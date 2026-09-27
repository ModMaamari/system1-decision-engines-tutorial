import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { softmax } from "../lib/decision";
import { DECODING_PRESETS, DecodingPlayground } from "./DecodingPlayground";

describe("DecodingPlayground", () => {
  it("reproduces the README's clamp example: 0.24 at T=1 becomes 0.99 at T=0.1006", () => {
    const sharp = DECODING_PRESETS.find((p) => p.id === "sharp")!;
    expect(Math.max(...softmax(sharp.logits, 1))).toBeCloseTo(0.24, 2);
    expect(Math.max(...softmax(sharp.logits, sharp.t))).toBeGreaterThan(0.99);
    expect(Math.max(...softmax(sharp.logits, 0.5))).toBeLessThan(0.5);
  });

  it("switches examples and applies the clamp", async () => {
    const user = userEvent.setup();
    render(<DecodingPlayground />);
    await user.click(screen.getByRole("button", { name: /Over-sharpened bucket/ }));
    expect(screen.getByText("choice:11+")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByText(/→ T = 0.5/)).toBeInTheDocument();
  });

  it("flags low confidence in the answer JSON", async () => {
    const user = userEvent.setup();
    render(<DecodingPlayground />);
    await user.click(screen.getByRole("button", { name: /Urgency/ }));
    // max p for [-0.5, 0.8, 1.2] at T = 1 is about 0.53, below the default 0.6 threshold
    expect(screen.getByText(/flagged/)).toBeInTheDocument();
  });
});
