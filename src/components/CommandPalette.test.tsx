import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../App";
import { search } from "../lib/search";

describe("search", () => {
  it("ranks a chapter title match first", () => {
    expect(search("calibration")[0].title).toMatch(/Calibration and temperature scaling/);
  });

  it("finds glossary terms and requires every word", () => {
    expect(search("rlcd").some((r) => r.kind === "term" && r.title === "RLCD")).toBe(true);
    expect(search("temperature zzzz")).toHaveLength(0);
  });
});

describe("CommandPalette in the app", () => {
  it("opens with Ctrl+K, filters, and navigates with Enter", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("{Control>}k{/Control}");
    const input = screen.getByRole("combobox", { name: "Search" });
    expect(input).toHaveFocus();
    await user.type(input, "router");
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Checkpoints and the router");
  });

  it("opens with / and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("/");
    expect(screen.getByRole("dialog", { name: "Search the tutorial" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
