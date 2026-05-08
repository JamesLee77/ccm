import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Bucket = {
  id: string;
  label: string;
  pct: number;
  /** cliff in months */
  cliff: number;
  /** linear vesting duration in months after cliff */
  vesting: number;
  color: string;
  note: string;
};

// Months 0–60 (5-year window, sufficient for 4Y vesting + 1Y cliff buckets).
const TOTAL_MONTHS = 60;

const BUCKETS: Bucket[] = [
  { id: "tge-seed", label: "TGE · Seed", pct: 2, cliff: 6, vesting: 24, color: "var(--moss)", note: "$0.15 entry" },
  { id: "tge-series-a", label: "TGE · Series A", pct: 3, cliff: 3, vesting: 18, color: "var(--moss-2)", note: "$0.20 entry" },
  { id: "foundation", label: "Foundation", pct: 18, cliff: 12, vesting: 48, color: "var(--sky)", note: "ecosystem · standards" },
  { id: "strategic", label: "Strategic", pct: 10, cliff: 12, vesting: 48, color: "#7ba9c4", note: "partners · advisors" },
  { id: "team", label: "Team", pct: 5, cliff: 12, vesting: 48, color: "var(--ink-soft)", note: "core contributors" },
];

const W = 720;
const ROW_H = 56;
const PAD_L = 160;
const PAD_R = 24;
const PAD_T = 24;
const PAD_B = 36;
const innerW = W - PAD_L - PAD_R;
const totalH = PAD_T + BUCKETS.length * ROW_H + PAD_B;

const xForMonth = (m: number) => PAD_L + (m / TOTAL_MONTHS) * innerW;

const TICKS = [0, 12, 24, 36, 48, 60];

export default function VestingTimeline() {
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
          vesting · 5-year window
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          cliff · linear vesting · M = months
        </div>
      </div>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${totalH}`}
        style={{ display: "block" }}
      >
        {/* Y grid */}
        {TICKS.map((m) => (
          <g key={m}>
            <line
              x1={xForMonth(m)}
              x2={xForMonth(m)}
              y1={PAD_T}
              y2={totalH - PAD_B + 6}
              stroke="var(--rule)"
              strokeWidth={0.5}
              strokeDasharray={m === 0 ? "" : "2 4"}
            />
            <text
              x={xForMonth(m)}
              y={totalH - PAD_B + 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={10}
              fill="var(--ink-soft)"
            >
              M{m}
            </text>
          </g>
        ))}

        {BUCKETS.map((b, i) => {
          const rowY = PAD_T + i * ROW_H;
          const cliffStart = xForMonth(0);
          const cliffEnd = xForMonth(b.cliff);
          const vestEnd = xForMonth(b.cliff + b.vesting);
          const cliffWidth = cliffEnd - cliffStart;
          const vestWidth = vestEnd - cliffEnd;
          return (
            <g key={b.id}>
              {/* row label */}
              <text
                x={PAD_L - 18}
                y={rowY + 22}
                textAnchor="end"
                fontFamily="Space Grotesk, system-ui, sans-serif"
                fontSize={14}
                fontWeight={500}
                fill="var(--ink)"
              >
                {b.label}
              </text>
              <text
                x={PAD_L - 18}
                y={rowY + 38}
                textAnchor="end"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={10}
                fill="var(--moss)"
              >
                {b.pct}%
              </text>
              {/* cliff (hatched) */}
              <rect
                x={cliffStart}
                y={rowY + 12}
                width={drawn ? cliffWidth : 0}
                height={20}
                fill={b.color}
                fillOpacity={0.3}
                style={{
                  transition: reduced
                    ? "none"
                    : `width 800ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 120}ms`,
                }}
              />
              {/* linear vesting (solid) */}
              <rect
                x={cliffEnd}
                y={rowY + 12}
                width={drawn ? vestWidth : 0}
                height={20}
                fill={b.color}
                style={{
                  transition: reduced
                    ? "none"
                    : `width 1100ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 120 + 400}ms`,
                }}
              />
              {/* note inside bar (when wide enough) */}
              {drawn && vestWidth > 80 ? (
                <text
                  x={cliffEnd + 8}
                  y={rowY + 26}
                  fontFamily="JetBrains Mono, ui-monospace, monospace"
                  fontSize={10}
                  fill={b.id === "team" ? "var(--paper)" : "var(--paper-deep)"}
                >
                  {b.note}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-6 mt-5 pt-5 border-t border-rule font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft">
        <span className="flex items-center gap-2">
          <span style={{ width: 14, height: 12, background: "var(--moss)", opacity: 0.3 }} aria-hidden />
          cliff (no unlock)
        </span>
        <span className="flex items-center gap-2">
          <span style={{ width: 14, height: 12, background: "var(--moss)" }} aria-hidden />
          linear vesting
        </span>
      </div>
    </div>
  );
}
