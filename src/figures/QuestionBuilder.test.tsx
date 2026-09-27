import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { QuestionBuilder, lintQuestion } from "./QuestionBuilder";

describe("QuestionBuilder", () => {
  it("shows the options the model reads for the default question", () => {
    render(<QuestionBuilder />);
    expect(screen.getByText("Valid question.")).toBeInTheDocument();
    expect(screen.getByText("choice question: Which department should handle this request?")).toBeInTheDocument();
    expect(screen.getByText("billing: invoices, payments, refunds")).toBeInTheDocument();
  });

  it("reports Laya's validation error for yes/no noul keys", async () => {
    const user = userEvent.setup();
    render(<QuestionBuilder />);
    await user.click(screen.getByRole("button", { name: "Mistake: yes/no keys" }));
    expect(screen.getByText("Laya would reject this.")).toBeInTheDocument();
    expect(screen.getByText(/keyed only 'true'\/'false'/)).toBeInTheDocument();
  });

  it("warns about boolean-word choice labels", async () => {
    const user = userEvent.setup();
    render(<QuestionBuilder />);
    await user.click(screen.getByRole("button", { name: "Pitfall: boolean labels" }));
    expect(screen.getByText(/Avoid boolean-word labels/)).toBeInTheDocument();
  });

  it("edits through the form and keeps the JSON in sync", async () => {
    const user = userEvent.setup();
    render(<QuestionBuilder />);
    await user.selectOptions(screen.getByRole("combobox"), "noul");
    expect(screen.getByText("true: the statement holds")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "JSON" }));
    expect((screen.getByLabelText("Question definition as JSON") as HTMLTextAreaElement).value).toContain('"type": "noul"');
  });

  it("lints a noul without criteria", () => {
    expect(lintQuestion({ type: "noul", instructions: "Urgent?" })[0]).toMatch(/generic pair/);
  });
});
