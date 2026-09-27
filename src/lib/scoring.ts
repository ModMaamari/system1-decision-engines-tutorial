/**
 * Scoring rules as rewards (higher is better). `q` is the reported distribution, `t` the target
 * (one-hot for an observed outcome, or a soft teacher distribution). The composite reward mirrors
 * `proper_reward` in laya/common.py.
 */
import type { QType } from "./decision";

export const LOG_FLOOR = -9.21; // Laya clamps log q at about log(1e-4)

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Logarithmic score: sum_i t_i log q_i, with log q floored as in Laya. */
export function logScore(q: readonly number[], t: readonly number[], floor = LOG_FLOOR): number {
  return sum(q.map((qi, i) => t[i] * Math.max(Math.log(Math.max(qi, 1e-12)), floor)));
}

/** Spherical score: sum_i t_i q_i / ||q||. Bounded in [0, 1]. */
export function sphericalScore(q: readonly number[], t: readonly number[]): number {
  const norm = Math.max(Math.sqrt(sum(q.map((v) => v * v))), 1e-9);
  return sum(q.map((qi, i) => t[i] * qi)) / norm;
}

/** Brier score as a reward: -sum_i (q_i - t_i)^2. Laya reports Brier as a metric, not in its reward. */
export function brierReward(q: readonly number[], t: readonly number[]): number {
  return -sum(q.map((qi, i) => (qi - t[i]) ** 2));
}

/** Ranked probability score (a penalty): squared distance between the two CDFs, over k - 1. */
export function rps(q: readonly number[], t: readonly number[]): number {
  const k = Math.max(2, q.length);
  let cq = 0;
  let ct = 0;
  let acc = 0;
  for (let i = 0; i < q.length; i++) {
    cq += q[i];
    ct += t[i];
    acc += (cq - ct) ** 2;
  }
  return acc / (k - 1);
}

/** The "linear score": probability put on what happened. Looks reasonable, but is NOT proper. */
export function linearScore(q: readonly number[], t: readonly number[]): number {
  return sum(q.map((qi, i) => t[i] * qi));
}

/** Accuracy as a reward: 1 when the argmax of q is the argmax of t. Ignores the probabilities. */
export function accuracyReward(q: readonly number[], t: readonly number[]): number {
  const am = (xs: readonly number[]) => xs.indexOf(Math.max(...xs));
  return am(q) === am(t) ? 1 : 0;
}

/**
 * Laya's reward (`proper_reward`): log score + w_sph * spherical, minus w_rps * RPS for score
 * questions. Defaults are the library's (0.5, 1.0); the fine-tuning notebook uses w_sph = 0.75.
 */
export function properReward(q: readonly number[], t: readonly number[], type: QType, wSph = 0.5, wRps = 1.0): number {
  let r = logScore(q, t) + wSph * sphericalScore(q, t);
  if (type === "score") r -= wRps * rps(q, t);
  return r;
}

export type RuleId = "log" | "spherical" | "brier" | "linear" | "accuracy";

export const RULES: Record<RuleId, { label: string; proper: boolean; fn: (q: number[], t: number[]) => number }> = {
  log: { label: "Log score", proper: true, fn: logScore },
  spherical: { label: "Spherical score", proper: true, fn: sphericalScore },
  brier: { label: "Brier (negated)", proper: true, fn: brierReward },
  linear: { label: "Linear score", proper: false, fn: linearScore },
  accuracy: { label: "Accuracy (0/1)", proper: false, fn: accuracyReward },
};

/**
 * Expected reward of reporting q = P(yes) when the event happens with probability p:
 * p * S(q, yes) + (1 - p) * S(q, no), for a two-outcome question.
 */
export function expectedBinary(rule: (q: number[], t: number[]) => number, p: number, q: number): number {
  const dist = [1 - q, q];
  return p * rule(dist, [0, 1]) + (1 - p) * rule(dist, [1, 0]);
}

/** Expected reward of reporting `q` when outcomes follow `p` (k outcomes). */
export function expectedReward(rule: (q: number[], t: number[]) => number, p: readonly number[], q: number[]): number {
  return p.reduce((acc, pi, i) => {
    const onehot = p.map((_, j) => (j === i ? 1 : 0));
    return acc + pi * rule(q, onehot);
  }, 0);
}
