// Headless render. Starts the Motion Canvas dev server, opens the project in Chromium, and renders
// frame ranges in several tabs at once (split at scene boundaries), each streaming PNG frames to its
// own ffmpeg (see plugins/master-exporter). The parts are joined losslessly, then the narration,
// the music bed and the captions are mixed and muxed in.
//
//   node scripts/render.mjs                          full video -> output/system1-decision-engines.mp4
//   node scripts/render.mjs --parallel 4             use four tabs (default 3)
//   node scripts/render.mjs --scene s04_arnar        one scene, with its narration
//   node scripts/render.mjs --stills --every 15      PNG stills of every 15th frame, for review
//   node scripts/render.mjs --from 30 --to 45 --scale 0.5
//   node scripts/render.mjs --mux-only               redo the audio mix and mux on the last full render
//
// Chromium comes from Playwright; set CHROMIUM_PATH if it is not under /opt/pw-browsers.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createServer } from "vite";
import { chromium } from "playwright-core";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "output");
const NAME = "system1-decision-engines";
const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "timeline.json"), "utf8"));
const ffmpeg = require("@ffmpeg-installer/ffmpeg").path;

// ---- options ------------------------------------------------------------------------------------
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const stills = args.includes("--stills");
const muxOnly = args.includes("--mux-only");
const every = Number(opt("every", 15));
const scale = Number(opt("scale", 1));
const fps = timeline.fps;
const sceneId = opt("scene");
let fromFrame = Math.round(Number(opt("from", 0)) * fps);
let toFrame = opt("to") !== undefined ? Math.round(Number(opt("to")) * fps) : timeline.frames; // exclusive
if (sceneId) {
  const s = timeline.scenes.find((x) => x.id === sceneId);
  if (!s) throw new Error(`unknown scene ${sceneId}`);
  fromFrame = Math.round(s.start * fps);
  toFrame = fromFrame + s.frames;
}
const full = fromFrame === 0 && toFrame >= timeline.frames;
const parallel = stills ? 1 : Math.max(1, Number(opt("parallel", toFrame - fromFrame > 1800 ? 3 : 1)));

// Split [fromFrame, toFrame) into `parallel` chunks, cutting only at scene starts.
function chunks() {
  const cuts = timeline.scenes.map((s) => Math.round(s.start * fps)).filter((f) => f > fromFrame && f < toFrame);
  const bounds = [fromFrame];
  for (let k = 1; k < parallel; k++) {
    const ideal = fromFrame + ((toFrame - fromFrame) * k) / parallel;
    const best = cuts.reduce((a, b) => (Math.abs(b - ideal) < Math.abs(a - ideal) ? b : a), cuts[0]);
    if (best !== undefined && best > bounds[bounds.length - 1]) bounds.push(best);
  }
  bounds.push(toFrame);
  return bounds.slice(0, -1).map((f, i) => ({ id: `part${i}`, from: f, to: bounds[i + 1] }));
}

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = "/opt/pw-browsers";
  for (const dir of fs.existsSync(base) ? fs.readdirSync(base).sort().reverse() : []) {
    const p = path.join(base, dir, "chrome-linux", "chrome");
    if (dir.startsWith("chromium-") && fs.existsSync(p)) return p;
  }
  return undefined; // let Playwright look for its own
}

function run(argv) {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...argv], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${argv.join(" ")}`);
}

// ---- render -------------------------------------------------------------------------------------
async function renderVideo() {
  const parts = chunks();
  const started = Date.now();
  const totalFrames = toFrame - fromFrame;
  const progress = new Map();
  const waiting = new Map();
  globalThis.__s1RenderEvents = (e) => {
    if (e.type === "frame") {
      progress.set(e.job, e.frames);
      const done = [...progress.values()].reduce((a, b) => a + b, 0);
      const rate = done / ((Date.now() - started) / 1000);
      const eta = stills ? "" : `  eta ${Math.round((totalFrames - done) / Math.max(rate, 0.01) / 60)} min`;
      process.stdout.write(`\r  frames ${done}${stills ? "" : `/${totalFrames}`}  ${rate.toFixed(1)} fps${eta}   `);
    }
    if (e.type === "end") {
      const w = waiting.get(e.job);
      if (w) (e.result === 0 ? w.resolve : w.reject)(e);
    }
  };

  console.log(
    `render ${stills ? `stills every ${every} frames` : "video"}: frames ${fromFrame}-${toFrame} (${(totalFrames / fps).toFixed(1)} s) ` +
      `at ${fps} fps, scale ${scale}, ${parts.length} part(s)`,
  );
  const server = await createServer({ root: ROOT, configFile: path.join(ROOT, "vite.config.ts"), logLevel: "warn", server: { port: 0 } });
  await server.listen();
  const port = server.httpServer.address().port;
  // One browser per part: tabs of the same site would share a renderer process, and so one thread.
  const browsers = [];
  const launch = () =>
    chromium.launch({
      executablePath: findChromium(),
      // Plain CPU raster: without a GPU, an "accelerated" canvas runs on SwiftShader, which is far
      // slower than Skia drawing straight into memory, and every PNG then needs a GPU readback.
      args: [
        "--disable-gpu",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu-compositing",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        // The render needs nothing from the internet (the editor's update check is simply refused).
        // Blocking at DNS level avoids request interception, which would slow every frame upload.
        "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost",
      ],
    });

  async function renderPart(part) {
    const browser = await launch();
    browsers.push(browser);
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on("console", (m) => {
      if (m.type() === "error" && (process.env.RENDER_DEBUG || !m.text().includes("Failed to load resource"))) console.log(`\n[${part.id}] ${m.text()} ${JSON.stringify(m.location())}`);
    });
    page.on("pageerror", (e) => {
      if (!e.message.includes("Failed to fetch")) console.log(`\n[${part.id} page error] ${e.message}`);
    });
    await page.goto(`http://localhost:${port}/`);
    await page.waitForFunction(() => window.__s1?.renderer && window.__s1?.project, null, { timeout: 120000 });
    const finished = new Promise((resolve, reject) => waiting.set(part.id, { resolve, reject }));
    // Ranges are in seconds and inclusive at both ends; nudge them so each part owns exactly
    // frames [from, to).
    const range = [(part.from - 0.01) / fps, (part.to - 1 - 0.01) / fps];
    await page.evaluate(
      ({ range, fps, scale, options }) => {
        const { project, renderer, player } = window.__s1;
        try {
          player?.togglePlayback?.(false);
        } catch {}
        const settings = project.meta.getFullRenderingSettings();
        window.__s1.rendering = renderer.render({
          ...settings,
          name: project.name,
          range,
          fps,
          resolutionScale: scale,
          exporter: { name: "s1/master", options },
        });
      },
      { range, fps, scale, options: { mode: stills ? "stills" : "video", stillEvery: every, job: part.id } },
    );
    const result = await finished;
    await page.close();
    return result;
  }

  let results;
  try {
    results = await Promise.all(parts.map(renderPart));
  } finally {
    await Promise.all(browsers.map((b) => b.close()));
    await server.close();
  }
  const frames = results.reduce((n, r) => n + r.frames, 0);
  console.log(`\n  ${frames} frames in ${((Date.now() - started) / 1000).toFixed(0)} s`);
  if (stills) process.exit(0);
  if (frames !== totalFrames) console.log(`  WARNING: expected ${totalFrames} frames`);

  // Join the parts losslessly.
  const list = path.join(OUT, "parts.txt");
  fs.writeFileSync(list, results.map((r) => `file '${path.basename(r.file)}'`).join("\n") + "\n");
  run(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", video]);
  for (const r of results) fs.rmSync(r.file, { force: true });
  fs.rmSync(list, { force: true });
}

// ---- mix and mux --------------------------------------------------------------------------------
const video = path.join(OUT, `${NAME}-video.mp4`);
if (muxOnly) {
  if (!fs.existsSync(video)) throw new Error(`--mux-only needs ${path.relative(ROOT, video)} from an earlier render`);
} else {
  await renderVideo();
}

const voice = path.join(ROOT, "narration", "out", "voiceover.wav");
const music = path.join(ROOT, "narration", "out", "music.wav");
const captions = path.join(ROOT, "narration", "captions.srt");
if (!fs.existsSync(music)) spawnSync(process.execPath, [path.join(ROOT, "scripts", "music.mjs")], { stdio: "inherit" });
const final = path.join(OUT, sceneId ? `${NAME}-${sceneId}.mp4` : full ? `${NAME}.mp4` : `${NAME}-range.mp4`);
const from = String(fromFrame / fps);
const argv = ["-i", video, "-ss", from, "-i", voice, "-ss", from, "-i", music];
if (full) argv.push("-i", captions);
// Voice on top; the music bed ducks under it (sidechain), then the mix is normalised to -16 LUFS.
const mix = [
  "[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asplit=2[v1][v2]",
  "[2:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=0.38[m]",
  "[m][v1]sidechaincompress=threshold=0.015:ratio=5:attack=40:release=700[duck]",
  "[v2][duck]amix=inputs=2:duration=first:dropout_transition=0,volume=2,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]",
].join(";");
argv.push("-filter_complex", mix, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000");
if (full) argv.push("-map", "3:s", "-c:s", "mov_text", "-metadata:s:s:0", "language=eng", "-metadata:s:s:0", "title=English");
// An explicit duration, not -shortest: with a subtitle track, -shortest stops at the last cue.
const duration = ((toFrame - fromFrame) / fps).toFixed(6);
argv.push("-t", duration, "-metadata", "title=System 1 Decision Engines", "-movflags", "+faststart", final);
run(argv);
console.log(`  muxed -> ${path.relative(ROOT, final)} (${(fs.statSync(final).size / 1e6).toFixed(1)} MB)`);
