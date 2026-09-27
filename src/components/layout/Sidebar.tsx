import { useEffect, useRef } from "react";
import { CHAPTERS, PARTS } from "../../content/chapters";
import { Icon } from "../Icon";

interface SidebarProps {
  current: string;
  open: boolean;
  completed: ReadonlySet<string>;
  onNavigate: (id: string) => void;
  onClose: () => void;
  /** True below the drawer breakpoint: the sidebar is then an off-canvas dialog. */
  drawer: boolean;
}

export function Sidebar({ current, open, completed, onNavigate, onClose, drawer }: SidebarProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // As a drawer: focus moves in when it opens, and Escape closes it.
  useEffect(() => {
    if (!drawer || !open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, open, onClose]);

  return (
    <>
      <div className={`scrim ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <nav
        id="chapter-nav"
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label="Chapters"
        // Off-canvas and closed: keep it out of the tab order and the accessibility tree.
        inert={drawer && !open ? true : undefined}
      >
        <div className="sidebar-head">
          <span className="sidebar-title">Contents</span>
          <button ref={closeRef} type="button" className="icon-button close-button" onClick={onClose} aria-label="Close chapter list">
            <Icon name="x" />
          </button>
        </div>
        {PARTS.map((part) => (
          <div className="sidebar-part" key={part.id}>
            <div className="sidebar-part-title">
              <span className="numeral">{part.numeral}</span>
              {part.title}
            </div>
            <ol className="sidebar-list">
              {CHAPTERS.map((c, i) =>
                c.part !== part.id ? null : (
                  <li key={c.id}>
                    <a
                      href={`#/${c.id}`}
                      className={`sidebar-link ${c.id === current ? "is-active" : ""}`}
                      aria-current={c.id === current ? "page" : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(c.id);
                        onClose();
                      }}
                    >
                      <span className={`sidebar-num ${completed.has(c.id) ? "is-done" : ""}`}>
                        {completed.has(c.id) ? <Icon name="check" size={13} /> : i + 1}
                        {completed.has(c.id) && <span className="sr-only">completed</span>}
                      </span>
                      <span className="sidebar-label">{c.title}</span>
                    </a>
                  </li>
                ),
              )}
            </ol>
          </div>
        ))}
        <div className="sidebar-foot">
          Reference implementation:{" "}
          <a href="https://github.com/NandhaKishorM/laya" target="_blank" rel="noreferrer">
            NandhaKishorM/laya
          </a>
        </div>
      </nav>
    </>
  );
}
