
type ReadOut = {
  id: string;
  label: string;
  /** Initial numeric value or fixed string. */
  value: number | string;
  step?: [number, number];
  format?: (n: number) => string;
};

const READOUTS: ReadOut[] = [
  {
    id: "premiums",
    label: "Premiums collected",
    value: 84200,
    step: [3, 18],
    format: (n) => `$${n.toLocaleString()}`,
  },
  {
    id: "claims",
    label: "Claims paid",
    value: 12450,
    step: [0, 4],
    format: (n) => `$${n.toLocaleString()}`,
  },
  {
    id: "reserve",
    label: "Reserve balance",
    value: 1_640_000,
    step: [0, 0],
    format: (n) => `$${(n / 1000).toFixed(0)}k`,
  },
  {
    id: "ratio",
    label: "Coverage ratio",
    value: "13.2×",
  },
];


export default function InsuranceLedger() {
  const values = READOUTS.map((r) => (typeof r.value === "number" ? r.value : 0));


  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          model · illustrative · insurance vault
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto">
          paper-deep collateral · USDC
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
        @keyframes il-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .il-pulse { animation: il-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .il-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
