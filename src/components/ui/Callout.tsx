import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon";

export type CalloutType = "note" | "tip" | "warning" | "laya" | "sim";

const META: Record<CalloutType, { icon: IconName; label: string }> = {
  note: { icon: "info", label: "Note" },
  tip: { icon: "bulb", label: "Tip" },
  warning: { icon: "alert", label: "Watch out" },
  laya: { icon: "target", label: "In Laya" },
  sim: { icon: "flask", label: "About this simulation" },
};

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

export function Callout({ type = "note", title, children }: CalloutProps) {
  const meta = META[type];
  return (
    <aside className={`callout callout-${type}`}>
      <div className="callout-icon" aria-hidden="true">
        <Icon name={meta.icon} size={18} />
      </div>
      <div className="callout-body">
        <div className="callout-title">{title ?? meta.label}</div>
        <div className="callout-content">{children}</div>
      </div>
    </aside>
  );
}
