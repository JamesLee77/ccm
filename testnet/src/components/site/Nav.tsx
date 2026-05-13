import { useTranslation } from "react-i18next";
import Wordmark from "../brand/Wordmark";
import ThemeToggle from "./ThemeToggle";
import CarbonPriceBadge from "../marketing/CarbonPriceBadge";
import AnchorNav from "./AnchorNav";

export default function Nav() {
  const { t } = useTranslation();
  return (
    <header className="r-nav">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Wordmark size={28} />
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
          {t("nav.title")}
        </span>
      </div>
      <AnchorNav />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <CarbonPriceBadge />
        <ThemeToggle />
      </div>
    </header>
  );
}
