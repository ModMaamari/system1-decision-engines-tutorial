/**
 * The input layout of one question row, ported from `build_sequence` in laya/common.py:
 *
 *   [CLS] <type> question: <instructions> [SEP] [MASK] opt0 [MASK] opt1 ... [SEP] state [SEP]
 *
 * The budget rules are exact. The tokenizer is not: Laya uses the checkpoint's BPE tokenizer,
 * while this module ships a small approximation so the visualiser can run in the browser.
 */
import { headerText, renderOptions, type QuestionDef } from "./questions";

export const OPTION_TOKEN_CAP = 48;

/**
 * A rough stand-in for a BPE tokenizer: short words are one token, long words split into chunks
 * of about five letters, numbers into groups of up to three digits, punctuation one token each,
 * and each non-Latin character roughly one token. Counts land in the right range for English
 * prose; they are not ModernBERT's or mmBERT's counts.
 */
export function approxTokenize(text: string): string[] {
  const out: string[] = [];
  const re = /\s*[A-Za-z]+|\s*\d{1,3}|\s*[^\sA-Za-z\d]|\s+$/g;
  for (const m of text.matchAll(re)) {
    const piece = m[0];
    const lead = piece.match(/^\s*/)?.[0] ?? "";
    const body = piece.slice(lead.length);
    if (/^[A-Za-z]+$/.test(body) && body.length > 7) {
      for (let i = 0; i < body.length; i += 5) out.push((i === 0 ? lead : "") + body.slice(i, i + 5));
    } else if (body || lead) {
      out.push(piece);
    }
  }
  return out;
}

export type Role = "cls" | "head" | "sep" | "mask" | "opt" | "state";

export interface Tok {
  text: string;
  role: Role;
  /** Option index for mask/opt tokens. */
  opt?: number;
}

export interface SequenceStats {
  /** Options the question defines. */
  options: number;
  /** Options whose (possibly trimmed) token span is still unique. */
  optionsDistinct: number;
  /** The per-option cap applied when options overflowed the head budget, else null. */
  tokensPerOption: number | null;
  headTokens: number;
  headTokensFull: number;
  optionTokens: number;
  stateTokens: number;
  stateTokensFull: number;
  /** Options whose marker fell beyond max_len (Laya rejects such a request). */
  optionsCut: number;
  length: number;
}

export interface BuildInput {
  question: QuestionDef;
  state: string;
  maxLen: number;
  headMaxLen: number;
  /** Conversation lists keep their newest turns: truncate the state from the left. */
  truncateLeft?: boolean;
  tokenize?: (s: string) => string[];
}

export function buildSequence({ question, state, maxLen, headMaxLen, truncateLeft = false, tokenize = approxTokenize }: BuildInput) {
  const opts = renderOptions(question);
  const headFull = tokenize(headerText(question));

  let optIds: Tok[][] = opts.map((o, i) => [
    { text: "[MASK]", role: "mask" as const, opt: i },
    ...tokenize(" " + o)
      .slice(0, OPTION_TOKEN_CAP)
      .map((t) => ({ text: t, role: "opt" as const, opt: i })),
  ]);

  let optBudget = headMaxLen - optIds.reduce((a, o) => a + o.length, 0);
  let perOption: number | null = null;
  if (optBudget < 16) {
    const per = Math.max(4, Math.floor((headMaxLen - 16) / Math.max(1, optIds.length)));
    perOption = per;
    optIds = optIds.map((o) => o.slice(0, per));
    optBudget = headMaxLen - optIds.reduce((a, o) => a + o.length, 0);
  }
  const head = headFull.slice(0, Math.max(8, optBudget));

  const ids: Tok[] = [{ text: "[CLS]", role: "cls" }, ...head.map((t) => ({ text: t, role: "head" as const })), { text: "[SEP]", role: "sep" }];
  const markers: number[] = [];
  for (const o of optIds) {
    markers.push(ids.length);
    ids.push(...o);
  }
  ids.push({ text: "[SEP]", role: "sep" });

  const stateFull = tokenize(state);
  const room = Math.max(0, maxLen - ids.length - 1);
  const st = truncateLeft ? stateFull.slice(Math.max(0, stateFull.length - room)) : stateFull.slice(0, room);
  const all: Tok[] = [...ids, ...st.map((t) => ({ text: t, role: "state" as const })), { text: "[SEP]", role: "sep" as const }];
  const tokens = all.slice(0, maxLen);
  const keptMarkers = markers.filter((m) => m < maxLen);

  const spans = optIds.map((o) => o.map((t) => t.text).join("\u0000"));
  const stats: SequenceStats = {
    options: optIds.length,
    optionsDistinct: new Set(spans).size,
    tokensPerOption: perOption,
    headTokens: head.length,
    headTokensFull: headFull.length,
    optionTokens: optIds.reduce((a, o) => a + o.length, 0),
    stateTokens: st.length,
    stateTokensFull: stateFull.length,
    optionsCut: markers.length - keptMarkers.length,
    length: tokens.length,
  };
  return { tokens, markers: keptMarkers, stats };
}
