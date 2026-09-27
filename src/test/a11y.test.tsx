import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import App from "../App";
import { CHAPTERS } from "../content/chapters";

// jsdom does not compute layout or colours, so contrast is checked separately; every other rule runs.
const OPTIONS: axe.RunOptions = { rules: { "color-contrast": { enabled: false } } };

async function violations(container: Element) {
  const result = await axe.run(container, OPTIONS);
  return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.html.slice(0, 120)}`);
}

describe("accessibility (axe-core)", () => {
  it("app shell has no violations", async () => {
    const { container } = render(<App />);
    await screen.findAllByRole("heading", { level: 2 }, { timeout: 10000 });
    expect(await violations(container)).toEqual([]);
  }, 20000);

  it.each(CHAPTERS.map((c) => [c.id, c] as const))("chapter %s has no violations", async (_id, chapter) => {
    const { Component } = chapter;
    const { container } = render(
      <main>
        <h1>{chapter.title}</h1>
        <Suspense fallback={<p>loading</p>}>
          <Component />
        </Suspense>
      </main>,
    );
    await screen.findAllByText((_, el) => el?.tagName === "P" && el.textContent !== "loading", undefined, { timeout: 10000 });
    expect(await violations(container)).toEqual([]);
  }, 30000);
});
