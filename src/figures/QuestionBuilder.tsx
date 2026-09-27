import { useMemo, useState } from "react";
import { Button, Segmented } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { Icon } from "../components/Icon";
import { CodeBlock } from "../components/ui/CodeBlock";
import { decodeAnswer, type QType } from "../lib/decision";
import { headerText, optionKeys, renderOptions, validateQuestion, type QuestionDef } from "../lib/questions";

const PRESETS: { id: string; label: string; q: unknown }[] = [
  {
    id: "department",
    label: "Routing (choice)",
    q: {
      type: "choice",
      instructions: "Which department should handle this request?",
      criteria: {
        billing: "invoices, payments, refunds",
        technical: "bugs, outages, system errors",
        sales: "pricing, new contracts",
        other: "everything else",
      },
    },
  },
  {
    id: "urgency",
    label: "Urgency (score)",
    q: {
      type: "score",
      instructions: "How urgent is this request?",
      criteria: ["not urgent", "soon", "critical deadline or blocking issue"],
    },
  },
  {
    id: "refund",
    label: "Refund asked? (noul)",
    q: {
      type: "noul",
      instructions: "Does the user explicitly request a refund?",
      criteria: { true: "the user asks for money back", false: "no refund is requested" },
    },
  },
  {
    id: "bad-noul",
    label: "Mistake: yes/no keys",
    q: { type: "noul", instructions: "Is this review positive?", criteria: { yes: "positive", no: "negative" } },
  },
  {
    id: "bool-labels",
    label: "Pitfall: boolean labels",
    q: { type: "choice", instructions: "Is this review positive?", criteria: { yes: "the review is positive", no: "the review is negative" } },
  },
  {
    id: "dup",
    label: "Mistake: duplicate label",
    q: { type: "choice", instructions: "What is it about?", criteria: ["billing", "technical", "billing"] },
  },
];

/** Advice beyond Laya's hard validation, from the README's "Honest limits". */
export function lintQuestion(q: QuestionDef): string[] {
  const out: string[] = [];
  if (typeof q.instructions === "string" && q.instructions.trim() === "") {
    out.push("Empty instructions give the model nothing to decide about.");
  }
  if (q.type === "choice") {
    const keys = optionKeys(q);
    const boolish = keys.filter((k) => ["true", "false", "yes", "no"].includes(k.toLowerCase()));
    if (boolish.length) {
      out.push(
        `Avoid boolean-word labels in a choice question (${boolish.join(", ")}): current checkpoints can follow the label instead of its description. Use semantic labels or opaque ones such as A/B, or a noul question.`,
      );
    }
    if (keys.length > 20) {
      out.push(`${keys.length} options share one token budget; accuracy falls sharply past about 20. Shortlist or split the question.`);
    }
    if (keys.length === 1) out.push("A single option always gets probability 1.");
  }
  if (q.type === "score" && Array.isArray(q.criteria) && q.criteria.length === 1) {
    out.push("A single level always gets probability 1.");
  }
  if (q.type === "noul" && (q.criteria === undefined || q.criteria === null)) {
    out.push(
      "No criteria: the model reads the generic pair “no, the statement does not hold / yes, the statement holds”. On the English checkpoint that pair can decide the answer by itself; describe the true and false cases.",
    );
  }
  return out;
}

/** Descending illustrative logits, so the example answer has a clear winner. */
const illustrativeLogits = (k: number, type: QType) =>
  type === "score" ? Array.from({ length: k }, (_, i) => (i === Math.min(1, k - 1) ? 1.6 : 0.3 - 0.4 * i)) : Array.from({ length: k }, (_, i) => 1.9 - 1.3 * i);

type Rows = { label: string; desc: string }[];

function toRows(crit: unknown): Rows | null {
  if (Array.isArray(crit)) return crit.every((c) => typeof c === "string") ? crit.map((c) => ({ label: c as string, desc: "" })) : null;
  if (crit && typeof crit === "object") {
    const entries = Object.entries(crit as Record<string, unknown>);
    return entries.every(([, v]) => v === null || typeof v === "string") ? entries.map(([k, v]) => ({ label: k, desc: (v as string) ?? "" })) : null;
  }
  return null;
}

export function QuestionBuilder() {
  const [text, setText] = useState(() => JSON.stringify(PRESETS[0].q, null, 2));
  const [mode, setMode] = useState<"form" | "json">("form");

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: JSON.parse(text) as unknown };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [text]);

  const error = parsed.ok ? validateQuestion("q", parsed.value) : `Not valid JSON: ${parsed.error}`;
  const q = parsed.ok && !error ? (parsed.value as QuestionDef) : null;
  const lints = q ? lintQuestion(q) : [];
  const options = q ? renderOptions(q) : [];
  const example = q ? decodeAnswer(q.type, illustrativeLogits(options.length, q.type), 1, optionKeys(q)) : null;

  const set = (obj: unknown) => setText(JSON.stringify(obj, null, 2));
  const obj = parsed.ok && parsed.value && typeof parsed.value === "object" ? (parsed.value as Record<string, unknown>) : null;
  const type = (obj?.type as QType) ?? "choice";
  const rows = obj && (type === "choice" || type === "score") ? toRows(obj.criteria) : null;
  const noulCrit = obj && type === "noul" ? ((obj.criteria as Record<string, string> | undefined) ?? {}) : {};
  const noulFormable = type !== "noul" || !obj?.criteria || Object.keys(noulCrit).every((k) => k === "true" || k === "false");
  const formable = !!obj && typeof obj.type === "string" && ["choice", "score", "noul"].includes(obj.type) && (type === "noul" ? noulFormable : rows !== null);

  const update = (patch: Record<string, unknown>) => set({ ...obj, ...patch });
  const setRows = (next: Rows) =>
    update({
      criteria:
        type === "score" ? next.map((r) => r.desc || r.label) : Object.fromEntries(next.map((r) => [r.label, r.desc || null])),
    });

  const changeType = (t: QType) => {
    const ins = typeof obj?.instructions === "string" ? obj.instructions : "";
    if (t === "choice") set({ type: t, instructions: ins, criteria: { option_a: "first description", option_b: "second description" } });
    if (t === "score") set({ type: t, instructions: ins, criteria: ["low", "medium", "high"] });
    if (t === "noul") set({ type: t, instructions: ins, criteria: { true: "the statement holds", false: "it does not" } });
  };

  return (
    <Figure
      title="Question builder"
      kind="interactive"
      wide
      caption={
        <>
          The validation messages, option texts and answer shape are produced by ports of Laya's{" "}
          <code>_check_question</code>, <code>render_options</code> and <code>_decode_answers</code>. The example answer
          uses made-up logits, so only its shape is meaningful.
        </>
      }
    >
      <div className="qb-presets" role="group" aria-label="Examples">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="chip-btn" onClick={() => set(p.q)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="qb-grid">
        <div className="qb-editor">
          <div className="qb-editor-head">
            <span className="qb-col-title">Definition</span>
            <Segmented
              label="Editor"
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: "form", label: "Form" },
                { value: "json", label: "JSON" },
              ]}
            />
          </div>
          {mode === "json" || !formable ? (
            <>
              {mode === "form" && !formable && (
                <p className="qb-note">This definition cannot be shown as a form. Edit it as JSON, or load an example.</p>
              )}
              <textarea
                className="qb-json"
                spellCheck={false}
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Question definition as JSON"
                rows={14}
              />
            </>
          ) : (
            <div className="qb-form">
              <label className="field">
                <span>type</span>
                <select value={type} onChange={(e) => changeType(e.target.value as QType)}>
                  <option value="choice">choice</option>
                  <option value="score">score</option>
                  <option value="noul">noul</option>
                </select>
              </label>
              <label className="field">
                <span>instructions</span>
                <input value={String(obj?.instructions ?? "")} onChange={(e) => update({ instructions: e.target.value })} />
              </label>
              {type !== "noul" && rows && (
                <div className="field">
                  <span>{type === "choice" ? "criteria (label → description)" : "criteria (levels, 0 first)"}</span>
                  <div className="qb-rows">
                    {rows.map((r, i) => (
                      <div key={i} className="qb-row">
                        {type === "choice" ? (
                          <>
                            <input
                              aria-label={`Label ${i + 1}`}
                              className="qb-label"
                              value={r.label}
                              onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                            />
                            <input
                              aria-label={`Description ${i + 1}`}
                              value={r.desc}
                              placeholder="description (optional)"
                              onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))}
                            />
                          </>
                        ) : (
                          <>
                            <span className="qb-level">{i}</span>
                            <input
                              aria-label={`Level ${i}`}
                              value={r.desc || r.label}
                              onChange={(e) => setRows(rows.map((x, j) => (j === i ? { label: e.target.value, desc: e.target.value } : x)))}
                            />
                          </>
                        )}
                        <button
                          type="button"
                          className="icon-button qb-remove"
                          aria-label={`Remove option ${i + 1}`}
                          onClick={() => setRows(rows.filter((_, j) => j !== i))}
                        >
                          <Icon name="x" size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setRows([...rows, type === "choice" ? { label: `option_${rows.length + 1}`, desc: "" } : { label: `level ${rows.length}`, desc: `level ${rows.length}` }])
                    }
                  >
                    + Add {type === "choice" ? "option" : "level"}
                  </Button>
                </div>
              )}
              {type === "noul" && (
                <>
                  <label className="field">
                    <span>criteria.true</span>
                    <input
                      value={noulCrit.true ?? ""}
                      placeholder="(empty: generic text)"
                      onChange={(e) => {
                        const c = { ...noulCrit, true: e.target.value };
                        if (!c.true) delete (c as Record<string, string>).true;
                        update({ criteria: Object.keys(c).length ? c : undefined });
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>criteria.false</span>
                    <input
                      value={noulCrit.false ?? ""}
                      placeholder="(empty: generic text)"
                      onChange={(e) => {
                        const c = { ...noulCrit, false: e.target.value };
                        if (!c.false) delete (c as Record<string, string>).false;
                        update({ criteria: Object.keys(c).length ? c : undefined });
                      }}
                    />
                  </label>
                  <label className="field field-inline">
                    <input
                      type="checkbox"
                      checked={!!obj?.labels}
                      onChange={(e) => update({ labels: e.target.checked ? { false: "B", true: "A" } : undefined })}
                    />
                    <span>Override the model-facing words with labels A/B</span>
                  </label>
                </>
              )}
            </div>
          )}
        </div>

        <div className="qb-output">
          <div className={`qb-status ${error ? "is-error" : lints.length ? "is-warn" : "is-ok"}`} role="status">
            <Icon name={error ? "alert" : lints.length ? "info" : "check"} size={16} />
            <div>
              {error ? (
                <>
                  <strong>Laya would reject this.</strong> {error}
                </>
              ) : lints.length ? (
                <>
                  <strong>Valid, with advice:</strong>
                  <ul>
                    {lints.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <strong>Valid question.</strong>
              )}
            </div>
          </div>

          {q && (
            <>
              <div className="qb-col-title">What the model reads</div>
              <div className="qb-reads">
                <div className="qb-header-text">{headerText(q)}</div>
                <ol className="qb-options" start={0}>
                  {options.map((o, i) => (
                    <li key={i}>
                      <span className="mask-pill">[MASK]</span>
                      {o}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="qb-col-title">Answer shape</div>
              <CodeBlock lang="json" title={'answers["q"]'} code={JSON.stringify(example, null, 2)} />
            </>
          )}
        </div>
      </div>
    </Figure>
  );
}
