import { useTranslation } from "react-i18next";

export default function TestnetBanner() {
  const { t } = useTranslation();
  return (
    <div style={{
      background: "var(--warn)", color: "var(--paper)",
      padding: "8px 24px", fontSize: 13,
      textAlign: "center",
    }}>
      {t("hero.warning")}
    </div>
  );
}
