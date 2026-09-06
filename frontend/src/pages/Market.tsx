import { useTranslation } from "react-i18next";
import { PageHero } from "../components/site/PageSection";
import ChapterRail from "../components/site/ChapterRail";
import MarketContext from "../sections/earth/market/MarketContext";
import MarketSection from "../sections/earth/Market";
import Problem from "../sections/earth/Problem";
import Vs from "../sections/earth/Vs";

const RAIL = [
  { id: "context", label: "atmosphere" },
  { id: "market", label: "market" },
  { id: "problem", label: "what broke" },
  { id: "vs", label: "differentiation" },
];

export default function Market() {
  const { t } = useTranslation("home");
  return (
    <>
      <PageHero
        pre={t("pages.market.pre")}
        em={t("pages.market.em")}
        lead={t("pages.market.lead")}
      />
      <ChapterRail items={RAIL} />
      <MarketContext />
      <MarketSection />
      <Problem />
      <Vs />
    </>
  );
}
