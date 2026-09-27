import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export interface Part {
  id: string;
  numeral: string;
  title: string;
}

export interface Chapter {
  id: string;
  part: string;
  title: string;
  /** One sentence shown under the title and in search results. */
  summary: string;
  minutes: number;
  Component: LazyExoticComponent<ComponentType>;
}

export const PARTS: Part[] = [
  { id: "foundations", numeral: "I", title: "Foundations" },
  { id: "engine", numeral: "II", title: "Inside the engine" },
  { id: "training", numeral: "III", title: "Training and calibration" },
  { id: "using", numeral: "IV", title: "Using it" },
  { id: "applications", numeral: "V", title: "Agents and applications" },
  { id: "review", numeral: "VI", title: "Evaluate and review" },
];

const placeholder = () => import("./chapters/Placeholder");

export const CHAPTERS: Chapter[] = [
  {
    id: "intro",
    part: "foundations",
    title: "What is a System 1 decision engine?",
    summary: "A model that answers a fixed set of typed questions about an input in one forward pass, with probabilities instead of generated text.",
    minutes: 7,
    Component: lazy(() => import("./chapters/Intro")),
  },
  {
    id: "fast-and-slow",
    part: "foundations",
    title: "Fast and slow thinking for machines",
    summary: "Kahneman's System 1 and System 2, and which decisions in software belong to each.",
    minutes: 8,
    Component: lazy(placeholder),
  },
  {
    id: "ar-vs-nar",
    part: "foundations",
    title: "Autoregressive vs non-autoregressive",
    summary: "Why generating a label token by token is slow and fragile, and what scoring every option at once buys you.",
    minutes: 10,
    Component: lazy(placeholder),
  },
  {
    id: "primitives",
    part: "engine",
    title: "The decision primitives",
    summary: "choice, score and noul: the three question types every decision is expressed in.",
    minutes: 10,
    Component: lazy(placeholder),
  },
  {
    id: "input-sequence",
    part: "engine",
    title: "Building the input sequence",
    summary: "How a question, its options and the state are packed into one token sequence, and what the token budgets cut.",
    minutes: 11,
    Component: lazy(placeholder),
  },
  {
    id: "forward-pass",
    part: "engine",
    title: "Inside the forward pass",
    summary: "Encoder, type embedding, decision head, marker gathering and the scorer, one stage at a time.",
    minutes: 12,
    Component: lazy(placeholder),
  },
  {
    id: "decoding",
    part: "engine",
    title: "From logits to answers",
    summary: "Temperature, softmax, expected scores and the two confidence numbers, and which one to gate on.",
    minutes: 10,
    Component: lazy(placeholder),
  },
  {
    id: "scoring-rules",
    part: "training",
    title: "Proper scoring rules",
    summary: "Rewards that are maximised only by reporting what you actually believe.",
    minutes: 12,
    Component: lazy(placeholder),
  },
  {
    id: "rlcd",
    part: "training",
    title: "RLCD: training with honest rewards",
    summary: "The noisy-logit policy gradient with proper-scoring rewards and soft cross-entropy, step by step.",
    minutes: 14,
    Component: lazy(placeholder),
  },
  {
    id: "calibration",
    part: "training",
    title: "Calibration and temperature scaling",
    summary: "Reliability diagrams, expected calibration error, and fitting one temperature per question type.",
    minutes: 12,
    Component: lazy(placeholder),
  },
  {
    id: "routing",
    part: "using",
    title: "Checkpoints and the router",
    summary: "Three checkpoints, and why the choice between them has to be made before the forward pass.",
    minutes: 10,
    Component: lazy(placeholder),
  },
  {
    id: "api",
    part: "using",
    title: "The API in practice",
    summary: "predict, batches, long documents, schema-driven decide, presets, the CLI, HTTP and MCP.",
    minutes: 12,
    Component: lazy(placeholder),
  },
  {
    id: "production",
    part: "using",
    title: "Production patterns",
    summary: "Confidence gating, abstention, hooks, throughput and a staged rollout from shadow to promotion.",
    minutes: 12,
    Component: lazy(placeholder),
  },
  {
    id: "agents",
    part: "applications",
    title: "System 1 inside agents",
    summary: "Guardrails, routing edges, tool and action selection, cascades and judges: where fast decisions sit in an agent loop.",
    minutes: 14,
    Component: lazy(placeholder),
  },
  {
    id: "use-cases",
    part: "applications",
    title: "Use-case design lab",
    summary: "Turning a real decision into typed questions, with worked schemas and the pitfalls to design around.",
    minutes: 11,
    Component: lazy(placeholder),
  },
  {
    id: "evaluation",
    part: "review",
    title: "Evaluation, benchmarks and limits",
    summary: "The metrics that matter, what the published numbers show, and the limits stated plainly.",
    minutes: 11,
    Component: lazy(placeholder),
  },
  {
    id: "quiz",
    part: "review",
    title: "Knowledge check",
    summary: "Test your understanding, with an explanation for every answer.",
    minutes: 8,
    Component: lazy(placeholder),
  },
  {
    id: "glossary",
    part: "review",
    title: "Glossary and references",
    summary: "Every term used in the tutorial, and the sources behind it.",
    minutes: 5,
    Component: lazy(placeholder),
  },
];

export const DEFAULT_CHAPTER = CHAPTERS[0].id;

export function chapterIndex(id: string): number {
  return CHAPTERS.findIndex((c) => c.id === id);
}

export function getChapter(id: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

export function getPart(id: string): Part {
  const part = PARTS.find((p) => p.id === id);
  if (!part) throw new Error(`unknown part ${id}`);
  return part;
}
