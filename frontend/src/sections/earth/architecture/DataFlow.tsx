import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Source = {
  id: string;
  label: string;
  detail: string;
  iconRef: string;
};

const SOURCES: Source[] = [
  { id: "sentinel", label: "Sentinel-2", detail: "10m optical, 5-day revisit", iconRef: "sat" },
  { id: "planet", label: "Planet Labs", detail: "3m daily revisit", iconRef: "sat" },
  { id: "gedi", label: "GEDI LiDAR", detail: "forest biomass", iconRef: "lidar" },
  { id: "iot", label: "IoT mesh", detail: "soil C, methane flux", iconRef: "sensor" },
  { id: "dac", label: "DAC monitors", detail: "real-time sequestration", iconRef: "sensor" },
];

type Stage = {
  id: string;
  label: string;
  body: string;
  layer: string;
};

const STAGES: Stage[] = [
  {
    id: "oracle",
    label: "Oracle aggregator",
    body: "Chainlink Functions normalises and batches all source feeds into signed onchain payloads.",
    layer: "L3",
  },
  {
    id: "vvb",
    label: "VVB consensus",
    body: "M-of-N stake-bonded validators co-sign each measurement — slashed on dishonest attestation.",
    layer: "L4",
  },
  {
    id: "mint",
    label: "CCM-NFT mint",
    body: "ERC-1155 issuance with vintage, grade, project, signatures embedded as immutable metadata.",
    layer: "L5",
  },
  {
    id: "wrap",
    label: "$CCM wrap",
    body: "Optional 1:1 lock into the non-custodial vault, exposing the credit to AMM and lending markets.",
    layer: "L6",
  },
];

const W = 880;
const H = 360;

export default function DataFlow() {
  const reduced = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const [shown, setShown] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const root = ref.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
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

  // Layout — sources stacked on the left, stages flowing horizontally on the right.
  const sourceX = 60;
  const sourceTop = 40;
  const sourceGap = 56;

  const stageY = 180;
  const stageStart = 280;
  const stageGap = 160;

  const sourcePoints = SOURCES.map((_, i) => ({
    x: sourceX,
    y: sourceTop + i * sourceGap,
  }));
  const oracleX = stageStart;
  const oracleY = stageY;

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-5">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          atmospheric measurement → onchain unit
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          L3 → L4 → L5 → L6
        </div>
      </div>

      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
        aria-label="Data flow from satellites and sensors through verification to onchain CCM"
      >
        <defs>
          <marker
            id="df-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10 Z" fill="var(--moss)" />
          </marker>
          <linearGradient id="df-flow-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--moss)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--moss)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--moss)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* sources column label */}
        <text
          x={sourceX}
          y={20}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={10}
          letterSpacing={1.6}
          fill="var(--moss)"
        >
          PHYSICS · L3
        </text>

        {/* sources */}
        {SOURCES.map((s, i) => {
          const p = sourcePoints[i]!;
          return (
            <g
              key={s.id}
              style={{
                opacity: shown ? 1 : 0,
                transform: shown ? "translateY(0)" : "translateY(6px)",
                transition: reduced
                  ? "none"
                  : `opacity 360ms ease-out ${i * 90}ms, transform 360ms ease-out ${i * 90}ms`,
              }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={5}
                fill="var(--paper-deep)"
                stroke="var(--moss)"
                strokeWidth={1.4}
              />
              <text
                x={p.x + 14}
                y={p.y + 4}
                fontFamily="Space Grotesk, system-ui, sans-serif"
                fontSize={13}
                fontWeight={500}
                fill="var(--ink)"
              >
                {s.label}
              </text>
              <text
                x={p.x + 14}
                y={p.y + 20}
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={10}
                fill="var(--ink-soft)"
              >
                {s.detail}
              </text>

              {/* feed line into oracle */}
              <line
                x1={p.x + 110}
                y1={p.y}
                x2={oracleX - 56}
                y2={oracleY}
                stroke="var(--rule)"
                strokeWidth={0.8}
              />
              <line
                x1={p.x + 110}
                y1={p.y}
                x2={oracleX - 56}
                y2={oracleY}
                stroke="url(#df-flow-grad)"
                strokeWidth={1.4}
                strokeDasharray="40 240"
                className="df-flow"
                style={
                  {
                    animationDelay: `${i * 0.5}s`,
                  } as React.CSSProperties
                }
              />
            </g>
          );
        })}

        {/* stages */}
        {STAGES.map((stage, idx) => {
          const x = oracleX + idx * stageGap;
          const isLast = idx === STAGES.length - 1;
          const baseDelay = SOURCES.length * 90 + idx * 180;
          return (
            <g
              key={stage.id}
              style={{
                opacity: shown ? 1 : 0,
                transition: reduced
                  ? "none"
                  : `opacity 420ms ease-out ${baseDelay}ms`,
              }}
            >
              <rect
                x={x - 56}
                y={stageY - 32}
                width={130}
                height={64}
                fill="var(--paper)"
                stroke={idx === 0 ? "var(--moss)" : "var(--rule)"}
                strokeWidth={idx === 0 ? 1.4 : 1}
              />
              <text
                x={x - 48}
                y={stageY - 14}
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={9}
                letterSpacing={1.4}
                fill="var(--moss)"
              >
                {stage.layer}
              </text>
              <text
                x={x - 48}
                y={stageY + 2}
                fontFamily="Space Grotesk, system-ui, sans-serif"
                fontSize={13}
                fontWeight={500}
                fill="var(--ink)"
              >
                {stage.label}
              </text>
              <text
                x={x - 48}
                y={stageY + 20}
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={9}
                fill="var(--ink-soft)"
              >
                {stage.layer === "L5" ? "ERC-1155 mint" : stage.layer === "L6" ? "ERC-20 wrap" : ""}
              </text>

              {/* arrow to next stage */}
              {!isLast ? (
                <line
                  x1={x + 76}
                  y1={stageY}
                  x2={x + stageGap - 58}
                  y2={stageY}
                  stroke="var(--moss)"
                  strokeWidth={1.4}
                  markerEnd="url(#df-arrow)"
                  className="df-flow"
                  style={
                    {
                      animationDelay: `${(idx + 1) * 0.7}s`,
                    } as React.CSSProperties
                  }
                />
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Stage descriptions row */}
      <div
        className="grid mt-6 pt-6 border-t border-rule"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}
      >
        {STAGES.map((stage) => (
          <div key={stage.id}>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-2">
              {stage.layer} · {stage.label.toLowerCase()}
            </div>
            <div
              className="font-body text-ink-soft"
              style={{ fontSize: 13, lineHeight: 1.55 }}
            >
              {stage.body}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes df-flow-anim {
          0% { stroke-dashoffset: 0; opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { stroke-dashoffset: -280; opacity: 0; }
        }
        .df-flow { animation: df-flow-anim 4s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .df-flow { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
