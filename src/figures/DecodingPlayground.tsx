import { useState } from "react";
import { ProbBars } from "../components/charts/ProbBars";
import { Slider } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { CodeBlock } from "../components/ui/CodeBlock";
import {
  answerConfidence,
  clampTemperature,
  decodeAnswer,
  entropyConfidence,
  expectedScore,
  softmax,
  tempBucket,
  type QType,
} from "../lib/decision";

interface Preset {
  id: string;
  label: string;
  type: QType;
  labels: string[];
  logits: number[];
  t: number;
}

export const DECODING_PRESETS: Preset[] = [
  { id: "route", label: "Routing (choice, 4)", type: "choice", labels: ["billing", "technical", "sales", "other"], logits: [2.2, 0.5, -0.3, 0.1], t: 1 },
  { id: "urgency", label: "Urgency (score, 3)", type: "score", labels: ["0 not urgent", "1 soon", "2 blocking"], logits: [-0.5, 0.8, 1.2], t: 1 },
  { id: "refund", label: "Refund asked? (noul)", type: "noul", labels: ["false", "true"], logits: [-0.4, 1.1], t: 1 },
  {
    id: "sharp",
    label: "Over-sharpened bucket (choice, 12)",
    type: "choice",
    labels: ["l01", "l02", "l03", "l04", "l05", "l06", "l07", "l08", "l09", "l10", "l11", "l12"],
    logits: [1.5, 1.0, 0.6, 0.4, 0.3, 0.2, 0.1, 0, 0, -0.1, -0.2, -0.3],
    t: 0.1006,
  },
];

const COLOR: Record<QType, string> = { choice: "var(--viz-choice)", score: "var(--viz-score)", noul: "var(--viz-noul)" };

function Gauge({ label, value, note, highlight }: { label: string; value: number; note: string; highlight?: boolean }) {
  return (
    <div className={`gauge ${highlight ? "is-key" : ""}`}>
      <div className="gauge-top">
        <span className="gauge-label">{label}</span>
        <span className="gauge-value tabular">{value.toFixed(3)}</span>
      </div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${value * 100}%` }} />
      </div>
      <div className="gauge-note">{note}</div>
    </div>
  );
}

export function DecodingPlayground() {
  const [preset, setPreset] = useState(DECODING_PRESETS[0]);
  const [logits, setLogits] = useState(preset.logits);
  const [rawT, setRawT] = useState(preset.t);
  const [clamp, setClamp] = useState(false);
  const [minConf, setMinConf] = useState(0.6);

  const load = (p: Preset) => {
    setPreset(p);
    setLogits(p.logits);
    setRawT(p.t);
    setClamp(false);
  };

  const t = clamp ? clampTemperature(rawT) : rawT;
  const p = softmax(logits, t);
  const pRaw = softmax(logits, 1);
  const keys = preset.type === "choice" ? preset.labels : preset.type === "score" ? preset.labels.map((_, i) => String(i)) : ["false", "true"];
  const answer = decodeAnswer(preset.type, logits, t, keys);
  const ac = answerConfidence(p);
  const ec = preset.type === "noul" ? Math.max(p[1], 1 - p[1]) : entropyConfidence(p);
  const low = ac < minConf;
  const json = JSON.stringify(low ? { ...answer, low_confidence: true } : answer, null, 2);

  return (
    <Figure
      title="From logits to a typed answer"
      kind="interactive"
      wide
      caption={
        <>
          Uses the same formulas as Laya's <code>_decode_answers</code>: softmax of logits divided by the temperature,
          then the typed answer, <code>confidence</code> and <code>answer_confidence</code>. The logits are yours to
          set; a real model produces them in the forward pass.
        </>
      }
    >
      <div className="qb-presets" role="group" aria-label="Examples">
        {DECODING_PRESETS.map((pr) => (
          <button key={pr.id} type="button" className={`chip-btn ${pr.id === preset.id ? "is-on" : ""}`} onClick={() => load(pr)}>
            {pr.label}
          </button>
        ))}
      </div>

      <div className="dp-grid">
        <div className="dp-inputs">
          <div className="qb-col-title">Logits (the scorer's outputs)</div>
          <div className={`dp-logits ${logits.length > 6 ? "is-dense" : ""}`}>
            {logits.map((z, i) => (
              <Slider
                key={`${preset.id}-${i}`}
                label={<code>{preset.labels[i]}</code>}
                value={z}
                min={-5}
                max={5}
                step={0.1}
                onChange={(v) => setLogits(logits.map((x, j) => (j === i ? v : x)))}
                format={(v) => v.toFixed(1)}
                accent={COLOR[preset.type]}
              />
            ))}
          </div>
          <div className="qb-col-title">Temperature</div>
          <Slider
            label={
              <>
                T for bucket <code>{tempBucket(preset.type, logits.length)}</code>
              </>
            }
            value={Math.log10(rawT)}
            min={-1}
            max={1}
            step={0.01}
            onChange={(v) => setRawT(Number((10 ** v).toPrecision(3)))}
            format={(v) => {
              const tv = 10 ** v;
              return tv < 1 ? tv.toPrecision(3) : tv.toFixed(2);
            }}
            hint="Below 1 sharpens the distribution; above 1 softens it. The argmax never changes."
          />
          <label className="field field-inline dp-clamp">
            <input type="checkbox" checked={clamp} onChange={(e) => setClamp(e.target.checked)} />
            <span>
              Apply Laya's load-time clamp to [0.5, 5]{clamp && rawT !== t ? ` → T = ${t}` : ""}
            </span>
          </label>
        </div>

        <div className="dp-outputs">
          <div className="qb-col-title">Probabilities</div>
          <ProbBars
            items={keys.map((k, i) => ({ label: preset.type === "choice" ? k : preset.labels[i], p: p[i], chosen: i === p.indexOf(Math.max(...p)) }))}
            color={COLOR[preset.type]}
            compact={logits.length > 6}
            ariaLabel="Probabilities after temperature"
          />
          {preset.type === "score" && (
            <p className="dp-score">
              score = Σ i·pᵢ = <b className="tabular">{expectedScore(p).toFixed(3)}</b> (the argmax level is{" "}
              {p.indexOf(Math.max(...p))})
            </p>
          )}
          {Math.abs(t - 1) > 1e-9 && (
            <p className="dp-t1 muted">At T = 1 the top probability would be {Math.max(...pRaw).toFixed(3)}.</p>
          )}
          <div className="gauges">
            <Gauge label="answer_confidence = max(p)" value={ac} note="Calibrated after temperature fitting; the number to gate on." highlight />
            <Gauge
              label={preset.type === "noul" ? "confidence = max(p, 1 − p)" : "confidence = 1 − H(p)/log k"}
              value={ec}
              note={preset.type === "noul" ? "Identical to answer_confidence for noul." : "How concentrated p is; not calibrated."}
            />
          </div>
          <Slider label="min_confidence (opt-in abstention)" value={minConf} min={0} max={1} step={0.01} onChange={setMinConf} format={(v) => v.toFixed(2)} />
          <CodeBlock lang="json" title={`answers["q"]${low ? " · flagged" : ""}`} code={json} />
        </div>
      </div>
    </Figure>
  );
}
