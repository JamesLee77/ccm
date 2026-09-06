import { useState } from "react";
import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import AllocationRing from "./tokenomics/AllocationRing";
import { AllocationTable } from "./tokenomics/AllocationPanel";
import EmissionCurve from "./tokenomics/EmissionCurve";
import VestingTimeline from "./tokenomics/VestingTimeline";
import UtilityCards from "./tokenomics/UtilityCards";
import ValueAccrualLive from "./tokenomics/ValueAccrualLive";

export default function Tokenomics() {
  const { t } = useTranslation("earth");
  const [active, setActive] = useState<string | null>(null);

  return (
    <Section id="tokenomics">
      <SectionLabel>{t("tokenomics.label")}</SectionLabel>

      {/* Hero — heading/lead + animated allocation ring */}
      <div
        className="grid items-center mt-8 mb-12 grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr] md:gap-16"
      >
        <div>
          <Heading
            pre={t("tokenomics.h1Pre")}
            em={t("tokenomics.h1Em")}
            maxWidth={720}
          />
          <p
            className="font-body text-ink-soft mt-10"
            style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 640 }}
          >
            {t("tokenomics.lead")}
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <AllocationRing active={active} onHover={setActive} />
        </div>
      </div>

      {/* Allocation table — synced with the ring above */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("tokenomics.allocationLabel")}
      </div>
      <AllocationTable active={active} onActive={setActive} />

      {/* Emission curve */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("tokenomics.emissionLabel")}
      </div>
      <EmissionCurve />

      {/* Vesting timeline */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("tokenomics.vestingLabel")}
      </div>
      <VestingTimeline />

      {/* Utility cards */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("tokenomics.utilityLabel")}
      </div>
      <UtilityCards />

      {/* Value accrual + live burn */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("tokenomics.accrualLabel")}
      </div>
      <ValueAccrualLive />
    </Section>
  );
}
