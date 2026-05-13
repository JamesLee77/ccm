import { useTranslation } from "react-i18next";
import TestnetLayout from "../components/site/TestnetLayout";

export default function Playground() {
  const { t } = useTranslation();
  return (
    <TestnetLayout>
      <section style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, lineHeight: 1.05, margin: 0 }}>{t("hero.headline")}</h1>
        <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 16 }}>{t("hero.tagline")}</p>
      </section>
      <section style={{ color: "var(--ink-soft)" }}>
        (Step cards arrive in later tasks.)
      </section>
    </TestnetLayout>
  );
}
