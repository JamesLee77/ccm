import { useTranslation } from "react-i18next";
import { PageHero } from "../components/site/PageSection";

export default function Roadmap() {
  const { t } = useTranslation("roadmap");
  return (
    <PageHero pre={t("h1Pre")} em={t("h1Em")} lead={t("lead")} />
  );
}
