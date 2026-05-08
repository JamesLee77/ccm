import { useState } from "react";

type FeeSlice = {
  pct: number;
  label: string;
  desc: string;
  color: string;
};

const SLICES: FeeSlice[] = [
  { pct: 60, label: "veCCM stakers", desc: "Lockers earn the bulk of protocol fee.", color: "var(--moss)" },
  { pct: 25, label: "Foundation Treasury", desc: "Standards body, audits, ecosystem grants.", color: "var(--moss-2)" },
  { pct: 10, label: "VVB network", desc: "Stake-bonded verifiers; slashed on bad attestations.", color: "var(--sky)" },
  { pct: 5, label: "Oracle nodes", desc: "Sentinel-2, Planet Labs, IoT, LiDAR feeders.", color: "var(--clay)" },
];

export default function Economics() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: 40 }}
    >
      <div className="grid gap-12" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Revenue formula */}
        <div>
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5">
            node revenue
          </div>
          <pre
            className="font-mono text-ink overflow-x-auto"
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              padding: "20px 24px",
              margin: 0,
            }}
          >
{`revenue = market_price × minted
        − operating_costs
        − vvb_oracle_fees
        − protocol_fee  // 5%`}
          </pre>
          <p
            className="font-body text-ink-soft mt-4"
            style={{ fontSize: 13, lineHeight: 1.55 }}
          >
            Operators retain net revenue after a flat 5% protocol fee. The fee
            is split four ways — see the bar to the right.
          </p>
        </div>

        {/* Fee distribution stacked bar */}
        <div>
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5">
            5% protocol fee · split
          </div>
          <div
            className="flex w-full overflow-hidden border border-rule"
            style={{ height: 56 }}
            onMouseLeave={() => setActive(null)}
          >
            {SLICES.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="font-mono text-[11px] tracking-[0.12em] uppercase border-0 cursor-pointer transition-opacity"
                style={{
                  flex: s.pct,
                  background: s.color,
                  color: i === 1 ? "var(--ink)" : "var(--paper)",
                  opacity: active === null || active === i ? 1 : 0.55,
                  outline: "none",
                }}
                aria-label={`${s.label} ${s.pct}%`}
              >
                {s.pct}%
              </button>
            ))}
          </div>

          <ul className="grid gap-2 mt-5">
            {SLICES.map((s, i) => (
              <li
                key={s.label}
                className="grid items-baseline transition-colors"
                style={{
                  gridTemplateColumns: "12px 56px 1fr",
                  gap: 12,
                  padding: "8px 0",
                  borderTop: i > 0 ? "1px solid var(--rule)" : "none",
                  background:
                    active === i ? "var(--paper)" : "transparent",
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    background: s.color,
                    display: "inline-block",
                  }}
                  aria-hidden="true"
                />
                <span
                  className="font-mono text-ink"
                  style={{ fontSize: 13 }}
                >
                  {s.pct}%
                </span>
                <span>
                  <span
                    className="font-display text-ink"
                    style={{ fontSize: 16 }}
                  >
                    {s.label}
                  </span>
                  <span
                    className="font-body text-ink-soft block"
                    style={{ fontSize: 12, lineHeight: 1.5 }}
                  >
                    {s.desc}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
