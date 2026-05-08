import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Range = {
  category: string;
  low: number;
  high: number;
  median: number;
  body: string;
};

const RANGES: Range[] = [
  { category: "REDD+ (avoidance)", low: 4, high: 22, median: 9, body: "Same registry, same vintage." },
  { category: "Reforestation", low: 12, high: 38, median: 21, body: "Geography drives the spread." },
  { category: "Biochar", low: 80, high: 220, median: 145, body: "Boutique buyers vs. corporates." },
  { category: "DAC", low: 380, high: 720, median: 540, body: "Energy mix and offtake terms." },
];

const W = 880;
const ROW_H = 56;
const PAD_L = 220;
const PAD_R = 60;
const PAD_T = 24;
const PAD_B = 32;
const innerW = W - PAD_L - PAD_R;
const totalH = PAD_T + RANGES.length * ROW_H + PAD_B;

const ALL_LOW = 4;
const ALL_HIGH = 720;

const xFor = (v: number) =>
  PAD_L + ((Math.log(v) - Math.log(ALL_LOW)) / (Math.log(ALL_HIGH) - Math.log(ALL_LOW))) * innerW;

const TICKS = [4, 10, 30, 100, 300, 720];

export default function PriceDisparity() {
  const reduced = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(reduced);

  useEffect(() => {
    if (reduced) return setDrawn(true);
    const root = ref.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setDrawn(true);
            obs.disconnect();
            return;
          }
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(root);
    return () => obs.disconnect();
  }, [reduced]);

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          price disparity · same vintage, broker-quoted
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          $/tonne · log scale
        </div>
      </div>
      <p
        className="font-body text-ink-soft mt-2 mb-5"
        style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 720 }}
      >
        Range bars show the low / high range a buyer reported in 2024 for the
        same project category at the same vintage. The dot marks the median.
      </p>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${totalH}`}
        style={{ display: "block" }}
        aria-label="Price disparity by category"
      >
        {TICKS.map((v) => (
          <g key={v}>
            <line
              x1={xFor(v)}
              x2={xFor(v)}
              y1={PAD_T}
              y2={totalH - PAD_B + 6}
              stroke="var(--rule)"
              strokeWidth={0.4}
              strokeDasharray="2 4"
            />
            <text
              x={xFor(v)}
              y={totalH - PAD_B + 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={9}
              fill="var(--ink-soft)"
            >
              ${v}
            </text>
          </g>
        ))}

        {RANGES.map((r, i) => {
          const rowY = PAD_T + i * ROW_H + 16;
          const x1 = xFor(r.low);
          const x2 = xFor(r.high);
          const xMed = xFor(r.median);
          return (
            <g key={r.category}>
              <text
                x={PAD_L - 18}
                y={rowY + 6}
                textAnchor="end"
                fontFamily="Space Grotesk, system-ui, sans-serif"
                fontSize={14}
                fontWeight={500}
                fill="var(--ink)"
              >
                {r.category}
              </text>
              <text
                x={PAD_L - 18}
                y={rowY + 22}
                textAnchor="end"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={10}
                fill="var(--ink-soft)"
              >
                {r.body}
              </text>
              {/* range bar */}
              <line
                x1={x1}
                x2={drawn ? x2 : x1}
                y1={rowY}
                y2={rowY}
                stroke="var(--moss)"
                strokeWidth={3}
                strokeLinecap="round"
                style={{
                  transition: reduced
                    ? "none"
                    : `x2 1100ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 120}ms`,
                }}
              />
              <circle
                cx={xMed}
                cy={rowY}
                r={5}
                fill="var(--paper-deep)"
                stroke="var(--moss)"
                strokeWidth={1.5}
                style={{
                  opacity: drawn ? 1 : 0,
                  transition: `opacity 220ms ease-out ${i * 120 + 600}ms`,
                }}
              />
              <text
                x={x1 - 10}
                y={rowY + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={10}
                fill="var(--ink)"
              >
                ${r.low}
              </text>
              <text
                x={x2 + 10}
                y={rowY + 4}
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={10}
                fill="var(--ink)"
              >
                ${r.high}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
