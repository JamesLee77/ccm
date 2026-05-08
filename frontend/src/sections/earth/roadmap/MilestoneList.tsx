import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type MilestoneState = "done" | "current" | "planned";

type Milestone = {
  phase: string;
  label: string;
  detail: string;
  state: MilestoneState;
};

// Curated, calendar-ordered list — investor-relevant moments only.
const MILESTONES: Milestone[] = [
  { phase: "P0", label: "Standard v1.0 published", detail: "CC BY 4.0; mapped to Verra, Gold Standard, ICVCM CCP", state: "done" },
  { phase: "P0", label: "Whitepaper v1.0", detail: "39 pages, 14 chapters, English", state: "done" },
  { phase: "P0", label: "Foundation legal scoping", detail: "ADGM/BVI options narrowed; counsel engaged", state: "done" },
  { phase: "P1", label: "External audit", detail: "Trail of Bits / OpenZeppelin / Quantstamp engagement", state: "current" },
  { phase: "P1", label: "TGE: Seed + Series A", detail: "$0.15 / $0.20, $45M total cap, vesting per round", state: "current" },
  { phase: "P1", label: "AMM seed", detail: "$CCM/USDC + $CCM/ETH on Uniswap V3 (Base)", state: "planned" },
  { phase: "P2", label: "5 CCMine pilot nodes", detail: "1 DAC · 1 mineralization · 1 biochar · 2 afforestation", state: "planned" },
  { phase: "P2", label: "VVB onboarding", detail: "Five Tier-1 VVB institutions live", state: "planned" },
  { phase: "P3", label: "Vault lending GA", detail: "NFT collateral; LTV 30–70% by grade", state: "planned" },
  { phase: "P3", label: "veCCM governance launch", detail: "Lock-and-vote, escrow, treasury rights", state: "planned" },
  { phase: "P4", label: "Multi-chain bridges", detail: "Optimism, Arbitrum, Polygon zkEVM", state: "planned" },
  { phase: "P5", label: "UNFCCC Article 6 alignment", detail: "Native A6.4ER ↔ CCM bridge", state: "planned" },
];

const STATE_META: Record<MilestoneState, { label: string; color: string }> = {
  done: { label: "done", color: "var(--moss)" },
  current: { label: "current", color: "var(--moss-2)" },
  planned: { label: "planned", color: "var(--ink-soft)" },
};

export default function MilestoneList() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
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
      { threshold: 0.15 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <ol
      ref={ref}
      className="border border-rule"
      style={{
        background: "var(--paper-deep)",
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
      <li
        className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
        style={{
          gridTemplateColumns: "60px 80px 1fr 1.4fr",
          gap: 16,
          padding: "16px 24px",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <span>phase</span>
        <span>state</span>
        <span>milestone</span>
        <span>detail</span>
      </li>
      {MILESTONES.map((m, i) => {
        const meta = STATE_META[m.state];
        return (
          <li
            key={`${m.phase}-${m.label}`}
            className="grid items-baseline transition-colors"
            style={{
              gridTemplateColumns: "60px 80px 1fr 1.4fr",
              gap: 16,
              padding: "16px 24px",
              borderBottom:
                i < MILESTONES.length - 1 ? "1px solid var(--rule)" : "none",
              opacity: shown ? 1 : 0,
              transform: shown ? "translateY(0)" : "translateY(6px)",
              transition: reduced
                ? "none"
                : `opacity 280ms ease-out ${i * 50}ms, transform 280ms ease-out ${i * 50}ms`,
            }}
          >
            <span
              className="font-mono text-moss"
              style={{ fontSize: 12, letterSpacing: 1 }}
            >
              {m.phase}
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: meta.color,
              }}
            >
              {/* state pip */}
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  background: meta.color,
                  marginRight: 8,
                  verticalAlign: "middle",
                }}
              />
              {meta.label}
            </span>
            <span
              className="font-display text-ink"
              style={{ fontSize: 15, fontWeight: 500 }}
            >
              {m.label}
            </span>
            <span
              className="font-body text-ink-soft"
              style={{ fontSize: 13, lineHeight: 1.5 }}
            >
              {m.detail}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
