import { describe, expect, it } from "vitest";
import { headerText, optionKeys, pyJson, renderOptions, resolveNoulLabels, validateQuestion } from "./questions";

describe("renderOptions (render_options in laya/common.py)", () => {
  it("renders choice options as 'label: description', or the bare label", () => {
    expect(
      renderOptions({
        type: "choice",
        instructions: "Which department?",
        criteria: { billing: "invoices, payments, refunds", technical: "bugs", other: "" },
      }),
    ).toEqual(["billing: invoices, payments, refunds", "technical: bugs", "other"]);
    expect(renderOptions({ type: "choice", instructions: "Topic?", criteria: ["coding", "other"] })).toEqual(["coding", "other"]);
  });

  it("renders score levels with their index", () => {
    expect(renderOptions({ type: "score", instructions: "Urgency?", criteria: ["not urgent", "soon", "blocking"] })).toEqual([
      "level 0: not urgent",
      "level 1: soon",
      "level 2: blocking",
    ]);
  });

  it("renders noul as [false, true] with defaults, criteria and labels", () => {
    expect(renderOptions({ type: "noul", instructions: "Urgent?" })).toEqual([
      "false: no, the statement does not hold",
      "true: yes, the statement holds",
    ]);
    expect(
      renderOptions({
        type: "noul",
        instructions: "Is this review positive?",
        criteria: { true: "the review is positive", false: "the review is negative" },
        labels: { true: "A", false: "B" },
      }),
    ).toEqual(["B: the review is negative", "A: the review is positive"]);
  });

  it("renders structured criteria as compact JSON, like Python's json.dumps", () => {
    expect(renderOptions({ type: "choice", instructions: "x", criteria: { a: { desc: "d", n: 2 } } })).toEqual([
      'a: {"desc": "d", "n": 2}',
    ]);
    expect(pyJson([1, "x", true, null])).toBe('[1, "x", true, null]');
  });
});

describe("validateQuestion (_check_question in laya/agent.py)", () => {
  it("accepts well-formed questions", () => {
    expect(validateQuestion("d", { type: "choice", instructions: "x", criteria: { a: "1", b: "2" } })).toBeNull();
    expect(validateQuestion("u", { type: "score", instructions: "x", criteria: ["low", "high"] })).toBeNull();
    expect(validateQuestion("n", { type: "noul", instructions: "x" })).toBeNull();
    expect(validateQuestion("n", { type: "noul", instructions: "x", criteria: { True: "yes" } })).toBeNull();
  });

  it("rejects what Laya rejects", () => {
    expect(validateQuestion("q", { type: "bool", instructions: "x" })).toMatch(/unknown type/);
    expect(validateQuestion("q", { type: "choice", criteria: ["a"] })).toMatch(/no 'instructions'/);
    expect(validateQuestion("q", { type: "choice", instructions: "x", criteria: [] })).toMatch(/at least one criterion/);
    expect(validateQuestion("q", { type: "choice", instructions: "x", criteria: ["a", "a"] })).toMatch(/repeats label 0/);
    expect(validateQuestion("q", { type: "choice", instructions: "x", criteria: ["a", null] })).toMatch(/is null/);
    expect(validateQuestion("q", { type: "score", instructions: "x", criteria: { a: 1 } })).toMatch(/list of level descriptions/);
    expect(validateQuestion("q", { type: "score", instructions: "x", criteria: ["a", null] })).toMatch(/level 1 is null/);
    expect(validateQuestion("q", { type: "noul", instructions: "x", criteria: { yes: "a", no: "b" } })).toMatch(/keyed only 'true'\/'false'/);
    expect(validateQuestion("q", { type: "choice", instructions: "x", criteria: ["a"], labels: { false: "B", true: "A" } })).toMatch(
      /only supported for noul/,
    );
    expect(validateQuestion("q", { type: "noul", instructions: "x", labels: { false: "A", true: "A" } })).toMatch(/distinct/);
  });
});

describe("helpers", () => {
  it("resolves noul labels", () => {
    expect(resolveNoulLabels()).toEqual(["false", "true"]);
    expect(resolveNoulLabels({ false: " B ", true: "A" })).toEqual(["B", "A"]);
    expect(() => resolveNoulLabels({ yes: "A", no: "B" })).toThrow();
  });

  it("lists answer keys and the header", () => {
    expect(optionKeys({ type: "score", instructions: "x", criteria: ["a", "b", "c"] })).toEqual(["0", "1", "2"]);
    expect(optionKeys({ type: "noul", instructions: "x" })).toEqual(["false", "true"]);
    expect(headerText({ type: "choice", instructions: "Which team?" })).toBe("choice question: Which team?");
  });
});
