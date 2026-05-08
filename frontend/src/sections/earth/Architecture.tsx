import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import StackDiagram from "./architecture/StackDiagram";
import DataFlow from "./architecture/DataFlow";
import ContractMap from "./architecture/ContractMap";
import Composability from "./architecture/Composability";
import SecurityCards from "./architecture/SecurityCards";

export default function Architecture() {
  const { t } = useTranslation("earth");
  return (
    <Section id="arch">
      <SectionLabel>{t("arch.label")}</SectionLabel>
      <Heading
        pre={t("arch.h1Pre")}
        em={t("arch.h1Em")}
        maxWidth={900}
        className="mt-8 mb-6"
      />
      <p
        className="font-body text-ink-soft mb-12"
        style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 720 }}
      >
        {t("arch.lead")}
      </p>

      {/* Interactive 8-layer stack */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5">
        {t("arch.stackLabel")}
      </div>
      <StackDiagram />

      {/* Data flow */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("arch.dataflowLabel")}
      </div>
      <DataFlow />

      {/* Contract map */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("arch.contractsLabel")}
      </div>
      <ContractMap />

      {/* Composability */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("arch.composabilityLabel")}
      </div>
      <Composability />

      {/* Security */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("arch.securityLabel")}
      </div>
      <SecurityCards />
    </Section>
  );
}
