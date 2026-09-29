import {spawn, type ChildProcessWithoutNullStreams} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import type {IncomingMessage, ServerResponse} from 'node:http';
import type {Plugin} from 'vite';

const require = createRequire(import.meta.url);
const PLUGIN_OPTIONS = Symbol.for('@motion-canvas/vite-plugin/PLUGIN_OPTIONS');

export interface RenderEvent {
  type: 'start' | 'frame' | 'end';
  job?: string;
  frames?: number;
  file?: string;
  result?: number;
}

interface StartOptions {
  job: string;
  name: string;
  mode: 'video' | 'stills';
  stillEvery: number;
  fps: number;
  width: number;
  height: number;
}

/**
 * Server half of the master exporter. Video mode pipes PNG frames into ffmpeg (x264, BT.709,
 * tuned for animation); stills mode writes the frames it receives as PNG files. Progress is
 * reported to `globalThis.__s1RenderEvents` when a render script is listening.
 */
interface Job {
  opts: StartOptions;
  ffmpeg?: ChildProcessWithoutNullStreams;
  done?: Promise<number>;
  file: string;
  next: number;
  buffer: Map<number, Buffer>;
  received: number;
}

export default function masterExporter(outputDir = './output'): Plugin {
  const jobs = new Map<string, Job>();
  const emit = (e: RenderEvent) => (globalThis as any).__s1RenderEvents?.(e);

  const readBody = (req: IncomingMessage) =>
    new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

  const write = (job: Job, data: Buffer) =>
    new Promise<void>((resolve) => {
      if (job.ffmpeg!.stdin.write(data)) resolve();
      else job.ffmpeg!.stdin.once('drain', () => resolve());
    });

  async function start(opts: StartOptions) {
    const out = path.resolve(outputDir);
    fs.mkdirSync(out, {recursive: true});
    if (opts.mode === 'stills') {
      const dir = path.join(out, 'stills');
      fs.rmSync(dir, {recursive: true, force: true});
      fs.mkdirSync(dir, {recursive: true});
      jobs.set(opts.job, {opts, file: dir, next: 0, buffer: new Map(), received: 0});
      return;
    }
    const file = path.join(out, `${opts.name}-${opts.job}.mp4`);
    const ffmpegPath: string = require('@ffmpeg-installer/ffmpeg').path;
    const args = [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'image2pipe', '-framerate', String(opts.fps), '-c:v', 'png', '-i', '-',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-tune', 'animation',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-g', String(opts.fps * 4), '-movflags', '+faststart',
      file,
    ];
    const ffmpeg = spawn(ffmpegPath, args);
    ffmpeg.stderr.on('data', (d) => process.stderr.write(`[ffmpeg ${opts.job}] ${d}`));
    const done = new Promise<number>((resolve) => ffmpeg.on('close', (code) => resolve(code ?? -1)));
    jobs.set(opts.job, {opts, ffmpeg, done, file, next: 0, buffer: new Map(), received: 0});
  }

  async function frame(id: string, seq: number, n: number, data: Buffer) {
    const job = jobs.get(id);
    if (!job) throw new Error(`no render in progress for ${id}`);
    if (seq < job.next || job.buffer.has(seq)) return; // a retried upload that already arrived
    job.received++;
    if (job.opts.mode === 'stills') {
      fs.writeFileSync(path.join(job.file, `${String(n).padStart(6, '0')}.png`), data);
    } else {
      job.buffer.set(seq, data);
      while (job.buffer.has(job.next)) {
        const d = job.buffer.get(job.next)!;
        job.buffer.delete(job.next);
        job.next++;
        await write(job, d);
      }
    }
    if (job.received % 30 === 0) emit({type: 'frame', job: id, frames: job.received});
  }

  async function end(id: string, result: number) {
    const job = jobs.get(id);
    jobs.delete(id);
    if (!job) {
      // The render failed before it started; still report it so a waiting script can exit.
      emit({type: 'end', job: id, frames: 0, file: '', result});
      return;
    }
    if (job.ffmpeg) {
      job.ffmpeg.stdin.end();
      const code = await job.done;
      if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
    }
    emit({type: 'end', job: id, frames: job.received, file: job.file, result});
  }

  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const action = url.pathname.replace(/^\//, '');
      const body = await readBody(req);
      if (action === 'start') {
        const opts = JSON.parse(body.toString()) as StartOptions;
        await start(opts);
        emit({type: 'start', job: opts.job});
      } else if (action === 'frame') {
        const q = url.searchParams;
        await frame(q.get('job') ?? 'main', Number(q.get('seq')), Number(q.get('n')), body);
      } else if (action === 'end') {
        const {job, result} = JSON.parse(body.toString());
        await end(job ?? 'main', result);
      } else {
        res.statusCode = 404;
      }
      res.end();
    } catch (e) {
      res.statusCode = 500;
      res.end(String(e));
    }
  };

  return {
    name: 's1/master-exporter',
    [PLUGIN_OPTIONS]: {entryPoint: '/plugins/master-exporter/client.ts'},
    configureServer(server) {
      server.middlewares.use('/__s1', (req, res) => void handler(req, res));
    },
  } as Plugin;
}
