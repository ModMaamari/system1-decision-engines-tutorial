import { useState } from "react";
import { Figure } from "../components/ui/Figure";
import { CodeBlock } from "../components/ui/CodeBlock";

export interface UseCase {
  id: string;
  title: string;
  source: string;
  schema: string;
  evidence: string[];
  watch: string[];
  strength: "strong" | "mixed" | "weak" | "fine-tune";
}

export const USE_CASES: UseCase[] = [
  {
    id: "triage",
    title: "Support ticket triage",
    source: "laya.triage_questions() (preset, abridged)",
    schema: `{
  "intent": {"type": "choice", "instructions": "What does the customer want in \`message\`?",
             "criteria": {"refund": "money returned or a duplicate charge reversed",
                          "technical_help": "a bug, outage or integration problem",
                          "billing_question": "a question about an invoice, plan or payment method",
                          "information": "general information, pricing or how-to",
                          "cancellation": "wants to cancel or downgrade",
                          "other": "none of the other options fits"}},
  "is_urgent": {"type": "noul", "instructions": "Does \`message\` communicate time pressure or a deadline?"},
  "frustration": {"type": "score", "instructions": "How frustrated does the customer sound in \`message\`?",
                  "criteria": ["calm and neutral", "concerned but civil", "clearly annoyed",
                               "very angry or using strong language"]},
  "churn_risk": {"type": "noul",
                 "instructions": "Does \`message\` suggest the customer may leave for a competitor or cancel?"}
}`,
    evidence: [
      "Base checkpoints on a 10-way support queue: 0.50–0.52.",
      "Fine-tuned on the customer-service workflow: 0.764.",
    ],
    watch: ["Negated cancellations (“I don't want to cancel”)", "noul questions without criteria on the English checkpoint"],
    strength: "fine-tune",
  },
  {
    id: "email",
    title: "Email security and routing",
    source: "laya.email_questions() (preset, abridged)",
    schema: `{
  "is_phishing": {"type": "noul",
                  "instructions": "Is this email a phishing or scam attempt to steal money, credentials, or personal data?",
                  "criteria": {"true": "phishing, scam, or fraud", "false": "a legitimate email"}},
  "is_spam": {"type": "noul", "instructions": "Is this email unsolicited spam or bulk marketing?"},
  "urgency": {"type": "score", "instructions": "How urgent is the request in \`body\`?",
              "criteria": ["no time pressure", "needs attention soon", "blocking issue or hard deadline"]},
  "needs_reply": {"type": "noul", "instructions": "Does the sender expect a reply?"}
}`,
    evidence: ["Phishing 0.94–0.99 and spam 0.96–0.99 across the three checkpoints; the best, 0.993 on each, with ECE around 0.01.", "Both sources were in the training mix."],
    watch: ["Performance on your own mail stream may be lower than on the benchmark sources"],
    strength: "strong",
  },
  {
    id: "guard",
    title: "LLM input guardrails",
    source: "laya.guard_questions() (preset, abridged)",
    schema: `{
  "jailbreak": {"type": "noul",
                "instructions": "Does \`prompt\` try to make an AI assistant ignore its rules, policies or system instructions?"},
  "prompt_injection": {"type": "noul",
                       "instructions": "Does \`prompt\` contain instructions aimed at the AI system rather than a genuine user request?"},
  "sensitive_data": {"type": "noul",
                     "instructions": "Does \`prompt\` contain credentials, personal data or other sensitive information?"},
  "harm_severity": {"type": "score", "instructions": "How much harm would complying with \`prompt\` cause?",
                    "criteria": ["none: ordinary request", "minor: mildly inappropriate",
                                 "serious: unsafe advice or abuse", "severe: dangerous or illegal"]}
}`,
    evidence: ["Held-out jailbreak data: 0.71–0.76.", "Held-out prompt injections (n = 116): 0.698 on the English checkpoint."],
    watch: ["A first filter, not a sole defence", "Adversaries adapt; re-evaluate regularly"],
    strength: "mixed",
  },
  {
    id: "moderation",
    title: "Content moderation",
    source: "laya.moderation_questions() (preset, abridged)",
    schema: `{
  "toxic": {"type": "noul",
            "instructions": "Is \`post\` toxic: rude, disrespectful or likely to make someone leave the discussion?"},
  "harassment": {"type": "noul", "instructions": "Does \`post\` target or harass a specific person?"},
  "threat": {"type": "noul", "instructions": "Does \`post\` threaten violence, harm or intimidation?"},
  "severity": {"type": "score", "instructions": "How severe is any rule-breaking in \`post\`?",
               "criteria": ["no rule-breaking: ordinary on-topic post", "mild: rude tone or off-topic, no target",
                            "clear violation: insults, harassment or spam aimed at someone",
                            "severe: threats, hate speech or calls for violence"]}
}`,
    evidence: ["Held-out toxicity: 0.53 accuracy, macro-F1 0.40, barely above chance on a balanced split."],
    watch: ["The benchmark report says hand-picked examples work and real traffic does not: fine-tune before relying on it"],
    strength: "weak",
  },
  {
    id: "llm-router",
    title: "Routing requests between models",
    source: "laya.router_questions() (preset, abridged)",
    schema: `{
  "difficulty": {"type": "score", "instructions": "How hard is \`request\` for a language model?",
                 "criteria": ["trivial: a lookup or one-liner", "easy: short answer, no reasoning",
                              "moderate: several steps", "hard: long multi-step reasoning or specialist knowledge"]},
  "domain": {"type": "choice", "instructions": "What domain does \`request\` belong to?",
             "criteria": {"code": "software engineering, programming, refactoring, architecture, debugging",
                          "math_or_logic": "mathematics, logic puzzles, proofs, complex calculation",
                          "writing": "creative writing, essays, emails, blog posts, copywriting",
                          "factual_lookup": "facts, definitions, trivia, history",
                          "data_analysis": "statistics, SQL, data manipulation, metrics",
                          "chitchat": "casual conversation, greetings, small talk"}},
  "needs_tools": {"type": "noul",
                  "instructions": "Does answering \`request\` require external tools, search or private data?"}
}`,
    evidence: ["Held-out domain routing: 0.639 (laya), 0.659 (typed-decisions), 0.123 (multilingual)."],
    watch: ["Route English requests to an English checkpoint", "One routing task was under-confident rather than over-confident: fit temperatures"],
    strength: "mixed",
  },
  {
    id: "invoice",
    title: "Invoice processing",
    source: "typed-decisions workflow (question ids exact; texts illustrative)",
    schema: `{
  "matches_order": {"type": "noul", "instructions": "Does the invoice match the purchase order?"},
  "duplicate": {"type": "noul", "instructions": "Is this invoice a duplicate of one already received?"},
  "discrepancy_severity": {"type": "score", "instructions": "How severe is any discrepancy?",
                           "criteria": ["none", "minor", "material", "critical"]},
  "disposition": {"type": "choice", "instructions": "What should happen to this invoice?",
                  "criteria": {"approve": "pay as billed", "hold": "wait for clarification", "reject": "do not pay"}},
  "urgency": {"type": "score", "instructions": "How urgent is it?", "criteria": ["low", "normal", "high"]}
}`,
    evidence: ["laya-typed-decisions, fine-tuned: 0.804 on this workflow.", "Base checkpoints are near chance on typed-decisions zero-shot."],
    watch: ["Route with task=\"typed_decisions\" or auto_task_detection; the ids must match exactly"],
    strength: "fine-tune",
  },
  {
    id: "security",
    title: "Security incident triage",
    source: "typed-decisions workflow (question ids exact; texts illustrative)",
    schema: `{
  "true_positive": {"type": "noul", "instructions": "Is this alert a real incident?"},
  "credential_compromise": {"type": "noul", "instructions": "Are credentials likely compromised?"},
  "severity": {"type": "score", "instructions": "How severe is the incident?",
               "criteria": ["informational", "low", "high", "critical"]},
  "disposition": {"type": "choice", "instructions": "What should the SOC do?",
                  "criteria": {"close": "benign, close it", "monitor": "watch for recurrence",
                               "escalate": "open an incident"}},
  "urgency": {"type": "score", "instructions": "How urgent is the response?", "criteria": ["low", "normal", "high"]}
}`,
    evidence: ["laya-typed-decisions, fine-tuned: 0.766 on this workflow."],
    watch: ["Keep escalation for anything irreversible", "Validate on your own alert sources"],
    strength: "fine-tune",
  },
  {
    id: "traces",
    title: "Agent trace observability",
    source: "typed-decisions workflow (question ids exact; texts illustrative)",
    schema: `{
  "outcome": {"type": "choice", "instructions": "How did this agent run end?",
              "criteria": {"success": "the goal was met", "partial": "some of the goal was met",
                           "failure": "the goal was not met"}},
  "needs_review": {"type": "noul", "instructions": "Should a human review this trace?"},
  "risk": {"type": "score", "instructions": "How risky were the agent's actions?",
           "criteria": ["none", "low", "medium", "high"]},
  "action": {"type": "choice", "instructions": "What should happen next?",
             "criteria": {"none": "nothing", "retry": "run again", "rollback": "undo the changes"}},
  "urgency": {"type": "score", "instructions": "How urgent is follow-up?", "criteria": ["low", "normal", "high"]}
}`,
    evidence: ["laya-typed-decisions, fine-tuned: 0.730 on this workflow."],
    watch: ["Long traces exceed the window: use predict_long or summarise the trace first"],
    strength: "fine-tune",
  },
  {
    id: "rag",
    title: "RAG passage relevance",
    source: "a common pattern (illustrative schema)",
    schema: `{
  "answers_question": {"type": "noul",
                       "instructions": "Does \`passage\` contain the information needed to answer \`question\`?",
                       "criteria": {"true": "the passage answers the question", "false": "it does not"}}
}`,
    evidence: ["RAG passage relevance: 0.625–0.657 across the checkpoints."],
    watch: ["Good for pruning a candidate list, weak as the final judge", "Score many passages with predict_batch"],
    strength: "mixed",
  },
];

const STRENGTH_LABEL: Record<UseCase["strength"], string> = {
  strong: "strong as shipped",
  mixed: "usable with care",
  weak: "weak as shipped",
  "fine-tune": "needs fine-tuning",
};

export function UseCaseGallery() {
  const [id, setId] = useState(USE_CASES[0].id);
  const uc = USE_CASES.find((u) => u.id === id)!;
  return (
    <Figure
      title="Use-case gallery"
      kind="interactive"
      wide
      caption="Evidence is quoted from Laya's README, BENCHMARKS.md and docs; each number is for that dataset and setup. Preset schemas are shortened copies of laya/presets.py; for typed-decisions workflows, only the question ids are the benchmark's."
    >
      <div className="uc-grid">
        <div className="uc-list" role="listbox" aria-label="Use cases">
          {USE_CASES.map((u) => (
            <button
              key={u.id}
              type="button"
              role="option"
              aria-selected={u.id === id}
              className={`uc-item ${u.id === id ? "is-active" : ""}`}
              onClick={() => setId(u.id)}
            >
              <span className="uc-item-title">{u.title}</span>
              <span className={`uc-strength s-${u.strength}`}>{STRENGTH_LABEL[u.strength]}</span>
            </button>
          ))}
        </div>
        <div className="uc-detail">
          <h3 className="uc-title">{uc.title}</h3>
          <p className="uc-source muted">{uc.source}</p>
          <CodeBlock lang="json" code={uc.schema} title="questions" />
          <div className="uc-cols">
            <div>
              <div className="qb-col-title">Published evidence</div>
              <ul>
                {uc.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="qb-col-title">Watch out for</div>
              <ul>
                {uc.watch.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Figure>
  );
}
