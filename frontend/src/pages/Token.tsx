import { useTranslation } from "react-i18next";
import { PageHero } from "../components/site/PageSection";
import ChapterRail from "../components/site/ChapterRail";
import Tokenomics from "../sections/earth/Tokenomics";
import Scenarios from "../sections/earth/Scenarios";

const RAIL = [
  { id: "tokenomics", label: "tokenomics" },
  { id: "scenarios", label: "scenarios" },
];

export default function Token() {
  const { t } = useTranslation("home");
  return (
    <>
      <PageHero
        pre={t("pages.token.pre")}
        em={t("pages.token.em")}
        lead={t("pages.token.lead")}
      />
      <ChapterRail items={RAIL} />
      <Tokenomics />
      <Scenarios />
    </>
  );
}
