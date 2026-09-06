import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

/** True below 640px. The SVG scales with its viewBox, so tick labels are
 *  thinned and enlarged there to stay legible. */
function useCompact(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return compact;
}

// Annual mean atmospheric CO₂ in ppm. Pre-1958 from ice cores; 1958+ from
// Mauna Loa (NOAA). Sampled to keep the path readable.
const PPM_DATA: [number, number][] = [
  [1750, 277],
  [1850, 285],
  [1900, 296],
  [1950, 311],
  [1960, 317],
  [1970, 326],
  [1980, 339],
  [1990, 354],
  [2000, 369],
  [2010, 389],
  [2015, 401],
  [2020, 414],
  [2024, 422],
  [2026, 423],
];

const W = 880;
const H = 220;
const PAD_L = 56;
const PAD_R = 32;
const PAD_T = 24;
const PAD_B = 40;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

const minYear = PPM_DATA[0]![0];
const maxYear = PPM_DATA[PPM_DATA.length - 1]![0];
const minPpm = 270;
const maxPpm = 430;

const xFor = (yr: number) =>
  PAD_L + ((yr - minYear) / (maxYear - minYear)) * innerW;
const yFor = (p: number) =>
  PAD_T + (1 - (p - minPpm) / (maxPpm - minPpm)) * innerH;

const points = PPM_DATA.map(([yr, p]) => [xFor(yr), yFor(p)] as const);
const linePath = points
  .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
  .join(" ");

export default function AtmosphericTimeline() {
  const reduced = useReducedMotion();
  const compact = useCompact();
  const tickFont = compact ? 22 : 10;
  const yTicks = compact ? [280, 400] : [280, 320, 360, 400];
  const xTicks = compact ? [1750, 2026] : [1750, 1900, 1950, 2000, 2026];
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
          atmospheric CO₂ · 1750 → 2026
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          NOAA Mauna Loa · ice cores
        </div>
      </div>
      <p
        className="font-body text-ink-soft mb-5"
        style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 720 }}
      >
        +145 ppm in 276 years; +50 ppm in the last 60 alone. The unit that
        measured the problem is the unit we are extending into the response.
      </p>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
        aria-label="Atmospheric CO2 trajectory 1750 to 2026"
      >
        {/* y-axis ticks */}
        {yTicks.map((p) => (
          <g key={p}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(p)}
              y2={yFor(p)}
              stroke="var(--rule)"
              strokeWidth={0.5}
              strokeDasharray="2 4"
            />
            <text
              x={PAD_L - 8}
              y={yFor(p) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={tickFont}
              fill="var(--ink-soft)"
            >
              {p}
            </text>
          </g>
        ))}
        {/* x-axis labels */}
        {xTicks.map((yr) => (
          <text
            key={yr}
            x={xFor(yr)}
            y={H - PAD_B + 18}
            textAnchor="middle"
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize={tickFont}
            fill="var(--ink-soft)"
          >
            {yr}
          </text>
        ))}
        {/* line */}
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
        {/* current marker */}
        <circle
          cx={xFor(2026)}
          cy={yFor(423)}
          r={5}
          fill="var(--moss)"
          stroke="var(--paper-deep)"
          strokeWidth={2}
          style={{
            opacity: drawn ? 1 : 0,
            transition: "opacity 280ms ease-out 1400ms",
          }}
        />
        <text
          x={xFor(2026) - 6}
          y={yFor(423) - 12}
          textAnchor="end"
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={tickFont}
          letterSpacing={1.4}
          fill="var(--moss)"
          style={{ opacity: drawn ? 1 : 0, transition: "opacity 280ms ease-out 1500ms" }}
        >
          422.8 PPM
        </text>
      </svg>
    </div>
  );
}
