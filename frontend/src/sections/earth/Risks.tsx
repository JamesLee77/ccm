import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";

export default function Risks() {
  const { t } = useTranslation("earth");
  const cols = t("risks.cols", { returnObjects: true }) as string[];
  const rows = t("risks.rows", { returnObjects: true }) as [string, string, string][];
  return (
    <Section id="risks">
      <SectionLabel>{t("risks.label")}</SectionLabel>
      <Heading
        pre={t("risks.h1Pre")}
        em={t("risks.h1Em")}
        maxWidth={900}
        className="mt-8 mb-12"
      />
      <div className="border border-rule" style={{ background: "var(--paper-deep)" }}>
        <div
          className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
          style={{
            gridTemplateColumns: "0.6fr 1.4fr 2fr",
            padding: "16px 24px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          {cols.map((c, i) => (
            <div key={i}>{c}</div>
          ))}
        </div>
        {rows.map(([dom, risk, mit], i) => (
          <div
            key={dom}
            className="grid items-start hover:bg-paper transition-colors"
            style={{
              gridTemplateColumns: "0.6fr 1.4fr 2fr",
              padding: "20px 24px",
              borderBottom:
                i < rows.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <div className="font-mono text-[12px] tracking-[0.14em] uppercase text-clay">
              {dom}
            </div>
            <div className="font-body text-ink" style={{ fontSize: 15, lineHeight: 1.5 }}>
              {risk}
            </div>
            <div className="font-body text-ink-soft" style={{ fontSize: 14, lineHeight: 1.5 }}>
              {mit}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
