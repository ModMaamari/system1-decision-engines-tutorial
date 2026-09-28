// Checks that every scene lasts exactly as many frames as src/timeline.json says, so the video can
// never drift from the narration. Loads the project in headless Chromium and reads the scene
// boundaries Motion Canvas computes.
//
//   node scripts/check-timing.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "timeline.json"), "utf8"));

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = "/opt/pw-browsers";
  for (const dir of fs.existsSync(base) ? fs.readdirSync(base).sort().reverse() : []) {
    const p = path.join(base, dir, "chrome-linux", "chrome");
    if (dir.startsWith("chromium-") && fs.existsSync(p)) return p;
  }
  return undefined;
}

const server = await createServer({ root: ROOT, configFile: path.join(ROOT, "vite.config.ts"), logLevel: "error", server: { port: 0 } });
await server.listen();
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--disable-gpu", "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost"],
});
let bad = 0;
try {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${server.httpServer.address().port}/`);
  await page.waitForFunction(() => window.__s1?.player, null, { timeout: 120000 });
  const scenes = await page.evaluate(async () => {
    const playback = window.__s1.player.playback;
    for (let i = 0; i < 400 && !(playback.duration > 0); i++) await new Promise((r) => setTimeout(r, 250));
    return playback.onScenesRecalculated.current.map((s) => [s.name, s.firstFrame, s.lastFrame]);
  });
  scenes.forEach(([name, first, last], i) => {
    const want = timeline.scenes[i];
    const wantFirst = Math.round(want.start * timeline.fps);
    const ok = first === wantFirst && last - first === want.frames;
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "BAD "} ${name.padEnd(18)} frames ${first}-${last} (${last - first}), timeline ${wantFirst}+${want.frames}`);
  });
} finally {
  await browser.close();
  await server.close();
}
console.log(bad ? `${bad} scene(s) out of sync` : "all scenes frame-exact");
process.exit(bad ? 1 : 0);
