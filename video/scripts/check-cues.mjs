// Checks that every cue(B.bN, 'phrase') in the scenes appears in that beat's narration text.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = JSON.parse(fs.readFileSync(path.join(ROOT, "narration", "script.json"), "utf8"));
let bad = 0;
for (const scene of script.scenes) {
  const file = path.join(ROOT, "src", "scenes", `${scene.id}.tsx`);
  const src = fs.readFileSync(file, "utf8");
  const beats = Object.fromEntries(scene.beats.map((b) => [b.id, b.text]));
  // Literal phrases, including those passed through arrays that feed cue() in a loop.
  for (const m of src.matchAll(/cue\(B\.(b\d)\s*,\s*'([^']+)'/g)) {
    if (!beats[m[1]]?.includes(m[2])) {
      console.log(`${scene.id}: "${m[2]}" not in ${m[1]}`);
      bad++;
    }
  }
  for (const m of src.matchAll(/for \(const \[i, phrase\] of \[([^\]]+)\]\.entries\(\)\) \{\s*yield\* at\(cue\(B\.(b\d)/g)) {
    for (const p of m[1].matchAll(/'([^']+)'/g)) {
      if (!beats[m[2]]?.includes(p[1])) {
        console.log(`${scene.id}: "${p[1]}" not in ${m[2]}`);
        bad++;
      }
    }
  }
}
console.log(bad ? `${bad} bad cue(s)` : "all cues found");
process.exit(bad ? 1 : 0);
