/**
 * Decoding maths, mirroring Laya's `Agent._decode_answers` and the helpers in `laya/common.py`
 * (`answer_confidence`, `confidence_from_probs`, `temp_bucket`, `clamp_temperature`).
 * The interactive chapters use these functions, so what the reader sees is what Laya computes.
 */

export type QType = "choice" | "score" | "noul";

/** Question-type ids used by the model's type embedding (`QTYPES` in laya/common.py). */
export const QTYPE_ID: Record<QType, number> = { choice: 0, score: 1, noul: 2 };

export const TEMP_MIN = 0.5;
export const TEMP_MAX = 5.0;

export const round4 = (x: number) => Math.round(x * 1e4) / 1e4;

/** Numerically stable softmax of `logits / temperature`. */
export function softmax(logits: readonly number[], temperature = 1): number[] {
  if (logits.length === 0) return [];
  const z = logits.map((v) => v / temperature);
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export function argmax(xs: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (xs[i] > xs[best]) best = i;
  return best;
}

/** Shannon entropy in nats. */
export function entropy(p: readonly number[]): number {
  return -p.reduce((acc, v) => acc + (v > 0 ? v * Math.log(Math.max(v, 1e-12)) : 0), 0);
}

/** `answer_confidence`: the probability of the reported answer, max(p). The calibrated number. */
export function answerConfidence(p: readonly number[]): number {
  if (p.length < 1) return 1;
  return Math.min(1, Math.max(0, Math.max(...p)));
}

/** `confidence` for choice/score: 1 - H(p)/log(k). How concentrated p is; not calibrated. */
export function entropyConfidence(p: readonly number[]): number {
  const k = p.length;
  if (k < 2) return 1;
  return Math.min(1, Math.max(0, 1 - entropy(p) / Math.log(k)));
}

/** Expected level of a score question: sum_i i * p_i. */
export function expectedScore(p: readonly number[]): number {
  return p.reduce((acc, v, i) => acc + i * v, 0);
}

/** `temp_bucket`: which fitted temperature applies to a (type, option count) pair. */
export function tempBucket(type: QType, k: number): string {
  const size = k <= 2 ? "2" : k <= 5 ? "3-5" : k <= 10 ? "6-10" : "11+";
  return `${type}:${size}`;
}

/** `clamp_temperature`: confine to [0.5, 5]; anything that is not a finite number becomes 1. */
export function clampTemperature(t: unknown, lo = TEMP_MIN, hi = TEMP_MAX): number {
  const v = typeof t === "number" ? t : typeof t === "string" && t.trim() !== "" ? Number(t) : NaN;
  if (!Number.isFinite(v)) return 1;
  return Math.min(hi, Math.max(lo, v));
}

export interface ChoiceAnswer {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
  answer_confidence: number;
}

export interface ScoreAnswer {
  type: "score";
  score: number;
  probabilities: Record<string, number>;
  confidence: number;
  answer_confidence: number;
}

export interface NoulAnswer {
  type: "noul";
  noul: number;
  confidence: number;
  answer_confidence: number;
}

export type Answer = ChoiceAnswer | ScoreAnswer | NoulAnswer;

/**
 * Turn one question's logits into Laya's answer shape. `labels` are the choice keys (ignored for
 * score and noul). Noul logits are in [false, true] order and the answer is P(true).
 */
export function decodeAnswer(type: QType, logits: readonly number[], temperature = 1, labels: readonly string[] = []): Answer {
  const p = softmax(logits, temperature);
  const ansConf = round4(answerConfidence(p));
  if (type === "choice") {
    const keys = labels.length === p.length ? labels : p.map((_, i) => `option_${i}`);
    return {
      type,
      choice: keys[argmax(p)],
      probabilities: Object.fromEntries(keys.map((k, i) => [k, round4(p[i])])),
      confidence: round4(entropyConfidence(p)),
      answer_confidence: ansConf,
    };
  }
  if (type === "score") {
    return {
      type,
      score: round4(expectedScore(p)),
      probabilities: Object.fromEntries(p.map((v, i) => [String(i), round4(v)])),
      confidence: round4(entropyConfidence(p)),
      answer_confidence: ansConf,
    };
  }
  const pTrue = p[1] ?? 0;
  return {
    type,
    noul: round4(pTrue),
    confidence: round4(Math.max(pTrue, 1 - pTrue)),
    answer_confidence: ansConf,
  };
}

/**
 * The four summary features the act head reads next to the pooled [CLS] vector
 * (`DecisionModel.forward`): top-1 probability, top-1 minus top-2, normalised entropy, k/255.
 */
export function actFeatures(p: readonly number[]): [number, number, number, number] {
  const sorted = [...p].sort((a, b) => b - a);
  const top1 = sorted[0] ?? 1;
  const top2 = sorted[1] ?? 0;
  const k = Math.max(2, p.length);
  const ent = entropy(p) / Math.log(k);
  return [top1, top1 - top2, ent, p.length / 255];
}
