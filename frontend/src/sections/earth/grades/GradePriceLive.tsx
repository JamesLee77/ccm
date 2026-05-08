import { useEffect, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Grade = {
  id: string;
  letter: string;
  baseline: number;
  step: [number, number];
  color: string;
};

const GRADES: Grade[] = [
  { id: "a", letter: "CCM-A", baseline: 540, step: [-3, 3], color: "var(--moss)" },
  { id: "b", letter: "CCM-B", baseline: 145, step: [-2, 2], color: "var(--moss-2)" },
  { id: "c", letter: "CCM-C", baseline: 21, step: [-1, 1], color: "var(--sky)" },
  { id: "d", letter: "CCM-D", baseline: 9, step: [-1, 1], color: "var(--clay)" },
];

function tickInterval(): number {
  return 4500 + Math.random() * 4500;
}

export default function GradePriceLive() {
  const reduced = useReducedMotion();
  const [prices, setPrices] = useState(() => GRADES.map((g) => g.baseline));

  useEffect(() => {
    if (reduced) return;
    const ts: number[] = [];
    const sched = () => {
      ts.push(
        window.setTimeout(() => {
          setPrices((prev) =>
            prev.map((p, i) => {
              const g = GRADES[i]!;
              const [min, max] = g.step;
              const next = p + Math.floor(min + Math.random() * (max - min + 1));
              // Keep within ±15% of baseline so the spread stays believable.
              const lower = g.baseline * 0.85;
              const upper = g.baseline * 1.15;
              return Math.max(lower, Math.min(upper, next));
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

  const aPrice = prices[0] ?? 0;
  const dPrice = prices[3] ?? 1;
  const ratio = dPrice ? Math.round(aPrice / dPrice) : 0;

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span
          aria-hidden
          className="gp-pulse"
          style={{ width: 8, height: 8, background: "var(--moss)", borderRadius: "50%", display: "inline-block" }}
        />
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          live · grade price ratio
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto">
          $/tonne · 7-day rolling
        </span>
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--rule)" }}
      >
        {GRADES.map((g, i) => (
          <div
            key={g.id}
            style={{ background: "var(--paper-deep)", padding: "20px 24px" }}
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span
                aria-hidden
                style={{ width: 10, height: 10, background: g.color }}
              />
              <span
                className="font-mono text-[11px] tracking-[0.14em] uppercase"
                style={{ color: g.color }}
              >
                {g.letter}
              </span>
            </div>
            <div
              className="font-display text-ink"
              style={{
                fontSize: 30,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ${prices[i]?.toLocaleString()}
            </div>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft mt-2">
              median {g.baseline.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-6 pt-5 border-t border-rule flex items-baseline gap-3"
      >
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss">
          spread
        </span>
        <span
          className="font-display text-ink"
          style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em" }}
        >
          CCM-A is {ratio}× CCM-D
        </span>
      </div>
      <style>{`
        @keyframes gp-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .gp-pulse { animation: gp-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .gp-pulse { animation: none !important; } }
      `}</style>
    </div>
  );
}
