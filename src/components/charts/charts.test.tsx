import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarChart } from "./BarChart";
import { LineChart } from "./LineChart";
import { ProbBars } from "./ProbBars";

describe("charts", () => {
  it("draws one path per line series and a legend for several", () => {
    const { container } = render(
      <LineChart
        ariaLabel="test lines"
        xLabel="x"
        yLabel="y"
        xDomain={[0, 1]}
        yDomain={[0, 1]}
        series={[
          { id: "a", label: "Series A", color: "red", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
          { id: "b", label: "Series B", color: "blue", points: [{ x: 0, y: 1 }, { x: 1, y: 0 }] },
        ]}
      />,
    );
    expect(screen.getByRole("img", { name: "test lines" })).toBeInTheDocument();
    expect(container.querySelectorAll("path[stroke='red']")).toHaveLength(1);
    expect(screen.getByText("Series A")).toBeInTheDocument();
  });

  it("draws bars with values and a table view", () => {
    render(
      <BarChart
        ariaLabel="test bars"
        valueLabel="Task"
        domain={[0, 1]}
        series={[
          { id: "en", label: "English", color: "red" },
          { id: "ml", label: "Multilingual", color: "blue" },
        ]}
        rows={[{ label: "XNLI", values: { en: 0.86, ml: 0.843 } }]}
        refLines={[{ value: 0.5, label: "random" }]}
      />,
    );
    expect(screen.getByRole("img", { name: "test bars" })).toBeInTheDocument();
    expect(screen.getAllByText("0.860").length).toBeGreaterThan(0);
    expect(screen.getByText("View as table")).toBeInTheDocument();
    expect(screen.getByText(/random: 0.500/)).toBeInTheDocument();
  });

  it("renders probability rows", () => {
    render(<ProbBars items={[{ label: "billing", p: 0.9, chosen: true }, { label: "other", p: 0.1 }]} ariaLabel="dist" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("0.900")).toBeInTheDocument();
  });
});
