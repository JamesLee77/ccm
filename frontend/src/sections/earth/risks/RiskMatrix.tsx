import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Risk = {
  id: string;
  domain: string;
  /** 1 (rare) … 5 (likely) */
  likelihood: number;
  /** 1 (low) … 5 (severe) */
  impact: number;
  summary: string;
  mitigations: string[];
};

export const RISKS: Risk[] = [
  {
    id: "regulatory",
    domain: "Regulatory",
    likelihood: 3,
    impact: 4,
    summary: "Tokens may be classified as securities in some jurisdictions.",
    mitigations: [
      "Foundation in ADGM/BVI (digital-asset friendly)",
      "Per-round KYC for Seed and Series A buyers",
      "External legal counsel engaged through Phase 1",
      "Retail sale restricted in US/CN until clarity",
    ],
  },
  {
    id: "verification",
    domain: "Verification",
    likelihood: 2,
    impact: 5,
    summary: "Faulty or dishonest VVB attestations could mint invalid NFTs.",
    mitigations: [
      "Stake-bonded VVBs slashed on misattestation",
      "M-of-N consensus per credit (varies by grade)",
      "ZK-proof option for sensitive datasets",
      "Dispute layer with bond-and-panel arbitration",
      "CCMInsurance Vault covers invalidation losses",
    ],
  },
  {
    id: "market",
    domain: "Market",
    likelihood: 4,
    impact: 3,
    summary: "Token price volatility, VCM credibility crises.",
    mitigations: [
      "Grading system isolates low-quality from high-quality",
      "Retire ratio and burn telemetry public",
      "Buy-back & burn from protocol revenue",
      "Mining emission front-loaded and capped",
    ],
  },
  {
    id: "technical",
    domain: "Technical",
    likelihood: 2,
    impact: 5,
    summary: "Smart-contract bugs, oracle manipulation, vault exploits.",
    mitigations: [
      "Multi-firm external audit",
      "Immunefi bug bounty (up to $500K)",
      "All contracts non-upgradeable",
      "Chainlink TWAP for oracle pricing",
      "Slither + Mythril static analysis required",
    ],
  },
  {
    id: "defi",
    domain: "DeFi",
    likelihood: 3,
    impact: 3,
    summary: "Vault liquidation cascades, index oracle manipulation.",
    mitigations: [
      "Conservative LTV thresholds by grade (30–70%)",
      "Slow Dutch-auction liquidation",
      "TWAP + multi-oracle for index baskets",
      "Basket composition behind 48h timelock",
    ],
  },
  {
    id: "adoption",
    domain: "Adoption",
    likelihood: 4,
    impact: 4,
    summary: "Verra / Gold Standard lock-in delays CCM uptake.",
    mitigations: [
      "Interop mapping table to legacy registries",
      "ICVCM CCP alignment for top grades",
      "Pilot incentive program for early enterprises",
      "Joint papers with academia and standards bodies",
    ],
  },
];

const W = 480;
const H = 380;
const PAD_L = 56;
const PAD_R = 24;
const PAD_T = 20;
const PAD_B = 56;
const innerW = W - PAD_L - PAD_R;
const innerH = H - PAD_T - PAD_B;

// 1..5 maps to plot area
const xFor = (likelihood: number) =>
  PAD_L + ((likelihood - 1) / 4) * innerW;
const yFor = (impact: number) =>
  PAD_T + (1 - (impact - 1) / 4) * innerH;

type Props = {
  active: string;
  onActive: (id: string) => void;
};

export function RiskMatrix({ active, onActive }: Props) {
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
      style={{ background: "var(--paper-deep)", padding: "24px 28px" }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          risk matrix · likelihood × impact
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          hover a dot
        </div>
      </div>

      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
        aria-label="Risk matrix"
      >
        {/* quadrant fills */}
        <rect
          x={xFor(3)}
          y={PAD_T}
          width={xFor(5) - xFor(3) + 24}
          height={yFor(3) - PAD_T}
          fill="var(--clay)"
          opacity={0.08}
        />
        <rect
          x={PAD_L}
          y={PAD_T}
          width={xFor(3) - PAD_L}
          height={yFor(3) - PAD_T}
          fill="var(--moss)"
          opacity={0.06}
        />

        {/* axis lines */}
        <line
          x1={PAD_L}
          y1={H - PAD_B}
          x2={W - PAD_R}
          y2={H - PAD_B}
          stroke="var(--rule)"
          strokeWidth={1}
        />
        <line
          x1={PAD_L}
          y1={PAD_T}
          x2={PAD_L}
          y2={H - PAD_B}
          stroke="var(--rule)"
          strokeWidth={1}
        />

        {/* gridlines */}
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={`g-${v}`}>
            <line
              x1={xFor(v)}
              x2={xFor(v)}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="var(--rule)"
              strokeWidth={0.4}
              strokeDasharray="2 4"
              opacity={v === 1 ? 0 : 0.7}
            />
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(v)}
              y2={yFor(v)}
              stroke="var(--rule)"
              strokeWidth={0.4}
              strokeDasharray="2 4"
              opacity={v === 1 ? 0 : 0.7}
            />
          </g>
        ))}

        {/* axis labels */}
        <text
          x={PAD_L}
          y={H - PAD_B + 22}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={10}
          letterSpacing={1.4}
          fill="var(--ink-soft)"
        >
          rare
        </text>
        <text
          x={W - PAD_R}
          y={H - PAD_B + 22}
          textAnchor="end"
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={10}
          letterSpacing={1.4}
          fill="var(--ink-soft)"
        >
          likely
        </text>
        <text
          x={PAD_L}
          y={H - PAD_B + 38}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={10}
          letterSpacing={2}
          fill="var(--moss)"
        >
          LIKELIHOOD →
        </text>

        <text
          x={20}
          y={PAD_T + 8}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={10}
          letterSpacing={1.4}
          fill="var(--ink-soft)"
        >
          severe
        </text>
        <text
          x={20}
          y={H - PAD_B}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize={10}
          letterSpacing={1.4}
          fill="var(--ink-soft)"
        >
          low
        </text>
        <g
          transform={`rotate(-90 ${22} ${(H - PAD_B - PAD_T) / 2 + PAD_T})`}
        >
          <text
            x={22}
            y={(H - PAD_B - PAD_T) / 2 + PAD_T + 4}
            textAnchor="middle"
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize={10}
            letterSpacing={2}
            fill="var(--moss)"
          >
            ↑ IMPACT
          </text>
        </g>

        {/* risk dots */}
        {RISKS.map((r, i) => {
          const isActive = active === r.id;
          const cx = xFor(r.likelihood);
          const cy = yFor(r.impact);
          const radius = isActive ? 14 : 10;
          return (
            <g key={r.id}>
              <circle
                cx={cx}
                cy={cy}
                r={drawn ? radius : 0}
                fill={isActive ? "var(--moss)" : "var(--paper)"}
                stroke="var(--moss)"
                strokeWidth={1.6}
                style={{
                  cursor: "pointer",
                  transition: reduced
                    ? "none"
                    : `r 320ms ease-out ${i * 80 + 200}ms, fill 220ms ease`,
                }}
                onMouseEnter={() => onActive(r.id)}
                onClick={() => onActive(r.id)}
                tabIndex={0}
                role="button"
                aria-label={r.domain}
              />
              <text
                x={cx + radius + 6}
                y={cy + 4}
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={11}
                letterSpacing={1}
                fill={isActive ? "var(--moss)" : "var(--ink-soft)"}
                style={{ pointerEvents: "none" }}
              >
                {r.domain.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function MitigationDetail({ active }: { active: string }) {
  const risk = RISKS.find((r) => r.id === active) ?? RISKS[0]!;
  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "28px 32px" }}
    >
      <div className="flex items-baseline gap-4 mb-3">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          {risk.domain}
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto">
          L {risk.likelihood}/5 · I {risk.impact}/5
        </div>
      </div>
      <p
        className="font-display text-ink mb-5"
        style={{
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "-0.015em",
          lineHeight: 1.2,
        }}
      >
        {risk.summary}
      </p>
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-3">
        mitigations · {risk.mitigations.length}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {risk.mitigations.map((m) => (
          <li
            key={m}
            className="font-body text-ink border-t border-rule"
            style={{ fontSize: 14, padding: "10px 0", lineHeight: 1.5 }}
          >
            <span className="text-moss" style={{ marginRight: 8 }}>·</span>
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}
