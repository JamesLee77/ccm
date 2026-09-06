import { useTranslation } from "react-i18next";
import { PageHero } from "../components/site/PageSection";
import Roadmap from "../sections/earth/Roadmap";

export default function RoadmapPage() {
  const { t } = useTranslation("home");
  return (
    <>
      <PageHero
        pre={t("pages.roadmap.pre")}
        em={t("pages.roadmap.em")}
        lead={t("pages.roadmap.lead")}
      />
      <Roadmap />
    </>
  );
}
