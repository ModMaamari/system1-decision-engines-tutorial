export interface Term {
  term: string;
  def: string;
  chapter: string;
}

export const GLOSSARY: Term[] = [
  { term: "act head / act_probability", def: "A small MLP on the [CLS] vector and four distribution features, meant to signal act-or-escalate. In Laya it carries no usable signal yet (AUROC 0.30); gate on answer_confidence instead.", chapter: "forward-pass" },
  { term: "answer_confidence", def: "max(p): the probability of the reported answer. The quantity temperatures are fitted on and ECE is measured on; the number to threshold.", chapter: "decoding" },
  { term: "Autoregressive", def: "Generating a sequence one token at a time, each conditioned on the previous ones; one forward pass per token.", chapter: "ar-vs-nar" },
  { term: "Brier score", def: "Sum of squared differences between the predicted distribution and the target. A strictly proper score; lower is better as a loss.", chapter: "scoring-rules" },
  { term: "Calibration", def: "Agreement between confidence and accuracy: of answers given at confidence c, a fraction of about c is correct.", chapter: "calibration" },
  { term: "Checkpoint", def: "A trained model: laya (English, ModernBERT-large), laya-multilingual (mmBERT-base) or laya-typed-decisions (fine-tuned).", chapter: "routing" },
  { term: "choice", def: "A question type that picks one label from a set; returns the label and a probability per label.", chapter: "primitives" },
  { term: "confidence (entropy)", def: "For choice and score answers, 1 − H(p)/log k: how concentrated the distribution is. Descriptive, not calibrated.", chapter: "decoding" },
  { term: "Criteria", def: "The options of a question: label → description for choice, a list of level descriptions for score, optional true/false descriptions for noul.", chapter: "primitives" },
  { term: "decide / decide_batch", def: "Schema-driven decisions: a JSON schema or pydantic model in (enum → choice, boolean → noul, bounded integer → score), typed values out.", chapter: "api" },
  { term: "Decision head", def: "Two pre-norm transformer layers on top of the encoder, followed by gathering the marker vectors and scoring them.", chapter: "forward-pass" },
  { term: "Expected calibration error (ECE)", def: "The share-weighted average gap between mean confidence and accuracy across confidence bins (15 in Laya).", chapter: "calibration" },
  { term: "GRPO / group-relative advantage", def: "Comparing each sampled action's reward with the mean (and std) of its group instead of a learned value baseline; RLCD uses it over G noisy samples per item.", chapter: "rlcd" },
  { term: "head_max_len", def: "The token budget for a question's header and all its options (192 on laya, 256 on the others). Overflowing options are all trimmed to max(4, (head_max_len − 16) // n).", chapter: "input-sequence" },
  { term: "Hooks", def: "Callables or objects with on_predict_start, on_predict_end, on_route, on_load, on_evict or on_error, used for audit, redaction, caching and metrics.", chapter: "production" },
  { term: "Instructions", def: "The plain-language text of a question, written into the row header as “<type> question: <instructions>”.", chapter: "primitives" },
  { term: "Jev", def: "TypeSafe's hosted System 1 decision API. Laya's HTTP server speaks the same /v1/systemone request format.", chapter: "intro" },
  { term: "lang_guess", def: "A language code or callable passed to the Router to decide English or not, before built-in detection; abstaining codes fall through.", chapter: "routing" },
  { term: "laya-evals", def: "Laya's evaluation CLI: scores a labelled JSONL set and exits non-zero on threshold or baseline failures.", chapter: "evaluation" },
  { term: "Log score", def: "log of the probability assigned to what happened (Σ t log q for soft targets). Strictly proper; its negative is cross-entropy.", chapter: "scoring-rules" },
  { term: "Logit", def: "The raw score the scorer MLP gives an option, before temperature and softmax.", chapter: "forward-pass" },
  { term: "Marker ([MASK])", def: "The [MASK] token placed before each option's text; its final hidden state is where the option is scored.", chapter: "input-sequence" },
  { term: "max_len", def: "The token budget of a whole question row (512 on laya, 1,024 on the others; laya-multilingual reads up to 8,192 when asked).", chapter: "input-sequence" },
  { term: "MCP server", def: "laya-mcp-server exposes typed decisions as Model Context Protocol tools (laya_predict, laya_decide, …) for agents and assistants.", chapter: "agents" },
  { term: "min_confidence / low_confidence", def: "Opt-in abstention: answers whose answer_confidence falls below min_confidence get low_confidence: true; decide returns None for them.", chapter: "decoding" },
  { term: "Non-autoregressive", def: "Producing the output without generating it token by token; for a decision engine, one pass scores every listed option.", chapter: "ar-vs-nar" },
  { term: "noul", def: "A yes/no question type; scores the slots [false, true] and returns P(true).", chapter: "primitives" },
  { term: "Option collapse", def: "When trimming leaves two options with identical token spans, so the model cannot tell them apart; reported in usage[\"options\"].", chapter: "input-sequence" },
  { term: "predict_batch", def: "Answer the same questions for many states in shared forward passes; results in input order.", chapter: "api" },
  { term: "predict_long", def: "Scan a long state in overlapping windows and aggregate per question (noul: highest P(true); choice/score: most confident window).", chapter: "input-sequence" },
  { term: "predict_shortlist", def: "Keep the top-k labels of a large choice by embedding similarity, then answer over those in one pass.", chapter: "api" },
  { term: "Proper scoring rule", def: "A reward whose expectation is maximised by reporting the true distribution; strictly proper if that is the unique maximiser.", chapter: "scoring-rules" },
  { term: "Ranked probability score (RPS)", def: "Squared distance between cumulative distributions over ordered outcomes; penalises far misses more. Laya subtracts it for score questions.", chapter: "scoring-rules" },
  { term: "Reliability diagram", def: "A plot of accuracy against confidence per bin; a calibrated model lies on the diagonal.", chapter: "calibration" },
  { term: "RLCD", def: "Reinforcement Learning for Calibrated Decisions: a policy gradient over noisy logit samples with a strictly proper scoring rule as reward (plus soft cross-entropy in Laya's recipe).", chapter: "rlcd" },
  { term: "Router", def: "Picks a checkpoint per request (explicit model, task, lang, lang_guess, then script and language detection, then default) before the forward pass.", chapter: "routing" },
  { term: "score", def: "A question type over ordered levels; returns the expected level Σ i·pᵢ and a probability per level.", chapter: "primitives" },
  { term: "Soft target / teacher distribution", def: "A training target that is a probability distribution (e.g. a teacher model's probabilities) rather than a single label.", chapter: "rlcd" },
  { term: "Spherical score", def: "q_y / ‖q‖: a bounded, strictly proper scoring rule used in Laya's reward.", chapter: "scoring-rules" },
  { term: "Staged adoption", def: "Rolling a decision engine out in stages: shadow, compare, choose a policy, promote a bounded slice.", chapter: "production" },
  { term: "State", def: "The input a decision is about: a string, a JSON document, an email, or a conversation list.", chapter: "intro" },
  { term: "System 1 / System 2", def: "Kahneman's labels (from Stanovich and West) for fast, automatic judgement and slow, deliberate reasoning.", chapter: "fast-and-slow" },
  { term: "TD(λ) targets", def: "Targets for multi-turn decisions built backwards from the final outcome, blending in the model's next-turn prediction; λ = 1 uses the outcome directly.", chapter: "rlcd" },
  { term: "Temperature", def: "A positive number dividing the logits before softmax; changes confidence, never the answer. Fitted per type (or per type and option-count bucket), clamped to [0.5, 5] at load.", chapter: "decoding" },
  { term: "Type embedding", def: "One of three learned vectors (choice, score, noul) added to every token of a row before the decision head.", chapter: "forward-pass" },
];

export interface Reference {
  label: string;
  href: string;
  note: string;
}

export const REFERENCES: { group: string; items: Reference[] }[] = [
  {
    group: "Laya",
    items: [
      { label: "NandhaKishorM/laya", href: "https://github.com/NandhaKishorM/laya", note: "Source code, README, BENCHMARKS.md, docs and notebooks (Apache 2.0)." },
      { label: "Laya documentation", href: "https://nandhakishorm.github.io/laya/", note: "Guides for hooks, structured decisions, Docker, LangChain and the API reference." },
      { label: "convaiinnovations/laya", href: "https://huggingface.co/convaiinnovations/laya", note: "Checkpoints on the Hugging Face Hub (with laya-multilingual and laya-typed-decisions)." },
      { label: "Fine-tuning notebook", href: "https://github.com/NandhaKishorM/laya/blob/main/notebooks/laya_finetune_typed_decisions_2xT4_kaggle.ipynb", note: "The RLCD training loop, calibration and evaluation used in chapter 9." },
      { label: "LocalLLaMA/typed-decisions", href: "https://huggingface.co/datasets/LocalLLaMA/typed-decisions", note: "The typed-decisions benchmark dataset." },
      { label: "cklxx/laya-browser", href: "https://huggingface.co/cklxx/laya-browser", note: "The browser-agent fine-tune discussed in chapter 14." },
      { label: "Introductory article (dev.to)", href: "https://dev.to/nandakishor_m_6cc0adfde9f/i-built-non-autoregressive-decision-models-a-year-ago-then-a-frontier-lab-called-it-a-18me", note: "The author's write-up of the architecture and RLCD." },
    ],
  },
  {
    group: "Encoders",
    items: [
      { label: "Warner et al. (2024), ModernBERT", href: "https://arxiv.org/abs/2412.13663", note: "“Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder…”; the English checkpoint's encoder." },
      { label: "Marone et al. (2025), mmBERT", href: "https://arxiv.org/abs/2509.06888", note: "“mmBERT: A Modern Multilingual Encoder with Annealed Language Learning”; the multilingual checkpoint's encoder." },
    ],
  },
  {
    group: "Ideas used in this tutorial",
    items: [
      { label: "Kahneman (2011), Thinking, Fast and Slow", href: "https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow", note: "System 1 and System 2." },
      { label: "Stanovich and West (2000)", href: "https://doi.org/10.1017/S0140525X00003435", note: "“Individual differences in reasoning: Implications for the rationality debate?”, Behavioral and Brain Sciences; origin of the System 1/2 labels." },
      { label: "Gneiting and Raftery (2007)", href: "https://doi.org/10.1198/016214506000001437", note: "“Strictly Proper Scoring Rules, Prediction, and Estimation”, JASA." },
      { label: "Guo et al. (2017)", href: "https://arxiv.org/abs/1706.04599", note: "“On Calibration of Modern Neural Networks”: temperature scaling and ECE." },
      { label: "Shao et al. (2024), DeepSeekMath", href: "https://arxiv.org/abs/2402.03300", note: "Introduces GRPO, the group-relative policy optimisation idea RLCD's baseline follows." },
      { label: "Gu et al. (2018)", href: "https://arxiv.org/abs/1711.02281", note: "“Non-Autoregressive Neural Machine Translation”." },
      { label: "Yin, Hay and Roth (2019)", href: "https://arxiv.org/abs/1909.00161", note: "“Benchmarking Zero-shot Text Classification”: classification by entailment." },
    ],
  },
  {
    group: "Third-party Jev measurements cited by Laya",
    items: [
      { label: "AbdelStark/jev-benchmarks", href: "https://github.com/AbdelStark/jev-benchmarks", note: "AG News, Banking77 and DAIR Emotion figures for Jev." },
      { label: "nibzard/decision-model-benchmark", href: "https://github.com/nibzard/decision-model-benchmark", note: "Calibration, option-order and latency figures for Jev." },
    ],
  },
];
