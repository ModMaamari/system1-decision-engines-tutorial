export interface LegendItem {
  label: string;
  color: string;
  dashed?: boolean;
}

/** Identity for multi-series charts: a coloured key beside text in text colours. */
export function Legend({ items }: { items: LegendItem[] }) {
  if (items.length < 2) return null;
  return (
    <ul className="chart-legend">
      {items.map((it) => (
        <li key={it.label}>
          <svg width="18" height="10" aria-hidden="true">
            <line
              x1="1"
              y1="5"
              x2="17"
              y2="5"
              stroke={it.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={it.dashed ? "3 4" : undefined}
            />
          </svg>
          {it.label}
        </li>
      ))}
    </ul>
  );
}
