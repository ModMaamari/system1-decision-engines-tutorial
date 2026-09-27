import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GatingSim, costPer1000, gateAt } from "./GatingSim";

describe("gating maths", () => {
  it("automates answers at or above the threshold", () => {
    const s = gateAt([0.9, 0.8, 0.6, 0.95], [true, false, true, true], 0.8);
    expect(s.automated).toBe(3);
    expect(s.coverage).toBe(0.75);
    expect(s.accuracy).toBeCloseTo(2 / 3, 12);
  });

  it("prices errors and reviews", () => {
    const s = { threshold: 0.8, coverage: 0.5, accuracy: 0.9, automated: 500 };
    expect(costPer1000(s, 10, 1)).toBeCloseTo(1000 * (0.5 * 0.1 * 10 + 0.5 * 1), 9);
  });
});

describe("GatingSim", () => {
  it("shows that raw confidence overstates the accuracy of automated answers", async () => {
    const user = userEvent.setup();
    render(<GatingSim />);
    expect(screen.getByText(/roughly means what it says/)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "raw (as shipped)" }));
    const text = screen.getByText(/does not mean what it says/).textContent ?? "";
    const pct = Number(/right only (\d+)%/.exec(text)?.[1]);
    expect(pct).toBeLessThan(85);
  });
});
