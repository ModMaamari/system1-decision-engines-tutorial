import { useMemo, useState, type PointerEvent, type ReactNode } from "react";
import { clamp, linearScale, niceTicks } from "../../lib/scale";
import { Legend } from "./Legend";
import { useWidth } from "./useWidth";

export interface LineSeries {
  id: string;
  label: string;
  color: string;
  points: { x: number; y: number }[];
  dashed?: boolean;
  /** Draw the area under the line as a light wash. */
  area?: boolean;
}

export interface VMarker {
  x: number;
  label: string;
  color?: string;
}

interface LineChartProps {
  series: LineSeries[];
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel: string;
  yLabel: string;
  height?: number;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  markers?: VMarker[];
  /** Points to emphasise with a ringed dot (e.g. the maximum of a curve). */
  dots?: { x: number; y: number; color: string; label?: string }[];
  ariaLabel: string;
  xTicks?: number;
  yTicks?: number;
  footer?: ReactNode;
}

const M = { top: 14, right: 18, bottom: 42, left: 52 };

/** A multi-series line chart with a crosshair tooltip that reads every series at the cursor. */
export function LineChart({
  series,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  height = 280,
  formatX = (v) => String(Number(v.toFixed(3))),
  formatY = (v) => String(Number(v.toFixed(3))),
  markers = [],
  dots = [],
  ariaLabel,
  xTicks = 6,
  yTicks = 5,
  footer,
}: LineChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hoverX, setHoverX] = useState<number | null>(null);
  const w = Math.max(240, width);
  const x = linearScale(xDomain, [M.left, w - M.right]);
  const y = linearScale(yDomain, [height - M.bottom, M.top]);
  const xt = useMemo(() => niceTicks(xDomain[0], xDomain[1], xTicks), [xDomain, xTicks]);
  const yt = useMemo(() => niceTicks(yDomain[0], yDomain[1], yTicks), [yDomain, yTicks]);

  const path = (pts: { x: number; y: number }[]) =>
    pts
      .filter((p) => Number.isFinite(p.y))
      .map((p, i) => `${i ? "L" : "M"}${x(p.x).toFixed(1)},${y(clamp(p.y, yDomain[0], yDomain[1])).toFixed(1)}`)
      .join("");

  const nearest = (pts: { x: number; y: number }[], xv: number) => {
    let best = pts[0];
    for (const p of pts) if (Math.abs(p.x - xv) < Math.abs(best.x - xv)) best = p;
    return best;
  };

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    setHoverX(clamp(x.invert(px), xDomain[0], xDomain[1]));
  };

  const hover = hoverX === null ? null : series.map((s) => ({ s, p: s.points.length ? nearest(s.points, hoverX) : null }));
  const hoverPx = hoverX === null ? 0 : x(hoverX);

  return (
    <div className="chart" ref={ref}>
      <Legend items={series.map((s) => ({ label: s.label, color: s.color, dashed: s.dashed }))} />
      <div className="chart-plot">
        <svg width={w} height={height} role="img" aria-label={ariaLabel}>
          {yt.map((t) => (
            <g key={`y${t}`}>
              <line className="chart-grid" x1={M.left} x2={w - M.right} y1={y(t)} y2={y(t)} />
              <text className="chart-tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {formatY(t)}
              </text>
            </g>
          ))}
          {xt.map((t) => (
            <text key={`x${t}`} className="chart-tick" x={x(t)} y={height - M.bottom + 16} textAnchor="middle">
              {formatX(t)}
            </text>
          ))}
          <line className="chart-axis" x1={M.left} x2={w - M.right} y1={height - M.bottom} y2={height - M.bottom} />
          <text className="chart-axis-label" x={(M.left + w - M.right) / 2} y={height - 6} textAnchor="middle">
            {xLabel}
          </text>
          <text
            className="chart-axis-label"
            transform={`translate(13 ${(M.top + height - M.bottom) / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            {yLabel}
          </text>

          {markers.map((m) => (
            <g key={`m${m.label}`}>
              <line
                x1={x(m.x)}
                x2={x(m.x)}
                y1={M.top}
                y2={height - M.bottom}
                stroke={m.color ?? "var(--text-3)"}
                strokeWidth={1}
              />
              <text className="chart-marker-label" x={x(m.x) + 5} y={M.top + 10}>
                {m.label}
              </text>
            </g>
          ))}

          {series.map((s) =>
            s.area && s.points.length ? (
              <path
                key={`a${s.id}`}
                d={`${path(s.points)}L${x(s.points[s.points.length - 1].x)},${y(yDomain[0])}L${x(s.points[0].x)},${y(yDomain[0])}Z`}
                fill={s.color}
                opacity={0.1}
              />
            ) : null,
          )}
          {series.map((s) => (
            <path
              key={s.id}
              d={path(s.points)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? "5 5" : undefined}
            />
          ))}
          {dots.map((d, i) => (
            <g key={`d${i}`}>
              <circle cx={x(d.x)} cy={y(d.y)} r={5} fill={d.color} stroke="var(--surface)" strokeWidth={2} />
              {d.label && (
                <text className="chart-dot-label" x={x(d.x)} y={y(d.y) - 10} textAnchor="middle">
                  {d.label}
                </text>
              )}
            </g>
          ))}

          {hover && (
            <g pointerEvents="none">
              <line className="chart-crosshair" x1={hoverPx} x2={hoverPx} y1={M.top} y2={height - M.bottom} />
              {hover.map(({ s, p }) =>
                p && Number.isFinite(p.y) ? (
                  <circle
                    key={s.id}
                    cx={x(p.x)}
                    cy={y(clamp(p.y, yDomain[0], yDomain[1]))}
                    r={4.5}
                    fill={s.color}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                ) : null,
              )}
            </g>
          )}
          <rect
            x={M.left}
            y={M.top}
            width={Math.max(0, w - M.left - M.right)}
            height={Math.max(0, height - M.top - M.bottom)}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHoverX(null)}
          />
        </svg>
        {hover && hoverX !== null && (
          <div
            className="chart-tooltip"
            style={{ left: clamp(hoverPx + 12, 0, w - 190), top: M.top }}
            role="status"
          >
            <div className="chart-tooltip-title">
              {xLabel}: {formatX(hover[0]?.p?.x ?? hoverX)}
            </div>
            {hover.map(({ s, p }) =>
              p ? (
                <div key={s.id} className="chart-tooltip-row">
                  <span className="swatch" style={{ background: s.color }} />
                  <span className="chart-tooltip-name">{s.label}</span>
                  <span className="chart-tooltip-value tabular">{formatY(p.y)}</span>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}
