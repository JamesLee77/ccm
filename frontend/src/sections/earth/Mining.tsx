import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import MiningNetwork from "./mining/MiningNetwork";
import IssuanceFlow from "./mining/IssuanceFlow";
import RoleCards from "./mining/RoleCards";
import Economics from "./mining/Economics";
import LiveMetrics from "./mining/LiveMetrics";

export default function Mining() {
  const { t } = useTranslation("earth");
  return (
    <Section id="mining">
      <SectionLabel>{t("mining.label")}</SectionLabel>

      {/* Hero — heading + lead + animated mining hub */}
      <div
        className="grid items-end mt-8 mb-12 grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr] md:gap-16"
      >
        <div>
          <Heading pre={t("mining.h1Pre")} em={t("mining.h1Em")} maxWidth={720} />
          <p
            className="font-body text-ink-soft mt-10"
            style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 640 }}
          >
            {t("mining.lead")}
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <MiningNetwork size={300} count={7} />
        </div>
      </div>

      {/* Issuance flow — 5 steps */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("mining.flowLabel")}
      </div>
      <IssuanceFlow />

      {/* 3 mining roles */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("mining.rolesLabel")}
      </div>
      <RoleCards />

      {/* Economics */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("mining.economicsLabel")}
      </div>
      <Economics />

      {/* Live metrics */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("mining.metricsLabel")}
      </div>
      <LiveMetrics />
    </Section>
  );
}
