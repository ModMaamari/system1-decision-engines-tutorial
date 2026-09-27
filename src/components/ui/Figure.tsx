import type { ReactNode } from "react";

export type FigureKind = "interactive" | "simulation" | "diagram" | "data";

const KIND_LABEL: Record<FigureKind, string> = {
  interactive: "Interactive",
  simulation: "Simulation",
  diagram: "Diagram",
  data: "Measured data",
};

interface FigureProps {
  title: string;
  kind?: FigureKind;
  caption?: ReactNode;
  wide?: boolean;
  children: ReactNode;
  actions?: ReactNode;
}

/** A framed, titled block for every interactive, diagram and chart in the tutorial. */
export function Figure({ title, kind = "interactive", caption, wide, children, actions }: FigureProps) {
  return (
    <figure className={`figure ${wide ? "wide" : ""}`}>
      <div className="figure-head">
        <span className={`figure-kind kind-${kind}`}>{KIND_LABEL[kind]}</span>
        <span className="figure-title">{title}</span>
        {actions && <span className="figure-actions">{actions}</span>}
      </div>
      <div className="figure-body">{children}</div>
      {caption && <figcaption className="figure-caption">{caption}</figcaption>}
    </figure>
  );
}
