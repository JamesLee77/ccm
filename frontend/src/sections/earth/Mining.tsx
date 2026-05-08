import { useTranslation } from "react-i18next";
import NodeNetwork from "../../components/brand/NodeNetwork";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";

export default function Mining() {
  const { t } = useTranslation("earth");
  const roles = t("mining.roles", { returnObjects: true }) as [string, string][];
  return (
    <Section id="mining">
      <SectionLabel>{t("mining.label")}</SectionLabel>
      <div className="grid items-end mt-8 mb-12" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <Heading pre={t("mining.h1Pre")} em={t("mining.h1Em")} maxWidth={720} />
        <div className="flex justify-end">
          <NodeNetwork count={7} size={240} label="MINE" />
        </div>
      </div>
      <p
        className="font-body text-ink-soft mb-16"
        style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 720 }}
      >
        {t("mining.lead")}
      </p>
      <div className="grid grid-cols-3 gap-6">
        {roles.map(([role, desc]) => (
          <div
            key={role}
            className="border border-rule"
            style={{ background: "var(--paper-deep)", padding: "32px 28px" }}
          >
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-3">
              {role}
            </div>
            <div className="font-body text-ink" style={{ fontSize: 17, lineHeight: 1.5 }}>
              {desc}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
