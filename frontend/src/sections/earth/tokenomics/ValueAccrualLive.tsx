
type BurnSource = {
  id: string;
  label: string;
  /** Initial value in $CCM. */
  start: number;
  /** Increment range per tick. */
  step: [number, number];
};

const BURN_SOURCES: BurnSource[] = [
  { id: "retire", label: "Retire-to-Earn burn", start: 412300, step: [4, 22] },
  { id: "buyback", label: "Buy-back & burn", start: 187500, step: [0, 12] },
  { id: "vault", label: "Vault liquidation", start: 49100, step: [0, 5] },
];


export default function ValueAccrualLive() {
  const values = BURN_SOURCES.map((s) => s.start);


  const totalBurned = values.reduce((a, b) => a + b, 0);

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: "1.4fr 1fr", background: "var(--rule)" }}
    >
      {/* Value accrual flow */}
      <div
        style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
      >
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5">
          value accrual · 97% cash flow / 3% utility
        </div>

        <p
          className="font-body text-ink-soft mb-6"
          style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 540 }}
        >
          Marketplace fees and DeFi vault revenue accrue to veCCM stakers as
          direct cash yield. At a forecast{" "}
          <span className="text-ink font-medium">$1B annual volume (2030E)</span>,
          a 5% fee channels{" "}
          <span className="text-moss font-medium">~$30M/year</span> to lockers.
        </p>

        {/* flow visualization */}
        <svg width="100%" viewBox="0 0 560 140" style={{ display: "block" }}>
          <defs>
            <marker
              id="va-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10 Z" fill="var(--moss)" />
            </marker>
          </defs>

          {/* boxes */}
          {[
            { x: 0, label: "Marketplace fees", sub: "5% of volume" },
            { x: 200, label: "Protocol revenue", sub: "fee + DeFi yield" },
            { x: 400, label: "veCCM stakers", sub: "60% cash yield" },
          ].map((b) => (
            <g key={b.label}>
              <rect
                x={b.x}
                y={32}
                width={160}
                height={72}
                fill="var(--paper)"
                stroke="var(--rule)"
                strokeWidth={1}
              />
              <text
                x={b.x + 80}
                y={62}
                textAnchor="middle"
                fontFamily="Space Grotesk, system-ui, sans-serif"
                fontSize={14}
                fontWeight={500}
                fill="var(--ink)"
              >
                {b.label}
              </text>
              <text
                x={b.x + 80}
                y={82}
                textAnchor="middle"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={10}
                fill="var(--ink-soft)"
              >
                {b.sub}
              </text>
            </g>
          ))}

          {/* arrows */}
          <line
            x1={160}
            y1={68}
            x2={196}
            y2={68}
            stroke="var(--moss)"
            strokeWidth={1.6}
            markerEnd="url(#va-arrow)"
            className="va-flow"
          />
          <line
            x1={360}
            y1={68}
            x2={396}
            y2={68}
            stroke="var(--moss)"
            strokeWidth={1.6}
            markerEnd="url(#va-arrow)"
            className="va-flow va-flow-2"
          />
        </svg>

        <div
          className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-rule"
        >
          {[
            ["60%", "veCCM stakers"],
            ["25%", "Foundation Treasury"],
            ["15%", "VVB + Oracle pools"],
          ].map(([pct, label]) => (
            <div key={label}>
              <div
                className="font-display text-ink"
                style={{ fontSize: 22, fontWeight: 500 }}
              >
                {pct}
              </div>
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft mt-1">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live burn counter */}
      <div
        style={{ background: "var(--paper-deep)", padding: "32px 32px" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
            model · illustrative · burn ledger
          </span>
        </div>

        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          total $CCM burned
        </div>
        <div
          className="font-display text-ink mt-1 mb-6"
          style={{
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1,
          }}
        >
          {totalBurned.toLocaleString()}
        </div>

        <ul className="grid gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {BURN_SOURCES.map((s, i) => (
            <li
              key={s.id}
              className="grid items-baseline border-t border-rule pt-3"
              style={{ gridTemplateColumns: "1fr auto", gap: 12 }}
            >
              <span
                className="font-mono text-ink-soft"
                style={{ fontSize: 12 }}
              >
                {s.label}
              </span>
              <span
                className="font-mono text-ink"
                style={{ fontSize: 14, fontVariantNumeric: "tabular-nums" }}
              >
                {(values[i] ?? 0).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @keyframes va-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        @keyframes va-flow-anim {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .va-pulse { animation: va-pulse-anim 2s ease-in-out infinite; }
        .va-flow { animation: va-flow-anim 2.4s ease-in-out infinite; }
        .va-flow-2 { animation-delay: 0.6s; }
        @media (prefers-reduced-motion: reduce) {
          .va-pulse, .va-flow { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
