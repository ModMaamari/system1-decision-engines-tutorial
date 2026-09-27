import { useMemo, useState } from "react";
import { tokenize, type Lang } from "../../lib/highlight";
import { Icon } from "../Icon";

interface CodeBlockProps {
  code: string;
  lang?: Lang;
  title?: string;
  /** 1-based line numbers to emphasise. */
  highlight?: number[];
}

const LANG_LABEL: Record<Lang, string> = {
  python: "Python",
  json: "JSON",
  bash: "Shell",
  ts: "TypeScript",
  text: "Text",
};

export function CodeBlock({ code, lang = "python", title, highlight = [] }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const text = code.replace(/^\n+|\s+$/g, "");
  const lines = useMemo(() => {
    // Tokenize the whole snippet (so multi-line strings stay one token), then split into lines.
    const rows: { type: string; text: string }[][] = [[]];
    for (const tok of tokenize(text, lang)) {
      const parts = tok.text.split("\n");
      parts.forEach((part, i) => {
        if (i > 0) rows.push([]);
        if (part) rows[rows.length - 1].push({ type: tok.type, text: part });
      });
    }
    return rows;
  }, [text, lang]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="code-block">
      <div className="code-head">
        <span className="code-title">{title ?? LANG_LABEL[lang]}</span>
        <button type="button" className="code-copy" onClick={copy} aria-label="Copy code">
          <Icon name={copied ? "check" : "copy"} size={14} />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className={`code lang-${lang}`}>
        <code>
          {lines.map((row, i) => (
            <span key={i} className={`code-line ${highlight.includes(i + 1) ? "is-hl" : ""}`}>
              {row.length === 0 ? "​" : row.map((t, j) => (
                <span key={j} className={`tok-${t.type}`}>
                  {t.text}
                </span>
              ))}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
