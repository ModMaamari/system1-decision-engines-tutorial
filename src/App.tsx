import { useCallback, useEffect, useMemo, useState } from "react";
import { CHAPTERS, DEFAULT_CHAPTER, chapterIndex, getChapter } from "./content/chapters";
import { CommandPalette } from "./components/CommandPalette";
import { Icon } from "./components/Icon";
import { ChapterNav } from "./components/layout/ChapterNav";
import { ChapterView } from "./components/layout/ChapterView";
import { ProgressBadge } from "./components/layout/ProgressBadge";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { useHashRoute } from "./hooks/useHashRoute";
import { isEditableTarget, useKeyboardNav } from "./hooks/useKeyboardNav";
import { useProgress } from "./hooks/useProgress";
import { useScrollProgress } from "./hooks/useScrollProgress";
import { useTheme } from "./hooks/useTheme";

const CHAPTER_IDS = CHAPTERS.map((c) => c.id);
const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const isChapter = (id: string) => CHAPTER_IDS.includes(id);

export default function App() {
  const { theme, toggle } = useTheme();
  const [route, navigate] = useHashRoute(isChapter, DEFAULT_CHAPTER);
  const { completed, markComplete, toggleComplete } = useProgress(CHAPTER_IDS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const scroll = useScrollProgress();

  const chapter = getChapter(route) ?? CHAPTERS[0];
  const index = chapterIndex(chapter.id);
  const prev = index > 0 ? CHAPTERS[index - 1] : null;
  const next = index < CHAPTERS.length - 1 ? CHAPTERS[index + 1] : null;

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const goPrev = useMemo(() => (prev ? () => navigate(prev.id) : null), [prev, navigate]);
  // Moving on with "Next" is the natural moment to count a chapter as read.
  const goNext = useMemo(
    () =>
      next
        ? () => {
            markComplete(chapter.id);
            navigate(next.id);
          }
        : null,
    [next, chapter.id, markComplete, navigate],
  );

  useKeyboardNav(searchOpen ? null : goPrev, searchOpen ? null : goNext);

  // Ctrl/Cmd+K anywhere, or "/" outside form fields, opens search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditableTarget(e.target)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.title = `${chapter.title} · System 1 Decision Engines`;
  }, [chapter]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <TopBar
        theme={theme}
        onToggleTheme={toggle}
        onOpenMenu={() => setMenuOpen(true)}
        onHome={() => navigate(DEFAULT_CHAPTER)}
      >
        <button
          type="button"
          className="search-button"
          onClick={() => setSearchOpen(true)}
          aria-label={`Search (${IS_MAC ? "Cmd" : "Ctrl"}+K)`}
        >
          <Icon name="search" size={16} />
          <span className="search-label">Search</span>
          <kbd className="search-kbd">{IS_MAC ? "⌘K" : "Ctrl K"}</kbd>
        </button>
        <ProgressBadge done={completed.size} total={CHAPTERS.length} />
      </TopBar>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={navigate} />
      <div className="reading-progress" aria-hidden="true">
        <div className="reading-progress-bar" style={{ transform: `scaleX(${scroll})` }} />
      </div>
      <div className="app-body">
        <Sidebar
          current={chapter.id}
          open={menuOpen}
          completed={completed}
          onNavigate={navigate}
          onClose={closeMenu}
        />
        <main id="main" className="main" tabIndex={-1}>
          <ChapterView
            key={chapter.id}
            chapter={chapter}
            footer={
              <ChapterNav
                prev={prev}
                next={next}
                isComplete={completed.has(chapter.id)}
                onToggleComplete={() => toggleComplete(chapter.id)}
                onPrev={() => goPrev?.()}
                onNext={() => goNext?.()}
              />
            }
          />
        </main>
      </div>
    </div>
  );
}
