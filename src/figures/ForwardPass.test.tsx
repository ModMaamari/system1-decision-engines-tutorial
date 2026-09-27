import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ForwardPass } from "./ForwardPass";

describe("ForwardPass", () => {
  it("steps through the stages with real shapes for the chosen width", async () => {
    const user = userEvent.setup();
    render(<ForwardPass />);
    expect(screen.getByText("Batch the rows")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("Bidirectional encoder")).toBeInTheDocument();
    expect(screen.getByText(/h \[3, 58, 1024\]/)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "d = 768" }));
    expect(screen.getByText(/h \[3, 58, 768\]/)).toBeInTheDocument();
  });

  it("jumps to a stage from the pipeline and decodes the example batch", async () => {
    const user = userEvent.setup();
    render(<ForwardPass />);
    await user.click(screen.getByRole("button", { name: /Temperature \+ softmax/ }));
    expect(screen.getByText("Decode (next chapter)")).toBeInTheDocument();
    expect(screen.getByText("billing")).toBeInTheDocument();
  });
});
