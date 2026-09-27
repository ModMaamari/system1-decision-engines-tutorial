import { useState } from "react";
import { Button } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { Icon } from "../components/Icon";

type Pick = "s1" | "s2" | "cascade";

interface Task {
  text: string;
  answer: Pick;
  why: string;
}

export const SORTER_TASKS: Task[] = [
  {
    text: "Route an incoming support ticket to one of six queues.",
    answer: "s1",
    why: "A fixed set of options, high volume and a latency budget: the textbook choice question.",
  },
  {
    text: "Write a reply to an angry customer that follows the refund policy.",
    answer: "s2",
    why: "The output is new text. A decision engine can only pick among options you wrote in advance.",
  },
  {
    text: "Check every user prompt for a jailbreak attempt before it reaches the LLM.",
    answer: "s1",
    why: "A guardrail must run on every request and add little latency; it is a yes/no (noul) question. Laya ships a guard preset for it, and measures 0.71–0.76 on held-out jailbreak data, so validate before trusting it.",
  },
  {
    text: "Summarise a 40-page contract for a lawyer.",
    answer: "s2",
    why: "Open-ended generation over a long document. Nothing here is a choice among fixed options.",
  },
  {
    text: "Pick which of ~45 page elements a browser agent should click next.",
    answer: "s1",
    why: "Laya's browser-agent example fine-tunes a checkpoint for exactly this: element top-1 rose from 0.10 zero-shot to 0.63–0.66 after fine-tuning, at 17–23 ms per step on the 322M model.",
  },
  {
    text: "Decide whether a request needs a frontier model or a small, cheap model.",
    answer: "s1",
    why: "Model routing is a decision about the request, made before any expensive call. Laya's router preset scores difficulty, domain, tool need and sensitivity in one pass.",
  },
  {
    text: "Find the cause of a failing integration test from its stack trace.",
    answer: "s2",
    why: "Multi-step diagnosis over code: hypotheses, reading, checking. This is deliberate reasoning.",
  },
  {
    text: "Label one million historical tickets by category for an analytics report.",
    answer: "s1",
    why: "Throughput matters most. Batched decision calls share forward passes (Laya measured about 7 ms per question at 10 per call on a T4).",
  },
  {
    text: "Handle a refund request end to end: classify it, then draft the response.",
    answer: "cascade",
    why: "The classification (intent, urgency, churn risk) is a System 1 decision; drafting the reply is System 2. The first step also decides whether the second is needed at all.",
  },
  {
    text: "Triage a security alert, then investigate the ones that look real.",
    answer: "cascade",
    why: "True positive? Severity? Credential compromise? are typed questions (one of Laya's typed-decisions workflows). Investigation of the flagged ones is open-ended work.",
  },
];

const LABELS: Record<Pick, string> = {
  s1: "System 1",
  s2: "System 2",
  cascade: "System 1 → System 2",
};

export function SystemSorter() {
  const [picks, setPicks] = useState<Record<number, Pick>>({});
  const answered = Object.keys(picks).length;
  const correct = Object.entries(picks).filter(([i, p]) => SORTER_TASKS[Number(i)].answer === p).length;

  return (
    <Figure
      title="Which system should handle it?"
      kind="interactive"
      wide
      actions={
        answered > 0 ? (
          <Button size="sm" icon="reset" onClick={() => setPicks({})}>
            Reset
          </Button>
        ) : undefined
      }
      caption="Pick a system for each task. “System 1 → System 2” means a fast decision first, with deliberate work only where the decision calls for it."
    >
      <ol className="sorter">
        {SORTER_TASKS.map((task, i) => {
          const pick = picks[i];
          const ok = pick === task.answer;
          return (
            <li key={i} className={`sorter-item ${pick ? (ok ? "is-ok" : "is-wrong") : ""}`}>
              <div className="sorter-text">{task.text}</div>
              <div className="sorter-choices" role="group" aria-label={`Options for task ${i + 1}`}>
                {(Object.keys(LABELS) as Pick[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`sorter-btn pick-${p} ${pick === p ? "is-picked" : ""}`}
                    aria-pressed={pick === p}
                    onClick={() => setPicks((prev) => ({ ...prev, [i]: p }))}
                  >
                    {LABELS[p]}
                  </button>
                ))}
              </div>
              {pick && (
                <div className="sorter-feedback" role="status">
                  <Icon name={ok ? "check" : "info"} size={15} />
                  <span>
                    <strong>{ok ? "Yes. " : `Better: ${LABELS[task.answer]}. `}</strong>
                    {task.why}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="sorter-score" aria-live="polite">
        {answered === 0
          ? `${SORTER_TASKS.length} tasks`
          : `${correct} of ${answered} answered correctly${answered === SORTER_TASKS.length ? " · all done" : ""}`}
      </div>
    </Figure>
  );
}
