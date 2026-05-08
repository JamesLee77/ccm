import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";

export default function Architecture() {
  const { t } = useTranslation("earth");
  const layers = t("arch.layers", { returnObjects: true }) as [string, string, string][];
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
        className="font-body text-ink-soft mb-16"
        style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 720 }}
      >
        {t("arch.lead")}
      </p>
      <div className="border border-rule" style={{ background: "var(--paper-deep)" }}>
        {layers.map(([id, name, desc], i) => (
          <div
            key={id}
            className="grid items-center hover:bg-paper transition-colors"
            style={{
              gridTemplateColumns: "80px 280px 1fr",
              padding: "24px 32px",
              borderBottom:
                i < layers.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <div className="font-mono text-[12px] tracking-[0.16em] uppercase text-moss">
              {id}
            </div>
            <div
              className="font-display text-ink"
              style={{ fontSize: 20, letterSpacing: "-0.01em" }}
            >
              {name}
            </div>
            <div
              className="font-body text-ink-soft"
              style={{ fontSize: 16, lineHeight: 1.55 }}
            >
              {desc}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
