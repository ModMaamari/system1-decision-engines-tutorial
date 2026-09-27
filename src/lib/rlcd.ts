/**
 * A toy version of the RLCD update in Laya's fine-tuning notebook (train_ddp.py), for one item.
 * The "model" is just the item's k logits, so the gradient that the real run pushes into the
 * encoder and head is applied to the logits directly. Every other step follows the notebook:
 *
 *   eps ~ N(0, sigma^2), projected to zero mean over the options      (exploration)
 *   q_g = softmax(z + eps_g)                                          (G sampled distributions)
 *   r_g = proper_reward(q_g, target)                                  (w_sph = 0.75, w_rps = 1)
 *   adv = (r - mean(r)) / (std(r) + 1e-6)                             (group-relative baseline)
 *   logp_g = -||z_g - z||^2 / (2 sigma^2)                             (Gaussian policy)
 *   loss = -mean(adv * logp) + ce_weight * CE(target, softmax(z))     (policy gradient + soft CE)
 *
 * with sigma annealed linearly and an Adam optimiser (the notebook uses AdamW).
 */
import { softmax, type QType } from "./decision";
import { linearScore, properReward } from "./scoring";

export type RewardKind = "proper" | "linear" | "accuracy";

export interface RlcdConfig {
  target: number[];
  type: QType;
  groupSize: number;
  sigmaStart: number;
  sigmaEnd: number;
  steps: number;
  lr: number;
  ceWeight: number;
  reward: RewardKind;
  wSph: number;
  wRps: number;
  seed: number;
}

export const NOTEBOOK_DEFAULTS: Omit<RlcdConfig, "target" | "type" | "seed" | "steps" | "lr"> = {
  groupSize: 4,
  sigmaStart: 0.4,
  sigmaEnd: 0.1,
  ceWeight: 1,
  reward: "proper",
  wSph: 0.75,
  wRps: 1,
};

export interface Sample {
  eps: number[];
  q: number[];
  r: number;
  adv: number;
}

export interface StepInfo {
  step: number;
  sigma: number;
  q: number[];
  samples: Sample[];
  kl: number;
  /** Reward of the current (noise-free) distribution. */
  reward: number;
}

/** mulberry32: a small, fast, seedable PRNG. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** KL(t || q), in nats. */
export function kl(t: readonly number[], q: readonly number[]): number {
  return t.reduce((acc, ti, i) => (ti > 0 ? acc + ti * Math.log(ti / Math.max(q[i], 1e-12)) : acc), 0);
}

export function rewardOf(kind: RewardKind, q: number[], t: number[], type: QType, wSph: number, wRps: number): number {
  if (kind === "proper") return properReward(q, t, type, wSph, wRps);
  if (kind === "linear") return linearScore(q, t);
  const am = (xs: readonly number[]) => xs.indexOf(Math.max(...xs));
  return am(q) === am(t) ? 1 : 0;
}

export class ToyRlcd {
  readonly cfg: RlcdConfig;
  z: number[];
  private m: number[];
  private v: number[];
  private t = 0;
  private rand: () => number;

  constructor(cfg: RlcdConfig, init?: number[]) {
    this.cfg = cfg;
    const k = cfg.target.length;
    this.z = init ? [...init] : new Array(k).fill(0);
    this.m = new Array(k).fill(0);
    this.v = new Array(k).fill(0);
    this.rand = rng(cfg.seed);
  }

  get stepCount() {
    return this.t;
  }

  sigmaAt(step: number): number {
    const { sigmaStart, sigmaEnd, steps } = this.cfg;
    const progress = Math.min(1, step / Math.max(1, steps - 1));
    return sigmaStart + (sigmaEnd - sigmaStart) * progress;
  }

  step(): StepInfo {
    const { target, type, groupSize, lr, ceWeight, reward, wSph, wRps } = this.cfg;
    const k = this.z.length;
    const sigma = this.sigmaAt(this.t);

    // 1. G noisy logit vectors, noise projected to zero mean across the options.
    const samples: Sample[] = [];
    for (let g = 0; g < groupSize; g++) {
      const raw = Array.from({ length: k }, () => gaussian(this.rand) * sigma);
      const mean = raw.reduce((a, b) => a + b, 0) / k;
      const eps = raw.map((e) => e - mean);
      const q = softmax(this.z.map((zi, i) => zi + eps[i]));
      samples.push({ eps, q, r: rewardOf(reward, q, target, type, wSph, wRps), adv: 0 });
    }

    // 2. Group-relative advantage (torch.std is the unbiased estimator).
    const rMean = samples.reduce((a, s) => a + s.r, 0) / groupSize;
    const centred = samples.map((s) => s.r - rMean);
    const std = Math.sqrt(centred.reduce((a, c) => a + c * c, 0) / Math.max(1, groupSize - 1));
    samples.forEach((s, g) => (s.adv = centred[g] / (std + 1e-6)));

    // 3. Gradient of -mean(adv * logp) w.r.t. z, where d logp / dz = eps / sigma^2 ...
    const grad = new Array(k).fill(0);
    for (const s of samples) for (let i = 0; i < k; i++) grad[i] -= (s.adv * s.eps[i]) / (sigma * sigma) / groupSize;
    // ... plus the soft cross-entropy term, whose gradient is softmax(z) - target.
    const p = softmax(this.z);
    for (let i = 0; i < k; i++) grad[i] += ceWeight * (p[i] - target[i]);

    // 4. Adam.
    this.t += 1;
    const b1 = 0.9;
    const b2 = 0.999;
    for (let i = 0; i < k; i++) {
      this.m[i] = b1 * this.m[i] + (1 - b1) * grad[i];
      this.v[i] = b2 * this.v[i] + (1 - b2) * grad[i] * grad[i];
      const mh = this.m[i] / (1 - b1 ** this.t);
      const vh = this.v[i] / (1 - b2 ** this.t);
      this.z[i] -= (lr * mh) / (Math.sqrt(vh) + 1e-8);
    }

    const q = softmax(this.z);
    return { step: this.t, sigma, q, samples, kl: kl(target, q), reward: rewardOf("proper", q, target, type, wSph, wRps) };
  }
}
