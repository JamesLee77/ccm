import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { PHASES } from "./PhaseTrack";

// Quarterly buckets across the planning window: 2026 Q1 → 2029 Q4 (16 quarters).
type Quarter = { idx: number; label: string; year: number; q: number };
const QUARTERS: Quarter[] = (() => {
  const out: Quarter[] = [];
  for (let y = 26; y <= 29; y++) {
    for (let q = 1; q <= 4; q++) {
      out.push({ idx: out.length, label: `Q${q}`, year: 2000 + y, q });
    }
  }
  return out;
})();

// Map each phase to a [start, end] quarter index (inclusive) along QUARTERS.
const PHASE_RANGES: Record<string, [number, number]> = {
  p0: [0, 1], // 2026 Q1–Q2 (foundation done)
  p1: [2, 3], // 2026 Q3–Q4 (mainnet, pilots start)
  p2: [3, 5], // overlap into 2027 Q1
  p3: [4, 7], // 2027 H1–H2
  p4: [6, 11], // 2027 H2 – 2028
  p5: [10, 15], // 2028 onward
};

const W = 880;
const ROW_H = 44;
const PAD_L = 160;
const PAD_R = 24;
const PAD_T = 36;
const PAD_B = 48;
const innerW = W - PAD_L - PAD_R;
const totalH = PAD_T + PHASES.length * ROW_H + PAD_B;

const xForQuarter = (i: number) =>
  PAD_L + (i / (QUARTERS.length - 1)) * innerW;

const TODAY_QUARTER_IDX = 2; // current = 2026 Q3

export default function DeliveryGantt() {
  const reduced = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setDrawn(true);
      return;
    }
    const root = ref.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setDrawn(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-5">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          delivery gantt · 2026 → 2029
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          phase overlap = parallel work
        </div>
      </div>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${totalH}`}
        style={{ display: "block" }}
        aria-label="Phase delivery gantt"
      >
        {/* year ticks */}
        {QUARTERS.map((qq, i) => (
          <g key={i}>
            {qq.q === 1 ? (
              <line
                x1={xForQuarter(i)}
                x2={xForQuarter(i)}
                y1={PAD_T - 18}
                y2={totalH - PAD_B + 6}
                stroke="var(--rule)"
                strokeWidth={0.6}
              />
            ) : null}
            {qq.q === 1 ? (
              <text
                x={xForQuarter(i)}
                y={PAD_T - 22}
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={10}
                letterSpacing={1.4}
                fill="var(--moss)"
              >
                {qq.year}
              </text>
            ) : null}
            <text
              x={xForQuarter(i)}
              y={totalH - PAD_B + 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={9}
              fill="var(--ink-soft)"
            >
              {qq.label}
            </text>
          </g>
        ))}

        {/* today marker */}
        <line
          x1={xForQuarter(TODAY_QUARTER_IDX)}
          x2={xForQuarter(TODAY_QUARTER_IDX)}
          y1={PAD_T - 8}
          y2={totalH - PAD_B + 8}
          stroke="var(--moss)"
          strokeWidth={1.4}
          strokeDasharray="3 3"
        />
        <text
          x={xForQuarter(TODAY_QUARTER_IDX) + 6}
          y={PAD_T - 4}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={9}
          letterSpacing={1.4}
          fill="var(--moss)"
        >
          NOW
        </text>

        {/* phase bars */}
        {PHASES.map((phase, i) => {
          const [from, to] = PHASE_RANGES[phase.id] ?? [0, 1];
          const x = xForQuarter(from);
          const fullWidth = xForQuarter(to) - x + (innerW / (QUARTERS.length - 1));
          const rowY = PAD_T + i * ROW_H;
          const color =
            phase.state === "done"
              ? "var(--moss)"
              : phase.state === "current"
                ? "var(--moss-2)"
                : "var(--rule)";

          return (
            <g key={phase.id}>
              <text
                x={PAD_L - 18}
                y={rowY + 22}
                textAnchor="end"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={11}
                letterSpacing={1.2}
                fill="var(--moss)"
              >
                P{phase.num}
              </text>
              <text
                x={PAD_L - 18}
                y={rowY + 36}
                textAnchor="end"
                fontFamily="Space Grotesk, system-ui, sans-serif"
                fontSize={13}
                fontWeight={500}
                fill="var(--ink)"
              >
                {phase.title}
              </text>
              <rect
                x={x}
                y={rowY + 12}
                width={drawn ? fullWidth : 0}
                height={20}
                fill={color}
                style={{
                  transition: reduced
                    ? "none"
                    : `width 1100ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 120}ms`,
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
