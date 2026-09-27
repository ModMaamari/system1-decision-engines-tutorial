/**
 * Numbers published in the Laya repository, collected in one place so every chapter quotes the
 * same values. Each group names its source file.
 */

/** README.md "Speed (Tesla T4, measured)" and BENCHMARKS.md "Speed (Tesla T4)": ms per call. */
export const T4_LATENCY_MS: Record<"laya" | "laya-multilingual", Record<1 | 5 | 10 | 50, number>> = {
  laya: { 1: 39.5, 5: 84.5, 10: 158.6, 50: 771.3 },
  "laya-multilingual": { 1: 32.8, 5: 40.1, 10: 72.3, 50: 337.4 },
};

/** BENCHMARKS.md "Server CPU: AMD EPYC 9R14, 4 cores": p50 ms per call. */
export const CPU_LATENCY_MS: Record<"english" | "multilingual" | "typed-decisions", Record<1 | 5 | 10 | 50, number>> = {
  english: { 1: 580, 5: 3072, 10: 6244, 50: 35969 },
  multilingual: { 1: 193, 5: 912, 10: 1842, 50: 11157 },
  "typed-decisions": { 1: 584, 5: 2819, 10: 6031, 50: 35653 },
};

/** Third-party published p50 latency for TypeSafe Jev, one question (README). */
export const JEV_P50_MS: [number, number] = [236, 276];

/** README.md checkpoint table. */
export const CHECKPOINTS = [
  {
    id: "english",
    name: "laya",
    encoder: "ModernBERT-large",
    params: "421M",
    context: "512",
    headMaxLen: 192,
    use: "English",
  },
  {
    id: "multilingual",
    name: "laya-multilingual",
    encoder: "mmBERT-base",
    params: "322M",
    context: "1,024 (up to 8,192)",
    headMaxLen: 256,
    use: "100+ languages, about 2x faster",
  },
  {
    id: "typed-decisions",
    name: "laya-typed-decisions",
    encoder: "ModernBERT-large",
    params: "421M",
    context: "1,024",
    headMaxLen: 256,
    use: "the four typed-decisions workflows (fine-tuned)",
  },
] as const;

/** README.md / BENCHMARKS.md "typed-decisions — 400 cases, 2,000 decisions". */
export const TYPED_DECISIONS = {
  models: [
    { model: "laya-typed-decisions", accuracy: 0.766, softAcc: 0.471, brier: 0.062, ece: 0.213, scoreMae: 0.242 },
    { model: "laya", accuracy: 0.362, softAcc: 0.332, brier: 0.316, ece: 0.175, scoreMae: 0.694 },
    { model: "laya-multilingual", accuracy: 0.352, softAcc: 0.328, brier: 0.463, ece: 0.314, scoreMae: 0.76 },
    { model: "Jev 1.13.0 (published)", accuracy: 0.727, softAcc: 0.58, brier: 0.148, ece: 0.144, scoreMae: 0.391 },
  ],
  teacherCeiling: 0.735,
  majorityClass: 0.461,
  random: 0.318,
  byWorkflow: [
    { workflow: "invoice processing", accuracy: 0.804 },
    { workflow: "security incidents", accuracy: 0.766 },
    { workflow: "customer service", accuracy: 0.764 },
    { workflow: "agent trace observability", accuracy: 0.73 },
  ],
  byPrimitive: { noul: 0.857, choice: 0.733, score: 0.723 },
};

/** README.md "Why Route: The Evidence" (17,416 questions, one T4). */
export const ROUTING_EVIDENCE = [
  { task: "MASSIVE intent, English", english: 0.783, multilingual: 0.657 },
  { task: "MASSIVE intent, 13 other languages", english: 0.306, multilingual: 0.451 },
  { task: "XNLI, English", english: 0.86, multilingual: 0.843 },
  { task: "XNLI, 14 other languages", english: 0.521, multilingual: 0.731 },
];

/** README.md "Calibration": mean ECE before and after refitting temperatures. */
export const CALIBRATION_ECE = [
  { model: "laya", shipped: 0.466, refit: 0.081 },
  { model: "laya-multilingual", shipped: 0.314, refit: 0.106 },
];

/** BENCHMARKS.md "Themes — the application workflows" (400 cases each). */
export const THEMES = [
  { theme: "Email spam", laya: 0.993, multilingual: 0.993, typed: 0.958, heldOut: false },
  { theme: "Phishing", laya: 0.98, multilingual: 0.993, typed: 0.94, heldOut: false },
  { theme: "LLM guardrails (jailbreak)", laya: 0.708, multilingual: 0.755, typed: 0.762, heldOut: true },
  { theme: "Moderation (toxicity)", laya: 0.53, multilingual: 0.525, typed: 0.53, heldOut: true },
  { theme: "RAG passage relevance", laya: 0.625, multilingual: 0.657, typed: 0.625, heldOut: false },
  { theme: "Support triage (10-way queue)", laya: 0.502, multilingual: 0.522, typed: 0.505, heldOut: false },
  { theme: "Model routing (domain)", laya: 0.639, multilingual: 0.123, typed: 0.659, heldOut: true },
];

/** BENCHMARKS.md "On the public datasets where Jev numbers exist". */
export const PUBLIC_DATASETS = [
  { dataset: "AG News (4 labels)", laya: 0.95, multilingual: 0.93, typed: 0.953, jev: 0.91 },
  { dataset: "DAIR Emotion (6 labels)", laya: 0.595, multilingual: 0.53, typed: 0.6, jev: 0.48 },
  { dataset: "Banking77 (77 labels)", laya: 0.425, multilingual: 0.425, typed: 0.492, jev: 0.87 },
];

/** README.md "English tasks". */
export const ENGLISH_TASKS = [
  { task: "AG News", laya: 0.947, multilingual: 0.937, note: "in training mix" },
  { task: "BoolQ", laya: 0.83, multilingual: 0.787, note: "in training mix" },
  { task: "DAIR Emotion", laya: 0.573, multilingual: 0.513, note: "held out" },
  { task: "prompt-injections", laya: 0.698, multilingual: 0.578, note: "held out, n=116" },
  { task: "SST-5 (ordinal)", laya: 0.372, multilingual: 0.282, note: "held out" },
];

/** The fine-tuning notebook's training settings (docs/finetune.md and the notebook). */
export const FINETUNE_SETTINGS = {
  epochs: 4,
  microBatch: 8,
  gpus: 2,
  gradAccum: 4,
  effectiveBatch: 64,
  groupSize: 4,
  lrEncoder: 2.5e-5,
  lrHead: 1e-4,
  sigmaStart: 0.4,
  sigmaEnd: 0.1,
  wSph: 0.75,
  wRps: 1.0,
  ceWeight: 1.0,
  maxLen: 1024,
  headMaxLen: 256,
  calibrationSlice: "up to 400 items or 10%, held out before training",
};
