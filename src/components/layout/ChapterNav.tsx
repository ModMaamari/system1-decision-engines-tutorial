import type { Chapter } from "../../content/chapters";
import { Icon } from "../Icon";

interface ChapterNavProps {
  prev: Chapter | null;
  next: Chapter | null;
  isComplete: boolean;
  onToggleComplete: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ChapterNav({ prev, next, isComplete, onToggleComplete, onPrev, onNext }: ChapterNavProps) {
  return (
    <footer className="chapter-footer">
      <div className="complete-row">
        <button
          type="button"
          className={`complete-button ${isComplete ? "is-done" : ""}`}
          onClick={onToggleComplete}
          aria-pressed={isComplete}
        >
          <span className="complete-check" aria-hidden="true">
            {isComplete && <Icon name="check" size={14} />}
          </span>
          {isComplete ? "Chapter completed" : "Mark chapter as complete"}
        </button>
        <span className="keyboard-hint">
          <kbd>←</kbd> <kbd>→</kbd> to move between chapters
        </span>
      </div>
      <nav className="chapter-nav" aria-label="Previous and next chapter">
        {prev ? (
          <a
            className="nav-card prev"
            href={`#/${prev.id}`}
            onClick={(e) => {
              e.preventDefault();
              onPrev();
            }}
          >
            <span className="nav-dir">
              <Icon name="arrowLeft" size={15} /> Previous
            </span>
            <span className="nav-title">{prev.title}</span>
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a
            className="nav-card next"
            href={`#/${next.id}`}
            onClick={(e) => {
              e.preventDefault();
              onNext();
            }}
          >
            <span className="nav-dir">
              Next <Icon name="arrowRight" size={15} />
            </span>
            <span className="nav-title">{next.title}</span>
          </a>
        ) : (
          <span />
        )}
      </nav>
    </footer>
  );
}
