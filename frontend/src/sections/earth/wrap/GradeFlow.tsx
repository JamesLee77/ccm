import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

// Hypothetical vault composition over Y0–Y10. FIFR retires lowest grade
// first, so CCM-D shrinks rapidly while CCM-A accretes.
type Snapshot = {
  year: number; // Y0..Y10
  a: number;
  b: number;
  c: number;
  d: number;
};

const SERIES: Snapshot[] = [
  { year: 0, a: 12, b: 18, c: 32, d: 38 },
  { year: 1, a: 16, b: 22, c: 32, d: 30 },
  { year: 2, a: 21, b: 27, c: 30, d: 22 },
  { year: 3, a: 26, b: 30, c: 27, d: 17 },
  { year: 4, a: 32, b: 31, c: 24, d: 13 },
  { year: 5, a: 38, b: 32, c: 21, d: 9 },
  { year: 6, a: 43, b: 31, c: 19, d: 7 },
  { year: 7, a: 48, b: 30, c: 17, d: 5 },
  { year: 8, a: 52, b: 29, c: 15, d: 4 },
  { year: 9, a: 56, b: 27, c: 14, d: 3 },
  { year: 10, a: 59, b: 26, c: 13, d: 2 },
];

const GRADES = [
  { id: "a", color: "var(--ink)", label: "CCM-A" },
  { id: "b", color: "var(--moss)", label: "CCM-B" },
  { id: "c", color: "var(--moss-2)", label: "CCM-C" },
  { id: "d", color: "var(--rule)", label: "CCM-D" },
] as const;

const W = 880;
const H = 320;
const PAD_L = 56;
const PAD_R = 80;
const PAD_T = 24;
const PAD_B = 48;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

const xFor = (year: number) =>
  PAD_L + (year / (SERIES.length - 1)) * innerW;
const yFor = (pct: number) => PAD_T + (1 - pct / 100) * innerH;

// Pre-compute area paths per grade. Stack is bottom-up: D then C then B then A.
const stackedPaths = (() => {
  // For each snapshot accumulate cumulative bottom for each grade.
  // Order from bottom: d, c, b, a
  const layerOrder = ["d", "c", "b", "a"] as const;
  const result: Record<string, string> = {};

  // For each layer build top + bottom polylines.
  layerOrder.forEach((g, idx) => {
    const tops: [number, number][] = [];
    const bottoms: [number, number][] = [];
    SERIES.forEach((snap) => {
      const cumulativeBelow = layerOrder
        .slice(0, idx)
        .reduce((acc, l) => acc + (snap[l] as number), 0);
      const cumulativeIncl = cumulativeBelow + (snap[g] as number);
      tops.push([xFor(snap.year), yFor(cumulativeIncl)]);
      bottoms.push([xFor(snap.year), yFor(cumulativeBelow)]);
    });
    const topPath = tops.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
    const bottomPath = bottoms
      .reverse()
      .map((p, i) => `${i === 0 ? "L" : "L"} ${p[0]} ${p[1]}`)
      .join(" ");
    result[g] = `${topPath} ${bottomPath} Z`;
  });
  return result;
})();

export default function GradeFlow() {
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
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          fifr · vault grade composition · Y0 → Y10
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          self-correcting
        </div>
      </div>
      <p
        className="font-body text-ink-soft mt-2 mb-6"
        style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 720 }}
      >
        Standard unwrap retires the oldest, lowest-grade NFT first. Over time
        the vault average rises automatically — no governance vote required.
      </p>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
        aria-label="Vault grade composition over 10 years"
      >
        {/* Y axis ticks 0/25/50/75/100 */}
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke="var(--rule)"
              strokeWidth={0.5}
              strokeDasharray={tick === 0 ? "" : "2 4"}
            />
            <text
              x={PAD_L - 8}
              y={yFor(tick) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={10}
              fill="var(--ink-soft)"
            >
              {tick}%
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {SERIES.map((snap) => (
          <text
            key={snap.year}
            x={xFor(snap.year)}
            y={H - PAD_B + 18}
            textAnchor="middle"
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize={10}
            fill="var(--ink-soft)"
          >
            Y{snap.year}
          </text>
        ))}

        {/* Stacked areas */}
        {(["d", "c", "b", "a"] as const).map((g, idx) => {
          const grade = GRADES.find((x) => x.id === g)!;
          const delay = idx * 200;
          return (
            <path
              key={g}
              d={stackedPaths[g]}
              fill={grade.color}
              opacity={drawn ? (g === "d" || g === "c" ? 0.5 : 1) : 0}
              style={{
                transition: reduced
                  ? "none"
                  : `opacity 700ms ease-out ${delay}ms, clip-path 1100ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
                clipPath: drawn ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
              }}
            />
          );
        })}

        {/* Right-side legend */}
        {GRADES.map((g, i) => (
          <g key={g.id}>
            <rect
              x={W - PAD_R + 10}
              y={PAD_T + i * 24}
              width={12}
              height={12}
              fill={g.color}
              opacity={g.id === "c" || g.id === "d" ? 0.5 : 1}
            />
            <text
              x={W - PAD_R + 28}
              y={PAD_T + i * 24 + 10}
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={10}
              letterSpacing={1.4}
              fill="var(--ink-soft)"
            >
              {g.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Endpoint summary */}
      <div
        className="grid mt-6 pt-5 border-t border-rule"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}
      >
        {GRADES.map((g) => {
          const start = SERIES[0]![g.id as keyof Snapshot] as number;
          const end = SERIES[SERIES.length - 1]![g.id as keyof Snapshot] as number;
          const delta = end - start;
          const sign = delta > 0 ? "+" : "";
          return (
            <div key={g.id}>
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-1">
                {g.label}
              </div>
              <div
                className="font-display text-ink"
                style={{ fontSize: 22, fontWeight: 500 }}
              >
                {start}% → {end}%
              </div>
              <div
                className="font-mono text-[11px] tracking-[0.06em]"
                style={{
                  color:
                    delta > 0
                      ? "var(--moss)"
                      : delta < 0
                        ? "var(--clay)"
                        : "var(--ink-soft)",
                  marginTop: 4,
                }}
              >
                {sign}
                {delta} pts over 10y
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
