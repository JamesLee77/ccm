import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import TrinityCards from "./trinity/TrinityCards";
import TrinityRelations from "./trinity/TrinityRelations";
import UnitConverter from "./trinity/UnitConverter";
import BitcoinAnalogue from "./trinity/BitcoinAnalogue";

export default function Trinity() {
  const { t } = useTranslation("earth");
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
      <TrinityCards />

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
