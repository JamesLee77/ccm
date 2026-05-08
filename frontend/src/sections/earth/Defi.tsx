import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";

export default function Defi() {
  const { t } = useTranslation("earth");
  const items = t("defi.items", { returnObjects: true }) as [string, string, string][];
  return (
    <Section id="defi">
      <SectionLabel>{t("defi.label")}</SectionLabel>
      <Heading
        pre={t("defi.h1Pre")}
        em={t("defi.h1Em")}
        maxWidth={900}
        className="mt-8 mb-6"
      />
      <p
        className="font-body text-ink-soft mb-16"
        style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 720 }}
      >
        {t("defi.lead")}
      </p>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: "var(--rule)",
          border: "1px solid var(--rule)",
        }}
      >
        {items.map(([num, h, b]) => (
          <div
            key={num}
            className="hover:bg-paper transition-colors"
            style={{ background: "var(--paper-deep)", padding: "32px 28px", minHeight: 200 }}
          >
            <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-moss mb-3">
              § {num}
            </div>
            <div
              className="font-display text-ink mb-3"
              style={{ fontSize: 24, letterSpacing: "-0.015em" }}
            >
              {h}
            </div>
            <div
              className="font-body text-ink-soft"
              style={{ fontSize: 14, lineHeight: 1.55 }}
            >
              {b}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
