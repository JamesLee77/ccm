import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Series = {
  id: string;
  label: string;
  color: string;
  /** % share at [Y0, Y2, Y4, Y6, Y8] */
  values: [number, number, number, number, number];
};

const SERIES: Series[] = [
  { id: "ccm", label: "CCM Network", color: "var(--moss)", values: [0, 8, 22, 34, 42] },
  { id: "tk", label: "Toucan / KlimaDAO", color: "var(--clay)", values: [4, 5, 4, 3, 2] },
  { id: "moss", label: "Moss MCO2", color: "#e88a4e", values: [3, 2, 1, 0.5, 0.5] },
  { id: "other", label: "Other onchain", color: "var(--ink-soft)", values: [1, 4, 6, 8, 9] },
];

const X_LABELS = ["Y0", "Y2", "Y4", "Y6", "Y8"];

const W = 880;
const H = 320;
const PAD_L = 56;
const PAD_R = 100;
const PAD_T = 24;
const PAD_B = 44;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

const xFor = (i: number) => PAD_L + (i / 4) * innerW;
const yFor = (pct: number) => PAD_T + (1 - pct / 50) * innerH;

function buildPath(values: number[]): string {
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(v)}`)
    .join(" ");
}

export default function MarketShareTimeline() {
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
          onchain carbon · market share evolution · forward-looking
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          % of onchain carbon TVL · Y0 = 2026
        </div>
      </div>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
        aria-label="Market share timeline projection"
      >
        {[0, 10, 20, 30, 40, 50].map((p) => (
          <g key={p}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(p)}
              y2={yFor(p)}
              stroke="var(--rule)"
              strokeWidth={0.4}
              strokeDasharray="2 4"
            />
            <text
              x={PAD_L - 8}
              y={yFor(p) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={10}
              fill="var(--ink-soft)"
            >
              {p}%
            </text>
          </g>
        ))}
        {X_LABELS.map((l, i) => (
          <text
            key={l}
            x={xFor(i)}
            y={H - PAD_B + 18}
            textAnchor="middle"
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize={10}
            fill="var(--ink-soft)"
          >
            {l}
          </text>
        ))}
        {SERIES.map((s, i) => (
          <g key={s.id}>
            <path
              d={buildPath(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.id === "ccm" ? 1.8 : 1.2}
              strokeDasharray={lineLen}
              strokeDashoffset={drawn ? 0 : lineLen}
              style={{
                transition: reduced
                  ? "none"
                  : `stroke-dashoffset 1500ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 200}ms`,
              }}
            />
            <text
              x={xFor(4) + 12}
              y={yFor(s.values[4]) + 4}
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={11}
              letterSpacing={1.2}
              fill={s.color}
              style={{
                opacity: drawn ? 1 : 0,
                transition: `opacity 220ms ease-out ${i * 200 + 1200}ms`,
              }}
            >
              {s.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
