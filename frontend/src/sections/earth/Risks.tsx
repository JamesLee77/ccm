import { useState } from "react";
import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import { RiskMatrix, MitigationDetail } from "./risks/RiskMatrix";
import DefenseInDepth from "./risks/DefenseInDepth";
import DisputeFlow from "./risks/DisputeFlow";
import InsuranceLedger from "./risks/InsuranceLedger";

export default function Risks() {
  const { t } = useTranslation("earth");
  const [active, setActive] = useState<string>("verification");

  return (
    <Section id="risks">
      <SectionLabel>{t("risks.label")}</SectionLabel>
      <Heading
        pre={t("risks.h1Pre")}
        em={t("risks.h1Em")}
        maxWidth={900}
        className="mt-12 mb-16"
      />
      <p
        className="font-body text-ink-soft mb-12"
        style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 720 }}
      >
        {t("risks.lead")}
      </p>

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5">
        {t("risks.matrixLabel")}
      </div>
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <RiskMatrix active={active} onActive={setActive} />
        <MitigationDetail active={active} />
      </div>

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("risks.defenseLabel")}
      </div>
      <DefenseInDepth />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("risks.disputeLabel")}
      </div>
      <DisputeFlow />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("risks.insuranceLabel")}
      </div>
      <InsuranceLedger />
    </Section>
  );
}
