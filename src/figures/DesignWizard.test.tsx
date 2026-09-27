import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { validateQuestion } from "../lib/questions";
import { DesignWizard, LEAVES, TREE } from "./DesignWizard";
import { USE_CASES, UseCaseGallery } from "./UseCaseGallery";

describe("DesignWizard", () => {
  it("every branch ends in a known node or leaf", () => {
    for (const node of Object.values(TREE)) {
      for (const o of node.options) {
        if (o.next.startsWith("leaf:")) expect(LEAVES[o.next.slice(5)]).toBeDefined();
        else expect(TREE[o.next]).toBeDefined();
      }
    }
  });

  it("recommends a score question for an ordered scale", async () => {
    const user = userEvent.setup();
    render(<DesignWizard />);
    await user.click(screen.getByRole("button", { name: /fixed set/ }));
    await user.click(screen.getByRole("button", { name: "Exactly one" }));
    await user.click(screen.getByRole("button", { name: /Yes \(severity/ }));
    expect(screen.getByText("A score question")).toBeInTheDocument();
  });

  it("ships templates that Laya would accept", () => {
    for (const leaf of Object.values(LEAVES)) {
      if (!leaf.template || leaf.template.startsWith("#")) continue;
      const qs = JSON.parse(leaf.template) as Record<string, unknown>;
      for (const [id, q] of Object.entries(qs)) expect(validateQuestion(id, q)).toBeNull();
    }
  });
});

describe("UseCaseGallery", () => {
  it("every schema is valid for Laya", () => {
    for (const uc of USE_CASES) {
      const qs = JSON.parse(uc.schema) as Record<string, unknown>;
      for (const [id, q] of Object.entries(qs)) expect(validateQuestion(id, q), `${uc.id}.${id}`).toBeNull();
    }
  });

  it("uses the exact typed-decisions question ids", () => {
    const ids = (id: string) => Object.keys(JSON.parse(USE_CASES.find((u) => u.id === id)!.schema)).sort();
    expect(ids("invoice")).toEqual(["discrepancy_severity", "disposition", "duplicate", "matches_order", "urgency"]);
    expect(ids("security")).toEqual(["credential_compromise", "disposition", "severity", "true_positive", "urgency"]);
    expect(ids("traces")).toEqual(["action", "needs_review", "outcome", "risk", "urgency"]);
  });

  it("switches use cases", async () => {
    const user = userEvent.setup();
    render(<UseCaseGallery />);
    await user.click(screen.getByRole("option", { name: /Content moderation/ }));
    expect(screen.getByText(/barely above chance/)).toBeInTheDocument();
  });
});
