export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
  chapter: string;
}

export const QUIZ: QuizQuestion[] = [
  {
    q: "What makes a decision engine “non-autoregressive”?",
    options: [
      "It generates the label faster, one token at a time",
      "It scores every listed option in one forward pass and returns a distribution over them",
      "It uses a smaller vocabulary than a language model",
      "It samples several answers and takes a vote",
    ],
    answer: 1,
    why: "Nothing is generated. The options are part of the input, one pass produces a logit per option, and a softmax turns them into a distribution over exactly those options.",
    chapter: "ar-vs-nar",
  },
  {
    q: "A score question with levels 0–2 returns score = 1.84. What is 1.84?",
    options: ["The most likely level", "The confidence of level 2", "The expected level, Σ i·pᵢ", "The logit of level 2"],
    answer: 2,
    why: "score is the expectation over levels. Take the argmax of probabilities if you need a single level.",
    chapter: "primitives",
  },
  {
    q: "What does a noul answer report?",
    options: ["P(false)", "P(true), the second slot of [false, true]", "The entropy of the two slots", "1 if true, 0 if false"],
    answer: 1,
    why: "noul always scores [false, true] and returns the probability of the second slot, whatever labels are shown to the model.",
    chapter: "primitives",
  },
  {
    q: "With head_max_len = 256 and 77 options, how many tokens does each option keep?",
    options: ["48", "3, because 240 // 77 = 3", "4, the minimum, marker included", "All of them; the state is cut instead"],
    answer: 2,
    why: "Overflowing options are all cut to max(4, (256 − 16) // 77) = max(4, 3) = 4 tokens, one of which is the [MASK] marker.",
    chapter: "input-sequence",
  },
  {
    q: "Where does the model read an option's score?",
    options: [
      "At the [CLS] token",
      "At the [MASK] token placed before that option's text",
      "At the last token of the state",
      "From a dedicated output unit per label",
    ],
    answer: 1,
    why: "The hidden state at each option's [MASK] marker is gathered and scored by a shared MLP, which is why any labels and any number of options work.",
    chapter: "forward-pass",
  },
  {
    q: "Which number should a confidence threshold be applied to?",
    options: ["confidence (1 − normalised entropy)", "act_probability", "answer_confidence = max(p)", "The raw logit of the answer"],
    answer: 2,
    why: "answer_confidence is what temperatures are fitted on and what ECE measures. The entropy confidence is not calibrated, and act_probability carries no usable signal yet.",
    chapter: "decoding",
  },
  {
    q: "What does temperature scaling change?",
    options: ["The answer", "The confidence, never the answer", "Both answer and confidence", "Only latency"],
    answer: 1,
    why: "Dividing all logits by the same positive T keeps their order, so the argmax (and accuracy) is unchanged; only the probabilities spread or sharpen.",
    chapter: "calibration",
  },
  {
    q: "Which reward is strictly proper?",
    options: ["1 if the argmax is right, else 0", "The probability put on the true answer, q_y", "The log score, log q_y", "The top probability, max q"],
    answer: 2,
    why: "The log score is maximised in expectation only by reporting the true distribution. The linear score q_y rewards overconfidence, and 0/1 accuracy ignores the probabilities.",
    chapter: "scoring-rules",
  },
  {
    q: "In RLCD, what is each sampled distribution's advantage measured against?",
    options: [
      "A learned value network",
      "The other samples drawn for the same item (group mean and std)",
      "The previous epoch's reward",
      "A fixed reward of zero",
    ],
    answer: 1,
    why: "A (GRPO-style) group-relative baseline: A_g = (r_g − mean r) / (std r + 1e-6) over the G samples of one item.",
    chapter: "rlcd",
  },
  {
    q: "Why is the exploration noise projected to zero mean over the options?",
    options: [
      "To keep the logits positive",
      "Because softmax ignores a constant added to every logit, so that direction only adds variance",
      "To make the noise smaller",
      "Because the reward requires it",
    ],
    answer: 1,
    why: "Adding the same value to every logit leaves the softmax unchanged; noise in that direction earns no reward difference.",
    chapter: "rlcd",
  },
  {
    q: "Why must the router choose a checkpoint before the forward pass?",
    options: [
      "Loading checkpoints is slow",
      "The English checkpoint stays confident on scripts it cannot read (Khmer: 0.000 accuracy at 0.952 confidence)",
      "The multilingual checkpoint cannot read English",
      "Only one checkpoint can be loaded at a time",
    ],
    answer: 1,
    why: "Its confidence gives no warning, so a threshold on the output cannot catch the failure; the input's script has to decide.",
    chapter: "routing",
  },
  {
    q: "Where should PII redaction happen?",
    options: ["In an on_predict_end hook", "In an on_predict_start hook, before inference", "After logging", "In the model's config"],
    answer: 1,
    why: "A start hook can rewrite ctx.states before tokenisation. Redacting in an end hook is too late: the model and any logger already saw the text.",
    chapter: "production",
  },
  {
    q: "A choice question with labels yes and no is…",
    options: ["The recommended way to ask a yes/no question", "A documented pitfall: the model can follow the label words", "Rejected by Laya's validation", "Faster than a noul question"],
    answer: 1,
    why: "Use a noul with criteria, or semantic or opaque (A/B) labels.",
    chapter: "use-cases",
  },
  {
    q: "In Laya's browser-agent fine-tune, what did confidence-gated escalation to a local 8B or 27B LLM do?",
    options: ["Improved every metric", "Made results worse; the fine-tuned 322M model was the better decider", "Had no effect", "Was not tried"],
    answer: 1,
    why: "0.890 operation accuracy at 21 ms for the 322M model, against 0.861 at 4.7 s for the 27B model. Measure the escalation path; bigger is not automatically better.",
    chapter: "agents",
  },
  {
    q: "How do the base checkpoints do on the typed-decisions benchmark zero-shot?",
    options: ["About 0.77", "Near chance: 0.36 and 0.35, against 0.32 random", "Above the teacher ceiling", "They were not tested"],
    answer: 1,
    why: "The 0.766 belongs to the checkpoint fine-tuned on the benchmark's training split. Treat Laya as a fast base to specialise.",
    chapter: "evaluation",
  },
  {
    q: "What makes a threshold of 0.85 mean “about 85% of these answers are right”?",
    options: [
      "Nothing extra; confidences are always calibrated",
      "Fitting temperatures on representative held-out data (and measuring it in the precision you serve)",
      "Using the entropy confidence instead",
      "Raising head_max_len",
    ],
    answer: 1,
    why: "Shipped checkpoints are over-confident; the direction and size of miscalibration depend on the task, so calibrate and measure on your own data.",
    chapter: "calibration",
  },
];
