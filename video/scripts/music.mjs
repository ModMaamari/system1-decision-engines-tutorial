// Synthesises the music bed: a slow, warm ambient pad plus soft air "whooshes" at scene changes.
// Deterministic and original (no samples), so it can be regenerated at any time.
//
//   node scripts/music.mjs      -> narration/out/music.wav (48 kHz stereo, 16-bit)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "timeline.json"), "utf8"));
const SR = 48000;
const DUR = timeline.duration;
const N = Math.ceil(DUR * SR);

// A calm progression in A minor; each chord holds 12 s with a 5 s crossfade.
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const CHORDS = [
  [45, 52, 55, 59, 60, 64], // Am9
  [41, 48, 52, 55, 57, 64], // Fmaj9
  [36, 43, 48, 52, 55, 59], // Cmaj7
  [40, 47, 50, 55, 57, 62], // Em7(11)
].map((c) => c.map(hz));
const HOLD = 12;
const FADE = 5;

// Small deterministic PRNG for noise.
let seed = 12345;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

const L = new Float32Array(N);
const R = new Float32Array(N);

// --- pad -------------------------------------------------------------------------------------
/** Equal-power crossfade weights of each chord at time t. */
const chordWeights = (t) => {
  const K = CHORDS.length;
  const p = t % (HOLD * K);
  const c = Math.floor(p / HOLD);
  const local = p - c * HOLD;
  const w = new Array(K).fill(0);
  if (local < FADE / 2) {
    const x = (local + FADE / 2) / FADE;
    w[c] = Math.sin((Math.PI / 2) * x);
    w[(c - 1 + K) % K] = Math.cos((Math.PI / 2) * x);
  } else if (local > HOLD - FADE / 2) {
    const x = (local - (HOLD - FADE / 2)) / FADE;
    w[c] = Math.cos((Math.PI / 2) * x);
    w[(c + 1) % K] = Math.sin((Math.PI / 2) * x);
  } else {
    w[c] = 1;
  }
  return w;
};

const voices = [];
CHORDS.forEach((chord, ci) =>
  chord.forEach((f, ni) => {
    for (const [side, cents] of [[0, -4], [1, 4]]) {
      voices.push({ ci, f: f * 2 ** (cents / 1200), side, phase: ni * 0.7 + side, amp: ni === 0 ? 0.9 : 0.55 });
    }
  }),
);

const block = 480; // update chord weights every 10 ms
for (let b = 0; b < N; b += block) {
  const t = b / SR;
  const w = chordWeights(t);
  const breathe = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.05 * t);
  for (const v of voices) {
    const g = w[v.ci] * v.amp * breathe;
    if (g < 1e-4) continue;
    const out = v.side ? R : L;
    const k = (2 * Math.PI * v.f) / SR;
    for (let i = b; i < Math.min(N, b + block); i++) {
      const ph = k * i + v.phase;
      out[i] += g * (Math.sin(ph) + 0.22 * Math.sin(2 * ph) + 0.06 * Math.sin(3 * ph));
    }
  }
}

// Warmth: two one-pole low-passes (about 900 Hz) per channel.
for (const ch of [L, R]) {
  const a = Math.exp((-2 * Math.PI * 900) / SR);
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < N; i++) {
    y1 = (1 - a) * ch[i] + a * y1;
    y2 = (1 - a) * y1 + a * y2;
    ch[i] = y2;
  }
}

// --- whooshes at scene changes ------------------------------------------------------------------
for (const scene of timeline.scenes.slice(1)) {
  const centre = scene.start; // the cut
  const len = 1.4;
  const s0 = Math.floor((centre - 0.9) * SR);
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < len * SR; i++) {
    const idx = s0 + i;
    if (idx < 0 || idx >= N) continue;
    const x = i / (len * SR);
    const env = Math.sin(Math.PI * Math.min(1, x / 0.65) * 0.5) ** 2 * (x < 0.65 ? 1 : Math.cos(((x - 0.65) / 0.35) * Math.PI * 0.5) ** 2);
    const cutoff = 300 + 2600 * Math.sin(Math.PI * x);
    const a = Math.exp((-2 * Math.PI * cutoff) / SR);
    lp = (1 - a) * rand() + a * lp;
    lp2 = (1 - a) * lp + a * lp2;
    const pan = 0.5 + 0.35 * Math.sin(2 * Math.PI * x);
    const s = 0.9 * env * (lp - lp2 * 0.6);
    L[idx] += s * (1 - pan) * 2;
    R[idx] += s * pan * 2;
  }
}

// --- normalise, fade in and out, write -------------------------------------------------------
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = 0.5 / peak;
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 3, (DUR - t) / 5);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain * fade)) * 32767), i * 4);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain * fade)) * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);
const out = path.join(ROOT, "narration", "out", "music.wav");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([header, pcm]));
console.log(`music: ${DUR.toFixed(1)}s -> ${path.relative(ROOT, out)}`);
