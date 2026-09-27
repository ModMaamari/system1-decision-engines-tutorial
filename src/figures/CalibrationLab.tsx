import { useMemo, useState } from "react";
import { Button, Segmented, Slider } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { evaluate, fitTemperature, oneHot, syntheticDataset, type Bin } from "../lib/calibration";
import { clamp, linearScale } from "../lib/scale";
import { useWidth } from "../components/charts/useWidth";

function Reliability({ bins, total }: { bins: Bin[]; total: number }) {
  const [ref, width] = useWidth<HTMLDivElement>(420);
  const [hover, setHover] = useState<Bin | null>(null);
  const size = Math.min(Math.max(240, width), 440);
  const m = { l: 44, r: 12, t: 10, b: 38 };
  const x = linearScale([0, 1], [m.l, size - m.r]);
  const y = linearScale([0, 1], [size - m.b, m.t]);
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];
  const maxN = Math.max(1, ...bins.map((b) => b.n));
  return (
    <div className="chart cal-chart" ref={ref}>
      <svg width={size} height={size} role="img" aria-label="Reliability diagram: accuracy against confidence per bin">
        {ticks.map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} />
            <text className="chart-tick" x={m.l - 6} y={y(t)} dy="0.32em" textAnchor="end">
              {t.toFixed(1)}
            </text>
            <text className="chart-tick" x={x(t)} y={size - m.b + 15} textAnchor="middle">
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        <text className="chart-axis-label" x={(m.l + size - m.r) / 2} y={size - 4} textAnchor="middle">
          confidence (max p)
        </text>
        <text className="chart-axis-label" transform={`translate(12 ${(m.t + size - m.b) / 2}) rotate(-90)`} textAnchor="middle">
          accuracy
        </text>
        {bins.map((b) => {
          if (!b.n) return null;
          const x0 = x(b.lo) + 1;
          const w = x(b.hi) - x(b.lo) - 2;
          const accY = y(b.acc);
          const confY = y(b.meanConf);
          return (
            <g key={b.lo} onPointerEnter={() => setHover(b)} onPointerLeave={() => setHover(null)}>
              <rect x={x(b.lo)} y={m.t} width={x(b.hi) - x(b.lo)} height={size - m.t - m.b} fill="transparent" />
              <rect x={x0} y={accY} width={w} height={y(0) - accY} rx={3} fill="var(--viz-choice)" opacity={0.35 + 0.65 * (b.n / maxN)} />
              <rect
                x={x0}
                y={Math.min(accY, confY)}
                width={w}
                height={Math.abs(confY - accY)}
                fill="var(--viz-s2)"
                opacity={0.28}
              />
            </g>
          );
        })}
        <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--text-3)" strokeWidth={1.5} />
        <text className="chart-marker-label" x={x(0.62)} y={y(0.7)} transform={`rotate(-45 ${x(0.62)} ${y(0.7)})`}>
          perfect calibration
        </text>
      </svg>
      {hover && (
        <div className="chart-tooltip" style={{ left: clamp(x(hover.hi) + 8, 0, size - 180), top: 20 }} role="status">
          <div className="chart-tooltip-title">
            confidence {hover.lo.toFixed(2)}–{hover.hi.toFixed(2)}
          </div>
          <div className="chart-tooltip-row">
            <span className="chart-tooltip-name">items</span>
            <span className="chart-tooltip-value tabular">
              {hover.n} ({((hover.n / total) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="chart-tooltip-row">
            <span className="chart-tooltip-name">mean confidence</span>
            <span className="chart-tooltip-value tabular">{hover.meanConf.toFixed(3)}</span>
          </div>
          <div className="chart-tooltip-row">
            <span className="chart-tooltip-name">accuracy</span>
            <span className="chart-tooltip-value tabular">{hover.acc.toFixed(3)}</span>
          </div>
        </div>
      )}
      <ul className="chart-legend cal-legend">
        <li>
          <span className="swatch" style={{ background: "var(--viz-choice)" }} /> accuracy per bin (darker = more items)
        </li>
        <li>
          <span className="swatch" style={{ background: "var(--viz-s2)", opacity: 0.5 }} /> gap to mean confidence
        </li>
      </ul>
    </div>
  );
}

const N = 3000;

export function CalibrationLab() {
  const [factor, setFactor] = useState(2.5);
  const [k, setK] = useState(4);
  const [t, setT] = useState(1);
  const [fitted, setFitted] = useState<number | null>(null);

  const { fit, test } = useMemo(
    () => ({ fit: syntheticDataset(N, k, factor, 101), test: syntheticDataset(N, k, factor, 202) }),
    [k, factor],
  );
  const ev = useMemo(() => evaluate(test, t), [test, t]);
  const base = useMemo(() => evaluate(test, 1), [test]);

  const doFit = () => {
    const ft = fitTemperature(fit.logits, oneHot(fit.labels, k));
    setFitted(ft);
    setT(Number(ft.toFixed(3)));
  };

  const direction = ev.meanConf > ev.accuracy + 0.01 ? "over-confident" : ev.meanConf < ev.accuracy - 0.01 ? "under-confident" : "about calibrated";

  return (
    <Figure
      title="Calibration lab: fit one temperature"
      kind="simulation"
      wide
      actions={
        <Button size="sm" variant="primary" icon="target" onClick={doFit}>
          Fit T on the calibration split
        </Button>
      }
      caption={
        <>
          A synthetic {k}-option classifier whose logits are exactly {factor.toFixed(1)}× those of a perfectly calibrated model, so the
          right temperature is known to be {factor.toFixed(1)}. The temperature is fitted on one split of {N.toLocaleString()} items by
          minimising cross-entropy, and every number is measured on a separate test split of {N.toLocaleString()}, with Laya's
          15-bin ECE.
        </>
      }
    >
      <div className="cal-controls">
        <Slider
          label="How over-confident the model is (logit scale)"
          value={factor}
          min={0.4}
          max={4}
          step={0.1}
          onChange={(v) => {
            setFactor(v);
            setFitted(null);
            setT(1);
          }}
          format={(v) => `${v.toFixed(1)}×`}
          hint="Above 1: over-confident. Below 1: under-confident."
          accent="var(--s2)"
        />
        <Slider
          label="Temperature T applied"
          value={Math.log10(t)}
          min={-1}
          max={1}
          step={0.005}
          onChange={(v) => setT(Number((10 ** v).toPrecision(3)))}
          format={(v) => (10 ** v).toFixed(2)}
        />
        <div className="seq-control-group">
          <span className="seq-control-label">Options</span>
          <Segmented
            label="Options"
            size="sm"
            value={String(k)}
            onChange={(v) => {
              setK(Number(v));
              setFitted(null);
              setT(1);
            }}
            options={["2", "4", "10"].map((v) => ({ value: v, label: v }))}
          />
        </div>
      </div>

      <div className="cal-grid">
        <Reliability bins={ev.bins} total={N} />
        <div className="cal-metrics">
          <div className="cal-metric">
            <span className="cal-metric-label">ECE (test)</span>
            <span className="cal-metric-value tabular">{ev.ece.toFixed(3)}</span>
            <span className="cal-metric-note">at T = 1: {base.ece.toFixed(3)}</span>
          </div>
          <div className="cal-metric">
            <span className="cal-metric-label">accuracy</span>
            <span className="cal-metric-value tabular">{ev.accuracy.toFixed(3)}</span>
            <span className="cal-metric-note">unchanged by T</span>
          </div>
          <div className="cal-metric">
            <span className="cal-metric-label">mean confidence</span>
            <span className="cal-metric-value tabular">{ev.meanConf.toFixed(3)}</span>
            <span className="cal-metric-note">{direction}</span>
          </div>
          <div className="cal-metric">
            <span className="cal-metric-label">NLL per item</span>
            <span className="cal-metric-value tabular">{ev.nll.toFixed(3)}</span>
            <span className="cal-metric-note">at T = 1: {base.nll.toFixed(3)}</span>
          </div>
          <p className="cal-fit" aria-live="polite">
            {fitted === null
              ? "Press “Fit T” to fit the temperature on the calibration split."
              : `Fitted T = ${fitted.toFixed(3)} (true factor ${factor.toFixed(1)}). ECE on the test split: ${base.ece.toFixed(3)} → ${evaluate(test, fitted).ece.toFixed(3)}.`}
          </p>
        </div>
      </div>
    </Figure>
  );
}
