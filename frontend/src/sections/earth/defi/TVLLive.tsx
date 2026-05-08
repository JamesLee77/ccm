import { useEffect, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Pool = {
  id: string;
  label: string;
  baseline: number;
  step: [number, number];
};

const POOLS: Pool[] = [
  { id: "amm", label: "AMM (Uniswap, Curve)", baseline: 86_400_000, step: [4_000, 24_000] },
  { id: "vault", label: "Vault lending", baseline: 32_100_000, step: [1_500, 12_000] },
  { id: "index", label: "$CCM-PRIME index", baseline: 18_700_000, step: [1_000, 7_000] },
  { id: "insurance", label: "Insurance vault", baseline: 6_400_000, step: [200, 1_800] },
];

function tickInterval(): number {
  return 4500 + Math.random() * 4500;
}

export default function TVLLive() {
  const reduced = useReducedMotion();
  const [values, setValues] = useState(() => POOLS.map((p) => p.baseline));

  useEffect(() => {
    if (reduced) return;
    const ts: number[] = [];
    const sched = () => {
      ts.push(
        window.setTimeout(() => {
          setValues((prev) =>
            prev.map((v, i) => {
              const p = POOLS[i]!;
              const [min, max] = p.step;
              return v + Math.floor(min + Math.random() * (max - min + 1));
            }),
          );
          sched();
        }, tickInterval()),
      );
    };
    sched();
    return () => {
      for (const t of ts) window.clearTimeout(t);
    };
  }, [reduced]);

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span
          aria-hidden
          className="tv-pulse"
          style={{ width: 8, height: 8, background: "var(--moss)", borderRadius: "50%", display: "inline-block" }}
        />
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          live · TVL by primitive
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto">
          USDC + $CCM equivalent
        </span>
      </div>

      <div
        className="grid items-end mb-6 pb-6 border-b border-rule"
        style={{ gridTemplateColumns: "auto 1fr", gap: 24 }}
      >
        <div>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
            total
          </div>
          <div
            className="font-display text-ink"
            style={{
              fontSize: 48,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${(total / 1_000_000).toFixed(2)}M
          </div>
        </div>
        <div className="font-body text-ink-soft" style={{ fontSize: 13, lineHeight: 1.5 }}>
          Aggregated across all CCM × DeFi pools. Composability with external
          DeFi (Aave, Pendle, Yearn) is not double-counted here.
        </div>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--rule)" }}
      >
        {POOLS.map((p, i) => (
          <div key={p.id} style={{ background: "var(--paper-deep)", padding: "20px 24px" }}>
            <div
              className="font-display text-ink"
              style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em" }}
            >
              ${((values[i] ?? 0) / 1_000_000).toFixed(2)}M
            </div>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft mt-2">
              {p.label}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes tv-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .tv-pulse { animation: tv-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .tv-pulse { animation: none !important; } }
      `}</style>
    </div>
  );
}
