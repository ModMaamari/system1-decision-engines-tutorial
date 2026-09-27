import { describe, expect, it } from "vitest";
import { linearScale, niceStep, niceTicks } from "./scale";

describe("linearScale", () => {
  it("maps and inverts", () => {
    const s = linearScale([0, 1], [100, 300]);
    expect(s(0)).toBe(100);
    expect(s(0.5)).toBe(200);
    expect(s(1)).toBe(300);
    expect(s.invert(250)).toBeCloseTo(0.75, 12);
  });

  it("supports inverted ranges (SVG y axes)", () => {
    const s = linearScale([0, 10], [200, 0]);
    expect(s(10)).toBe(0);
    expect(s(2.5)).toBe(150);
  });
});

describe("niceTicks", () => {
  it("chooses 1-2-5 steps", () => {
    expect(niceStep(1, 5)).toBe(0.2);
    expect(niceStep(100, 5)).toBe(20);
    expect(niceStep(7, 5)).toBe(2);
  });

  it("covers the domain on round values", () => {
    expect(niceTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(niceTicks(0, 800, 4)).toEqual([0, 200, 400, 600, 800]);
    expect(niceTicks(-3, 3, 6)).toEqual([-3, -2, -1, 0, 1, 2, 3]);
  });

  it("handles a zero-width domain", () => {
    expect(niceTicks(2, 2)).toEqual([2]);
  });
});
