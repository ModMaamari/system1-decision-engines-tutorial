import { useState, type ReactNode } from "react";
import { Figure } from "../components/ui/Figure";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** A Router.predict result for the three-question quickstart. Values are illustrative. */
export const RESPONSE: Json = {
  model: "laya-rl-agent",
  answers: {
    department: {
      type: "choice",
      choice: "billing",
      probabilities: { billing: 0.9412, technical: 0.0231, other: 0.0357 },
      confidence: 0.7606,
      answer_confidence: 0.9412,
      action: { act_probability: 1.0 },
    },
    urgency: {
      type: "score",
      score: 1.84,
      legend: { "0": "not urgent", "1": "soon", "2": "blocking" },
      probabilities: { "0": 0.0301, "1": 0.0998, "2": 0.8701 },
      confidence: 0.5845,
      answer_confidence: 0.8701,
      action: { act_probability: 1.0 },
    },
    churn_risk: {
      type: "noul",
      noul: 0.892,
      confidence: 0.892,
      answer_confidence: 0.892,
      action: { act_probability: 1.0 },
    },
  },
  usage: { input_tokens: 214, output_tokens: 0 },
  routing: {
    model: "english",
    repo: "convaiinnovations/laya",
    reason: "English Latin text",
    detection: {
      script: "latin",
      script_profile: { latin: 1.0 },
      language: "en",
      is_english: true,
      language_undecided: false,
      diacritic_rate: 0.0,
      non_latin_fraction: 0.0,
      mixed_segment: null,
    },
    workflow: null,
  },
};

/** Explanations keyed by path; `*` matches any question id. */
export const NOTES: Record<string, ReactNode> = {
  model: "Always \"laya-rl-agent\" for the agent payload; which checkpoint answered is in routing.model.",
  answers: "One entry per question id you sent, in the same order.",
  "answers.*.type": "The primitive: choice, score or noul.",
  "answers.*.choice": "The label with the highest probability (choice only).",
  "answers.*.probabilities": "The full distribution over the options, keyed by label (choice), level index (score). Rounded to 4 decimals.",
  "answers.*.confidence": "choice/score: 1 − H(p)/log k, how concentrated p is (not calibrated). noul: max(p, 1 − p).",
  "answers.*.answer_confidence": "max(p): the probability of the reported answer. The calibrated number; gate on this.",
  "answers.*.action": "Output of the act head.",
  "answers.*.action.act_probability": "Not usable yet: reads 1.0 for almost every input (AUROC 0.30). Ignore it; gate on answer_confidence.",
  "answers.*.score": "Expected level, Σ i·pᵢ. A real number, not a level index.",
  "answers.*.legend": "The level descriptions you sent, keyed by level index.",
  "answers.*.noul": "P(true), the probability of the second slot of [false, true].",
  usage: "Token accounting in the Jev-compatible shape.",
  "usage.input_tokens": "Real (unpadded) tokens across all question rows of this state.",
  "usage.output_tokens": "Always 0: nothing is generated.",
  routing: "Added by the Router: which checkpoint answered, and why.",
  "routing.model": "english, multilingual or typed-decisions.",
  "routing.repo": "The Hub repository (and subfolder) the checkpoint came from.",
  "routing.reason": "A human-readable reason, e.g. “non-Latin script (devanagari, 100% of letters) …”.",
  "routing.detection": "The detector's evidence: dominant script, per-script shares, language guess, diacritic rate. null when an explicit model, task or lang decided.",
  "routing.workflow": "The typed-decisions workflow whose question ids matched, when auto task detection is on.",
};

function noteFor(path: string): ReactNode | undefined {
  if (NOTES[path]) return NOTES[path];
  const generic = path.replace(/^answers\.[^.]+/, "answers.*");
  if (NOTES[generic]) return NOTES[generic];
  if (path.startsWith("routing.detection.")) return NOTES["routing.detection"];
  if (/^answers\.[^.]+\.probabilities\./.test(path)) return NOTES["answers.*.probabilities"];
  if (/^answers\.[^.]+\.legend\./.test(path)) return NOTES["answers.*.legend"];
  if (/^answers\.[^.]+$/.test(path)) return "The answer to this question.";
  return undefined;
}

function Node({ k, v, path, depth, active, onPick }: { k?: string; v: Json; path: string; depth: number; active: string; onPick: (p: string) => void }) {
  const pad = { paddingLeft: depth * 16 };
  const keyEl =
    k !== undefined ? (
      <button type="button" className={`aj-key ${active === path ? "is-active" : ""}`} onClick={() => onPick(path)} onMouseEnter={() => onPick(path)} onFocus={() => onPick(path)}>
        "{k}"
      </button>
    ) : null;
  if (v !== null && typeof v === "object") {
    const entries = Array.isArray(v) ? v.map((x, i) => [String(i), x] as const) : Object.entries(v);
    const open = Array.isArray(v) ? "[" : "{";
    const close = Array.isArray(v) ? "]" : "}";
    return (
      <>
        <div className="aj-line" style={pad}>
          {keyEl}
          {keyEl && <span className="tok-punct">: </span>}
          <span className="tok-punct">{open}</span>
        </div>
        {entries.map(([ck, cv], i) => (
          <Node key={ck + i} k={ck} v={cv} path={path ? `${path}.${ck}` : ck} depth={depth + 1} active={active} onPick={onPick} />
        ))}
        <div className="aj-line" style={pad}>
          <span className="tok-punct">{close}</span>
        </div>
      </>
    );
  }
  const cls = typeof v === "string" ? "tok-string" : v === null || typeof v === "boolean" ? "tok-literal" : "tok-number";
  return (
    <div className="aj-line" style={pad}>
      {keyEl}
      {keyEl && <span className="tok-punct">: </span>}
      <span className={cls}>{JSON.stringify(v)}</span>
    </div>
  );
}

export function AnnotatedResponse() {
  const [active, setActive] = useState("answers.department.answer_confidence");
  return (
    <Figure
      title="Anatomy of a result"
      kind="interactive"
      wide
      caption="The shape of Router.predict's result for the quickstart's three questions. Hover or focus any key to see what it means. The numbers are illustrative."
    >
      <div className="aj-grid">
        <div className="aj-code code" aria-label="Example result">
          <Node v={RESPONSE} path="" depth={0} active={active} onPick={setActive} />
        </div>
        <div className="aj-note" aria-live="polite">
          <code className="aj-path">{active}</code>
          <p>{noteFor(active) ?? "—"}</p>
        </div>
      </div>
    </Figure>
  );
}
