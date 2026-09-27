import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { CHAPTERS, PARTS } from "./chapters";

describe("chapter registry", () => {
  it("has unique ids and valid parts", () => {
    const ids = CHAPTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CHAPTERS) expect(PARTS.map((p) => p.id)).toContain(c.part);
  });

  it.each(CHAPTERS.map((c) => [c.id, c] as const))("renders chapter %s", async (_id, chapter) => {
    const { Component } = chapter;
    const { container } = render(
      <Suspense fallback={<p>loading</p>}>
        <Component />
      </Suspense>,
    );
    await screen.findAllByText((_, el) => el?.tagName === "P" && el.textContent !== "loading", undefined, { timeout: 10000 });
    expect(container.textContent?.length ?? 0).toBeGreaterThan(40);
    // Links between chapters must point at chapters that exist.
    container.querySelectorAll('a[href^="#/"]').forEach((a) => {
      const id = a.getAttribute("href")!.slice(2);
      expect(CHAPTERS.map((c) => c.id)).toContain(id);
    });
  }, 15000);
});
