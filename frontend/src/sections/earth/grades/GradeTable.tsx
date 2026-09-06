import { useTranslation } from "react-i18next";

const SWATCHES = [
  { bg: "#0c0f10", fg: "#f5f3ec" },
  { bg: "#3D5A3A", fg: "#F0EEE9" },
  { bg: "#6E8A5A", fg: "#1A1D1A" },
  { bg: "#C9C4B6", fg: "#1A1D1A" },
];

/**
 * CCM-A … CCM-D grade table — full table on desktop, stacked cards on
 * phones. Shared by the home §05 chapter and the Grades section on /protocol.
 */
export default function GradeTable() {
  const { t } = useTranslation("earth");
  const rows = t("grades.rows", { returnObjects: true }) as [string, string, string, string][];
  const cols = t("grades.cols", { returnObjects: true }) as string[];
  return (
    <>
      {/* Desktop: full table */}
      <div
        className="border border-rule hidden md:block"
        style={{ background: "var(--panel, var(--paper-deep))" }}
      >
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
                borderBottom: i < rows.length - 1 ? "1px solid var(--rule)" : "none",
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
      {/* Mobile: stacked grade cards */}
      <div
        className="md:hidden border border-rule"
        style={{ background: "var(--panel, var(--paper-deep))" }}
      >
        {rows.map(([g, m, dur, vvb], i) => {
          const sw = SWATCHES[i] ?? SWATCHES[0]!;
          return (
            <div
              key={g}
              style={{
                padding: "20px",
                borderBottom: i < rows.length - 1 ? "1px solid var(--rule)" : "none",
              }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="font-display flex-shrink-0"
                  style={{
                    width: 56,
                    height: 56,
                    background: sw.bg,
                    color: sw.fg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                  }}
                >
                  {g}
                </div>
                <div className="font-display text-ink" style={{ fontSize: 18, lineHeight: 1.25 }}>
                  CCM-{g} · {m}
                </div>
              </div>
              <div
                className="grid grid-cols-2 gap-3 mt-3 pt-3"
                style={{ borderTop: "1px solid var(--rule)" }}
              >
                <div>
                  <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-moss mb-1">
                    {cols[2]}
                  </div>
                  <div className="font-mono text-[12px] text-ink-soft">{dur}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-moss mb-1">
                    {cols[3]}
                  </div>
                  <div className="font-mono text-[12px] text-ink-soft">vvb {vvb}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
