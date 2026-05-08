import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

export type PhaseState = "done" | "current" | "planned";

export type Phase = {
  id: string;
  num: string;
  title: string;
  when: string;
  body: string;
  deliverables: string[];
  state: PhaseState;
};

export const PHASES: Phase[] = [
  {
    id: "p0",
    num: "0",
    title: "Foundation",
    when: "completed",
    body: "Standard, contracts, and whitepaper drafted before any token activity. Independent legal counsel engaged.",
    deliverables: [
      "CCM Standard v1.0 published",
      "Smart contract drafts (Core, DeFi, Governance, Verification)",
      "Whitepaper v1.0",
      "Foundation entity ADGM scoping",
    ],
    state: "done",
  },
  {
    id: "p1",
    num: "1",
    title: "Mainnet",
    when: "2026 Q3",
    body: "Audit closes, mainnet deploys, TGE rounds run, AMM seeded. Foundation operational.",
    deliverables: [
      "Trail of Bits / OpenZeppelin audit",
      "Base mainnet deployment",
      "TGE: Seed + Series A",
      "$CCM/USDC, $CCM/ETH liquidity seed",
      "Foundation legal & ops live",
    ],
    state: "current",
  },
  {
    id: "p2",
    num: "2",
    title: "Mining + DeFi",
    when: "2026 Q4",
    body: "First operational nodes mint into the network. Wrapper contracts ship for ERC-20 use.",
    deliverables: [
      "5 CCMine pilot nodes",
      "VVB onboarding (5 institutions)",
      "Sentinel-2 + IoT oracle integration",
      "First CCM-A and CCM-C NFT mints",
      "CCMWrapper, GradeWrapper, NFTStaking",
    ],
    state: "planned",
  },
  {
    id: "p3",
    num: "3",
    title: "DeFi full",
    when: "2027 H1",
    body: "Vault lending, fractionalization, indices, insurance, and governance go live.",
    deliverables: [
      "CCMVault (lending) gated rollout",
      "CCMFractional + CCMIndex ($CCM-PRIME)",
      "CCMInsurance pool seeded",
      "veCCM governance launch",
      "External Curve / Aave integration",
    ],
    state: "planned",
  },
  {
    id: "p4",
    num: "4",
    title: "Scale",
    when: "2027 H2 — 2028",
    body: "100+ nodes, multi-chain, multilingual surfaces. Dispute layer hardens.",
    deliverables: [
      "100+ CCMine nodes onchain",
      "Optimism + Arbitrum bridges",
      "Full multilingual front",
      "Dispute layer mainnet",
      "Additional indices ($CCM-FOREST, $CCM-TECH)",
    ],
    state: "planned",
  },
  {
    id: "p5",
    num: "5",
    title: "Standard",
    when: "2028+",
    body: "International standards alignment. Formal interop with Article 6 mechanisms.",
    deliverables: [
      "UNFCCC Article 6 alignment",
      "ISO TC 207 working group",
      "Native A6.4ER ↔ CCM bridge",
      "1,000+ enterprise ESG buyers",
    ],
    state: "planned",
  },
];

const TOTAL_PHASES = PHASES.length;
// Progress = done count + 0.5 if there's a current.
const PROGRESS_RATIO = (() => {
  const done = PHASES.filter((p) => p.state === "done").length;
  const current = PHASES.find((p) => p.state === "current") ? 0.4 : 0;
  return (done + current) / TOTAL_PHASES;
})();

type Props = {
  active: string;
  onActive: (id: string) => void;
};

export function PhaseTrack({ active, onActive }: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
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
      { threshold: 0.3 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px 24px" }}
    >
      <div className="flex items-baseline justify-between mb-10">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          phase track · click to focus
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          {Math.round(PROGRESS_RATIO * 100)}% delivered
        </div>
      </div>

      <div className="relative" style={{ height: 80 }}>
        {/* base track */}
        <div
          className="absolute"
          style={{
            top: 30,
            left: 0,
            right: 0,
            height: 2,
            background: "var(--rule)",
          }}
        />
        {/* progress fill */}
        <div
          className="absolute"
          style={{
            top: 30,
            left: 0,
            height: 2,
            width: drawn ? `${PROGRESS_RATIO * 100}%` : "0%",
            background: "var(--moss)",
            transition: reduced
              ? "none"
              : "width 1400ms cubic-bezier(0.22, 1, 0.36, 1) 200ms",
          }}
        />

        {/* phase nodes */}
        {PHASES.map((phase, i) => {
          const x = (i / (TOTAL_PHASES - 1)) * 100;
          const isActive = active === phase.id;
          const isDone = phase.state === "done";
          const isCurrent = phase.state === "current";

          return (
            <button
              key={phase.id}
              type="button"
              onMouseEnter={() => onActive(phase.id)}
              onClick={() => onActive(phase.id)}
              onFocus={() => onActive(phase.id)}
              aria-label={`Phase ${phase.num} ${phase.title}`}
              className="absolute"
              style={{
                left: `${x}%`,
                top: 0,
                transform: "translateX(-50%)",
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                width: 88,
                textAlign: "center",
                opacity: drawn ? 1 : 0,
                transition: reduced
                  ? "none"
                  : `opacity 320ms ease-out ${i * 80 + 200}ms`,
              }}
            >
              <span
                aria-hidden
                className={isCurrent ? "pt-pulse" : ""}
                style={{
                  display: "inline-block",
                  width: isActive ? 18 : 14,
                  height: isActive ? 18 : 14,
                  background: isDone ? "var(--moss)" : "var(--paper-deep)",
                  border: `2px solid ${
                    isDone || isCurrent ? "var(--moss)" : "var(--rule)"
                  }`,
                  borderRadius: "50%",
                  marginTop: 22,
                  marginBottom: 14,
                  transition: "width 200ms ease, height 200ms ease",
                }}
              />
              <span
                className="block font-mono text-[10px] tracking-[0.14em] uppercase"
                style={{
                  color: isActive ? "var(--moss)" : "var(--ink-soft)",
                }}
              >
                phase {phase.num}
              </span>
              <span
                className="block font-display"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: isActive ? "var(--ink)" : "var(--ink-soft)",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                }}
              >
                {phase.title}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes pt-pulse-anim {
          0%, 100% { box-shadow: 0 0 0 0 var(--moss); }
          50% { box-shadow: 0 0 0 6px transparent; }
        }
        .pt-pulse {
          animation: pt-pulse-anim 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pt-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

export function PhaseDetail({ active }: { active: string }) {
  const phase = PHASES.find((p) => p.id === active) ?? PHASES[1]!;
  const stateColor =
    phase.state === "done"
      ? "var(--moss)"
      : phase.state === "current"
        ? "var(--moss-2)"
        : "var(--ink-soft)";

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline gap-6 mb-1">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          phase {phase.num}
        </div>
        <div
          className="font-mono text-[10px] tracking-[0.14em] uppercase"
          style={{ color: stateColor }}
        >
          · {phase.state}
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto">
          {phase.when}
        </div>
      </div>
      <div
        className="font-display text-ink mb-3"
        style={{
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
        }}
      >
        {phase.title}
      </div>
      <p
        className="font-body text-ink-soft mb-6"
        style={{ fontSize: 16, lineHeight: 1.55, maxWidth: 620 }}
      >
        {phase.body}
      </p>
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-3">
        deliverables
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {phase.deliverables.map((d) => (
          <li
            key={d}
            className="font-mono text-ink border-t border-rule"
            style={{ fontSize: 13, padding: "8px 0", lineHeight: 1.5 }}
          >
            <span className="text-moss" style={{ marginRight: 8 }}>·</span>
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
}
