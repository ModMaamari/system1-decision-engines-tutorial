import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import { CHAPTERS } from "./content/chapters";

describe("App shell", () => {
  it("opens on the first chapter", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(CHAPTERS[0].title);
  });

  it("lists every chapter in the sidebar", () => {
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Chapters" });
    for (const c of CHAPTERS) {
      expect(nav).toHaveTextContent(c.title);
    }
  });

  it("navigates when a chapter link is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    const target = CHAPTERS[3];
    await user.click(screen.getByRole("link", { name: new RegExp(target.title) }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(target.title);
    expect(window.location.hash).toBe(`#/${target.id}`);
    expect(screen.getByRole("link", { name: new RegExp(target.title) })).toHaveAttribute("aria-current", "page");
  });

  it("opens the chapter named in the URL", () => {
    window.location.hash = `/${CHAPTERS[8].id}`;
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(CHAPTERS[8].title);
  });
});
