import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import GrowthCurve from "./market/GrowthCurve";
import TAMBreakdown from "./market/TAMBreakdown";
import MarketLive from "./market/MarketLive";

type Milestone = {
  year: string;
  value: string;
  note: string;
  highlight?: boolean;
};

export default function Market() {
  const { t } = useTranslation("earth");
  const milestones = t("market.milestones", { returnObjects: true }) as Milestone[];
  return (
    <Section id="market">
      <SectionLabel>{t("market.label")}</SectionLabel>
      <Heading
        pre={t("market.h1Pre")}
        em={t("market.h1Em")}
        maxWidth={900}
        className="mt-12 mb-16"
      />
      <p
        className="font-body text-ink-soft mb-16"
        style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 720 }}
      >
        {t("market.lead")}
      </p>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(120px, 1fr))`,
          background: "var(--rule)",
          gap: 1,
          border: "1px solid var(--rule)",
        }}
      >
        {milestones.map((m) => (
          <div
            key={m.year}
            style={{
              background: m.highlight ? "var(--ink)" : "var(--paper)",
              color: m.highlight ? "var(--paper)" : "var(--ink)",
              padding: "32px 24px",
            }}
          >
            <div
              className="font-mono text-[11px] tracking-[0.14em] uppercase mb-3"
              style={{ color: m.highlight ? "var(--moss-2)" : "var(--moss)" }}
            >
              {m.year}
            </div>
            <div
              className="font-display"
              style={{ fontSize: 48, fontWeight: 300, letterSpacing: "-0.025em", lineHeight: 1 }}
            >
              {m.value}
            </div>
            <div
              className="font-mono text-[10px] tracking-[0.1em] uppercase mt-3"
              style={{ color: m.highlight ? "var(--paper)" : "var(--ink-soft)", opacity: 0.85 }}
            >
              {m.note}
            </div>
          </div>
        ))}
      </div>

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("market.growthLabel")}
      </div>
      <GrowthCurve />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("market.tamLabel")}
      </div>
      <TAMBreakdown />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("market.liveLabel")}
      </div>
      <MarketLive />
    </Section>
  );
}
