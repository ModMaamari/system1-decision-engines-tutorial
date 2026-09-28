import {
  EnumMetaField,
  makePlugin,
  NumberMetaField,
  ObjectMetaField,
  type Exporter,
  type Project,
  type RendererResult,
  type RendererSettings,
} from '@motion-canvas/core';

/** Frame uploads in flight at once. */
const IN_FLIGHT = 4;

/**
 * Streams rendered frames as PNG to the dev server, which pipes them into ffmpeg with the
 * settings in ./server.ts. In "stills" mode every Nth frame is saved as a PNG file instead, for
 * quick visual checks of a range. (Raw RGBA frames were tried: reading pixels is fast, but moving
 * 8 MB request bodies out of Chrome is slower than encoding a PNG.)
 */
class MasterExporter implements Exporter {
  public static readonly id = 's1/master';
  public static readonly displayName = 'Master video (ffmpeg, x264)';

  public static meta() {
    return new ObjectMetaField(this.displayName, {
      mode: new EnumMetaField(
        'mode',
        [
          {text: 'video', value: 'video'},
          {text: 'stills', value: 'stills'},
        ],
        'video',
      ),
      stillEvery: new NumberMetaField('still every N frames', 30),
    });
  }

  public static async create(project: Project, settings: RendererSettings) {
    return new MasterExporter(project, settings);
  }

  private readonly options: {mode: 'video' | 'stills'; stillEvery: number; job?: string};
  private pending: Promise<void>[] = [];
  private seq = 0;

  public constructor(
    private readonly project: Project,
    private readonly settings: RendererSettings,
  ) {
    this.options = settings.exporter.options as typeof this.options;
  }

  public async start() {
    const {size, resolutionScale, fps, range} = this.settings;
    await post('start', {
      job: this.job,
      name: this.project.name,
      mode: this.options.mode,
      stillEvery: this.options.stillEvery,
      fps,
      width: Math.round(size.x * resolutionScale),
      height: Math.round(size.y * resolutionScale),
      range,
    });
  }

  public async handleFrame(canvas: HTMLCanvasElement, frame: number) {
    if (this.options.mode === 'stills' && frame % Math.max(1, this.options.stillEvery) !== 0) return;
    if (this.pending.length >= IN_FLIGHT) await this.pending.shift();
    const seq = this.seq++;
    const body = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
    );
    this.pending.push(upload(`/__s1/frame?job=${this.job}&n=${frame}&seq=${seq}`, body));
  }

  public async stop(result: RendererResult) {
    try {
      await Promise.all(this.pending);
    } finally {
      this.pending = [];
      await post('end', {job: this.job, result});
    }
  }

  private get job() {
    return this.options.job ?? 'main';
  }
}

/** POSTs a frame, retrying a dropped connection; the server ignores a frame it already has. */
async function upload(url: string, body: Blob) {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, {method: 'POST', body});
      if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
      return;
    } catch (e) {
      if (attempt >= 4) throw new Error(`frame upload failed: ${e}`);
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
}

async function post(action: string, body: unknown) {
  const r = await fetch(`/__s1/${action}`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${action}: HTTP ${r.status} ${await r.text()}`);
}

// Expose the project and renderer so scripts/render.mjs can start renders of chosen ranges in
// several browsers at once.
const handles: Record<string, unknown> = {};
(window as any).__s1 = handles;

export default makePlugin({
  name: 's1-master-exporter',
  exporters() {
    return [MasterExporter];
  },
  project(project) {
    handles.project = project;
  },
  renderer(renderer) {
    handles.renderer = renderer;
  },
  player(player) {
    handles.player = player;
  },
});
