
type ReadOut = {
  id: string;
  label: string;
  value: number | string;
  step?: [number, number];
  format?: (n: number) => string;
};

const READOUTS: ReadOut[] = [
  {
    id: "vcm",
    label: "VCM volume (24h)",
    value: 12_400_000,
    step: [4000, 24000],
    format: (n) => `$${(n / 1_000_000).toFixed(2)}M`,
  },
  { id: "spread", label: "CCM-A vs CCM-D spread", value: "30×" },
  {
    id: "retired",
    label: "Tonnes retired (24h)",
    value: 8420,
    step: [4, 24],
    format: (n) => n.toLocaleString(),
  },
  { id: "buyers", label: "Active corporate buyers", value: 1184, step: [0, 1] },
];


export default function MarketLive() {
  const values = READOUTS.map((r) => (typeof r.value === "number" ? r.value : 0));

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          model · illustrative · market
        </span>
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--rule)" }}
      >
        {READOUTS.map((r, i) => {
          const display =
            typeof r.value === "number"
              ? (r.format ? r.format(values[i] ?? 0) : (values[i] ?? 0).toLocaleString())
              : r.value;
          return (
            <div key={r.id} style={{ background: "var(--paper-deep)", padding: "20px 24px" }}>
              <div
                className="font-display text-ink"
                style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em" }}
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
        @keyframes ml-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .ml-pulse { animation: ml-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ml-pulse { animation: none !important; } }
      `}</style>
    </div>
  );
}
