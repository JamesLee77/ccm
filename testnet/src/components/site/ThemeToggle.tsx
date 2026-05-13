import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        background: "transparent",
        border: `1px solid var(--rule)`,
        color: "var(--ink)",
        padding: "6px 10px",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {theme === "light" ? "dark" : "light"}
    </button>
  );
}
