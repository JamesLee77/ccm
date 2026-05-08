import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

const POINTS: [number, number][] = [
  [2024, 2],
  [2026, 8],
  [2028, 25],
  [2030, 50],
  [2035, 95],
  [2040, 145],
  [2045, 200],
  [2050, 250],
];

const W = 880;
const H = 280;
const PAD_L = 56;
const PAD_R = 32;
const PAD_T = 20;
const PAD_B = 44;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

const xFor = (yr: number) => PAD_L + ((yr - 2024) / 26) * innerW;
const yFor = (b: number) => PAD_T + (1 - b / 270) * innerH;

const points = POINTS.map(([yr, b]) => [xFor(yr), yFor(b)] as const);
const linePath = points
  .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
  .join(" ");
const areaPath =
  linePath +
  ` L ${points[points.length - 1]![0]} ${PAD_T + innerH} L ${points[0]![0]} ${PAD_T + innerH} Z`;

export default function GrowthCurve() {
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
      { threshold: 0.3 },
    );
    obs.observe(root);
    return () => obs.disconnect();
  }, [reduced]);

  const lineLen = 1800;

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          VCM growth curve · 2024 → 2050
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          $B annual volume · McKinsey 2024
        </div>
      </div>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
        aria-label="VCM growth curve"
      >
        {[0, 50, 100, 150, 200, 250].map((b) => (
          <g key={b}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(b)}
              y2={yFor(b)}
              stroke="var(--rule)"
              strokeWidth={0.4}
              strokeDasharray={b === 0 ? "" : "2 4"}
            />
            <text
              x={PAD_L - 8}
              y={yFor(b) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={10}
              fill="var(--ink-soft)"
            >
              ${b}B
            </text>
          </g>
        ))}
        {[2024, 2030, 2040, 2050].map((yr) => (
          <text
            key={yr}
            x={xFor(yr)}
            y={H - PAD_B + 18}
            textAnchor="middle"
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize={10}
            fill="var(--ink-soft)"
          >
            {yr}
          </text>
        ))}
        {/* area */}
        <path
          d={areaPath}
          fill="var(--moss)"
          opacity={0.12}
          style={{
            clipPath: drawn ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
            transition: reduced
              ? "none"
              : "clip-path 1500ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        <path
          d={linePath}
          fill="none"
          stroke="var(--moss)"
          strokeWidth={1.6}
          strokeDasharray={lineLen}
          strokeDashoffset={drawn ? 0 : lineLen}
          style={{
            transition: reduced
              ? "none"
              : "stroke-dashoffset 1500ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        {/* 2030 milestone */}
        <line
          x1={xFor(2030)}
          x2={xFor(2030)}
          y1={PAD_T}
          y2={H - PAD_B}
          stroke="var(--moss)"
          strokeWidth={0.6}
          strokeDasharray="3 4"
          opacity={drawn ? 0.5 : 0}
          style={{ transition: "opacity 240ms ease-out 1400ms" }}
        />
        <text
          x={xFor(2030) + 6}
          y={PAD_T + 14}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={9}
          letterSpacing={1.4}
          fill="var(--moss)"
          opacity={drawn ? 1 : 0}
          style={{ transition: "opacity 240ms ease-out 1500ms" }}
        >
          $50B · 2030
        </text>
      </svg>
    </div>
  );
}
