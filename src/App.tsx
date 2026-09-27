import { useCallback, useEffect, useState } from "react";
import { CHAPTERS, DEFAULT_CHAPTER, getChapter } from "./content/chapters";
import { ChapterView } from "./components/layout/ChapterView";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { useHashRoute } from "./hooks/useHashRoute";
import { useTheme } from "./hooks/useTheme";

const isChapter = (id: string) => CHAPTERS.some((c) => c.id === id);

export default function App() {
  const { theme, toggle } = useTheme();
  const [route, navigate] = useHashRoute(isChapter, DEFAULT_CHAPTER);
  const [menuOpen, setMenuOpen] = useState(false);
  const chapter = getChapter(route) ?? CHAPTERS[0];

  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
      />
      <div className="app-body">
        <Sidebar
          current={chapter.id}
          open={menuOpen}
          completed={new Set()}
          onNavigate={navigate}
          onClose={closeMenu}
        />
        <main id="main" className="main" tabIndex={-1}>
          <ChapterView key={chapter.id} chapter={chapter} />
        </main>
      </div>
    </div>
  );
}
