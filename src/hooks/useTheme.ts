import { useCallback, useEffect, useState } from "react";
import { readStored, writeStored } from "../lib/storage";

export type Theme = "light" | "dark";

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function initialTheme(): Theme {
  const stored = readStored<Theme | null>("theme", null);
  return stored === "light" || stored === "dark" ? stored : systemTheme();
}

/** The active colour theme, applied as `data-theme` on <html> and remembered once chosen. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      writeStored("theme", next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
