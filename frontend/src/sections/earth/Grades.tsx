import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import GradeRadar from "./grades/GradeRadar";
import GradeProjects from "./grades/GradeProjects";
import GradePriceLive from "./grades/GradePriceLive";

const SWATCHES = [
  { bg: "#0c0f10", fg: "#f5f3ec" },
  { bg: "#3D5A3A", fg: "#F0EEE9" },
  { bg: "#6E8A5A", fg: "#1A1D1A" },
  { bg: "#C9C4B6", fg: "#1A1D1A" },
];

export default function Grades() {
  const { t } = useTranslation("earth");
  const rows = t("grades.rows", { returnObjects: true }) as [string, string, string, string][];
  const cols = t("grades.cols", { returnObjects: true }) as string[];
  return (
    <Section id="grades">
      <SectionLabel>{t("grades.label")}</SectionLabel>
      <Heading
        pre={t("grades.h1Pre")}
        em={t("grades.h1Em")}
        maxWidth={900}
        className="mt-12 mb-16"
      />
      <div className="border border-rule" style={{ background: "var(--paper-deep)" }}>
        <div
          className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
          style={{
            gridTemplateColumns: "120px 2fr 1fr 1fr",
            padding: "16px 32px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          {cols.map((c, i) => (
            <div key={i}>{c}</div>
          ))}
        </div>
        {rows.map(([g, m, dur, vvb], i) => {
          const sw = SWATCHES[i] ?? SWATCHES[0]!;
          return (
            <div
              key={g}
              className="grid items-center hover:bg-paper transition-colors"
              style={{
                gridTemplateColumns: "120px 2fr 1fr 1fr",
                padding: "28px 32px",
                borderBottom:
                  i < rows.length - 1 ? "1px solid var(--rule)" : "none",
              }}
            >
              <div
                className="font-display"
                style={{
                  width: 64,
                  height: 64,
                  background: sw.bg,
                  color: sw.fg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                }}
              >
                {g}
              </div>
              <div className="font-display text-ink" style={{ fontSize: 22 }}>
                CCM-{g} · {m}
              </div>
              <div className="font-mono text-[12px] tracking-[0.06em] text-ink-soft">{dur}</div>
              <div className="font-mono text-[12px] tracking-[0.06em] text-ink-soft">vvb {vvb}</div>
            </div>
          );
        })}
      </div>

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("grades.radarLabel")}
      </div>
      <GradeRadar />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("grades.projectsLabel")}
      </div>
      <GradeProjects />

      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("grades.priceLabel")}
      </div>
      <GradePriceLive />
    </Section>
  );
}
