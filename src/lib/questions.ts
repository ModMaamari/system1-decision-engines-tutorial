/**
 * Question definitions, validation and option rendering, ported from Laya:
 * `Agent._check_question` / `_to_internal` (laya/agent.py) and `render_options` /
 * `render_criterion` / `_resolve_noul_labels` (laya/common.py).
 */
import type { QType } from "./decision";

export type Criterion = string | number | boolean | null | Criterion[] | { [k: string]: Criterion };

export interface QuestionDef {
  type: QType;
  instructions: string;
  /** choice: {label: description} or [label, ...]; score: [level0, level1, ...]; noul: {false?, true?}. */
  criteria?: Record<string, Criterion> | Criterion[];
  /** noul only: the model-facing words for the two slots. */
  labels?: { false: string; true: string };
}

const QTYPES = ["choice", "score", "noul"];

/** JSON with Python's `separators=(", ", ": ")`, which is how Laya renders structured criteria. */
export function pyJson(v: Criterion): string {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.map(pyJson).join(", ")}]`;
  return `{${Object.entries(v)
    .map(([k, x]) => `${JSON.stringify(k)}: ${pyJson(x)}`)
    .join(", ")}}`;
}

/** `render_criterion`: strings pass through; anything structured becomes compact JSON. */
export function renderCriterion(v: Criterion): string {
  return typeof v === "string" ? v : pyJson(v);
}

/** `_resolve_noul_labels`: the (false, true) words shown to the model. */
export function resolveNoulLabels(labels?: unknown): [string, string] {
  if (labels === undefined || labels === null) return ["false", "true"];
  const bad = () => new Error("noul labels must map exactly 'false' and 'true' to distinct non-empty strings");
  if (typeof labels !== "object" || Array.isArray(labels)) throw bad();
  const keys = Object.keys(labels as object).sort();
  if (keys.length !== 2 || keys[0] !== "false" || keys[1] !== "true") throw bad();
  const f = (labels as Record<string, unknown>).false;
  const t = (labels as Record<string, unknown>).true;
  if (typeof f !== "string" || typeof t !== "string") throw bad();
  const fs = f.trim();
  const ts = t.trim();
  if (!fs || !ts || fs === ts) throw bad();
  return [fs, ts];
}

/** `render_options`: option texts in label-index order; noul is always [false, true]. */
export function renderOptions(q: QuestionDef): string[] {
  const crit = q.criteria;
  if (q.type !== "noul" && q.labels !== undefined) throw new Error("labels is only supported for noul questions");
  if (q.type === "choice") {
    const entries: [string, Criterion][] = Array.isArray(crit)
      ? crit.map((c) => [String(c), null])
      : Object.entries(crit ?? {});
    return entries.map(([k, v]) => (v === null || v === undefined || v === "" ? k : `${k}: ${renderCriterion(v)}`));
  }
  if (q.type === "score") {
    return (Array.isArray(crit) ? crit : []).map((c, i) => `level ${i}: ${renderCriterion(c)}`);
  }
  const c = (crit && !Array.isArray(crit) ? crit : {}) as Record<string, Criterion>;
  const lower = Object.fromEntries(Object.entries(c).map(([k, v]) => [k.toLowerCase(), v]));
  const [fl, tl] = resolveNoulLabels(q.labels);
  const f = lower.false;
  const t = lower.true;
  return [
    `${fl}: ${f !== undefined && f !== null && f !== "" ? renderCriterion(f) : "no, the statement does not hold"}`,
    `${tl}: ${t !== undefined && t !== null && t !== "" ? renderCriterion(t) : "yes, the statement holds"}`,
  ];
}

/** The answer keys a question returns probabilities for. */
export function optionKeys(q: QuestionDef): string[] {
  if (q.type === "choice") {
    return Array.isArray(q.criteria) ? q.criteria.map(String) : Object.keys(q.criteria ?? {});
  }
  if (q.type === "score") return (Array.isArray(q.criteria) ? q.criteria : []).map((_, i) => String(i));
  return ["false", "true"];
}

/** The question header the model reads, as `build_sequence` writes it. */
export function headerText(q: Pick<QuestionDef, "type" | "instructions">): string {
  return `${q.type} question: ${q.instructions}`;
}

/**
 * `Agent._check_question`: null when the question is valid, otherwise the error Laya would raise
 * (worded the same way, trimmed of the historical notes in the Python source).
 */
export function validateQuestion(qid: string, qdef: unknown): string | null {
  if (typeof qdef !== "object" || qdef === null || Array.isArray(qdef)) {
    return `question '${qid}': definition must be a dict`;
  }
  const q = qdef as Record<string, unknown>;
  const t = q.type;
  if (typeof t !== "string" || !QTYPES.includes(t)) {
    return `question '${qid}': unknown type ${JSON.stringify(t ?? null)}; use one of ['choice', 'noul', 'score']`;
  }
  if (!("instructions" in q)) {
    return `question '${qid}': no 'instructions'; add the text the model should answer`;
  }
  const crit = q.criteria;
  if (t === "choice") {
    if (typeof crit !== "object" || crit === null) {
      return `question '${qid}': a choice question takes 'criteria' as a dict of label -> description, or a list of labels`;
    }
    const labels = Array.isArray(crit) ? crit : Object.keys(crit);
    if (labels.length === 0) return `question '${qid}': a choice question needs at least one criterion`;
    const seen = new Map<string, number>();
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i] as unknown;
      if (label === null) {
        return `question '${qid}': choice label ${i} is null; a label is rendered as option text and used as the answer key`;
      }
      if (typeof label === "object") {
        return `question '${qid}': choice label ${i} is a ${Array.isArray(label) ? "list" : "dict"}; a label must be a scalar (a string, number or bool)`;
      }
      if (Array.isArray(crit)) {
        const key = String(label);
        if (seen.has(key)) {
          return `question '${qid}': choice label ${i} (${JSON.stringify(label)}) repeats label ${seen.get(key)}; the labels are the answer keys, so every option needs its own`;
        }
        seen.set(key, i);
      }
    }
  } else if (t === "score") {
    if (!Array.isArray(crit)) {
      return `question '${qid}': a score question takes 'criteria' as a list of level descriptions, index 0 first`;
    }
    if (crit.length === 0) return `question '${qid}': a score question needs at least one level`;
    const nullAt = crit.findIndex((c) => c === null);
    if (nullAt >= 0) return `question '${qid}': score level ${nullAt} is null; give every level a description, index 0 first`;
  } else if (crit !== undefined && crit !== null) {
    if (typeof crit !== "object" || Array.isArray(crit)) {
      return `question '${qid}': a noul question takes 'criteria' as a dict with optional 'true'/'false' descriptions, or omits it`;
    }
    const keys = Object.keys(crit).map((k) => k.toLowerCase());
    const extra = keys.filter((k) => k !== "true" && k !== "false");
    if (extra.length) {
      return `question '${qid}': a noul question takes 'criteria' keyed only 'true'/'false', got [${keys
        .sort()
        .map((k) => `'${k}'`)
        .join(", ")}]. Those keys are the option texts the model reads; use 'labels' to change the wording`;
    }
  }
  if ("labels" in q) {
    if (t !== "noul") return `question '${qid}': 'labels' is only supported for noul questions`;
    try {
      resolveNoulLabels(q.labels);
    } catch (e) {
      return `question '${qid}': ${(e as Error).message}`;
    }
  }
  return null;
}
