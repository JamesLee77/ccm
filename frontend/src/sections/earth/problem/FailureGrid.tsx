import { useTranslation } from "react-i18next";

/**
 * The four market failures — inverted ink block, 4-up on desktop.
 * Shared by the home §02 chapter and the full Problem section on /market.
 */
export default function FailureGrid() {
  const { t } = useTranslation("earth");
  const items = t("problem.items", { returnObjects: true }) as [string, string][];
  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        padding: "48px 40px",
      }}
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        style={{ gap: 1, background: "rgba(255,255,255,0.06)" }}
      >
        {items.map(([h, b], i) => (
          <div
            key={i}
            style={{ background: "var(--ink)", padding: "32px 28px", color: "var(--paper)" }}
          >
            <div className="font-mono text-[12px] tracking-[0.12em] uppercase text-moss mb-3">
              FAIL · {String(i + 1).padStart(2, "0")}
            </div>
            <div
              className="font-display mb-4"
              style={{ fontSize: 32, letterSpacing: "-0.02em", color: "var(--paper)" }}
            >
              {h}
            </div>
            <div
              className="font-body"
              style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)", opacity: 0.95 }}
            >
              {b}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
