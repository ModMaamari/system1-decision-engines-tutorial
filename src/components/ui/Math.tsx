import katex from "katex";
import { useMemo } from "react";

function render(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex, { displayMode, throwOnError: false, strict: "ignore", output: "htmlAndMathml" });
}

/** Inline maths: <M>{String.raw`p_i`}</M> */
export function M({ children }: { children: string }) {
  const html = useMemo(() => render(children, false), [children]);
  return <span className="math-inline" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Display maths, optionally with a label on the right. */
export function MathBlock({ children, label }: { children: string; label?: string }) {
  const html = useMemo(() => render(children, true), [children]);
  return (
    <div className="math-block">
      <div className="math-block-body" dangerouslySetInnerHTML={{ __html: html }} />
      {label && <span className="math-label">{label}</span>}
    </div>
  );
}
