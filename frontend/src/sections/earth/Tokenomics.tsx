import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";

export default function Tokenomics() {
  const { t } = useTranslation("earth");
  const cols = t("tokenomics.cols", { returnObjects: true }) as string[];
  const rows = t("tokenomics.rows", { returnObjects: true }) as [string, string, string, string][];
  const utility = t("tokenomics.utility.items", { returnObjects: true }) as string[];
  return (
    <Section id="tokenomics">
      <SectionLabel>{t("tokenomics.label")}</SectionLabel>
      <Heading
        pre={t("tokenomics.h1Pre")}
        em={t("tokenomics.h1Em")}
        maxWidth={900}
        className="mt-8 mb-6"
      />
      <p
        className="font-body text-ink-soft mb-16"
        style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 720 }}
      >
        {t("tokenomics.lead")}
      </p>

      <div className="grid gap-12" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Allocation table */}
        <div className="border border-rule" style={{ background: "var(--paper-deep)" }}>
          <div
            className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
            style={{
              gridTemplateColumns: "1.6fr 0.5fr 0.6fr 1.4fr",
              padding: "16px 24px",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            {cols.map((c, i) => (
              <div key={i}>{c}</div>
            ))}
          </div>
          {rows.map(([cat, pct, tokens, note], i) => (
            <div
              key={cat}
              className="grid items-center hover:bg-paper transition-colors"
              style={{
                gridTemplateColumns: "1.6fr 0.5fr 0.6fr 1.4fr",
                padding: "20px 24px",
                borderBottom:
                  i < rows.length - 1 ? "1px solid var(--rule)" : "none",
              }}
            >
              <div className="font-display text-ink" style={{ fontSize: 18 }}>
                {cat}
              </div>
              <div className="font-mono text-moss text-[14px]">{pct}</div>
              <div className="font-mono text-ink text-[14px]">{tokens}</div>
              <div className="font-body text-ink-soft" style={{ fontSize: 14 }}>
                {note}
              </div>
            </div>
          ))}
        </div>

        {/* Utility */}
        <div
          className="border border-rule"
          style={{ background: "var(--paper-deep)", padding: "32px 28px" }}
        >
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5">
            {t("tokenomics.utility.label")}
          </div>
          <ol className="font-body text-ink-soft" style={{ fontSize: 16, lineHeight: 1.7 }}>
            {utility.map((u, i) => (
              <li
                key={i}
                className="flex gap-3 py-2.5 border-t border-rule first:border-t-0"
              >
                <span className="font-mono text-[11px] text-moss tracking-[0.12em] pt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{u}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
