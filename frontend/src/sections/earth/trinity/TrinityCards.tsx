import { useTranslation } from "react-i18next";

type Item = { n: string; h: string; s: string; b: string };

/**
 * Network · Unit · Token cards. Shared by the home §03 chapter and the
 * full Trinity section on /protocol.
 */
export default function TrinityCards() {
  const { t } = useTranslation("earth");
  const items = t("trinity.items", { returnObjects: true }) as Item[];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {items.map((c) => (
        <div
          key={c.n}
          className="border border-rule transition-transform hover:-translate-y-1"
          style={{
            background: "var(--panel, var(--paper-deep))",
            padding: "40px 32px",
            minHeight: 320,
          }}
        >
          <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-moss">
            {c.n}
          </div>
          <div
            className="font-display text-ink mt-4"
            style={{ fontSize: 36, letterSpacing: "-0.02em" }}
          >
            {c.h}
          </div>
          <div
            className="font-mono text-moss mt-1 mb-6"
            style={{ fontSize: 13, letterSpacing: "0.04em" }}
          >
            {c.s}
          </div>
          <div
            className="font-body text-ink-soft"
            style={{ fontSize: 16, lineHeight: 1.55 }}
          >
            {c.b}
          </div>
        </div>
      ))}
    </div>
  );
}
