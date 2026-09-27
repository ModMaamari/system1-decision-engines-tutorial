import { describe, expect, it } from "vitest";
import {
  RULES,
  brierReward,
  expectedBinary,
  expectedReward,
  logScore,
  properReward,
  rps,
  sphericalScore,
} from "./scoring";

describe("scoring rules", () => {
  it("computes known values", () => {
    expect(logScore([0.8, 0.2], [1, 0])).toBeCloseTo(Math.log(0.8), 12);
    expect(sphericalScore([0.6, 0.8], [0, 1])).toBeCloseTo(0.8, 12);
    expect(brierReward([0.7, 0.3], [1, 0])).toBeCloseTo(-(0.09 + 0.09), 12);
    expect(rps([1, 0, 0], [0, 0, 1])).toBeCloseTo((1 + 1) / 2, 12);
    expect(rps([0, 1, 0], [0, 0, 1])).toBeCloseTo((0 + 1) / 2, 12);
  });

  it("floors the log score at -9.21 like Laya", () => {
    expect(logScore([0, 1], [1, 0])).toBe(-9.21);
  });

  it("matches a NumPy transliteration of Laya's proper_reward", () => {
    expect(properReward([0.7, 0.2, 0.1], [1, 0, 0], "choice")).toBeCloseTo(0.11961472826910774, 12);
    expect(properReward([0.2, 0.5, 0.3], [0.1, 0.3, 0.6], "score")).toBeCloseTo(-0.8573841410281208, 12);
    expect(properReward([0.2, 0.5, 0.3], [0.1, 0.3, 0.6], "choice", 0.75)).toBeCloseTo(-0.6654403975387035, 12);
    expect(properReward([0.00001, 0.99999], [1, 0], "noul")).toBeCloseTo(-9.20999499995, 9);
  });
});

describe("propriety", () => {
  const grid = Array.from({ length: 999 }, (_, i) => (i + 1) / 1000);
  const argmaxQ = (rule: (q: number[], t: number[]) => number, p: number) =>
    grid.reduce((best, q) => (expectedBinary(rule, p, q) > expectedBinary(rule, p, best) ? q : best), grid[0]);

  it.each(["log", "spherical", "brier"] as const)("%s is maximised by reporting the true probability", (id) => {
    for (const p of [0.1, 0.3, 0.7, 0.9]) {
      expect(argmaxQ(RULES[id].fn, p)).toBeCloseTo(p, 2);
    }
  });

  it("the linear score rewards overconfidence", () => {
    expect(argmaxQ(RULES.linear.fn, 0.7)).toBeCloseTo(0.999, 3);
  });

  it("accuracy is indifferent between an honest 0.7 and an extreme 0.99", () => {
    expect(expectedBinary(RULES.accuracy.fn, 0.7, 0.7)).toBe(expectedBinary(RULES.accuracy.fn, 0.7, 0.99));
  });

  it("holds for several outcomes too", () => {
    const p = [0.5, 0.3, 0.2];
    for (const id of ["log", "spherical", "brier"] as const) {
      const honest = expectedReward(RULES[id].fn, p, p);
      for (const q of [
        [0.6, 0.25, 0.15],
        [0.34, 0.33, 0.33],
        [0.9, 0.05, 0.05],
      ]) {
        expect(honest).toBeGreaterThan(expectedReward(RULES[id].fn, p, q));
      }
    }
  });
});
