import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

export type AllocationSlice = {
  id: string;
  label: string;
  pct: number;
  tokens: string;
  note: string;
  color: string;
};

export const ALLOCATION: AllocationSlice[] = [
  { id: "mining", label: "Mining Rewards", pct: 40, tokens: "2.0B", note: "10-year decelerating emission", color: "var(--moss)" },
  { id: "foundation", label: "Foundation", pct: 18, tokens: "900M", note: "4Y vesting + 1Y cliff", color: "var(--moss-2)" },
  { id: "strategic", label: "Strategic / Partners", pct: 10, tokens: "500M", note: "4Y vesting + 1Y cliff", color: "var(--sky)" },
  { id: "liquidity", label: "Liquidity / AMM", pct: 9, tokens: "450M", note: "Unlocked at TGE", color: "#7ba9c4" },
  { id: "treasury", label: "Treasury", pct: 8, tokens: "400M", note: "DAO-controlled", color: "var(--clay)" },
  { id: "tge", label: "Public Sale (TGE)", pct: 5, tokens: "250M", note: "Seed + Series A", color: "#e88a4e" },
  { id: "staking", label: "Staking Pool", pct: 5, tokens: "250M", note: "Price-elastic yield", color: "#a3823b" },
  { id: "team", label: "Team & Advisors", pct: 5, tokens: "250M", note: "4Y vesting + 1Y cliff", color: "var(--ink-soft)" },
];

const SIZE = 320;
const RADIUS = 132;
const THICKNESS = 28;
const CIRC = 2 * Math.PI * RADIUS;

type Props = {
  active: string | null;
  onHover: (id: string | null) => void;
};

/**
 * Animated 8-segment allocation donut. Segments draw in with
 * stroke-dasharray on viewport entry. Hovering an arc lifts it and
 * dims the rest. The center reads "5.0B HARD CAP".
 */
export default function AllocationRing({ active, onHover }: Props) {
  const reduced = useReducedMotion();
  const containerRef = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setDrawn(true);
      return;
    }
    const root = containerRef.current;
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

  let cumulative = 0;
  const arcs = ALLOCATION.map((slice) => {
    const start = cumulative;
    cumulative += slice.pct;
    return {
      ...slice,
      start,
      end: cumulative,
      length: (slice.pct / 100) * CIRC,
      offset: (start / 100) * CIRC,
    };
  });

  return (
    <div
      style={{ width: SIZE, height: SIZE, position: "relative" }}
      onMouseLeave={() => onHover(null)}
    >
      <svg
        ref={containerRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        {/* base ring */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={THICKNESS}
          opacity={0.3}
        />
        {/* arcs — rotated -90 so they start at 12 o'clock */}
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {arcs.map((arc, i) => {
            const dim = active !== null && active !== arc.id;
            const isActive = active === arc.id;
            return (
              <circle
                key={arc.id}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={isActive ? THICKNESS + 6 : THICKNESS}
                strokeDasharray={
                  drawn
                    ? `${arc.length - 2} ${CIRC - arc.length + 2}`
                    : `0 ${CIRC}`
                }
                strokeDashoffset={-arc.offset}
                style={{
                  transition: reduced
                    ? "none"
                    : `stroke-dasharray 1100ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 90}ms, stroke-width 220ms ease, opacity 220ms ease`,
                  opacity: dim ? 0.35 : 1,
                  cursor: "pointer",
                }}
                onMouseEnter={() => onHover(arc.id)}
                onFocus={() => onHover(arc.id)}
                tabIndex={0}
                role="button"
                aria-label={`${arc.label} ${arc.pct}%`}
              />
            );
          })}
        </g>

        {/* center label — non-interactive so it never intercepts arc hovers */}
        <g style={{ pointerEvents: "none" }}>
          <text
            x={SIZE / 2}
            y={SIZE / 2 - 14}
            textAnchor="middle"
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize={10}
            letterSpacing={2}
            fill="var(--moss)"
          >
            HARD CAP
          </text>
          <text
            x={SIZE / 2}
            y={SIZE / 2 + 18}
            textAnchor="middle"
            fontFamily="Space Grotesk, system-ui, sans-serif"
            fontSize={42}
            fontWeight={500}
            letterSpacing={-1}
            fill="var(--ink)"
          >
            5.0B
          </text>
          <text
            x={SIZE / 2}
            y={SIZE / 2 + 38}
            textAnchor="middle"
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize={10}
            letterSpacing={1}
            fill="var(--ink-soft)"
          >
            {active
              ? `${arcs.find((a) => a.id === active)?.pct}% · ${arcs.find((a) => a.id === active)?.tokens}`
              : "$CCM ERC-20"}
          </text>
        </g>
      </svg>
    </div>
  );
}
