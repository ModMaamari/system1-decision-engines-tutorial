import { describe, expect, it } from "vitest";
import { NOTEBOOK_DEFAULTS, ToyRlcd, kl, rng, type RlcdConfig } from "./rlcd";

const soft = [0.55, 0.25, 0.15, 0.05];
const base: RlcdConfig = { ...NOTEBOOK_DEFAULTS, target: soft, type: "choice", steps: 600, lr: 0.05, seed: 7 };

const run = (cfg: RlcdConfig) => {
  const t = new ToyRlcd(cfg);
  let last = t.step();
  for (let i = 1; i < cfg.steps; i++) last = t.step();
  return last;
};

describe("ToyRlcd", () => {
  it("uses zero-mean exploration noise and zero-mean advantages", () => {
    const info = new ToyRlcd(base).step();
    for (const s of info.samples) expect(s.eps.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 12);
    expect(info.samples.reduce((a, s) => a + s.adv, 0)).toBeCloseTo(0, 9);
    expect(info.samples).toHaveLength(4);
  });

  it("anneals sigma linearly from 0.4 to 0.1", () => {
    const t = new ToyRlcd(base);
    expect(t.sigmaAt(0)).toBeCloseTo(0.4, 12);
    expect(t.sigmaAt(base.steps - 1)).toBeCloseTo(0.1, 12);
  });

  it("is deterministic for a seed", () => {
    expect(run({ ...base, steps: 50 }).q).toEqual(run({ ...base, steps: 50 }).q);
    const r = rng(1);
    expect(r()).not.toBe(r());
  });

  it("with the proper reward and soft CE, matches the teacher distribution", () => {
    const last = run(base);
    expect(last.kl).toBeLessThan(0.01);
    last.q.forEach((qi, i) => expect(qi).toBeCloseTo(soft[i], 1));
  });

  it("the proper reward alone also moves towards the teacher", () => {
    const start = kl(soft, [0.25, 0.25, 0.25, 0.25]);
    const last = run({ ...base, ceWeight: 0, steps: 1500 });
    expect(last.kl).toBeLessThan(start * 0.3);
  });

  it("an improper linear reward drives the answer to overconfidence", () => {
    const last = run({ ...base, ceWeight: 0, reward: "linear", steps: 1500 });
    expect(Math.max(...last.q)).toBeGreaterThan(0.9);
    expect(Math.max(...last.q)).toBeGreaterThan(soft[0] + 0.3);
  });
});
