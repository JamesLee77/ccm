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
  { id: "active", label: "Active CCMine nodes", value: 47, step: [0, 1] },
  { id: "vvb", label: "VVB validators", value: 11, step: [0, 0] },
  {
    id: "minted",
    label: "CCM minted today",
    value: 2840,
    step: [4, 22],
    format: (n) => n.toLocaleString(),
  },
  {
    id: "retired",
    label: "CCM retired today",
    value: 712,
    step: [1, 8],
    format: (n) => n.toLocaleString(),
  },
];

function tickInterval(): number {
  return 4500 + Math.random() * 3500;
}

export default function NetworkSnapshot() {
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
      style={{ background: "var(--paper-deep)", padding: "28px 32px" }}
    >
      <div className="flex items-center gap-2 mb-5">
        <span
          aria-hidden
          className="ns-pulse"
          style={{ width: 8, height: 8, background: "var(--moss)", borderRadius: "50%" }}
        />
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          live · network state
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
            <div key={r.id} style={{ background: "var(--paper-deep)", padding: "16px 20px" }}>
              <div
                className="font-display text-ink"
                style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }}
              >
                {display}
              </div>
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft mt-1">
                {r.label}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes ns-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .ns-pulse { animation: ns-pulse-anim 2s ease-in-out infinite; display: inline-block; }
        @media (prefers-reduced-motion: reduce) { .ns-pulse { animation: none !important; } }
      `}</style>
    </div>
  );
}
