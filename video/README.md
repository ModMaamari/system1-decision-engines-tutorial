# System 1 Decision Engines: the video

A narrated, 9-minute motion-graphics summary of the tutorial, built with
[Motion Canvas](https://motioncanvas.io/). It walks through the whole topic in 16 scenes: the
problem, fast and slow thinking, autoregressive vs non-autoregressive decisions, the three
primitives, the input sequence, the forward pass, decoding, proper scoring rules, RLCD, calibration,
the router, production patterns, agents, limits and a recap.

The rendered video is [`system1-decision-engines.mp4`](system1-decision-engines.mp4) (1080p, 30 fps,
AAC stereo, with an English subtitle track). Captions are also in
[`narration/captions.srt`](narration/captions.srt).

## How it is made

```
narration/script.json ──(Replicate TTS)──> narration/clips/*.wav        one clip per narration beat
                        │                                          (cached, not committed)
                        ├──> src/timeline.json      scene and beat timings the animations sync to
                        ├──> narration/voiceover.ogg + narration/out/voiceover.wav (mastered)
                        └──> narration/captions.srt
scripts/align.py        word timings (faster-whisper) so animations land on specific words,
                        and a check that every clip says exactly what the script says
scripts/music.mjs       an original synthesised ambient bed and scene-change whooshes
src/scenes/*.tsx        the 16 Motion Canvas scenes
scripts/render.mjs      headless render: several Chromium instances render scene-aligned parts in
                        parallel, each streaming PNG frames to its own ffmpeg (x264); the parts are
                        joined losslessly, then the voice/music mix, captions and mux
plugins/master-exporter the Motion Canvas exporter and dev-server endpoint behind that render
```

- **Narration**: Google's `gemini-3.1-flash-tts` on Replicate, voice *Charon*, one clip per beat
  (1-3 sentences) so every animation can start exactly when its sentence does. Clips are trimmed,
  laid out on a frame-accurate timeline, compressed gently and normalised to -16 LUFS.
- **Sync**: each scene reads its beat times from `src/timeline.json`; `cue(beat, 'phrase')` returns
  the moment a phrase is spoken, from the aligned word timings. Every scene ends on exactly its
  planned frame, so picture and narration never drift (`scripts/check-timing.mjs` verifies it).
- **Music**: a quiet pad (Am9, Fmaj9, Cmaj7, Em7) that ducks under the voice with a sidechain
  compressor. Generated from code, so there is nothing to license.
- **Accuracy**: numbers on screen come from the tutorial's sourced data (`../src/data/laya.ts`).
  Each chart carries a tag: *measured data*, *illustrative*, *diagram* or *formula*.

## Commands

Requires Node 22.12+. Chromium comes from Playwright (`/opt/pw-browsers`, or set `CHROMIUM_PATH`).

```bash
npm install
npm start                          # Motion Canvas editor at http://localhost:9000

# Narration. The token is read from the environment only; never commit it.
export REPLICATE_API_TOKEN=...     # never commit it (.env files are git-ignored)
export NODE_USE_ENV_PROXY=1        # only behind an HTTPS proxy
npm run narration                  # generates missing or changed clips, then rebuilds everything
node scripts/narration.mjs --only s05_primitives/b4   # re-record one beat
node scripts/narration.mjs --build                    # rebuild timeline/track from cached clips
python scripts/align.py            # optional: word timings + transcript check (faster-whisper)

npm run check                      # every cue() phrase exists in the script, and TypeScript
npm run check:timing               # every scene is exactly as long as its narration

npm run render                     # full video -> output/system1-decision-engines.mp4
node scripts/render.mjs --scene s07_forward           # one scene, with its narration
node scripts/render.mjs --from 100 --to 140 --stills --every 15 --scale 0.5   # review stills
node scripts/render.mjs --mux-only                    # redo the audio mix and captions only
```

A full 1080p render takes about 30 minutes on 4 CPU cores. The master in `output/` is encoded at
CRF 17; the copy committed here is re-encoded at CRF 23 with 160 kbps audio (visually identical
for this material) to keep the repository light.

Re-running `npm run narration` costs nothing when the script has not changed: clips are cached
with a hash of their text, voice and style. Low-credit Replicate accounts are limited to six
predictions a minute, so the generator paces itself.
