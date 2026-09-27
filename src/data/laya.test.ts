import { describe, expect, it } from "vitest";
import { CALIBRATION_ECE, PUBLIC_DATASETS, ROUTING_EVIDENCE, T4_LATENCY_MS, THEMES, TYPED_DECISIONS } from "./laya";

// Spot checks against the published tables, so a typo in the data file cannot slip through.
describe("published numbers", () => {
  it("typed-decisions", () => {
    expect(TYPED_DECISIONS.models[0]).toMatchObject({ model: "laya-typed-decisions", accuracy: 0.766 });
    expect(TYPED_DECISIONS.teacherCeiling).toBe(0.735);
    expect(TYPED_DECISIONS.random).toBe(0.318);
    expect(TYPED_DECISIONS.byWorkflow.map((w) => w.accuracy)).toEqual([0.804, 0.766, 0.764, 0.73]);
  });

  it("latency and routing evidence", () => {
    expect(T4_LATENCY_MS["laya-multilingual"][1]).toBe(32.8);
    expect(T4_LATENCY_MS.laya[10]).toBe(158.6);
    expect(ROUTING_EVIDENCE[1]).toMatchObject({ english: 0.306, multilingual: 0.451 });
  });

  it("calibration and application themes", () => {
    expect(CALIBRATION_ECE[0]).toMatchObject({ shipped: 0.466, refit: 0.081 });
    expect(THEMES.find((t) => t.theme.startsWith("Moderation"))?.laya).toBe(0.53);
    expect(PUBLIC_DATASETS.find((d) => d.dataset.startsWith("Banking77"))).toMatchObject({ laya: 0.425, jev: 0.87 });
  });
});
