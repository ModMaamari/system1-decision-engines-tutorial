import { describe, expect, it } from "vitest";
import { decisionSideParams, encoderLayerParams, fmtParams } from "./params";

describe("decision-side parameter counts", () => {
  it("matches 12 d^2 + 13 d per head layer", () => {
    expect(encoderLayerParams(1024)).toBe(12 * 1024 * 1024 + 13 * 1024);
  });

  it("gives about 25.2M for a 2-layer head at d = 1024 (the figure Laya's author quotes)", () => {
    expect(fmtParams(decisionSideParams(1024).head)).toBe("25.2M");
  });

  it("leaves encoders of about 395M and 307M inside the published 421M and 322M totals", () => {
    const large = 421e6 - decisionSideParams(1024).total;
    const base = 322e6 - decisionSideParams(768).total;
    // The published totals are rounded to the nearest million, so allow for that.
    expect(Math.abs(large / 1e6 - 395)).toBeLessThan(1);
    expect(Math.abs(base / 1e6 - 307)).toBeLessThan(1);
  });
});
