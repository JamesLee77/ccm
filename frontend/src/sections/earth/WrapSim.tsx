import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import WrapStudio from "./wrap/WrapStudio";
import VaultLedger from "./wrap/VaultLedger";
import WrapModes from "./wrap/WrapModes";
import GradeFlow from "./wrap/GradeFlow";
import InvariantTicker from "./wrap/InvariantTicker";

export default function WrapSim() {
  const { t } = useTranslation("earth");
  return (
    <Section id="wrap">
      <SectionLabel>{t("wrap.label")}</SectionLabel>
      <Heading
        pre={t("wrap.h1Pre")}
        em={t("wrap.h1Em")}
        maxWidth={900}
        className="mt-12 mb-16"
      />
      <p
        className="font-body text-ink-soft mb-12"
        style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 720 }}
      >
        {t("wrap.lead")}
      </p>

      {/* Wrap Studio — interactive demo */}
      <WrapStudio />

      {/* Vault state */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("wrap.vaultLabel")}
      </div>
      <VaultLedger />

      {/* Unwrap modes */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("wrap.modesLabel")}
      </div>
      <WrapModes />

      {/* FIFR */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("wrap.fifrLabel")}
      </div>
      <GradeFlow />

      {/* Invariant ticker */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("wrap.invariantLabel")}
      </div>
      <InvariantTicker />
    </Section>
  );
}
