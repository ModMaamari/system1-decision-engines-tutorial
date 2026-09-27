export interface ProbItem {
  label: string;
  p: number;
  /** Mark this option as the model's answer. */
  chosen?: boolean;
  /** An optional target probability, drawn as a tick on the track. */
  target?: number;
}

interface ProbBarsProps {
  items: ProbItem[];
  color?: string;
  compact?: boolean;
  ariaLabel?: string;
}

/** A probability distribution over options: one labelled track per option, animated widths. */
export function ProbBars({ items, color = "var(--viz-choice)", compact, ariaLabel }: ProbBarsProps) {
  return (
    <div className={`prob-bars ${compact ? "is-compact" : ""}`} role="list" aria-label={ariaLabel}>
      {items.map((it) => (
        <div key={it.label} className={`prob-row ${it.chosen ? "is-chosen" : ""}`} role="listitem">
          <span className="prob-label" title={it.label}>
            {it.label}
          </span>
          <span className="prob-track">
            <span
              className="prob-fill"
              style={{ width: `${Math.max(0, Math.min(1, it.p)) * 100}%`, background: color }}
            />
            {typeof it.target === "number" && (
              <span className="prob-target" style={{ left: `${it.target * 100}%` }} title={`target ${it.target.toFixed(2)}`} />
            )}
          </span>
          <span className="prob-value tabular">{it.p.toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}
