import { useEffect, useMemo, useRef, useState } from "react";
import { search } from "../lib/search";
import { Icon } from "./Icon";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (chapterId: string) => void;
}

/** A search dialog over chapters and glossary terms: type, arrow through results, Enter to go. */
export function CommandPalette({ open, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const results = useMemo(() => search(query), [query]);

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement;
      setQuery("");
      setActive(0);
      input.current?.focus();
    } else if (returnFocus.current instanceof HTMLElement) {
      returnFocus.current.focus();
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (i: number) => {
    const r = results[i];
    if (!r) return;
    onNavigate(r.chapter);
    onClose();
  };

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search the tutorial"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(active);
          } else if (e.key === "Tab") {
            e.preventDefault(); // keep focus in the dialog
          }
        }}
      >
        <div className="palette-input">
          <Icon name="search" size={18} />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapters and terms… e.g. temperature, RLCD, router"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `palette-${active}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <ul id="palette-results" className="palette-results" role="listbox" aria-label="Results">
          {results.length === 0 && <li className="palette-empty">No matches. Try a shorter word.</li>}
          {results.map((r, i) => (
            <li
              key={`${r.kind}-${r.title}`}
              id={`palette-${i}`}
              role="option"
              aria-selected={i === active}
              className={`palette-item ${i === active ? "is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(i)}
            >
              <span className={`palette-kind kind-${r.kind}`}>{r.kind === "chapter" ? "Chapter" : "Term"}</span>
              <span className="palette-text">
                <span className="palette-title">{r.title}</span>
                <span className="palette-detail">{r.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="palette-foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>Enter</kbd> to open
          </span>
        </div>
      </div>
    </div>
  );
}
