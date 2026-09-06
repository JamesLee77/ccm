import { useTranslation } from "react-i18next";
import { PageHero } from "../components/site/PageSection";
import ChapterRail from "../components/site/ChapterRail";
import Trinity from "../sections/earth/Trinity";
import WrapSim from "../sections/earth/WrapSim";
import Grades from "../sections/earth/Grades";
import Architecture from "../sections/earth/Architecture";
import Mining from "../sections/earth/Mining";
import Risks from "../sections/earth/Risks";

const RAIL = [
  { id: "trinity", label: "trinity" },
  { id: "wrap", label: "wrap" },
  { id: "grades", label: "grades" },
  { id: "arch", label: "architecture" },
  { id: "mining", label: "ccmine" },
  { id: "risks", label: "risks" },
];

export default function Protocol() {
  const { t } = useTranslation("home");
  return (
    <>
      <PageHero
        pre={t("pages.protocol.pre")}
        em={t("pages.protocol.em")}
        lead={t("pages.protocol.lead")}
      />
      <ChapterRail items={RAIL} />
      <Trinity />
      <WrapSim />
      <Grades />
      <Architecture />
      <Mining />
      <Risks />
    </>
  );
}
