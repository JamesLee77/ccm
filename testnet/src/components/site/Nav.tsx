import { useTranslation } from "react-i18next";
import Wordmark from "../brand/Wordmark";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  const { t } = useTranslation();
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 24px", borderBottom: "1px solid var(--rule)",
      background: "var(--paper)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Wordmark size={28} />
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
          {t("nav.title")}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <ThemeToggle />
      </div>
    </header>
  );
}
