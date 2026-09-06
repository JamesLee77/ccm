
type ReadOut = {
  id: string;
  label: string;
  value: number | string;
  step?: [number, number];
  format?: (n: number) => string;
};

const READOUTS: ReadOut[] = [
  { id: "phase", label: "Phase 1 progress", value: "42%" },
  {
    id: "milestones",
    label: "Milestones completed",
    value: 14,
    step: [0, 1],
  },
  {
    id: "next",
    label: "Days until phase 2",
    value: 78,
    step: [0, 0], // displays static; updated nightly server-side
  },
  {
    id: "contributors",
    label: "Active contributors",
    value: 23,
    step: [0, 0],
  },
];


export default function LiveProgress() {
  const values = READOUTS.map((r) => (typeof r.value === "number" ? r.value : 0));


  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          model · illustrative · execution
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto">
          ledger updated nightly
        </span>
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: "var(--rule)",
        }}
      >
        {READOUTS.map((r, i) => {
          const display =
            typeof r.value === "number"
              ? (r.format ? r.format(values[i] ?? 0) : (values[i] ?? 0).toLocaleString())
              : r.value;
          return (
            <div
              key={r.id}
              style={{ background: "var(--paper-deep)", padding: "20px 24px" }}
            >
              <div
                className="font-display text-ink"
                style={{
                  fontSize: 36,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                {display}
              </div>
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft mt-2">
                {r.label}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes lp-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .lp-pulse { animation: lp-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lp-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
