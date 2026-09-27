import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Glossary from "./chapters/Glossary";
import { CHAPTERS } from "./chapters";
import { GLOSSARY, REFERENCES } from "./glossary";

describe("glossary", () => {
  it("links every term to a real chapter and has unique terms", () => {
    for (const t of GLOSSARY) expect(CHAPTERS.map((c) => c.id)).toContain(t.chapter);
    expect(new Set(GLOSSARY.map((t) => t.term)).size).toBe(GLOSSARY.length);
    for (const g of REFERENCES) for (const r of g.items) expect(r.href).toMatch(/^https:\/\//);
  });

  it("filters terms", async () => {
    const user = userEvent.setup();
    render(<Glossary />);
    await user.type(screen.getByLabelText("Filter glossary terms"), "rlcd");
    expect(screen.getByText("RLCD")).toBeInTheDocument();
    expect(screen.queryByText("Brier score")).not.toBeInTheDocument();
  });
});
