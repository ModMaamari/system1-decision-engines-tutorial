/**
 * Calibration metrics and temperature fitting.
 * `eceScore` mirrors `ece_score` in laya/common.py (15 equal-width bins; the first bin is closed
 * on the left). `fitTemperature` minimises the same objective as the notebook's `fit_one_temp`
 * (mean cross-entropy of the targets under softmax(z / T)), by golden-section search on log T
 * instead of LBFGS, with the notebook's [0.1, 10] clamp.
 */
import { argmax, softmax } from "./decision";
import { rng } from "./rlcd";

export interface Bin {
  lo: number;
  hi: number;
  n: number;
  meanConf: number;
  acc: number;
}

export function reliabilityBins(conf: readonly number[], correct: readonly (0 | 1 | boolean)[], bins = 15): Bin[] {
  const out: Bin[] = [];
  for (let b = 0; b < bins; b++) {
    const lo = b / bins;
    const hi = (b + 1) / bins;
    let n = 0;
    let sc = 0;
    let sa = 0;
    for (let i = 0; i < conf.length; i++) {
      const c = conf[i];
      const inBin = (b === 0 ? c >= lo : c > lo) && c <= hi;
      if (inBin) {
        n++;
        sc += c;
        sa += Number(correct[i]);
      }
    }
    out.push({ lo, hi, n, meanConf: n ? sc / n : 0, acc: n ? sa / n : 0 });
  }
  return out;
}

/** Expected calibration error: sum over bins of (share of items) * |mean confidence - accuracy|. */
export function eceScore(conf: readonly number[], correct: readonly (0 | 1 | boolean)[], bins = 15): number {
  if (conf.length === 0) return NaN;
  return reliabilityBins(conf, correct, bins).reduce((e, b) => e + (b.n / conf.length) * Math.abs(b.meanConf - b.acc), 0);
}

/** Mean cross-entropy of `targets` (one-hot or soft) under softmax(logits / T). */
export function meanCrossEntropy(logits: readonly number[][], targets: readonly number[][], t: number): number {
  let total = 0;
  for (let i = 0; i < logits.length; i++) {
    const p = softmax(logits[i], t);
    total -= targets[i].reduce((a, ti, j) => a + (ti > 0 ? ti * Math.log(Math.max(p[j], 1e-12)) : 0), 0);
  }
  return total / Math.max(1, logits.length);
}

/** One temperature for a set of items, as the notebook fits one per question type. */
export function fitTemperature(logits: readonly number[][], targets: readonly number[][], lo = 0.1, hi = 10): number {
  if (logits.length < 10) return 1; // the notebook returns 1.0 for fewer than ten items
  let a = Math.log(lo);
  let b = Math.log(hi);
  const gr = (Math.sqrt(5) - 1) / 2;
  let c = b - gr * (b - a);
  let d = a + gr * (b - a);
  const f = (x: number) => meanCrossEntropy(logits, targets, Math.exp(x));
  let fc = f(c);
  let fd = f(d);
  for (let it = 0; it < 80; it++) {
    if (fc < fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - gr * (b - a);
      fc = f(c);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + gr * (b - a);
      fd = f(d);
    }
  }
  return Math.min(hi, Math.max(lo, Math.exp((a + b) / 2)));
}

export interface Dataset {
  logits: number[][];
  labels: number[];
}

/**
 * A synthetic classifier whose logits are `factor` times perfectly calibrated ones: labels are drawn
 * from softmax(z_true), and the model reports factor * z_true. factor > 1 means over-confident, and
 * the ideal temperature is exactly `factor`.
 */
export function syntheticDataset(n: number, k: number, factor: number, seed = 1, spread = 1.6): Dataset {
  const rand = rng(seed);
  const gauss = () => {
    const u = Math.max(rand(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  const logits: number[][] = [];
  const labels: number[] = [];
  for (let i = 0; i < n; i++) {
    const zTrue = Array.from({ length: k }, () => gauss() * spread);
    const p = softmax(zTrue);
    let u = rand();
    let y = k - 1;
    for (let j = 0; j < k; j++) {
      u -= p[j];
      if (u <= 0) {
        y = j;
        break;
      }
    }
    logits.push(zTrue.map((z) => z * factor));
    labels.push(y);
  }
  return { logits, labels };
}

export interface Evaluation {
  accuracy: number;
  ece: number;
  meanConf: number;
  nll: number;
  bins: Bin[];
}

export function evaluate(ds: Dataset, t: number, bins = 15): Evaluation {
  const conf: number[] = [];
  const correct: (0 | 1)[] = [];
  let nll = 0;
  ds.logits.forEach((z, i) => {
    const p = softmax(z, t);
    conf.push(Math.max(...p));
    correct.push(argmax(p) === ds.labels[i] ? 1 : 0);
    nll -= Math.log(Math.max(p[ds.labels[i]], 1e-12));
  });
  const n = Math.max(1, conf.length);
  return {
    accuracy: correct.reduce<number>((a, c) => a + c, 0) / n,
    ece: eceScore(conf, correct, bins),
    meanConf: conf.reduce((a, c) => a + c, 0) / n,
    nll: nll / n,
    bins: reliabilityBins(conf, correct, bins),
  };
}

export const oneHot = (labels: readonly number[], k: number) => labels.map((y) => Array.from({ length: k }, (_, j) => (j === y ? 1 : 0)));
