import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

// 4 axes per grade, scored 0–5.
type Score = {
  permanence: number;
  additionality: number;
  mrv: number;
  leakage: number;
};

type Grade = {
  id: string;
  letter: string;
  color: string;
  score: Score;
  category: string;
};

const GRADES: Grade[] = [
  {
    id: "a",
    letter: "CCM-A",
    color: "var(--moss)",
    category: "DAC · mineralization",
    score: { permanence: 5, additionality: 5, mrv: 5, leakage: 5 },
  },
  {
    id: "b",
    letter: "CCM-B",
    color: "var(--moss-2)",
    category: "biochar · weathering",
    score: { permanence: 4, additionality: 5, mrv: 5, leakage: 4 },
  },
  {
    id: "c",
    letter: "CCM-C",
    color: "var(--sky)",
    category: "reforestation",
    score: { permanence: 3, additionality: 3, mrv: 4, leakage: 3 },
  },
  {
    id: "d",
    letter: "CCM-D",
    color: "var(--clay)",
    category: "REDD+ · legacy",
    score: { permanence: 2, additionality: 2, mrv: 3, leakage: 2 },
  },
];

// Wider viewBox + per-axis textAnchor keeps side labels from clipping.
const SIZE = 240;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_MAX = 76;

const AXES = [
  { id: "permanence", label: "Permanence", angle: -Math.PI / 2, anchor: "middle" as const, dy: -2 },
  { id: "additionality", label: "Additionality", angle: 0, anchor: "end" as const, dy: 4 },
  { id: "mrv", label: "MRV", angle: Math.PI / 2, anchor: "middle" as const, dy: 12 },
  { id: "leakage", label: "Leakage ↓", angle: Math.PI, anchor: "start" as const, dy: 4 },
] as const;

function pointFor(axis: number, score: number): [number, number] {
  const r = (score / 5) * R_MAX;
  return [CX + Math.cos(axis) * r, CY + Math.sin(axis) * r];
}

export default function GradeRadar() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(reduced);
  useEffect(() => {
    if (reduced) return setShown(true);
    const root = ref.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
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

  return (
    <div
      ref={ref}
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          grade radar · 4 axes scored 0–5
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          permanence · additionality · MRV · low leakage
        </div>
      </div>
      <div
        className="grid mt-6"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}
      >
        {GRADES.map((g, gi) => {
          const path = AXES
            .map((a, i) => {
              const [x, y] = pointFor(a.angle, g.score[a.id]);
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ") + " Z";
          return (
            <div key={g.id}>
              <div className="text-center mb-2">
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss">
                  {g.letter}
                </div>
                <div
                  className="font-display text-ink"
                  style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em" }}
                >
                  {g.category}
                </div>
              </div>
              <svg
                width="100%"
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                style={{ display: "block" }}
                aria-label={`${g.letter} grade radar`}
              >
                {/* concentric rings */}
                {[1, 2, 3, 4, 5].map((ring) => (
                  <circle
                    key={ring}
                    cx={CX}
                    cy={CY}
                    r={(ring / 5) * R_MAX}
                    fill="none"
                    stroke="var(--rule)"
                    strokeWidth={0.5}
                    opacity={ring === 5 ? 1 : 0.5}
                  />
                ))}
                {/* axis lines */}
                {AXES.map((a) => {
                  const [x, y] = pointFor(a.angle, 5);
                  return (
                    <line
                      key={a.id}
                      x1={CX}
                      y1={CY}
                      x2={x}
                      y2={y}
                      stroke="var(--rule)"
                      strokeWidth={0.5}
                    />
                  );
                })}
                {/* score polygon */}
                <path
                  d={path}
                  fill={g.color}
                  fillOpacity={0.25}
                  stroke={g.color}
                  strokeWidth={1.4}
                  style={{
                    opacity: shown ? 1 : 0,
                    transform: shown ? "scale(1)" : "scale(0.6)",
                    transformOrigin: `${CX}px ${CY}px`,
                    transition: reduced
                      ? "none"
                      : `opacity 600ms ease-out ${gi * 140}ms, transform 600ms cubic-bezier(0.22, 1, 0.36, 1) ${gi * 140}ms`,
                  }}
                />
                {/* axis labels — per-axis textAnchor + dy to keep side
                    labels inside the SVG box on every viewport. */}
                {AXES.map((a) => {
                  const [x, y] = pointFor(a.angle, 6.6);
                  return (
                    <text
                      key={a.id}
                      x={x}
                      y={y + a.dy}
                      textAnchor={a.anchor}
                      fontFamily="JetBrains Mono, ui-monospace, monospace"
                      fontSize={8}
                      letterSpacing={1.2}
                      fill="var(--ink-soft)"
                    >
                      {a.label}
                    </text>
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
