import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ThemeContext } from "../../lib/theme";
import type { Theme } from "../../lib/tokens";

const STORAGE_KEY = "ccm-theme";
const DEFAULT_THEME: Theme = "dark";

function readInitial(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  // 1. Explicit data-theme already on <html> (set by the bootstrap script in index.html)
  const attr = document.documentElement.dataset.theme;
  if (attr === "dark" || attr === "light") return attr;
  // 2. Previously stored user toggle
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable
  }
  // 3. Site default
  return DEFAULT_THEME;
}

type Props = {
  children: ReactNode;
  /** Force a theme regardless of user preference (e.g. dark-only routes). */
  force?: Theme;
};

export default function ThemeProvider({ children, force }: Props) {
  const [theme, setTheme] = useState<Theme>(() => force ?? readInitial());

  useEffect(() => {
    if (force) {
      document.documentElement.dataset.theme = force;
      setTheme(force);
      return;
    }
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable — ignore.
    }
  }, [theme, force]);

  const toggle = useCallback(() => {
    if (force) return;
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, [force]);

  const set = useCallback(
    (t: Theme) => {
      if (force) return;
      setTheme(t);
    },
    [force],
  );

  const value = useMemo(
    () => ({ theme, isDark: theme === "dark", toggle, set }),
    [theme, toggle, set],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
