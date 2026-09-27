import type { ReactNode } from "react";
import { Icon } from "../Icon";

const REPO = "https://github.com/NandhaKishorM/laya/blob/main/";

/** A link to a file in the Laya repository, so a claim can be traced to its source. */
export function Source({ path, children }: { path: string; children?: ReactNode }) {
  return (
    <a className="source-link" href={REPO + path} target="_blank" rel="noreferrer">
      <code>{children ?? path}</code>
      <Icon name="external" size={12} />
    </a>
  );
}

export function KeyTakeaways({ items }: { items: ReactNode[] }) {
  return (
    <section className="takeaways" aria-label="Key takeaways">
      <h2 className="takeaways-title">
        <Icon name="check" size={18} /> Key takeaways
      </h2>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export interface StatItem {
  value: ReactNode;
  label: ReactNode;
  note?: ReactNode;
  tone?: "accent" | "s2" | "choice" | "score" | "noul" | "neutral";
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="stat-grid">
      {items.map((s, i) => (
        <div key={i} className={`stat tone-${s.tone ?? "accent"}`}>
          <div className="stat-value tabular">{s.value}</div>
          <div className="stat-label">{s.label}</div>
          {s.note && <div className="stat-note">{s.note}</div>}
        </div>
      ))}
    </div>
  );
}

/** A horizontally scrollable wrapper so wide tables never widen the page on phones. */
export function TableWrap({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <div className="table-block">
      <div className="table-wrap">{children}</div>
      {caption && <div className="table-caption">{caption}</div>}
    </div>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="lead">{children}</p>;
}

/** A tag coloured by decision primitive. */
export function TypeTag({ type }: { type: "choice" | "score" | "noul" }) {
  return <span className={`type-tag tag-${type}`}>{type}</span>;
}
