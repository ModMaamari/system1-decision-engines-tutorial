import { useMemo, useState } from "react";
import { LineChart } from "../components/charts/LineChart";
import { Slider } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { RULES, expectedBinary, logScore, rps, type RuleId } from "../lib/scoring";

const COLORS: Record<RuleId, string> = {
  log: "var(--viz-choice)",
  spherical: "var(--viz-accent)",
  brier: "var(--viz-noul)",
  linear: "var(--viz-s2)",
  accuracy: "var(--viz-score)",
};

const GRID = Array.from({ length: 197 }, (_, i) => 0.01 + i * 0.005);

/** The report q that maximises expected reward (first maximum on the grid). */
export function bestReport(id: RuleId, p: number): number {
  let best = GRID[0];
  let bestV = -Infinity;
  for (const q of GRID) {
    const v = expectedBinary(RULES[id].fn, p, q);
    if (v > bestV + 1e-12) {
      bestV = v;
      best = q;
    }
  }
  return best;
}

export function ScoringExplorer() {
  const [p, setP] = useState(0.7);
  const [on, setOn] = useState<Record<RuleId, boolean>>({ log: true, spherical: true, brier: true, linear: true, accuracy: false });

  const series = useMemo(
    () =>
      (Object.keys(RULES) as RuleId[])
        .filter((id) => on[id])
        .map((id) => {
          const raw = GRID.map((q) => expectedBinary(RULES[id].fn, p, q));
          const lo = Math.min(...raw);
          const hi = Math.max(...raw);
          const span = hi - lo || 1;
          return {
            id,
            label: `${RULES[id].label}${RULES[id].proper ? "" : " (improper)"}`,
            color: COLORS[id],
            dashed: !RULES[id].proper,
            points: GRID.map((q, i) => ({ x: q, y: (raw[i] - lo) / span })),
          };
        }),
    [p, on],
  );

  const dots = (Object.keys(RULES) as RuleId[])
    .filter((id) => on[id] && id !== "accuracy")
    .map((id) => ({ x: bestReport(id, p), y: 1, color: COLORS[id] }));

  return (
    <Figure
      title="The honest forecaster: which report earns the most?"
      kind="interactive"
      wide
      caption={
        <>
          A yes/no event happens with true probability p. For each report q, the curve shows the expected reward{" "}
          p·S(q, yes) + (1 − p)·S(q, no). Each curve is rescaled to run from 0 to 1 so their shapes can share one axis;
          the dots mark where each curve peaks. Proper rules peak exactly at q = p; the linear score always runs to the
          edge, and accuracy is flat on each side of 0.5.
        </>
      }
    >
      <div className="se-controls">
        <Slider label="True probability p" value={p} min={0.05} max={0.95} step={0.01} onChange={setP} format={(v) => v.toFixed(2)} />
        <div className="se-toggles" role="group" aria-label="Scoring rules shown">
          {(Object.keys(RULES) as RuleId[]).map((id) => (
            <label key={id} className="se-toggle">
              <input type="checkbox" checked={on[id]} onChange={(e) => setOn({ ...on, [id]: e.target.checked })} />
              <span className="swatch" style={{ background: COLORS[id] }} />
              {RULES[id].label}
            </label>
          ))}
        </div>
      </div>
      <LineChart
        ariaLabel={`Expected reward against reported probability when the true probability is ${p.toFixed(2)}`}
        series={series}
        xDomain={[0, 1]}
        yDomain={[0, 1.05]}
        xLabel="reported probability q"
        yLabel="expected reward (rescaled)"
        markers={[{ x: p, label: `true p = ${p.toFixed(2)}` }]}
        dots={dots}
        formatX={(v) => v.toFixed(2)}
        formatY={(v) => v.toFixed(2)}
        height={300}
      />
      <div className="table-wrap se-table">
        <table>
          <thead>
            <tr>
              <th scope="col">Rule</th>
              <th scope="col" className="num">
                best report
              </th>
              <th scope="col" className="num">
                E[reward] honest (q = p)
              </th>
              <th scope="col" className="num">
                E[reward] overclaiming (q = 0.99)
              </th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(RULES) as RuleId[]).map((id) => {
              const honest = expectedBinary(RULES[id].fn, p, p);
              const over = expectedBinary(RULES[id].fn, p, p >= 0.5 ? 0.99 : 0.01);
              return (
                <tr key={id}>
                  <th scope="row" style={{ textTransform: "none", letterSpacing: 0, fontSize: "0.86rem" }}>
                    {RULES[id].label}
                  </th>
                  <td className="num">{id === "accuracy" ? `any q on the ${p >= 0.5 ? "> 0.5" : "< 0.5"} side` : bestReport(id, p).toFixed(3)}</td>
                  <td className={`num ${honest >= over - 1e-12 ? "best" : ""}`}>{honest.toFixed(3)}</td>
                  <td className={`num ${over > honest + 1e-12 ? "best" : ""}`}>{over.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="se-note muted">
        Overclaiming uses q = {p >= 0.5 ? "0.99" : "0.01"}, the extreme on the side of the more likely outcome. Bold marks the
        better of the two columns.
      </p>
    </Figure>
  );
}

const LEVELS = ["0 none", "1 minor", "2 serious", "3 severe"];

/** Three confident or hedged forecasts, placed relative to the true level. */
export function ordinalForecasts(truth: number): { id: string; label: string; q: number[] }[] {
  const near = truth === 0 ? 1 : truth - 1;
  const far = truth >= 2 ? 0 : 3;
  const onehot = (lvl: number) => LEVELS.map((_, i) => (i === lvl ? 0.997 : 0.001));
  return [
    { id: "near", label: `near miss: all on level ${near}`, q: onehot(near) },
    { id: "far", label: `far miss: all on level ${far}`, q: onehot(far) },
    {
      id: "hedge",
      label: `hedged: split between levels ${Math.min(near, truth)} and ${Math.max(near, truth)}`,
      q: LEVELS.map((_, i) => (i === near || i === truth ? 0.45 : 0.05)),
    },
  ];
}

/** Why ordinal questions get the ranked probability score as well. */
export function OrdinalScores() {
  const [truth, setTruth] = useState(3);
  const t = LEVELS.map((_, i) => (i === truth ? 1 : 0));
  return (
    <Figure
      title="Ordinal questions: a near miss should beat a far miss"
      kind="interactive"
      caption="Log score only looks at the probability on the true level, so two confident misses score the same. The ranked probability score compares cumulative distributions, so it charges more for being further away. Laya subtracts RPS from the reward of score questions only."
    >
      <div className="se-truth" role="group" aria-label="True level">
        <span className="qb-col-title">True harm level</span>
        {LEVELS.map((l, i) => (
          <button key={l} type="button" className={`chip-btn ${truth === i ? "is-on" : ""}`} onClick={() => setTruth(i)} aria-pressed={truth === i}>
            {l}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Forecast</th>
              <th scope="col" className="num">
                log score
              </th>
              <th scope="col" className="num">
                RPS (penalty)
              </th>
            </tr>
          </thead>
          <tbody>
            {ordinalForecasts(truth).map((f) => (
              <tr key={f.id}>
                <th scope="row" style={{ textTransform: "none", letterSpacing: 0, fontSize: "0.86rem" }}>
                  {f.label}
                </th>
                <td className="num">{logScore(f.q, t).toFixed(2)}</td>
                <td className="num">{rps(f.q, t).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Figure>
  );
}
