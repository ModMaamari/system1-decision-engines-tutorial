import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Quiz from "./chapters/Quiz";
import { CHAPTERS } from "./chapters";
import { QUIZ } from "./quiz";

describe("quiz data", () => {
  it("has a valid answer and a real chapter for every question", () => {
    for (const q of QUIZ) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(CHAPTERS.map((c) => c.id)).toContain(q.chapter);
    }
  });
});

describe("Quiz", () => {
  it("locks an answer, explains it and counts the score", async () => {
    const user = userEvent.setup();
    render(<Quiz />);
    const first = screen.getByRole("group", { name: "Question 1 options" });
    const buttons = within(first).getAllByRole("button");
    await user.click(buttons[QUIZ[0].answer]);
    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(buttons[0]).toBeDisabled();
    const second = within(screen.getByRole("group", { name: "Question 2 options" })).getAllByRole("button");
    await user.click(second[(QUIZ[1].answer + 1) % QUIZ[1].options.length]);
    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.tagName === "SPAN" && /^1 \/ 2 correct/.test(el.textContent ?? ""))).toBeInTheDocument();
  });

  it("shows a final score and remembers the best", async () => {
    const user = userEvent.setup();
    render(<Quiz />);
    for (let i = 0; i < QUIZ.length; i++) {
      const group = screen.getByRole("group", { name: `Question ${i + 1} options` });
      await user.click(within(group).getAllByRole("button")[QUIZ[i].answer]);
    }
    expect(screen.getByRole("heading", { name: `${QUIZ.length} of ${QUIZ.length}` })).toBeInTheDocument();
    expect(window.localStorage.getItem("s1-tutorial:quiz-best")).toBe(String(QUIZ.length));
  });
});
