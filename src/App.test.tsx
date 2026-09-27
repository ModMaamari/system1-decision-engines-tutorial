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

  it("moves with the arrow keys and counts a chapter as read on Next", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(CHAPTERS[1].title);
    expect(screen.getByText(`1/${CHAPTERS.length}`)).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(CHAPTERS[0].title);
    expect(screen.getByRole("button", { name: "Chapter completed" })).toHaveAttribute("aria-pressed", "true");
  });

  it("does not steal arrow keys from form controls", async () => {
    const user = userEvent.setup();
    render(
      <>
        <App />
        <input aria-label="probe" />
      </>,
    );
    await user.click(screen.getByLabelText("probe"));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(CHAPTERS[0].title);
  });

  it("toggles completion from the chapter footer", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Mark chapter as complete" }));
    expect(screen.getByRole("button", { name: "Chapter completed" })).toBeInTheDocument();
    expect(screen.getByText(`1/${CHAPTERS.length}`)).toBeInTheDocument();
  });

  it("opens the chapter named in the URL", () => {
    window.location.hash = `/${CHAPTERS[8].id}`;
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(CHAPTERS[8].title);
  });
});

describe("mobile drawer", () => {
  it("is inert when closed on narrow screens, and opens, focuses and closes with Escape", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ ...original(q), matches: q.includes("max-width: 1024px") })) as typeof window.matchMedia;
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole("navigation", { hidden: true, name: "Chapters" });
    expect(nav).toHaveAttribute("inert");
    await user.click(screen.getByRole("button", { name: "Open chapter list" }));
    expect(nav).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Close chapter list" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(nav).toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Open chapter list" })).toHaveFocus();
    window.matchMedia = original;
  });
});
