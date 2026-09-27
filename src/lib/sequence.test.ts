import { describe, expect, it } from "vitest";
import { approxTokenize, buildSequence } from "./sequence";
import type { QuestionDef } from "./questions";

const words = (s: string) => s.split(/(?=\s)/).filter(Boolean); // exact, whitespace-attached "tokens"

const q: QuestionDef = {
  type: "choice",
  instructions: "Which department should handle this?",
  criteria: { billing: "invoices, payments, refunds", technical: "bugs, outages", other: "everything else" },
};

describe("approxTokenize", () => {
  it("keeps every character and splits long words", () => {
    const text = "Please refund the duplicate charge on invoice 4411, internationalization!";
    expect(approxTokenize(text).join("")).toBe(text);
    expect(approxTokenize("internationalization").length).toBeGreaterThan(1);
    expect(approxTokenize("the cat").length).toBe(2);
  });
});

describe("buildSequence (build_sequence in laya/common.py)", () => {
  it("lays out [CLS] header [SEP] [MASK] options [SEP] state [SEP] with one marker per option", () => {
    const { tokens, markers } = buildSequence({ question: q, state: "billed twice", maxLen: 512, headMaxLen: 192, tokenize: words });
    expect(tokens[0].text).toBe("[CLS]");
    expect(tokens[tokens.length - 1].text).toBe("[SEP]");
    expect(markers).toHaveLength(3);
    markers.forEach((m, i) => {
      expect(tokens[m].text).toBe("[MASK]");
      expect(tokens[m].opt).toBe(i);
    });
    expect(tokens.filter((t) => t.role === "state").map((t) => t.text).join("")).toBe("billed twice");
  });

  it("never exceeds max_len and truncates the state from the right by default", () => {
    const state = Array.from({ length: 1000 }, (_, i) => `w${i}`).join(" ");
    const { tokens, stats } = buildSequence({ question: q, state, maxLen: 128, headMaxLen: 64, tokenize: words });
    expect(tokens).toHaveLength(128);
    expect(stats.stateTokens).toBeLessThan(stats.stateTokensFull);
    const kept = tokens.filter((t) => t.role === "state");
    expect(kept[0].text).toBe("w0");
  });

  it("keeps the newest turns when truncating from the left", () => {
    const state = Array.from({ length: 1000 }, (_, i) => `w${i}`).join(" ");
    const { tokens } = buildSequence({ question: q, state, maxLen: 128, headMaxLen: 64, truncateLeft: true, tokenize: words });
    const kept = tokens.filter((t) => t.role === "state");
    expect(kept[kept.length - 1].text.trim()).toBe("w999");
  });

  it("caps each option at 48 tokens", () => {
    const long = Array.from({ length: 80 }, () => "x").join(" ");
    const { stats } = buildSequence({
      question: { type: "choice", instructions: "q", criteria: { a: long } },
      state: "",
      maxLen: 1024,
      headMaxLen: 512,
      tokenize: words,
    });
    expect(stats.optionTokens).toBe(1 + 48); // [MASK] + 48
  });

  it("trims every option to (head_max_len - 16) // n tokens (at least 4) when they overflow", () => {
    const criteria = Object.fromEntries(Array.from({ length: 77 }, (_, i) => [`label_${i}`, "a fairly long description of this intent"]));
    const { stats } = buildSequence({ question: { type: "choice", instructions: "Which intent?", criteria }, state: "hi", maxLen: 1024, headMaxLen: 256, tokenize: words });
    expect(stats.tokensPerOption).toBe(4); // max(4, 240 // 77 = 3)
    expect(stats.optionTokens).toBe(77 * 4);
  });

  it("detects options that collapse onto the same tokens", () => {
    const criteria = { card_arrival_now_status: "where is my card", card_arrival_now_delay: "card is late", card_activation: "activate" };
    // A 20-token head cannot hold the options: per = max(4, (20 - 16) // 3) = 4, i.e. [MASK] + 3 tokens,
    // and the first two labels share their first three tokens.
    const tok = (s: string) => s.split(/(?=[_\s])/).filter(Boolean);
    const { stats } = buildSequence({ question: { type: "choice", instructions: "Which?", criteria }, state: "", maxLen: 256, headMaxLen: 20, tokenize: tok });
    expect(stats.tokensPerOption).toBe(4);
    expect(stats.optionsDistinct).toBeLessThan(stats.options);
  });

  it("keeps at least 8 header tokens", () => {
    // 60 options at the 4-token minimum (240 tokens) overflow a 192-token head, leaving the header 8.
    const criteria = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`l${i}`, "d d d d d d d d"]));
    const { stats } = buildSequence({
      question: { type: "choice", instructions: Array.from({ length: 40 }, () => "word").join(" "), criteria },
      state: "",
      maxLen: 2048,
      headMaxLen: 192,
      tokenize: words,
    });
    expect(stats.headTokens).toBe(8);
  });
});
