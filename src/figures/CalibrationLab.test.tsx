import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CalibrationLab } from "./CalibrationLab";

describe("CalibrationLab", () => {
  it("fits a temperature near the true factor and lowers test ECE", async () => {
    const user = userEvent.setup();
    render(<CalibrationLab />);
    expect(screen.getByText("over-confident")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Fit T/ }));
    const msg = screen.getByText(/Fitted T = /).textContent ?? "";
    const t = Number(/Fitted T = (\d+\.\d+)/.exec(msg)?.[1]);
    expect(t).toBeGreaterThan(2.2);
    expect(t).toBeLessThan(2.8);
    const [, before, after] = /ECE on the test split: (\d+\.\d+) → (\d+\.\d+)/.exec(msg) ?? [];
    expect(Number(after)).toBeLessThan(Number(before));
  });
});
