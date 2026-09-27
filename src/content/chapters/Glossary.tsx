import { useMemo, useState } from "react";
import { Icon } from "../../components/Icon";
import { Lead } from "../../components/ui/Blocks";
import { CHAPTERS } from "../chapters";
import { GLOSSARY, REFERENCES } from "../glossary";

export default function Glossary() {
  const [query, setQuery] = useState("");
  const terms = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }));
    return q ? sorted.filter((t) => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q)) : sorted;
  }, [query]);

  return (
    <>
      <Lead>Every term the tutorial uses, with a link to where it is explained, and the sources behind the content.</Lead>

      <h2>Glossary</h2>
      <label className="gl-search">
        <Icon name="search" size={16} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${GLOSSARY.length} terms`}
          aria-label="Filter glossary terms"
        />
      </label>
      <p className="gl-count muted" aria-live="polite">
        {terms.length} term{terms.length === 1 ? "" : "s"}
      </p>
      <dl className="gl-list">
        {terms.map((t) => {
          const ch = CHAPTERS.find((c) => c.id === t.chapter);
          return (
            <div key={t.term} className="gl-item">
              <dt>{t.term}</dt>
              <dd>
                {t.def}{" "}
                {ch && (
                  <a href={`#/${ch.id}`} className="gl-link">
                    → {ch.title}
                  </a>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <h2>References</h2>
      {REFERENCES.map((g) => (
        <section key={g.group} className="ref-group">
          <h3>{g.group}</h3>
          <ul className="ref-list">
            {g.items.map((r) => (
              <li key={r.href}>
                <a href={r.href} target="_blank" rel="noreferrer">
                  {r.label}
                </a>
                <span className="muted"> · {r.note}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="gl-note muted">
        All Laya figures quoted in this tutorial come from the repository's README, BENCHMARKS.md, docs and notebooks as
        of September 2026; the library changes quickly, so check the current versions before relying on a number.
        Simulations in this tutorial are labelled as such and use synthetic data.
      </p>
    </>
  );
}
