interface ProgressBadgeProps {
  done: number;
  total: number;
}

/** Course progress as a ring plus "done/total". */
export function ProgressBadge({ done, total }: ProgressBadgeProps) {
  const r = 8;
  const c = 2 * Math.PI * r;
  const frac = total ? done / total : 0;
  return (
    <div className="progress-badge" title={`${done} of ${total} chapters completed`}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <circle cx="11" cy="11" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="3" />
        <circle
          cx="11"
          cy="11"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${c * frac} ${c}`}
          transform="rotate(-90 11 11)"
          style={{ transition: "stroke-dasharray 400ms var(--ease-out)" }}
        />
      </svg>
      <span className="progress-text tabular">
        {done}/{total}
        <span className="sr-only"> chapters completed</span>
      </span>
    </div>
  );
}
