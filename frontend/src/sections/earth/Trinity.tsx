import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import TrinityRelations from "./trinity/TrinityRelations";
import UnitConverter from "./trinity/UnitConverter";
import BitcoinAnalogue from "./trinity/BitcoinAnalogue";

type Item = { n: string; h: string; s: string; b: string };

export default function Trinity() {
  const { t } = useTranslation("earth");
  const items = t("trinity.items", { returnObjects: true }) as Item[];
  return (
    <Section id="trinity">
      <SectionLabel>{t("trinity.label")}</SectionLabel>
      <h2
        className="font-display text-ink mt-8 mb-20"
        style={{
          fontWeight: 300,
          fontSize: "clamp(40px, 5vw, 64px)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          maxWidth: 900,
          margin: "32px 0 80px",
        }}
      >
        {t("trinity.h1Pre")}
        <br />a <em className="italic-moss">{t("trinity.h1EmA")}</em>, a{" "}
        <em className="italic-moss">{t("trinity.h1EmB")}</em>, a{" "}
        <em className="italic-moss">{t("trinity.h1EmC")}</em>.
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((c) => (
          <div
            key={c.n}
            className="border border-rule transition-transform hover:-translate-y-1"
            style={{
              background: "var(--paper-deep)",
              padding: "40px 32px",
              minHeight: 320,
            }}
          >
            <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-moss">
              {c.n}
            </div>
            <div
              className="font-display text-ink mt-4"
              style={{ fontSize: 36, letterSpacing: "-0.02em" }}
            >
              {c.h}
            </div>
            <div
              className="font-body italic text-moss mt-1 mb-6"
              style={{ fontSize: 15 }}
            >
              {c.s}
            </div>
            <div
              className="font-body text-ink-soft"
              style={{ fontSize: 16, lineHeight: 1.55 }}
            >
              {c.b}
            </div>
          </div>
        ))}
      </div>

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("trinity.relationsLabel")}
      </div>
      <TrinityRelations />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("trinity.converterLabel")}
      </div>
      <UnitConverter />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("trinity.bitcoinLabel")}
      </div>
      <BitcoinAnalogue />
    </Section>
  );
}
