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
    id: "double",
    label: "Tonnes double-counted (yr)",
    value: 312_400,
    step: [10, 60],
    format: (n) => n.toLocaleString(),
  },
  {
    id: "stranded",
    label: "Tonnes stranded (Verra ban)",
    value: 18_400_000,
    step: [0, 0],
    format: (n) => `${(n / 1_000_000).toFixed(1)}M`,
  },
  {
    id: "spreads",
    label: "Same-grade price spread",
    value: "20×",
  },
  {
    id: "lossPct",
    label: "Trust loss · ICVCM exclusions",
    value: "≈70%",
  },
];

function tickInterval(): number {
  return 5500 + Math.random() * 4500;
}

export default function CostsLive() {
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
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        padding: "32px 40px",
      }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span
          aria-hidden
          className="cl2-pulse"
          style={{ width: 8, height: 8, background: "var(--moss)", borderRadius: "50%", display: "inline-block" }}
        />
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          live · failure costs
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase ml-auto" style={{ color: "var(--ink-soft)" }}>
          legacy market · 2024 estimates
        </span>
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "rgba(255,255,255,0.08)" }}
      >
        {READOUTS.map((r, i) => {
          const display =
            typeof r.value === "number"
              ? (r.format ? r.format(values[i] ?? 0) : (values[i] ?? 0).toLocaleString())
              : r.value;
          return (
            <div
              key={r.id}
              style={{
                background: "var(--ink)",
                padding: "20px 24px",
                color: "var(--paper)",
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 32,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: "var(--paper)",
                }}
              >
                {display}
              </div>
              <div
                className="font-mono text-[10px] tracking-[0.14em] uppercase mt-2"
                style={{ color: "var(--ink-soft)", opacity: 0.9 }}
              >
                {r.label}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes cl2-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .cl2-pulse { animation: cl2-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .cl2-pulse { animation: none !important; } }
      `}</style>
    </div>
  );
}
