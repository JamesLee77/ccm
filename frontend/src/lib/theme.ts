import { createContext, useContext } from "react";
import type { Theme } from "./tokens";

export type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
  set: (t: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
