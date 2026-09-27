import { useState } from "react";
import { clamp, linearScale, niceTicks } from "../../lib/scale";
import { Legend } from "./Legend";
import { useWidth } from "./useWidth";

export interface BarSeries {
  id: string;
  label: string;
  color: string;
}

export interface BarRow {
  label: string;
  /** One value per series, keyed by series id. Missing values are skipped. */
  values: Record<string, number | undefined>;
  note?: string;
}

export interface RefLine {
  value: number;
  label: string;
}

interface BarChartProps {
  rows: BarRow[];
  series: BarSeries[];
  domain: [number, number];
  format?: (v: number) => string;
  valueLabel: string;
  refLines?: RefLine[];
  ariaLabel: string;
  labelWidth?: number;
  /** Emphasise the best value in each row. */
  highlightMax?: boolean;
}

const BAR = 16;
const GAP = 2;
const ROW_PAD = 14;

/**
 * Horizontal bars grouped by row, one bar per series. Values sit at the bar tips in text colours,
 * each bar has a hover tooltip, and the same numbers are available as a table.
 */
export function BarChart({
  rows,
  series,
  domain,
  format = (v) => v.toFixed(3),
  valueLabel,
  refLines = [],
  ariaLabel,
  labelWidth = 170,
  highlightMax = false,
}: BarChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<{ row: number; s: string; x: number; y: number } | null>(null);
  const narrow = width < 520;
  const lw = narrow ? 0 : labelWidth;
  const w = Math.max(260, width);
  const right = 56;
  const x = linearScale(domain, [lw + 4, w - right]);
  const groupH = series.length * BAR + (series.length - 1) * GAP;
  const rowH = groupH + ROW_PAD + (narrow ? 18 : 0);
  const top = 8;
  const height = top + rows.length * rowH + 30;
  const ticks = niceTicks(domain[0], domain[1], narrow ? 3 : 5);

  return (
    <div className="chart" ref={ref}>
      <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
      <div className="chart-plot">
        <svg width={w} height={height} role="img" aria-label={ariaLabel}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={x(t)} x2={x(t)} y1={top} y2={height - 26} />
              <text className="chart-tick" x={x(t)} y={height - 10} textAnchor="middle">
                {format(t)}
              </text>
            </g>
          ))}
          {rows.map((row, ri) => {
            const y0 = top + ri * rowH + (narrow ? 18 : 0);
            const present = series.map((s) => row.values[s.id]).filter((v): v is number => typeof v === "number");
            const max = Math.max(...present);
            return (
              <g key={row.label}>
                <text
                  className="chart-row-label"
                  x={narrow ? lw + 4 : lw - 10}
                  y={narrow ? y0 - 6 : y0 + groupH / 2}
                  dy={narrow ? 0 : "0.32em"}
                  textAnchor={narrow ? "start" : "end"}
                >
                  {row.label}
                </text>
                {series.map((s, si) => {
                  const v = row.values[s.id];
                  if (typeof v !== "number") return null;
                  const by = y0 + si * (BAR + GAP);
                  const x0 = x(domain[0]);
                  const bw = Math.max(1, x(clamp(v, domain[0], domain[1])) - x0);
                  const r = Math.min(4, bw / 2);
                  const isMax = highlightMax && present.length > 1 && v === max;
                  return (
                    <g
                      key={s.id}
                      className="chart-bar"
                      onPointerEnter={() => setHover({ row: ri, s: s.id, x: x0 + bw, y: by })}
                      onPointerLeave={() => setHover(null)}
                    >
                      <rect x={x0} y={by - 2} width={w - right - x0 + 40} height={BAR + 4} fill="transparent" />
                      <path
                        d={`M${x0},${by}h${bw - r}a${r},${r} 0 0 1 ${r},${r}v${BAR - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(bw - r)}z`}
                        fill={s.color}
                        opacity={hover && (hover.row !== ri || hover.s !== s.id) ? 0.55 : 1}
                      />
                      <text
                        className={`chart-value ${isMax ? "is-max" : ""}`}
                        x={x0 + bw + 6}
                        y={by + BAR / 2}
                        dy="0.34em"
                      >
                        {format(v)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
          {refLines.map((rl) => (
            <g key={rl.label}>
              <line className="chart-ref" x1={x(rl.value)} x2={x(rl.value)} y1={top - 4} y2={height - 26} />
            </g>
          ))}
        </svg>
        {hover && (
          <div className="chart-tooltip" style={{ left: clamp(hover.x + 10, 0, w - 200), top: hover.y - 6 }} role="status">
            <div className="chart-tooltip-title">{rows[hover.row].label}</div>
            <div className="chart-tooltip-row">
              <span className="swatch" style={{ background: series.find((s) => s.id === hover.s)?.color }} />
              <span className="chart-tooltip-name">{series.find((s) => s.id === hover.s)?.label}</span>
              <span className="chart-tooltip-value tabular">{format(rows[hover.row].values[hover.s] ?? 0)}</span>
            </div>
            {rows[hover.row].note && <div className="chart-tooltip-note">{rows[hover.row].note}</div>}
          </div>
        )}
      </div>
      {refLines.length > 0 && (
        <div className="chart-refs">
          {refLines.map((rl) => (
            <span key={rl.label}>
              <svg width="14" height="12" aria-hidden="true">
                <line x1="7" x2="7" y1="0" y2="12" className="chart-ref" />
              </svg>
              {rl.label}: {format(rl.value)}
            </span>
          ))}
        </div>
      )}
      <details className="chart-table">
        <summary>View as table</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">{valueLabel}</th>
                {series.map((s) => (
                  <th key={s.id} scope="col" className="num">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" style={{ textTransform: "none", letterSpacing: 0, fontSize: "0.88rem" }}>
                    {row.label}
                  </th>
                  {series.map((s) => (
                    <td key={s.id} className="num">
                      {typeof row.values[s.id] === "number" ? format(row.values[s.id] as number) : "–"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
