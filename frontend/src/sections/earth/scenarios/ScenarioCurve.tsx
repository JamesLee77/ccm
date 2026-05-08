import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Series = {
  id: string;
  label: string;
  color: string;
  /** [TGE, Y1, Y2, Y3, Y5] — Y4 is interpolated. */
  values: [number, number, number, number, number];
};

const SERIES: Series[] = [
  { id: "bull", label: "Bull", color: "var(--moss)", values: [0.2, 0.5, 1.2, 4.0, 15.0] },
  { id: "base", label: "Base", color: "var(--moss-2)", values: [0.2, 0.3, 0.55, 1.2, 3.5] },
  { id: "bear", label: "Bear", color: "var(--clay)", values: [0.2, 0.15, 0.18, 0.25, 0.4] },
];

const YEARS: [number, string][] = [
  [0, "TGE"],
  [1, "Y1"],
  [2, "Y2"],
  [3, "Y3"],
  [5, "Y5"],
];

const W = 880;
const H = 320;
const PAD_L = 56;
const PAD_R = 80;
const PAD_T = 24;
const PAD_B = 44;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

const Y_MIN = 0.1;
const Y_MAX = 15;

const xFor = (yr: number) => PAD_L + (yr / 5) * innerW;
const yFor = (v: number) => {
  const log = Math.log10(v);
  const minLog = Math.log10(Y_MIN);
  const maxLog = Math.log10(Y_MAX);
  return PAD_T + (1 - (log - minLog) / (maxLog - minLog)) * innerH;
};

function buildPath(values: [number, number, number, number, number]): string {
  const points = YEARS.map(([yr], i) => [xFor(yr), yFor(values[i] ?? Y_MIN)] as const);
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
}

const TICKS = [0.1, 0.3, 1, 3, 10];

export default function ScenarioCurve() {
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

  const lineLen = 1500;

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          price trajectory · log scale · forward-looking
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          $/token · TGE → Y5
        </div>
      </div>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
        aria-label="Bear, Base, Bull price trajectory"
      >
        {TICKS.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--rule)"
              strokeWidth={0.4}
              strokeDasharray="2 4"
            />
            <text
              x={PAD_L - 8}
              y={yFor(t) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={10}
              fill="var(--ink-soft)"
            >
              ${t}
            </text>
          </g>
        ))}
        {YEARS.map(([yr, label]) => (
          <text
            key={yr}
            x={xFor(yr)}
            y={H - PAD_B + 18}
            textAnchor="middle"
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize={10}
            fill="var(--ink-soft)"
          >
            {label}
          </text>
        ))}

        {SERIES.map((s, i) => {
          const path = buildPath(s.values);
          return (
            <g key={s.id}>
              <path
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth={1.6}
                strokeDasharray={lineLen}
                strokeDashoffset={drawn ? 0 : lineLen}
                style={{
                  transition: reduced
                    ? "none"
                    : `stroke-dashoffset 1400ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 220}ms`,
                }}
              />
              {YEARS.map(([yr], yi) => (
                <circle
                  key={yr}
                  cx={xFor(yr)}
                  cy={yFor(s.values[yi] ?? Y_MIN)}
                  r={3}
                  fill="var(--paper-deep)"
                  stroke={s.color}
                  strokeWidth={1.4}
                  style={{
                    opacity: drawn ? 1 : 0,
                    transition: `opacity 220ms ease-out ${i * 220 + 1000 + yi * 80}ms`,
                  }}
                />
              ))}
              <text
                x={xFor(5) + 12}
                y={yFor(s.values[4] ?? Y_MIN) + 4}
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={11}
                letterSpacing={1.2}
                fill={s.color}
                style={{
                  opacity: drawn ? 1 : 0,
                  transition: `opacity 220ms ease-out ${i * 220 + 1400}ms`,
                }}
              >
                {s.label.toUpperCase()} · ${s.values[4]}
              </text>
            </g>
          );
        })}
      </svg>
      <div
        className="font-body text-ink-soft mt-4"
        style={{ fontSize: 12, lineHeight: 1.5 }}
      >
        ⚠ Forward-looking projections from the whitepaper / deck model. Not
        investment advice or any price guarantee.
      </div>
    </div>
  );
}
