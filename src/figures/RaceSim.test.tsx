import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RaceSim, generativeLatency } from "./RaceSim";

describe("RaceSim", () => {
  it("computes generative latency as first token plus one step per output token", () => {
    expect(generativeLatency(1, 10, 300, 25)).toBe(550);
    expect(generativeLatency(5, 8, 200, 20)).toBe(1000);
  });

  it("uses Laya's measured T4 latency for the engine lane", async () => {
    const user = userEvent.setup();
    render(<RaceSim />);
    expect(screen.getByText("32.8 ms")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "10 questions" }));
    expect(screen.getByText("72.3 ms")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "laya (English)" }));
    expect(screen.getByText("158.6 ms")).toBeInTheDocument();
  });
});
