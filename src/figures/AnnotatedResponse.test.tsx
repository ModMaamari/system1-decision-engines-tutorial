import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { answerConfidence, entropyConfidence, expectedScore } from "../lib/decision";
import { AnnotatedResponse, RESPONSE } from "./AnnotatedResponse";

type A = Record<string, unknown> & { probabilities: Record<string, number> };

describe("AnnotatedResponse", () => {
  it("uses an internally consistent example", () => {
    const answers = (RESPONSE as { answers: Record<string, A> }).answers;
    for (const id of ["department", "urgency"]) {
      const p = Object.values(answers[id].probabilities);
      expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 3);
      expect(answers[id].answer_confidence).toBeCloseTo(answerConfidence(p), 4);
      expect(answers[id].confidence).toBeCloseTo(entropyConfidence(p), 3);
    }
    expect(answers.urgency.score).toBeCloseTo(expectedScore(Object.values(answers.urgency.probabilities)), 2);
  });

  it("explains a key when it is hovered", async () => {
    const user = userEvent.setup();
    render(<AnnotatedResponse />);
    await user.hover(screen.getByRole("button", { name: '"output_tokens"' }));
    expect(screen.getByText("Always 0: nothing is generated.")).toBeInTheDocument();
    await user.hover(screen.getAllByRole("button", { name: '"act_probability"' })[0]);
    expect(screen.getByText(/Not usable yet/)).toBeInTheDocument();
  });
});
