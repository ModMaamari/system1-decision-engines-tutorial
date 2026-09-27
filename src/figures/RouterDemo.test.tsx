import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RouterDemo } from "./RouterDemo";

describe("RouterDemo", () => {
  it("routes the samples with Laya's reasons", async () => {
    const user = userEvent.setup();
    render(<RouterDemo />);
    expect(screen.getByText("English Latin text")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hindi" }));
    expect(screen.getByText("laya-multilingual")).toBeInTheDocument();
    expect(screen.getByText(/non-Latin script \(devanagari/)).toBeInTheDocument();
  });

  it("lets an explicit model win over detection", async () => {
    const user = userEvent.setup();
    render(<RouterDemo />);
    await user.click(screen.getByRole("radio", { name: "typed" }));
    expect(screen.getByText("explicit model='typed-decisions'")).toBeInTheDocument();
  });

  it("changes the default for undecided text", async () => {
    const user = userEvent.setup();
    render(<RouterDemo />);
    await user.click(screen.getByRole("button", { name: "Short Portuguese" }));
    expect(screen.getByText(/using default \(english\)/)).toBeInTheDocument();
    await user.click(screen.getAllByRole("radio", { name: "multilingual" })[1]);
    expect(screen.getByText(/using default \(multilingual\)/)).toBeInTheDocument();
  });
});
