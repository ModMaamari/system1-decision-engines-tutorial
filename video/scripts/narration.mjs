// Narration pipeline: text-to-speech clips -> timeline -> one voice-over track.
//
//   REPLICATE_API_TOKEN=... node scripts/narration.mjs          generate missing or changed clips, then build
//   node scripts/narration.mjs --build                            rebuild timeline and track from existing clips
//   node scripts/narration.mjs --force                            regenerate every clip (costs money)
//   node scripts/narration.mjs --only s03_fastslow/b2             regenerate one clip
//   node scripts/narration.mjs --captions-only                    rewrite captions.srt only
//
// The API token is read from the environment only. It is never written to disk or printed.
// Clips are cached in narration/clips with a hash of (text, voice, style), so a rerun only pays
// for beats whose text changed.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "narration", "script.json");
const CLIPS = path.join(ROOT, "narration", "clips");
const OUT = path.join(ROOT, "narration", "out");
const TIMELINE = path.join(ROOT, "src", "timeline.json");
const CAPTIONS = path.join(ROOT, "narration", "captions.srt");
const ALIGNMENT = path.join(ROOT, "narration", "alignment.json");
const TRIMMED = path.join(OUT, "trimmed");
const MODEL = "google/gemini-3.1-flash-tts";

const FPS = 30;
const SAMPLE_RATE = 24000;
const LEAD_FIRST = 0.8; // silence before the first beat of the video
const LEAD = 0.9; // silence at the start of every other scene (covers the transition)
const GAP = 0.45; // pause between beats inside a scene
const TAIL = 0.7; // silence after the last beat of a scene
const TAIL_LAST = 2.6; // hold on the final card

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const BUILD_ONLY = args.includes("--build");
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

const script = JSON.parse(fs.readFileSync(SCRIPT, "utf8"));
fs.mkdirSync(CLIPS, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const clipKey = (scene, beat) => `${scene.id}__${beat.id}`;
const clipHash = (beat) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify([beat.text, script.voice, script.style, script.language]))
    .digest("hex")
    .slice(0, 16);

// ---------------------------------------------------------------------------------------------
// Text to speech

async function tts(text) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait=60" };
  const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      input: { text, voice: script.voice, prompt: script.style, language_code: script.language },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    if (res.status === 429) err.retryAfter = Number(JSON.parse(body || "{}").retry_after ?? 10);
    throw err;
  }
  let p = await res.json();
  while (!["succeeded", "failed", "canceled"].includes(p.status)) {
    await new Promise((r) => setTimeout(r, 1500));
    p = await (await fetch(p.urls.get, { headers: { Authorization: headers.Authorization } })).json();
  }
  if (p.status !== "succeeded") throw new Error(`${p.status}: ${p.error}`);
  const url = Array.isArray(p.output) ? p.output[0] : p.output;
  const audio = await fetch(url);
  if (!audio.ok) throw new Error(`download HTTP ${audio.status}`);
  return Buffer.from(await audio.arrayBuffer());
}

async function withRetry(fn, label, attempts = 4) {
  for (let i = 1, throttled = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      // Rate limiting is not a failure: wait as long as the API asks, a bounded number of times.
      if (e.retryAfter !== undefined && throttled++ < 20) {
        i--;
        await new Promise((r) => setTimeout(r, (e.retryAfter + 1) * 1000));
        continue;
      }
      if (i >= attempts) throw e;
      const wait = 2000 * 2 ** (i - 1);
      console.log(`  retry ${label} in ${wait / 1000}s (${e.message})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function generate() {
  const hashesFile = path.join(CLIPS, "hashes.json");
  const hashes = fs.existsSync(hashesFile) ? JSON.parse(fs.readFileSync(hashesFile, "utf8")) : {};
  const jobs = [];
  for (const scene of script.scenes) {
    for (const beat of scene.beats) {
      const key = clipKey(scene, beat);
      const file = path.join(CLIPS, `${key}.wav`);
      const wanted = ONLY ? ONLY === `${scene.id}/${beat.id}` : true;
      const fresh = fs.existsSync(file) && hashes[key] === clipHash(beat);
      if (!wanted || (fresh && !FORCE && !ONLY)) continue;
      jobs.push({ key, file, beat });
    }
  }
  console.log(`${jobs.length} clip(s) to generate`);
  // Sequential, and no faster than MIN_INTERVAL between requests: low-credit Replicate accounts
  // are limited to 6 predictions a minute with a burst of 1.
  const MIN_INTERVAL = 10500;
  let lastStart = 0;
  for (const job of jobs) {
    const wait = lastStart + MIN_INTERVAL - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastStart = Date.now();
    const buf = await withRetry(() => tts(job.beat.text), job.key);
    fs.writeFileSync(job.file, buf);
    hashes[job.key] = clipHash(job.beat);
    fs.writeFileSync(hashesFile, JSON.stringify(hashes, null, 2) + "\n");
    console.log(`ok   ${job.key}  ${readWav(job.file).seconds.toFixed(2)}s`);
  }
}

// ---------------------------------------------------------------------------------------------
// WAV helpers (walk the chunks; do not assume a 44-byte header)

function readWav(file) {
  const b = fs.readFileSync(file);
  let off = 12;
  let fmt = null;
  let data = null;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "fmt ") {
      fmt = { channels: b.readUInt16LE(off + 10), rate: b.readUInt32LE(off + 12), bits: b.readUInt16LE(off + 22) };
    } else if (id === "data") {
      data = b.subarray(off + 8, off + 8 + Math.min(size, b.length - off - 8));
      break;
    }
    off += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error(`${file}: not a PCM wav`);
  if (fmt.channels !== 1 || fmt.bits !== 16 || fmt.rate !== SAMPLE_RATE) {
    throw new Error(`${file}: expected 24 kHz mono 16-bit, got ${JSON.stringify(fmt)}`);
  }
  const samples = new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1)));
  return { samples, seconds: samples.length / SAMPLE_RATE };
}

function writeWav(file, samples) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + samples.length * 2, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(samples.length * 2, 40);
  fs.writeFileSync(file, Buffer.concat([header, Buffer.from(samples.buffer, samples.byteOffset, samples.length * 2)]));
}

/** Trim leading and trailing silence, keeping a little air around the voice. */
function trimSilence(samples) {
  const threshold = 0.012 * 32768; // about -38 dBFS
  const win = Math.round(0.01 * SAMPLE_RATE);
  const loud = (i) => {
    let peak = 0;
    for (let j = i; j < Math.min(i + win, samples.length); j++) peak = Math.max(peak, Math.abs(samples[j]));
    return peak > threshold;
  };
  let start = 0;
  while (start < samples.length && !loud(start)) start += win;
  let end = samples.length;
  while (end > start && !loud(Math.max(0, end - win))) end -= win;
  const padIn = Math.round(0.04 * SAMPLE_RATE);
  const padOut = Math.round(0.12 * SAMPLE_RATE);
  const s = Math.max(0, start - padIn);
  const e = Math.min(samples.length, end + padOut);
  const out = samples.slice(s, e);
  // 5 ms fades so a cut never clicks.
  const fade = Math.min(Math.round(0.005 * SAMPLE_RATE), out.length >> 1);
  for (let i = 0; i < fade; i++) {
    out[i] = Math.round((out[i] * i) / fade);
    out[out.length - 1 - i] = Math.round((out[out.length - 1 - i] * i) / fade);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Timeline and track

const frames = (s) => Math.ceil(s * FPS - 1e-9);
const round3 = (x) => Math.round(x * 1000) / 1000;

const MAX_CUE = 84;
const MAX_LINE = 44;
const normWord = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

function splitText(text) {
  if (text.length <= MAX_CUE) return [text];
  for (const re of [/(?<=[.!?:])\s+/, /(?<=[,;])\s+/, /\s+/]) {
    const parts = text.split(re);
    if (parts.length < 2) continue;
    const out = [];
    for (const part of parts) {
      const last = out[out.length - 1];
      if (last !== undefined && (last + " " + part).length <= MAX_CUE) out[out.length - 1] = last + " " + part;
      else out.push(part);
    }
    return out.flatMap((p) => (p.length > MAX_CUE ? splitText(p) : [p]));
  }
  return [text];
}

function wrap(text) {
  if (text.length <= MAX_LINE) return text;
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? text : `${text.slice(0, best)}\n${text.slice(best + 1)}`;
}

/** Cues for one narration beat, timed from aligned word starts when available. */
function captionCues(c) {
  const chunks = splitText(c.text);
  const words = c.words.map(([w, t]) => [normWord(w), t]).filter(([w]) => w);
  let cursor = 0;
  const starts = chunks.map((chunk, i) => {
    if (i === 0) return c.from;
    const first = chunk.split(/[\s-]+/).map(normWord).filter(Boolean);
    for (let k = cursor; k < words.length; k++) {
      if (words[k][0] === first[0] && (!first[1] || !words[k + 1] || words[k + 1][0] === first[1])) {
        cursor = k + 1;
        return words[k][1];
      }
    }
    // Fall back to the chunk's share of the text.
    const before = chunks.slice(0, i).join(" ").length;
    return c.from + ((c.to - c.from) * before) / c.text.length;
  });
  return chunks.map((chunk, i) => ({ from: starts[i], to: i + 1 < chunks.length ? starts[i + 1] : c.to, text: wrap(chunk) }));
}

function srtTime(t) {
  const ms = Math.round(t * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
}

function build() {
  fs.mkdirSync(TRIMMED, { recursive: true });
  const alignment = fs.existsSync(ALIGNMENT) ? JSON.parse(fs.readFileSync(ALIGNMENT, "utf8")) : {};
  const scenes = [];
  const pieces = [];
  let globalFrame = 0;
  const captions = [];
  script.scenes.forEach((scene, si) => {
    const isFirst = si === 0;
    const isLast = si === script.scenes.length - 1;
    let t = isFirst ? LEAD_FIRST : LEAD;
    const beats = {};
    const placed = [];
    scene.beats.forEach((beat, bi) => {
      const file = path.join(CLIPS, `${clipKey(scene, beat)}.wav`);
      if (!fs.existsSync(file)) throw new Error(`missing clip ${file}; run without --build first`);
      const samples = trimSilence(readWav(file).samples);
      writeWav(path.join(TRIMMED, `${clipKey(scene, beat)}.wav`), samples);
      const dur = samples.length / SAMPLE_RATE;
      beats[beat.id] = { start: round3(t), end: round3(t + dur), text: beat.text };
      // Word times from scripts/align.py, valid only for the exact clip they were measured on.
      const aligned = alignment[clipKey(scene, beat)];
      if (aligned && aligned.hash === clipHash(beat)) {
        const at = t;
        beats[beat.id].words = aligned.words.map(([w, s]) => [w, round3(at + s)]);
      }
      placed.push({ at: t, samples });
      t += dur + (bi < scene.beats.length - 1 ? (beat.pause ?? GAP) : 0);
    });
    t += isLast ? TAIL_LAST : TAIL;
    const nFrames = frames(t);
    const duration = nFrames / FPS;
    const sceneSamples = new Int16Array(Math.round(duration * SAMPLE_RATE));
    for (const p of placed) sceneSamples.set(p.samples.subarray(0, sceneSamples.length - Math.round(p.at * SAMPLE_RATE)), Math.round(p.at * SAMPLE_RATE));
    pieces.push(sceneSamples);
    const start = globalFrame / FPS;
    for (const [id, b] of Object.entries(beats)) {
      captions.push({
        from: start + b.start,
        to: start + b.end,
        text: b.text,
        words: (b.words ?? []).map(([w, t]) => [w, start + t]),
        id: `${scene.id}/${id}`,
      });
    }
    scenes.push({ id: scene.id, part: scene.part, title: scene.title, start: round3(start), duration: round3(duration), frames: nFrames, beats });
    globalFrame += nFrames;
  });

  const total = globalFrame / FPS;
  fs.writeFileSync(TIMELINE, JSON.stringify({ fps: FPS, frames: globalFrame, duration: round3(total), scenes }, null, 2) + "\n");

  const track = new Int16Array(pieces.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of pieces) {
    track.set(p, o);
    o += p.length;
  }
  const raw = path.join(OUT, "voiceover-raw.wav");
  writeWav(raw, track);

  // Captions: split each beat into cues of at most ~84 characters (at sentence, then clause,
  // then word boundaries), wrap them onto two lines, and time them from the aligned words.
  const cues = [];
  for (const c of captions) cues.push(...captionCues(c));
  writeCaptions(cues);

  master(raw);
  console.log(`timeline: ${scenes.length} scenes, ${globalFrame} frames, ${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`);
  for (const s of scenes) console.log(`  ${s.id.padEnd(18)} ${s.start.toFixed(2).padStart(7)}s  +${s.duration.toFixed(2)}s`);
}

/** Broadcast-style polish: rumble cut, gentle compression, loudness to -16 LUFS, 48 kHz. */
function master(raw) {
  const ffmpeg = require("@ffmpeg-installer/ffmpeg").path;
  const wav = path.join(OUT, "voiceover.wav");
  const filters = [
    "highpass=f=70",
    "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=160:makeup=2",
    "loudnorm=I=-16:TP=-1.5:LRA=9",
    "aresample=48000",
  ].join(",");
  const run = (argv) => {
    const r = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...argv], { stdio: "inherit" });
    if (r.status !== 0) throw new Error(`ffmpeg failed: ${argv.join(" ")}`);
  };
  run(["-i", raw, "-af", filters, "-ac", "1", "-c:a", "pcm_s16le", wav]);
  // A compact copy for the editor preview and for the repository.
  run(["-i", wav, "-c:a", "libopus", "-b:a", "64k", path.join(ROOT, "narration", "voiceover.ogg")]);
}

/** Rewrites captions.srt from the existing timeline (no audio or timeline changes). */
function captionsOnly() {
  const t = JSON.parse(fs.readFileSync(TIMELINE, "utf8"));
  const cues = [];
  for (const scene of t.scenes) {
    for (const b of Object.values(scene.beats)) {
      cues.push(
        ...captionCues({
          from: scene.start + b.start,
          to: scene.start + b.end,
          text: b.text,
          words: (b.words ?? []).map(([w, x]) => [w, scene.start + x]),
        }),
      );
    }
  }
  writeCaptions(cues);
  console.log(`captions: ${cues.length} cues -> ${path.relative(ROOT, CAPTIONS)}`);
}

function writeCaptions(cues) {
  fs.writeFileSync(CAPTIONS, cues.map((c, i) => `${i + 1}\n${srtTime(c.from)} --> ${srtTime(c.to)}\n${c.text}\n`).join("\n"));
}

if (args.includes("--captions-only")) {
  captionsOnly();
} else {
  if (!BUILD_ONLY) await generate();
  build();
}
