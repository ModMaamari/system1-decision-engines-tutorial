import { describe, expect, it } from "vitest";
import { eceScore, evaluate, fitTemperature, meanCrossEntropy, oneHot, reliabilityBins, syntheticDataset } from "./calibration";

describe("eceScore (ece_score in laya/common.py)", () => {
  it("is zero when confidence equals accuracy in every bin", () => {
    const conf = [0.8, 0.8, 0.8, 0.8, 0.8, 0.5, 0.5];
    const correct = [1, 1, 1, 1, 0, 1, 0] as const;
    expect(eceScore(conf, correct)).toBeCloseTo(0, 12);
  });

  it("weights each bin's gap by its share of items", () => {
    // 3 items at 0.9 all wrong (gap 0.9), 1 item at 0.3 right (gap 0.7)
    expect(eceScore([0.9, 0.9, 0.9, 0.3], [0, 0, 0, 1])).toBeCloseTo(0.75 * 0.9 + 0.25 * 0.7, 12);
  });

  it("uses Laya's bin edges: (lo, hi], with the first bin closed", () => {
    const bins = reliabilityBins([0, 1 / 15, 1], [1, 1, 1]);
    expect(bins[0].n).toBe(2); // 0 and exactly 1/15 both fall in the first bin
    expect(bins[14].n).toBe(1);
    expect(bins.reduce((a, b) => a + b.n, 0)).toBe(3);
  });

  it("returns NaN for no items, like the Python", () => {
    expect(eceScore([], [])).toBeNaN();
  });
});

describe("temperature fitting", () => {
  it("recovers the over-confidence factor of a synthetic model", () => {
    const ds = syntheticDataset(4000, 4, 2.5, 11);
    const t = fitTemperature(ds.logits, oneHot(ds.labels, 4));
    expect(t).toBeGreaterThan(2.2);
    expect(t).toBeLessThan(2.8);
  });

  it("lowers held-out ECE and never changes accuracy", () => {
    const fit = syntheticDataset(3000, 4, 2.5, 3);
    const test = syntheticDataset(3000, 4, 2.5, 4);
    const t = fitTemperature(fit.logits, oneHot(fit.labels, 4));
    const before = evaluate(test, 1);
    const after = evaluate(test, t);
    expect(after.accuracy).toBe(before.accuracy);
    expect(after.ece).toBeLessThan(before.ece / 3);
    expect(before.meanConf).toBeGreaterThan(before.accuracy); // over-confident as generated
  });

  it("fitting minimises the cross-entropy", () => {
    const ds = syntheticDataset(1000, 3, 0.5, 5);
    const targets = oneHot(ds.labels, 3);
    const t = fitTemperature(ds.logits, targets);
    expect(t).toBeLessThan(1); // an under-confident model needs sharpening
    const best = meanCrossEntropy(ds.logits, targets, t);
    expect(best).toBeLessThanOrEqual(meanCrossEntropy(ds.logits, targets, t * 1.1));
    expect(best).toBeLessThanOrEqual(meanCrossEntropy(ds.logits, targets, t / 1.1));
  });

  it("returns 1 for fewer than ten items, like the notebook", () => {
    expect(fitTemperature([[1, 0]], [[1, 0]])).toBe(1);
  });
});
