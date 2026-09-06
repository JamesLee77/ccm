import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import FailureGrid from "./problem/FailureGrid";
import MarketEvidence from "./problem/MarketEvidence";
import PriceDisparity from "./problem/PriceDisparity";
import CostsLive from "./problem/CostsLive";

export default function Problem() {
  const { t } = useTranslation("earth");
  return (
    <Section id="problem">
      <SectionLabel>{t("problem.label")}</SectionLabel>
      <h2
        className="font-display text-ink mt-8 mb-12"
        style={{
          fontWeight: 300,
          fontSize: "clamp(40px, 5vw, 64px)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          maxWidth: 900,
        }}
      >
        {t("problem.h1Pre")}
        <br />
        <em className="italic-moss">{t("problem.h1Em")}</em>
      </h2>

      <FailureGrid />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("problem.evidenceLabel")}
      </div>
      <MarketEvidence />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("problem.disparityLabel")}
      </div>
      <PriceDisparity />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("problem.costsLabel")}
      </div>
      <CostsLive />
    </Section>
  );
}
