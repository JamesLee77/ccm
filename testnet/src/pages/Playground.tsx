import { useTranslation } from "react-i18next";

export default function Playground() {
  const { t } = useTranslation();
  return (
    <main style={{ padding: 24 }}>
      <h1>{t("hero.headline")}</h1>
      <p>{t("hero.tagline")}</p>
      <p style={{ color: "orange" }}>{t("hero.warning")}</p>
      <p>(scaffold ok — step cards arrive in later tasks)</p>
    </main>
  );
}
