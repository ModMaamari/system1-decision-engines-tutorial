"""Optional: word-level alignment and a transcript check for the narration clips.

    python scripts/align.py            # needs faster-whisper (pip install faster-whisper)

Transcribes every trimmed clip in narration/out/trimmed with faster-whisper, writes word start
times to narration/alignment.json (used by the scenes to land animations on specific words),
and prints any clip whose transcript differs noticeably from the script, so a mispronounced or
garbled take can be regenerated with `node scripts/narration.mjs --only <scene>/<beat>`.
Run `node scripts/narration.mjs --build` afterwards to merge the times into src/timeline.json.
"""

import difflib
import hashlib
import json
import re
import sys
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
script = json.loads((ROOT / "narration" / "script.json").read_text())
trimmed = ROOT / "narration" / "out" / "trimmed"
out_file = ROOT / "narration" / "alignment.json"


def clip_hash(text):
    payload = json.dumps([text, script["voice"], script["style"], script["language"]], ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def words_of(text):
    return [w for w in re.sub(r"[^a-z0-9' ]", " ", text.lower().replace("-", " ")).split() if w]


model = WhisperModel(sys.argv[1] if len(sys.argv) > 1 else "small.en", device="cpu", compute_type="int8")
result = {}
flagged = []
for scene in script["scenes"]:
    for beat in scene["beats"]:
        key = f'{scene["id"]}__{beat["id"]}'
        wav = trimmed / f"{key}.wav"
        segments, _ = model.transcribe(str(wav), word_timestamps=True, language="en", beam_size=5, initial_prompt=beat["text"])
        words = [[w.word.strip(), round(w.start, 3)] for seg in segments for w in seg.words]
        heard = " ".join(w for w, _ in words)
        ratio = difflib.SequenceMatcher(None, words_of(beat["text"]), words_of(heard)).ratio()
        result[key] = {"hash": clip_hash(beat["text"]), "match": round(ratio, 3), "heard": heard, "words": words}
        mark = "  " if ratio >= 0.9 else "!!"
        if ratio < 0.9:
            flagged.append(key)
        print(f"{mark} {ratio:.2f} {key}: {heard}", flush=True)

out_file.write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n")
print(f"\n{len(result)} clips aligned; {len(flagged)} flagged: {', '.join(flagged) or 'none'}")
