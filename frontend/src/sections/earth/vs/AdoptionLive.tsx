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
  { id: "miners", label: "Active CCMine operators", value: 47, step: [0, 1] },
  { id: "vvb", label: "VVB partners", value: 11, step: [0, 0] },
  {
    id: "buyers",
    label: "Corporate ESG buyers",
    value: 1184,
    step: [0, 2],
  },
  {
    id: "retirements",
    label: "Cumulative retirements",
    value: 327_489,
    step: [3, 18],
    format: (n) => n.toLocaleString(),
  },
];

function tickInterval(): number {
  return 5500 + Math.random() * 4500;
}

export default function AdoptionLive() {
  const reduced = useReducedMotion();
  const [values, setValues] = useState(() =>
    READOUTS.map((r) => (typeof r.value === "number" ? r.value : 0)),
  );
  useEffect(() => {
    if (reduced) return;
    const ts: number[] = [];
    const sched = () => {
      ts.push(
        window.setTimeout(() => {
          setValues((prev) =>
            prev.map((v, i) => {
              const r = READOUTS[i]!;
              if (typeof r.value !== "number" || !r.step) return v;
              const [min, max] = r.step;
              if (max === 0) return v;
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

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span
          aria-hidden
          className="al-pulse"
          style={{ width: 8, height: 8, background: "var(--moss)", borderRadius: "50%", display: "inline-block" }}
        />
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          live · adoption ledger
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto">
          forecast at phase 1 mainnet
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
        @keyframes al-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .al-pulse { animation: al-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .al-pulse { animation: none !important; } }
      `}</style>
    </div>
  );
}
