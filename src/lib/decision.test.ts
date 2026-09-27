import { describe, expect, it } from "vitest";
import {
  actFeatures,
  answerConfidence,
  argmax,
  clampTemperature,
  decodeAnswer,
  entropyConfidence,
  expectedScore,
  softmax,
  tempBucket,
} from "./decision";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("softmax", () => {
  it("is a distribution and shift-invariant", () => {
    const p = softmax([2, 1, 0.1]);
    expect(sum(p)).toBeCloseTo(1, 12);
    const q = softmax([1002, 1001, 1000.1]);
    p.forEach((v, i) => expect(q[i]).toBeCloseTo(v, 12));
  });

  it("matches a hand-computed value", () => {
    const [a, b] = softmax([Math.log(3), 0]);
    expect(a).toBeCloseTo(0.75, 12);
    expect(b).toBeCloseTo(0.25, 12);
  });

  it("keeps the argmax at every positive temperature and flattens as it grows", () => {
    const z = [1.2, 3.1, -0.4, 2.2];
    for (const t of [0.5, 1, 2, 5]) expect(argmax(softmax(z, t))).toBe(1);
    expect(Math.max(...softmax(z, 5))).toBeLessThan(Math.max(...softmax(z, 1)));
    expect(Math.max(...softmax(z, 0.5))).toBeGreaterThan(Math.max(...softmax(z, 1)));
  });
});

describe("confidences", () => {
  it("answer confidence is max(p)", () => {
    expect(answerConfidence([0.2, 0.5, 0.3])).toBe(0.5);
    expect(answerConfidence([])).toBe(1);
  });

  it("entropy confidence is 0 for uniform and 1 for one-hot", () => {
    expect(entropyConfidence([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(0, 12);
    expect(entropyConfidence([1, 0, 0])).toBeCloseTo(1, 12);
    expect(entropyConfidence([1])).toBe(1);
  });

  it("the two confidences disagree on the same answer", () => {
    // Same top probability, different spread of the remainder.
    const peaked = [0.6, 0.4, 0, 0];
    const spread = [0.6, 0.1333, 0.1333, 0.1334];
    expect(answerConfidence(peaked)).toBe(answerConfidence(spread));
    expect(entropyConfidence(peaked)).toBeGreaterThan(entropyConfidence(spread));
  });
});

describe("temperature helpers", () => {
  it("buckets by option count like temp_bucket", () => {
    expect(tempBucket("noul", 2)).toBe("noul:2");
    expect(tempBucket("choice", 3)).toBe("choice:3-5");
    expect(tempBucket("choice", 5)).toBe("choice:3-5");
    expect(tempBucket("score", 6)).toBe("score:6-10");
    expect(tempBucket("choice", 11)).toBe("choice:11+");
    expect(tempBucket("choice", 77)).toBe("choice:11+");
  });

  it("clamps like clamp_temperature", () => {
    expect(clampTemperature(0.1006)).toBe(0.5);
    expect(clampTemperature(12)).toBe(5);
    expect(clampTemperature(1.3)).toBe(1.3);
    expect(clampTemperature("2")).toBe(2);
    expect(clampTemperature(NaN)).toBe(1);
    expect(clampTemperature(Infinity)).toBe(1);
    expect(clampTemperature(null)).toBe(1);
    expect(clampTemperature("x")).toBe(1);
  });
});

describe("decodeAnswer", () => {
  it("decodes a choice question", () => {
    const a = decodeAnswer("choice", [3, 1, 0], 1, ["billing", "technical", "other"]);
    expect(a.type).toBe("choice");
    if (a.type !== "choice") return;
    expect(a.choice).toBe("billing");
    expect(sum(Object.values(a.probabilities))).toBeCloseTo(1, 3);
    expect(a.answer_confidence).toBe(a.probabilities.billing);
  });

  it("decodes a score question as the expected level", () => {
    const a = decodeAnswer("score", [0, 0, 0]);
    if (a.type !== "score") throw new Error("wrong type");
    expect(a.score).toBeCloseTo(1, 4);
    expect(expectedScore([0, 0.2, 0.8])).toBeCloseTo(1.8, 12);
  });

  it("decodes noul as P(true), the second slot", () => {
    const a = decodeAnswer("noul", [0, Math.log(9)]);
    if (a.type !== "noul") throw new Error("wrong type");
    expect(a.noul).toBeCloseTo(0.9, 4);
    expect(a.confidence).toBeCloseTo(0.9, 4);
    expect(a.answer_confidence).toBe(a.confidence);
  });
});

describe("actFeatures", () => {
  it("computes top1, margin, normalised entropy and k/255", () => {
    const [top1, margin, ent, kk] = actFeatures([0.7, 0.2, 0.1]);
    expect(top1).toBe(0.7);
    expect(margin).toBeCloseTo(0.5, 12);
    expect(ent).toBeGreaterThan(0);
    expect(ent).toBeLessThan(1);
    expect(kk).toBeCloseTo(3 / 255, 12);
  });
});
