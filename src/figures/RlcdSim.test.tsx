import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RlcdSim, explain } from "./RlcdSim";

describe("RlcdSim", () => {
  it("samples a group of G = 4 on Step", async () => {
    const user = userEvent.setup();
    render(<RlcdSim />);
    await user.click(screen.getByRole("button", { name: "Step" }));
    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.queryByText("#5")).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "Step" }));
    expect(screen.getByText("#8")).toBeInTheDocument();
  });

  it("explains each reward accurately", () => {
    expect(explain("proper", true)).toMatch(/teacher's distribution/);
    expect(explain("linear", true)).toMatch(/overpowers/);
    expect(explain("accuracy", true)).toMatch(/cross-entropy term's work/);
    expect(explain("accuracy", false)).toMatch(/accident of the exploration noise/);
  });
});
