import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import MarketShareTimeline from "./vs/MarketShareTimeline";
import MoatCards from "./vs/MoatCards";
import AdoptionLive from "./vs/AdoptionLive";

const renderCell = (value: string) => {
  if (value.startsWith("✓")) return <span className="text-moss font-medium">{value}</span>;
  if (value.startsWith("Frozen") || value === "Yes" || value.startsWith("동결"))
    return <span className="text-clay">{value}</span>;
  if (value === "—" || value.startsWith("—"))
    return <span className="text-ink-soft">{value}</span>;
  return <span>{value}</span>;
};

export default function Vs() {
  const { t } = useTranslation("earth");
  const cols = t("vs.cols", { returnObjects: true }) as string[];
  const rows = t("vs.rows", { returnObjects: true }) as string[][];
  return (
    <Section id="vs">
      <SectionLabel>{t("vs.label")}</SectionLabel>
      <Heading
        pre={t("vs.h1Pre")}
        em={t("vs.h1Em")}
        maxWidth={900}
        className="mt-12 mb-16"
      />
      <p
        className="font-body text-ink-soft mb-16"
        style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 720 }}
      >
        {t("vs.lead")}
      </p>
      {/* ≥ md (768): full comparison table with horizontal scroll fallback */}
      <div
        className="hidden md:block border border-rule overflow-x-auto"
        style={{ background: "var(--paper-deep)" }}
      >
        <div
          className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft min-w-[860px]"
          style={{
            gridTemplateColumns: "1.5fr repeat(4, 1fr)",
            padding: "16px 24px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          {cols.map((c, i) => (
            <div key={i} className={i === cols.length - 1 ? "text-moss" : ""}>
              {c}
            </div>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="grid items-center hover:bg-paper transition-colors min-w-[860px]"
            style={{
              gridTemplateColumns: "1.5fr repeat(4, 1fr)",
              padding: "20px 24px",
              borderBottom:
                ri < rows.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            {row.map((cell, ci) => (
              <div
                key={ci}
                className="font-mono text-ink"
                style={{ fontSize: ci === 0 ? 14 : 13 }}
              >
                {ci === 0 ? cell : renderCell(cell)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* < md (mobile): stacked card per dimension */}
      <div className="md:hidden grid gap-3">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="border border-rule"
            style={{ background: "var(--paper-deep)", padding: "18px 20px" }}
          >
            <div
              className="font-display text-ink mb-3"
              style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em" }}
            >
              {row[0]}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {row.slice(1).map((cell, ci) => (
                <li
                  key={ci}
                  className="grid items-baseline border-t border-rule"
                  style={{
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    padding: "10px 0",
                  }}
                >
                  <span
                    className="font-mono text-ink-soft"
                    style={{ fontSize: 11, letterSpacing: 1 }}
                  >
                    {cols[ci + 1]}
                  </span>
                  <span
                    className="font-mono text-ink"
                    style={{ fontSize: 12, textAlign: "right" }}
                  >
                    {renderCell(cell)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("vs.shareLabel")}
      </div>
      <MarketShareTimeline />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("vs.moatLabel")}
      </div>
      <MoatCards />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("vs.adoptionLabel")}
      </div>
      <AdoptionLive />
    </Section>
  );
}
