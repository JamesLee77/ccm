import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

// Mining emission per year (M $CCM) — straight from the whitepaper §6.3.
// Y1-2: 300, Y3-4: 250, Y5-7: 200, Y8-10: 100. Cumulative milestones at
// 30% (end Y2), 55% (end Y4), 85% (end Y7), 100% (end Y10).
const YEARS = Array.from({ length: 10 }, (_, i) => i + 1);
const ANNUAL = (yr: number) => {
  if (yr <= 2) return 300;
  if (yr <= 4) return 250;
  if (yr <= 7) return 200;
  return 100;
};

const W = 720;
const H = 280;
const PAD_L = 48;
const PAD_R = 32;
const PAD_T = 24;
const PAD_B = 48;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

const xFor = (yr: number) => PAD_L + ((yr - 1) / 9) * innerW;
const yFor = (val: number) => PAD_T + (1 - val / 320) * innerH; // 320 ceiling

const points = YEARS.map((yr) => [xFor(yr), yFor(ANNUAL(yr))] as const);
const linePath = points
  .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
  .join(" ");
const areaPath =
  linePath +
  ` L ${points[points.length - 1]![0]} ${PAD_T + innerH}` +
  ` L ${points[0]![0]} ${PAD_T + innerH} Z`;

// Y-axis tick marks at 0, 100, 200, 300
const Y_TICKS = [0, 100, 200, 300];

const MILESTONES = [
  { atYear: 2, cumulative: 600, pct: 30 },
  { atYear: 4, cumulative: 1100, pct: 55 },
  { atYear: 7, cumulative: 1700, pct: 85 },
  { atYear: 10, cumulative: 2000, pct: 100 },
];

export default function EmissionCurve() {
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
      { threshold: 0.3 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  // Use a longer dasharray to ensure the path draws fully.
  const lineLen = 1600;

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-5">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          mining emission · 10-year decay
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          values in M $CCM / year
        </div>
      </div>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
        aria-label="Mining emission curve, 2026 to 2035"
      >
        {/* Y grid + ticks */}
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--rule)"
              strokeWidth={0.6}
              strokeDasharray={t === 0 ? "" : "2 4"}
            />
            <text
              x={PAD_L - 8}
              y={yFor(t) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={10}
              fill="var(--ink-soft)"
            >
              {t}
            </text>
          </g>
        ))}

        {/* X axis labels (years) */}
        {YEARS.map((yr) => (
          <text
            key={yr}
            x={xFor(yr)}
            y={H - PAD_B + 18}
            textAnchor="middle"
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize={10}
            fill="var(--ink-soft)"
          >
            Y{yr}
          </text>
        ))}

        {/* Area under curve */}
        <path
          d={areaPath}
          fill="var(--moss)"
          opacity={0.12}
          style={{
            clipPath: drawn ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
            transition: reduced ? "none" : "clip-path 1400ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--moss)"
          strokeWidth={1.6}
          strokeDasharray={lineLen}
          strokeDashoffset={drawn ? 0 : lineLen}
          style={{
            transition: reduced ? "none" : "stroke-dashoffset 1400ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        {/* Year markers */}
        {YEARS.map((yr, i) => (
          <circle
            key={yr}
            cx={points[i]![0]}
            cy={points[i]![1]}
            r={3}
            fill="var(--paper-deep)"
            stroke="var(--moss)"
            strokeWidth={1.2}
            style={{
              opacity: drawn ? 1 : 0,
              transition: reduced
                ? "none"
                : `opacity 220ms ease-out ${800 + i * 80}ms`,
            }}
          />
        ))}

        {/* Cumulative milestones */}
        {MILESTONES.map((m) => (
          <g key={m.atYear}>
            <line
              x1={xFor(m.atYear)}
              x2={xFor(m.atYear)}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="var(--moss)"
              strokeWidth={0.5}
              strokeDasharray="3 4"
              opacity={drawn ? 0.4 : 0}
              style={{ transition: "opacity 240ms ease-out 1400ms" }}
            />
            <text
              x={xFor(m.atYear) + 4}
              y={PAD_T + 14}
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={9}
              letterSpacing={1}
              fill="var(--moss)"
              opacity={drawn ? 1 : 0}
              style={{ transition: "opacity 240ms ease-out 1500ms" }}
            >
              {m.pct}%
            </text>
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-rule">
        {MILESTONES.map((m) => (
          <div key={m.atYear}>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss">
              end of Y{m.atYear}
            </div>
            <div
              className="font-display text-ink mt-1"
              style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em" }}
            >
              {m.cumulative.toLocaleString()}M
            </div>
            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-soft mt-1">
              {m.pct}% of mining cap
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
