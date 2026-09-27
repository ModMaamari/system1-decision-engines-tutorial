import { useMemo, useState } from "react";
import { LineChart } from "../components/charts/LineChart";
import { Segmented, Slider } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { fitTemperature, oneHot, syntheticDataset } from "../lib/calibration";
import { argmax, softmax } from "../lib/decision";

export interface GateStats {
  threshold: number;
  coverage: number;
  accuracy: number;
  automated: number;
}

/** Automate the answers whose confidence is at least `threshold`; escalate the rest. */
export function gateAt(conf: readonly number[], correct: readonly boolean[], threshold: number): GateStats {
  let n = 0;
  let right = 0;
  conf.forEach((c, i) => {
    if (c >= threshold) {
      n++;
      if (correct[i]) right++;
    }
  });
  return { threshold, coverage: n / Math.max(1, conf.length), accuracy: n ? right / n : 1, automated: n };
}

/** Expected cost per 1,000 requests: automated errors cost `errorCost`, escalations cost `reviewCost`. */
export function costPer1000(s: GateStats, errorCost: number, reviewCost: number): number {
  return 1000 * (s.coverage * (1 - s.accuracy) * errorCost + (1 - s.coverage) * reviewCost);
}

const THRESHOLDS = Array.from({ length: 71 }, (_, i) => 0.3 + i * 0.01);

export function GatingSim() {
  const [source, setSource] = useState<"raw" | "calibrated">("calibrated");
  const [tau, setTau] = useState(0.85);
  const [errorCost, setErrorCost] = useState(20);
  const [reviewCost, setReviewCost] = useState(2);

  const data = useMemo(() => {
    const fit = syntheticDataset(3000, 4, 2.5, 101);
    const test = syntheticDataset(4000, 4, 2.5, 303);
    const t = fitTemperature(fit.logits, oneHot(fit.labels, 4));
    const correct = test.logits.map((z, i) => argmax(z) === test.labels[i]);
    const raw = test.logits.map((z) => Math.max(...softmax(z, 1)));
    const cal = test.logits.map((z) => Math.max(...softmax(z, t)));
    return { t, correct, raw, cal };
  }, []);

  const conf = source === "raw" ? data.raw : data.cal;
  const curve = useMemo(() => THRESHOLDS.map((th) => gateAt(conf, data.correct, th)), [conf, data.correct]);
  const at = gateAt(conf, data.correct, tau);
  const costs = curve.map((s) => ({ x: s.threshold, y: costPer1000(s, errorCost, reviewCost) }));
  const best = costs.reduce((a, b) => (b.y < a.y ? b : a), costs[0]);

  return (
    <Figure
      title="Choosing a confidence threshold"
      kind="simulation"
      wide
      caption={
        <>
          4,000 decisions from the synthetic over-confident classifier of chapter 10 (4 options, logits 2.5× too large),
          with a temperature of {data.t.toFixed(2)} fitted on a separate split. Answers at or above the threshold are
          automated; the rest are escalated. Costs are in arbitrary units per decision; set them to your own.
        </>
      }
    >
      <div className="gs-controls">
        <div className="seq-control-group">
          <span className="seq-control-label">Confidence used</span>
          <Segmented
            label="Confidence source"
            size="sm"
            value={source}
            onChange={setSource}
            options={[
              { value: "raw", label: "raw (as shipped)" },
              { value: "calibrated", label: "after temperature fit" },
            ]}
          />
        </div>
        <Slider label="min_confidence threshold" value={tau} min={0.3} max={0.99} step={0.01} onChange={setTau} format={(v) => v.toFixed(2)} />
        <Slider label="Cost of an automated mistake" value={errorCost} min={1} max={100} step={1} onChange={setErrorCost} accent="var(--s2)" />
        <Slider label="Cost of a human review" value={reviewCost} min={0.5} max={20} step={0.5} onChange={setReviewCost} accent="var(--score)" />
      </div>

      <div className="gs-stats">
        <div className="seq-stat">
          <span className="seq-stat-v tabular">{(at.coverage * 100).toFixed(1)}%</span>
          <span className="seq-stat-l">automated (coverage)</span>
        </div>
        <div className={`seq-stat ${at.accuracy < tau - 0.03 ? "is-bad" : ""}`}>
          <span className="seq-stat-v tabular">{(at.accuracy * 100).toFixed(1)}%</span>
          <span className="seq-stat-l">accuracy of automated answers</span>
        </div>
        <div className="seq-stat">
          <span className="seq-stat-v tabular">{Math.round((1 - at.coverage) * 1000)}</span>
          <span className="seq-stat-l">escalations per 1,000</span>
        </div>
        <div className="seq-stat">
          <span className="seq-stat-v tabular">{Math.round(at.coverage * (1 - at.accuracy) * 1000)}</span>
          <span className="seq-stat-l">automated errors per 1,000</span>
        </div>
      </div>
      <p className="gs-verdict" aria-live="polite">
        {source === "raw"
          ? `With raw confidence, a threshold of ${tau.toFixed(2)} automates answers that are right only ${(at.accuracy * 100).toFixed(0)}% of the time: the number on the threshold does not mean what it says.`
          : `After fitting, answers automated at ${tau.toFixed(2)} are right ${(at.accuracy * 100).toFixed(0)}% of the time: the threshold now roughly means what it says.`}
      </p>

      <div className="gs-charts">
        <LineChart
          ariaLabel="Accuracy of automated answers against the share automated"
          series={[{ id: "curve", label: "accuracy vs coverage", color: "var(--viz-choice)", points: curve.map((s) => ({ x: s.coverage, y: s.accuracy })) }]}
          dots={[{ x: at.coverage, y: at.accuracy, color: "var(--viz-choice)", label: `τ = ${tau.toFixed(2)}` }]}
          xDomain={[0, 1]}
          yDomain={[0.5, 1]}
          xLabel="share of decisions automated"
          yLabel="accuracy of automated"
          formatX={(v) => `${Math.round(v * 100)}%`}
          formatY={(v) => `${Math.round(v * 100)}%`}
          height={250}
        />
        <LineChart
          ariaLabel="Expected cost per 1,000 decisions against the threshold"
          series={[{ id: "cost", label: "expected cost per 1,000", color: "var(--viz-s2)", points: costs }]}
          dots={[{ x: best.x, y: best.y, color: "var(--viz-s2)", label: `lowest at ${best.x.toFixed(2)}` }]}
          markers={[{ x: tau, label: "your τ" }]}
          xDomain={[0.3, 1]}
          yDomain={[0, Math.max(...costs.map((c) => c.y)) * 1.1]}
          xLabel="threshold τ"
          yLabel="cost per 1,000"
          formatX={(v) => v.toFixed(2)}
          formatY={(v) => String(Math.round(v))}
          height={250}
        />
      </div>
    </Figure>
  );
}
