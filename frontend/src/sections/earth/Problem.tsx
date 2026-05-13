import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import MarketEvidence from "./problem/MarketEvidence";
import PriceDisparity from "./problem/PriceDisparity";
import CostsLive from "./problem/CostsLive";

export default function Problem() {
  const { t } = useTranslation("earth");
  const items = t("problem.items", { returnObjects: true }) as [string, string][];
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

      {/* Inverted 4-failure grid as a self-contained block */}
      <div
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "48px 40px",
        }}
      >
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
          style={{ gap: 1, background: "rgba(255,255,255,0.06)" }}
        >
          {items.map(([h, b], i) => (
            <div
              key={i}
              style={{ background: "var(--ink)", padding: "32px 28px", color: "var(--paper)" }}
            >
              <div className="font-mono text-[12px] tracking-[0.12em] uppercase text-moss mb-3">
                FAIL · {String(i + 1).padStart(2, "0")}
              </div>
              <div
                className="font-display mb-4"
                style={{ fontSize: 32, letterSpacing: "-0.02em", color: "var(--paper)" }}
              >
                {h}
              </div>
              <div
                className="font-body"
                style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)", opacity: 0.95 }}
              >
                {b}
              </div>
            </div>
          ))}
        </div>
      </div>

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
