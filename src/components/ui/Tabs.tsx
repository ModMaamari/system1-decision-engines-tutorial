import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  initial?: string;
  label: string;
  onChange?: (id: string) => void;
}

/** WAI-ARIA tabs: arrow keys move between tabs, Home/End jump to the ends. */
export function Tabs({ items, initial, label, onChange }: TabsProps) {
  const [active, setActive] = useState(initial ?? items[0]?.id);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      select(items[next].id);
      refs.current[next]?.focus();
    }
  };

  return (
    <div className="tabs">
      <div className="tab-list" role="tablist" aria-label={label}>
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${item.id}`}
            aria-selected={active === item.id}
            aria-controls={`${base}-panel-${item.id}`}
            tabIndex={active === item.id ? 0 : -1}
            className={`tab ${active === item.id ? "is-active" : ""}`}
            onClick={() => select(item.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) =>
        item.id === active ? (
          <div
            key={item.id}
            role="tabpanel"
            id={`${base}-panel-${item.id}`}
            aria-labelledby={`${base}-tab-${item.id}`}
            className="tab-panel"
          >
            {item.content}
          </div>
        ) : null,
      )}
    </div>
  );
}
