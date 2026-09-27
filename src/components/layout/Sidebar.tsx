import { CHAPTERS, PARTS } from "../../content/chapters";
import { Icon } from "../Icon";

interface SidebarProps {
  current: string;
  open: boolean;
  completed: ReadonlySet<string>;
  onNavigate: (id: string) => void;
  onClose: () => void;
}

export function Sidebar({ current, open, completed, onNavigate, onClose }: SidebarProps) {
  return (
    <>
      <div className={`scrim ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <nav className={`sidebar ${open ? "is-open" : ""}`} aria-label="Chapters">
        <div className="sidebar-head">
          <span className="sidebar-title">Contents</span>
          <button type="button" className="icon-button close-button" onClick={onClose} aria-label="Close chapter list">
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
