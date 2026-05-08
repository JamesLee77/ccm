import { useEffect, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Props = {
  size?: number;
  count?: number;
  /** Initial counter value at the hub. */
  startCount?: number;
};

const RADIUS = 88;
const HUB_R = 28;
const VIEW = 240;

/**
 * Animated mining network — concentric rotating rings with pulsing
 * data-flow lines from satellite nodes to the central hub. Hub
 * displays a live-ticking minted counter.
 *
 * All animation is CSS keyframes + setInterval; `prefers-reduced-motion`
 * collapses everything to the static state.
 */
export default function MiningNetwork({
  size = 320,
  count = 7,
  startCount = 1284003,
}: Props) {
  const reduced = useReducedMotion();
  const [counter, setCounter] = useState(startCount);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(
      () => setCounter((c) => c + 1),
      4200,
    );
    return () => window.clearInterval(id);
  }, [reduced]);

  const satellites = Array.from({ length: count }).map((_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      i,
      x: Math.cos(a) * RADIUS,
      y: Math.sin(a) * RADIUS,
      delay: (i * 4) / count, // 4s loop, staggered
    };
  });

  return (
    <div
      style={{ width: size, height: size, position: "relative" }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox={`-${VIEW / 2} -${VIEW / 2} ${VIEW} ${VIEW}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="mn-flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--moss)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--moss)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--moss)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* outer rotating ring — slow, mechanical */}
        <g
          className="mn-spin-slow"
          style={{ transformOrigin: "center" } as React.CSSProperties}
        >
          <circle
            cx={0}
            cy={0}
            r={RADIUS + 18}
            fill="none"
            stroke="var(--rule)"
            strokeWidth={0.6}
            strokeDasharray="2 6"
          />
        </g>

        {/* mid orbit ring */}
        <circle
          cx={0}
          cy={0}
          r={RADIUS}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={0.5}
        />

        {/* satellite nodes + data lines */}
        {satellites.map((s) => (
          <g key={s.i}>
            {/* base spoke */}
            <line
              x1={0}
              y1={0}
              x2={s.x}
              y2={s.y}
              stroke="var(--rule)"
              strokeWidth={0.6}
            />
            {/* pulsing data flow */}
            <line
              x1={s.x}
              y1={s.y}
              x2={0}
              y2={0}
              stroke="var(--moss)"
              strokeWidth={1.4}
              strokeLinecap="round"
              className="mn-flow"
              style={
                {
                  animationDelay: `${s.delay}s`,
                } as React.CSSProperties
              }
            />
            {/* satellite dot */}
            <circle
              cx={s.x}
              cy={s.y}
              r={6}
              fill="var(--paper)"
              stroke="var(--moss)"
              strokeWidth={1.2}
              className="mn-pulse"
              style={
                {
                  animationDelay: `${s.delay}s`,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                } as React.CSSProperties
              }
            />
          </g>
        ))}

        {/* hub */}
        <circle
          cx={0}
          cy={0}
          r={HUB_R}
          fill="var(--ink)"
          stroke="var(--moss)"
          strokeWidth={1.4}
        />
        <text
          x={0}
          y={-4}
          textAnchor="middle"
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={7}
          letterSpacing={1}
          fill="var(--moss)"
        >
          MINTED
        </text>
        <text
          x={0}
          y={9}
          textAnchor="middle"
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={9}
          fontWeight={500}
          letterSpacing={0.5}
          fill="var(--paper)"
        >
          {counter.toLocaleString()}
        </text>
      </svg>

      <style>{`
        @keyframes mn-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes mn-flow-anim {
          0% { stroke-dasharray: 0 200; stroke-dashoffset: 0; opacity: 0; }
          20% { opacity: 0.9; }
          80% { stroke-dasharray: 24 200; stroke-dashoffset: -200; opacity: 0.9; }
          100% { stroke-dasharray: 24 200; stroke-dashoffset: -240; opacity: 0; }
        }
        @keyframes mn-pulse-anim {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.6); }
        }
        .mn-spin-slow { animation: mn-spin 60s linear infinite; }
        .mn-flow {
          animation: mn-flow-anim 4s linear infinite;
          stroke-dasharray: 0 200;
        }
        .mn-pulse { animation: mn-pulse-anim 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .mn-spin-slow, .mn-flow, .mn-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
