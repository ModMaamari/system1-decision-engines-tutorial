import type { ReactNode } from "react";
import { Icon } from "../Icon";
import type { Theme } from "../../hooks/useTheme";

interface TopBarProps {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenMenu: () => void;
  onHome: () => void;
  children?: ReactNode;
}

export function TopBar({ theme, onToggleTheme, onOpenMenu, onHome, children }: TopBarProps) {
  return (
    <header className="topbar">
      <button type="button" className="icon-button menu-button" onClick={onOpenMenu} aria-label="Open chapter list">
        <Icon name="menu" />
      </button>
      <a
        className="brand"
        href="#/intro"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
      >
        <span className="brand-mark" aria-hidden="true">
          <Icon name="zap" size={16} />
        </span>
        <span className="brand-text">
          System 1 <span className="brand-light">Decision Engines</span>
        </span>
      </a>
      <div className="topbar-spacer" />
      {children}
      <button
        type="button"
        className="icon-button"
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Light theme" : "Dark theme"}
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </button>
    </header>
  );
}
