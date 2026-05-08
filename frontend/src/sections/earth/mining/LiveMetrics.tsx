import { useEffect, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Metric = {
  id: string;
  label: string;
  /** Initial value as a number for tickable counters, or a fixed string. */
  value: number | string;
  /** Optional formatter; defaults to locale string for numbers. */
  format?: (n: number) => string;
  /** Increment range per tick — random within [min, max]. Numbers only. */
  step?: [number, number];
};

const METRICS: Metric[] = [
  {
    id: "nodes",
    label: "Nodes online",
    value: 47,
    step: [0, 1],
  },
  {
    id: "minted",
    label: "CCM minted (24h)",
    value: 12450,
    step: [3, 18],
    format: (n) => n.toLocaleString(),
  },
  {
    id: "verify",
    label: "Verification rate",
    value: "99.4%",
  },
  {
    id: "attest",
    label: "Avg attestation",
    value: "2.3 s",
  },
];

function tickInterval(): number {
  return 4500 + Math.random() * 3500; // 4.5 – 8.0 s
}

export default function LiveMetrics() {
  const reduced = useReducedMotion();
  const [values, setValues] = useState(() =>
    METRICS.map((m) => (typeof m.value === "number" ? m.value : 0)),
  );

  useEffect(() => {
    if (reduced) return;
    const timeouts: number[] = [];
    const schedule = () => {
      timeouts.push(
        window.setTimeout(() => {
          setValues((prev) =>
            prev.map((v, i) => {
              const m = METRICS[i]!;
              if (typeof m.value !== "number" || !m.step) return v;
              const [min, max] = m.step;
              return v + Math.floor(min + Math.random() * (max - min + 1));
            }),
          );
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
      {/* live indicator strip */}
      <div className="flex items-center gap-2 mb-6">
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--moss)",
            display: "inline-block",
          }}
          className="lm-pulse"
        />
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          live · network
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
        {METRICS.map((m, i) => {
          const display =
            typeof m.value === "number"
              ? (m.format ? m.format(values[i] ?? 0) : (values[i] ?? 0).toLocaleString())
              : m.value;
          return (
            <div
              key={m.id}
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
                {m.label}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes lm-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .lm-pulse { animation: lm-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lm-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
