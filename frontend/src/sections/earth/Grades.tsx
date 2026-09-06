import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import GradeTable from "./grades/GradeTable";
import GradeRadar from "./grades/GradeRadar";
import GradeProjects from "./grades/GradeProjects";
import GradePriceLive from "./grades/GradePriceLive";

export default function Grades() {
  const { t } = useTranslation("earth");
  return (
    <Section id="grades">
      <SectionLabel>{t("grades.label")}</SectionLabel>
      <Heading
        pre={t("grades.h1Pre")}
        em={t("grades.h1Em")}
        maxWidth={900}
        className="mt-12 mb-16"
      />
      <GradeTable />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("grades.radarLabel")}
      </div>
      <GradeRadar />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("grades.projectsLabel")}
      </div>
      <GradeProjects />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("grades.priceLabel")}
      </div>
      <GradePriceLive />
    </Section>
  );
}
