import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AgentPipeline, SCENARIOS, passes } from "./AgentPipeline";

describe("AgentPipeline", () => {
  it("compares a gate's confidence with the threshold", () => {
    const step = SCENARIOS[0].steps[1];
    expect(passes(step, 0.9)).toBe(true);
    expect(passes(step, 0.95)).toBe(false);
  });

  it("blocks a prompt injection without any LLM call", async () => {
    const user = userEvent.setup();
    render(<AgentPipeline />);
    await user.click(screen.getByRole("radio", { name: "Prompt injection" }));
    expect(screen.getByText((_, el) => el?.tagName === "SPAN" && /^0 LLM calls/.test(el.textContent ?? ""))).toBeInTheDocument();
    expect(screen.getByText("canned refusal, logged; no LLM call")).toBeInTheDocument();
  });

  it("escalates the ambiguous request at the default threshold", async () => {
    const user = userEvent.setup();
    render(<AgentPipeline />);
    await user.click(screen.getByRole("radio", { name: "Ambiguous request" }));
    expect(screen.getByText("LLM planner reads the whole case and decides")).toBeInTheDocument();
  });
});
