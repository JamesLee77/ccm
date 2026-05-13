import { useTranslation } from "react-i18next";
import { setLang } from "../../lib/i18n";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language === "en" ? "en" : "ko";
  const next = current === "ko" ? "en" : "ko";
  return (
    <button
      onClick={() => setLang(next)}
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
      🌐 {current.toUpperCase()}
    </button>
  );
}
