import { useEffect, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type ReadOut = {
  id: string;
  label: string;
  value: number | string;
  step?: [number, number];
  format?: (n: number) => string;
};

const READOUTS: ReadOut[] = [
  {
    id: "locked",
    label: "NFTs locked in vault",
    value: 956719,
    step: [3, 22],
    format: (n) => n.toLocaleString(),
  },
  {
    id: "circulating",
    label: "$CCM circulating",
    value: 956719,
    step: [3, 22],
    format: (n) => n.toLocaleString(),
  },
  {
    id: "ratio",
    label: "Lockup ratio (vault / minted)",
    value: "74.5%",
  },
  {
    id: "today",
    label: "Wrap volume (24h)",
    value: 18420,
    step: [4, 28],
    format: (n) => n.toLocaleString(),
  },
];

function tickInterval(): number {
  return 4500 + Math.random() * 3500;
}

export default function VaultLedger() {
  const reduced = useReducedMotion();
  const [values, setValues] = useState(() =>
    READOUTS.map((r) => (typeof r.value === "number" ? r.value : 0)),
  );

  useEffect(() => {
    if (reduced) return;
    const timeouts: number[] = [];
    const schedule = () => {
      timeouts.push(
        window.setTimeout(() => {
          setValues((prev) => {
            const next = [...prev];
            // Tick locked + circulating together so the 1:1 invariant holds.
            const r0 = READOUTS[0];
            if (r0?.step) {
              const [min, max] = r0.step;
              const delta = Math.floor(min + Math.random() * (max - min + 1));
              next[0] = (prev[0] ?? 0) + delta;
              next[1] = (prev[1] ?? 0) + delta;
            }
            // Tick today's volume independently.
            const r3 = READOUTS[3];
            if (r3?.step) {
              const [min, max] = r3.step;
              next[3] = (prev[3] ?? 0) + Math.floor(min + Math.random() * (max - min + 1));
            }
            return next;
          });
          schedule();
        }, tickInterval()),
      );
    };
    schedule();
    return () => {
      for (const t of timeouts) window.clearTimeout(t);
    };
  }, [reduced]);

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span
          aria-hidden
          className="vl-pulse"
          style={{
            width: 8,
            height: 8,
            background: "var(--moss)",
            borderRadius: "50%",
            display: "inline-block",
          }}
        />
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          live · vault
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto">
          non-custodial · invariant 1:1
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
        @keyframes vl-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .vl-pulse { animation: vl-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .vl-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
