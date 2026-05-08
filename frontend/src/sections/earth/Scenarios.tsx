import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import ScenarioCurve from "./scenarios/ScenarioCurve";
import AssumptionsMatrix from "./scenarios/AssumptionsMatrix";
import CapitalReturns from "./scenarios/CapitalReturns";

export default function Scenarios() {
  const { t } = useTranslation("earth");
  const tgeCols = t("scenarios.tge.cols", { returnObjects: true }) as string[];
  const tgeRows = t("scenarios.tge.rows", { returnObjects: true }) as string[][];
  const priceCols = t("scenarios.price.cols", { returnObjects: true }) as string[];
  const priceRows = t("scenarios.price.rows", { returnObjects: true }) as string[][];
  const assumptions = t("scenarios.price.assumptions", { returnObjects: true }) as [string, string][];

  return (
    <Section id="scenarios">
      <SectionLabel>{t("scenarios.label")}</SectionLabel>
      <Heading
        pre={t("scenarios.h1Pre")}
        em={t("scenarios.h1Em")}
        maxWidth={900}
        className="mt-8 mb-12"
      />

      {/* TGE structure */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5">
        {t("scenarios.tge.label")}
      </div>
      <div className="border border-rule mb-16" style={{ background: "var(--paper-deep)" }}>
        <div
          className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
          style={{
            gridTemplateColumns: "repeat(6, 1fr)",
            padding: "16px 24px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          {tgeCols.map((c, i) => (
            <div key={i}>{c}</div>
          ))}
        </div>
        {tgeRows.map((row, i) => (
          <div
            key={i}
            className="grid items-center hover:bg-paper transition-colors"
            style={{
              gridTemplateColumns: "repeat(6, 1fr)",
              padding: "20px 24px",
              borderBottom:
                i < tgeRows.length - 1 ? "1px solid var(--rule)" : "none",
              fontWeight: i === tgeRows.length - 1 ? 600 : undefined,
            }}
          >
            {row.map((cell, ci) => (
              <div
                key={ci}
                className={ci === 0 ? "font-display text-ink" : "font-mono text-ink-soft"}
                style={{ fontSize: ci === 0 ? 18 : 14 }}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Price scenarios */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5">
        {t("scenarios.price.label")}
      </div>
      <div className="border border-rule" style={{ background: "var(--paper-deep)" }}>
        <div
          className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
          style={{
            gridTemplateColumns: "repeat(6, 1fr)",
            padding: "16px 24px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          {priceCols.map((c, i) => (
            <div key={i}>{c}</div>
          ))}
        </div>
        {priceRows.map((row, i) => (
          <div
            key={i}
            className="grid items-center hover:bg-paper transition-colors"
            style={{
              gridTemplateColumns: "repeat(6, 1fr)",
              padding: "20px 24px",
              borderBottom:
                i < priceRows.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            {row.map((cell, ci) => (
              <div
                key={ci}
                className={
                  ci === 0
                    ? "font-display text-ink"
                    : ci === row.length - 1
                      ? "font-mono text-moss"
                      : "font-mono text-ink"
                }
                style={{ fontSize: ci === 0 ? 18 : 14 }}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Assumptions */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        {assumptions.map(([label, body]) => (
          <div
            key={label}
            className="border border-rule"
            style={{ background: "var(--paper-deep)", padding: "20px 24px" }}
          >
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-2">
              {label}
            </div>
            <div className="font-body text-ink-soft" style={{ fontSize: 14, lineHeight: 1.55 }}>
              {body}
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div
        className="mt-10 p-5 border-l-2 font-body text-ink-soft"
        style={{
          borderColor: "var(--clay)",
          background: "var(--paper-deep)",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {t("scenarios.disclaimer")}
      </div>

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("scenarios.curveLabel")}
      </div>
      <ScenarioCurve />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("scenarios.assumptionsLabel")}
      </div>
      <AssumptionsMatrix />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("scenarios.returnsLabel")}
      </div>
      <CapitalReturns />
    </Section>
  );
}
