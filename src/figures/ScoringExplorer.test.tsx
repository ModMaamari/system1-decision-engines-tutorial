import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { OrdinalScores, ScoringExplorer, bestReport } from "./ScoringExplorer";

describe("ScoringExplorer", () => {
  it("finds the honest report for proper rules and the edge for the linear score", () => {
    expect(bestReport("log", 0.7)).toBeCloseTo(0.7, 2);
    expect(bestReport("brier", 0.3)).toBeCloseTo(0.3, 2);
    expect(bestReport("spherical", 0.85)).toBeCloseTo(0.85, 2);
    expect(bestReport("linear", 0.7)).toBeCloseTo(0.99, 2);
  });

  it("renders the comparison table", () => {
    render(<ScoringExplorer />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("Log score")).toBeInTheDocument();
    expect(within(table).getByText("any q on the > 0.5 side")).toBeInTheDocument();
  });
});

describe("OrdinalScores", () => {
  it("charges a far miss more than a near miss under RPS", async () => {
    const user = userEvent.setup();
    render(<OrdinalScores />);
    const rows = screen.getAllByRole("row").slice(1);
    const rpsOf = (i: number) => Number(within(rows[i]).getAllByRole("cell")[1].textContent);
    expect(rpsOf(1)).toBeGreaterThan(rpsOf(0)); // truth = level 3: all on 0 is further than all on 2
    await user.click(screen.getByRole("button", { name: "0 none" }));
    const rows2 = screen.getAllByRole("row").slice(1);
    const r = (i: number) => Number(within(rows2[i]).getAllByRole("cell")[1].textContent);
    expect(r(1)).toBeGreaterThan(r(0));
  });
});
