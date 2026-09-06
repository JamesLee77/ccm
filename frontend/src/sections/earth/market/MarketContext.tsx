import { useTranslation } from "react-i18next";
import Section from "../../../components/site/Section";
import SectionLabel from "../../../components/site/SectionLabel";
import AtmosphericTimeline from "../hero/AtmosphericTimeline";
import WhyNow from "../hero/WhyNow";

/**
 * /market opener — the atmospheric CO₂ record and the three "why now"
 * reasons that used to sit under the home hero.
 */
export default function MarketContext() {
  const { t } = useTranslation("earth");
  return (
    <Section id="context">
      <SectionLabel>{t("context.label")}</SectionLabel>
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-12">
        {t("context.timelineLabel")}
      </div>
      <AtmosphericTimeline />
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("context.whyNowLabel")}
      </div>
      <WhyNow />
    </Section>
  );
}
