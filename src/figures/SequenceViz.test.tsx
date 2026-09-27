import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SequenceViz } from "./SequenceViz";

describe("SequenceViz", () => {
  it("shows all four options distinct and the whole short state read", () => {
    render(<SequenceViz />);
    expect(screen.getByText("4/4")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("trims and collapses options for 77 Banking77 labels", async () => {
    const user = userEvent.setup();
    render(<SequenceViz />);
    await user.click(screen.getByRole("radio", { name: "77 labels" }));
    expect(screen.getByText(/each was cut to 4/)).toBeInTheDocument();
    expect(screen.getByText(/options? now share a token span/)).toBeInTheDocument();
  });

  it("warns when a long state is cut", async () => {
    const user = userEvent.setup();
    render(<SequenceViz />);
    await user.click(screen.getByRole("radio", { name: "Long email" }));
    expect(screen.getByText(/state tokens never reach the model/)).toBeInTheDocument();
  });
});
