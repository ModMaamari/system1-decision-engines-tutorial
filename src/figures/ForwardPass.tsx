import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Segmented } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { softmax } from "../lib/decision";

type Ckpt = "large" | "base";
const DIMS: Record<Ckpt, { d: number; name: string; enc: string; layers: number }> = {
  large: { d: 1024, name: "laya / laya-typed-decisions", enc: "ModernBERT-large", layers: 28 },
  base: { d: 768, name: "laya-multilingual", enc: "mmBERT-base", layers: 22 },
};

/** The worked batch: three questions about one ticket, one row each. */
const ROWS = [
  { q: "department", type: "choice", k: 4, len: 58, labels: ["billing", "technical", "sales", "other"], logits: [3.1, 0.4, -0.6, -0.2] },
  { q: "urgency", type: "score", k: 3, len: 49, labels: ["0", "1", "2"], logits: [-0.8, 0.9, 1.6] },
  { q: "churn_risk", type: "noul", k: 2, len: 44, labels: ["false", "true"], logits: [-0.9, 1.2] },
];
const L = Math.max(...ROWS.map((r) => r.len));
const KMAX = Math.max(...ROWS.map((r) => r.k));

interface Stage {
  id: string;
  title: string;
  shape: (d: number) => string;
  body: (d: number, c: (typeof DIMS)[Ckpt]) => ReactNode;
}

const STAGES: Stage[] = [
  {
    id: "batch",
    title: "Batch the rows",
    shape: () => `input_ids [${ROWS.length}, ${L}] · marker_pos [${ROWS.length}, ${KMAX}] · qtype [${ROWS.length}]`,
    body: () => (
      <>
        <p>
          Each question is one row (chapter 5). The rows are padded to the longest one ({L} tokens here), and an{" "}
          <code>attention_mask</code> marks the real tokens. <code>marker_pos</code> holds each row's [MASK] positions,
          padded to the most options in the batch ({KMAX}); <code>marker_mask</code> says which of those slots are real.
          <code> qtype</code> is 0, 1 or 2 for choice, score, noul.
        </p>
        <div className="fp-rows" aria-hidden="true">
          {ROWS.map((r) => (
            <div key={r.q} className="fp-row">
              <span className="fp-row-name">{r.q}</span>
              <span className="fp-row-bar">
                <span className="fp-row-fill" style={{ width: `${(r.len / L) * 100}%` }} />
              </span>
              <span className="fp-row-mask">
                {Array.from({ length: KMAX }, (_, j) => (
                  <i key={j} className={j < r.k ? "on" : "off"} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "encoder",
    title: "Bidirectional encoder",
    shape: (d) => `h [${ROWS.length}, ${L}, ${d}]`,
    body: (_d, c) => (
      <>
        <p>
          The pretrained encoder ({c.enc}, {c.layers} layers) turns every token into a {c.d}-dimensional vector that
          depends on the whole row. Attention is bidirectional, so the [MASK] in front of <code>billing</code> can take
          in “billed twice” and “refund” from the state, the question, and the competing options, all in this one
          pass.
        </p>
        <p className="muted">
          ModernBERT and mmBERT are modernised BERT-style encoders: rotary position embeddings, gated (GeGLU)
          feed-forward layers, and attention that alternates between local sliding-window layers and global layers.
        </p>
      </>
    ),
  },
  {
    id: "type",
    title: "Add the type embedding",
    shape: (d) => `h + type_emb[qtype] → [${ROWS.length}, ${L}, ${d}]`,
    body: () => (
      <p>
        One of three learned vectors, chosen by <code>qtype</code>, is added to every position of the row. The head
        therefore knows which primitive it is answering even though all three share the same weights. (The type is
        also written as text in the header, “choice question: …”.)
      </p>
    ),
  },
  {
    id: "head",
    title: "Decision head: 2 transformer layers",
    shape: (d) => `[${ROWS.length}, ${L}, ${d}] → [${ROWS.length}, ${L}, ${d}]`,
    body: (d) => (
      <p>
        A small transformer on top of the encoder: <code>head_layers</code> pre-norm encoder layers (two in the shipped
        configs) with {d / 64} attention heads and a {4 * d}-wide feed-forward block, padding masked out. Unlike the
        encoder it has no pre-training: it starts from random weights when a model is first built. The fine-tuning
        notebook trains it with a four times higher learning rate than the encoder (1e-4 against 2.5e-5), a common
        choice for new layers on top of a pretrained model.
      </p>
    ),
  },
  {
    id: "gather",
    title: "Gather the marker positions",
    shape: (d) => `m [${ROWS.length}, ${KMAX}, ${d}]`,
    body: () => (
      <p>
        From each row, only the vectors at its [MASK] positions are kept: one vector per option. Everything the model
        concluded about an option has to be in that single vector, which is why the marker sits right before the
        option's text.
      </p>
    ),
  },
  {
    id: "scorer",
    title: "Score each option",
    shape: () => `logits [${ROWS.length}, ${KMAX}]`,
    body: () => (
      <>
        <p>
          A shared MLP (LayerNorm → Linear → GELU → Linear) maps each option vector to one number, its logit. Slots
          that are only padding get −1e4, so the softmax gives them effectively zero. The numbers below are
          illustrative.
        </p>
        <div className="table-wrap">
          <table className="fp-logits">
            <thead>
              <tr>
                <th scope="col">row</th>
                {Array.from({ length: KMAX }, (_, j) => (
                  <th key={j} scope="col" className="num">
                    slot {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.q}>
                  <th scope="row">{r.q}</th>
                  {Array.from({ length: KMAX }, (_, j) => (
                    <td key={j} className={`num ${j >= r.k ? "fp-masked" : ""}`}>
                      {j < r.k ? (
                        <>
                          {r.logits[j].toFixed(1)} <span className="muted">{r.labels[j]}</span>
                        </>
                      ) : (
                        "−1e4"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "act",
    title: "Side branch: the act head",
    shape: (d) => `[${ROWS.length}, ${d} + 4] → [${ROWS.length}, n_act]`,
    body: () => (
      <p>
        A second small MLP reads the [CLS] vector plus four summary features of the option distribution (top-1
        probability, the top-1 minus top-2 margin, normalised entropy, and k/255) and returns{" "}
        <code>act_probability</code>. It was meant to say “act or escalate”, but the README states it{" "}
        <strong>carries no usable signal yet</strong>: it reads 1.0 for almost every input, and on 396 labelled
        decisions its raw logits run against correctness (AUROC 0.30), while <code>confidence</code> reaches 0.77. The
        public fine-tuning notebook gives it no gradient at all. Gate on confidence instead.
      </p>
    ),
  },
  {
    id: "decode",
    title: "Decode (next chapter)",
    shape: () => `per row: softmax(logits[:k] / T)`,
    body: () => (
      <>
        <p>
          The forward pass ends at the logits. Outside the model, each row's real slots are divided by a fitted
          temperature and passed through a softmax, and the typed answer is read off (chapter 7):
        </p>
        <ul className="fp-answers">
          {ROWS.map((r) => {
            const p = softmax(r.logits);
            const best = p.indexOf(Math.max(...p));
            return (
              <li key={r.q}>
                <code>{r.q}</code>:{" "}
                {r.type === "choice" && (
                  <>
                    choice <b>{r.labels[best]}</b> ({p[best].toFixed(2)})
                  </>
                )}
                {r.type === "score" && (
                  <>
                    score <b>{p.reduce((a, v, i) => a + i * v, 0).toFixed(2)}</b> (expected level)
                  </>
                )}
                {r.type === "noul" && (
                  <>
                    noul <b>{p[1].toFixed(2)}</b> (P(true))
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </>
    ),
  },
];

const BLOCKS: { id: string; label: string; sub: string; kind: string }[] = [
  { id: "batch", label: "Rows", sub: "one per question", kind: "io" },
  { id: "encoder", label: "Encoder", sub: "pretrained, bidirectional", kind: "enc" },
  { id: "type", label: "+ type embedding", sub: "choice · score · noul", kind: "small" },
  { id: "head", label: "Decision head", sub: "2 transformer layers", kind: "head" },
  { id: "gather", label: "Gather [MASK]s", sub: "one vector per option", kind: "small" },
  { id: "scorer", label: "Scorer MLP", sub: "one logit per option", kind: "head" },
  { id: "decode", label: "Temperature + softmax", sub: "typed answers", kind: "io" },
];

export function ForwardPass() {
  const reduced = useReducedMotion();
  const [ckpt, setCkpt] = useState<Ckpt>("large");
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(0);
  const stage = STAGES[i];
  const c = DIMS[ckpt];

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setTimeout(() => {
      if (i < STAGES.length - 1) setI(i + 1);
      else setPlaying(false);
    }, reduced ? 0 : 2600);
    return () => window.clearTimeout(timer.current);
  }, [playing, i, reduced]);

  const activeBlock = stage.id === "act" ? "scorer" : stage.id;

  return (
    <Figure
      title="The forward pass, stage by stage"
      kind="diagram"
      wide
      actions={
        <Segmented
          label="Checkpoint size"
          size="sm"
          value={ckpt}
          onChange={setCkpt}
          options={[
            { value: "large", label: "d = 1024" },
            { value: "base", label: "d = 768" },
          ]}
        />
      }
      caption={
        <>
          Follows <code>DecisionModel.forward</code> in laya/common.py for a batch of three questions about one ticket.
          Shapes are real for the chosen hidden size; row lengths and logits are illustrative.
        </>
      }
    >
      <div className="fp-grid">
        <ol className="fp-pipeline" aria-label="Pipeline stages">
          {BLOCKS.map((b, bi) => {
            const idx = STAGES.findIndex((s) => s.id === b.id);
            const done = idx < i;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  className={`fp-block kind-${b.kind} ${b.id === activeBlock ? "is-active" : ""} ${done ? "is-done" : ""}`}
                  onClick={() => {
                    setPlaying(false);
                    setI(idx);
                  }}
                  aria-current={b.id === activeBlock ? "step" : undefined}
                >
                  <span className="fp-block-label">{b.label}</span>
                  <span className="fp-block-sub">{b.sub}</span>
                  {b.id === "scorer" && <span className={`fp-branch ${stage.id === "act" ? "is-active" : ""}`}>+ act head</span>}
                </button>
                {bi < BLOCKS.length - 1 && <span className={`fp-arrow ${done ? "is-done" : ""}`} aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
        <div className="fp-detail" aria-live="polite">
          <div className="fp-step">
            Stage {i + 1} of {STAGES.length}
          </div>
          <div className="fp-title">{stage.title}</div>
          <code className="fp-shape">{stage.shape(c.d)}</code>
          <div className="fp-body">{stage.body(c.d, c)}</div>
          <div className="fp-nav">
            <Button size="sm" icon="arrowLeft" onClick={() => { setPlaying(false); setI(Math.max(0, i - 1)); }} disabled={i === 0}>
              Back
            </Button>
            <Button size="sm" variant="primary" icon={playing ? "pause" : "play"} onClick={() => { if (!playing && i === STAGES.length - 1) setI(0); setPlaying(!playing); }}>
              {playing ? "Pause" : "Play"}
            </Button>
            <Button size="sm" icon="arrowRight" onClick={() => { setPlaying(false); setI(Math.min(STAGES.length - 1, i + 1)); }} disabled={i === STAGES.length - 1}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </Figure>
  );
}
