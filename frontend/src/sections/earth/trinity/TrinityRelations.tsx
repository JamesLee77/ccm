import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

const W = 880;
const H = 280;

export default function TrinityRelations() {
  const reduced = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
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
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          relations · how the three layers compose
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          standard → unit → wrapper
        </div>
      </div>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
        aria-label="Trinity relations diagram"
      >
        <defs>
          <marker
            id="tr-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10 Z" fill="var(--moss)" />
          </marker>
        </defs>

        {/* three boxes */}
        {[
          { x: 40, label: "CCM Network", sub: "the standard", body: "Foundation, governance, VVB" },
          { x: 320, label: "CCM", sub: "the unit", body: "1 ton CO₂e verified" },
          { x: 600, label: "$CCM", sub: "the wrapper", body: "ERC-20 fungible" },
        ].map((b, i) => (
          <g
            key={b.label}
            style={{
              opacity: shown ? 1 : 0,
              transform: shown ? "translateX(0)" : "translateX(-12px)",
              transition: reduced
                ? "none"
                : `opacity 480ms ease-out ${i * 200}ms, transform 480ms ease-out ${i * 200}ms`,
            }}
          >
            <rect
              x={b.x}
              y={70}
              width={240}
              height={140}
              fill="var(--paper)"
              stroke={i === 1 ? "var(--moss)" : "var(--rule)"}
              strokeWidth={i === 1 ? 1.6 : 1}
            />
            <text
              x={b.x + 24}
              y={102}
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={10}
              letterSpacing={1.6}
              fill="var(--moss)"
            >
              {b.sub.toUpperCase()}
            </text>
            <text
              x={b.x + 24}
              y={138}
              fontFamily="Space Grotesk, system-ui, sans-serif"
              fontSize={26}
              fontWeight={500}
              letterSpacing={-0.5}
              fill="var(--ink)"
            >
              {b.label}
            </text>
            <text
              x={b.x + 24}
              y={170}
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={11}
              fill="var(--ink-soft)"
            >
              {b.body}
            </text>
          </g>
        ))}

        {/* connections */}
        <line
          x1={280}
          y1={140}
          x2={316}
          y2={140}
          stroke="var(--moss)"
          strokeWidth={1.6}
          markerEnd="url(#tr-arrow)"
          style={{ opacity: shown ? 1 : 0, transition: "opacity 240ms ease-out 600ms" }}
        />
        <line
          x1={560}
          y1={140}
          x2={596}
          y2={140}
          stroke="var(--moss)"
          strokeWidth={1.6}
          markerEnd="url(#tr-arrow)"
          style={{ opacity: shown ? 1 : 0, transition: "opacity 240ms ease-out 800ms" }}
        />

        {/* outer label band */}
        <text
          x={160}
          y={56}
          textAnchor="middle"
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={9}
          letterSpacing={1.6}
          fill="var(--ink-soft)"
          style={{ opacity: shown ? 1 : 0, transition: "opacity 240ms ease-out 400ms" }}
        >
          PROTOCOL · GOVERNANCE
        </text>
        <text
          x={440}
          y={56}
          textAnchor="middle"
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={9}
          letterSpacing={1.6}
          fill="var(--ink-soft)"
          style={{ opacity: shown ? 1 : 0, transition: "opacity 240ms ease-out 600ms" }}
        >
          MEASUREMENT · NFT
        </text>
        <text
          x={720}
          y={56}
          textAnchor="middle"
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={9}
          letterSpacing={1.6}
          fill="var(--ink-soft)"
          style={{ opacity: shown ? 1 : 0, transition: "opacity 240ms ease-out 800ms" }}
        >
          LIQUIDITY · ERC-20
        </text>
      </svg>
    </div>
  );
}
