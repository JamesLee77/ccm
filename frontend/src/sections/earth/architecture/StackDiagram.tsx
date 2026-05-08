import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Layer = {
  id: string;
  l: string;
  name: string;
  starred?: boolean;
  responsibility: string;
  body: string;
  parts: string[];
};

// L1 at the bottom, L8 at the top — same orientation as the original
// table but rendered as stacked blocks for the diagram.
const LAYERS: Layer[] = [
  {
    id: "l1",
    l: "L1",
    name: "Settlement",
    responsibility: "settlement · finality",
    body: "Base (Coinbase L2). EVM-compatible, low gas, OP Stack. The rest of the stack settles here.",
    parts: ["Base mainnet", "Base Sepolia (test)", "OP Stack roadmap"],
  },
  {
    id: "l2",
    l: "L2",
    name: "Mining (CCMine)",
    responsibility: "issuance",
    body: "Physical, verification, and storage nodes. Each verified tonne reduced becomes a mint.",
    parts: ["Physical miners", "Verification miners", "Storage miners"],
  },
  {
    id: "l3",
    l: "L3",
    name: "Oracle / MRV",
    responsibility: "physics evidence",
    body: "Satellites, IoT sensors, LiDAR. Every measurement is signed at source and replayed onchain.",
    parts: ["Sentinel-2", "Planet Labs", "IoT mesh", "GEDI LiDAR"],
  },
  {
    id: "l4",
    l: "L4",
    name: "Verification",
    responsibility: "consensus",
    body: "VVB validators reach M-of-N agreement. Stake-bonded; bad attestations are slashed.",
    parts: ["VVB consensus", "ZK proof option", "Dispute layer"],
  },
  {
    id: "l5",
    l: "L5",
    name: "NFT Registry",
    starred: true,
    responsibility: "traceability",
    body: "ERC-1155 source-of-truth. Vintage, grade, project, signatures baked into immutable metadata.",
    parts: ["CCM-NFT contract", "Vintage / grade index", "Retire-once invariant"],
  },
  {
    id: "l6",
    l: "L6",
    name: "Token Layer",
    responsibility: "liquidity",
    body: "ERC-20 $CCM is a 1:1 fungible wrapper backed by NFTs locked in a non-custodial vault.",
    parts: ["$CCM ERC-20 (5B cap)", "veCCM lock-and-vote", "Vault wrapper"],
  },
  {
    id: "l7",
    l: "L7",
    name: "DeFi Primitives",
    starred: true,
    responsibility: "composability",
    body: "Wrap, vault, lend, fractionalize, retire-to-earn, insure, index. Eight composable building blocks.",
    parts: ["Wrap / Unwrap", "Grade wrappers", "Vault lending", "Index baskets"],
  },
  {
    id: "l8",
    l: "L8",
    name: "Application",
    responsibility: "user surface",
    body: "Wallet, marketplace, ESG dashboards, retirement certificates — the end-user touchpoints.",
    parts: ["Marketplace", "ESG dashboard", "Retirement certificates", "Mobile wallet"],
  },
];

export default function StackDiagram() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(reduced);
  const [active, setActive] = useState<string>("l5");

  useEffect(() => {
    if (reduced) {
      setRevealed(true);
      return;
    }
    const root = ref.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  // Render top-to-bottom: L8 first visually, L1 last.
  const ordered = [...LAYERS].reverse();
  const activeLayer = LAYERS.find((l) => l.id === active);

  return (
    <div
      ref={ref}
      className="grid"
      style={{ gridTemplateColumns: "1.4fr 1fr", gap: 24 }}
    >
      {/* Stack column */}
      <div className="grid" style={{ gap: 4 }}>
        {ordered.map((layer, i) => {
          const isActive = active === layer.id;
          const dim = active && active !== layer.id;
          // Reveal order: bottom-up, so L1 first, L8 last → invert i.
          const revealDelay = (LAYERS.length - 1 - i) * 90;
          return (
            <button
              key={layer.id}
              type="button"
              onMouseEnter={() => setActive(layer.id)}
              onFocus={() => setActive(layer.id)}
              className="border text-left transition-all"
              style={{
                background: layer.starred
                  ? "var(--paper-deep)"
                  : "var(--paper-deep)",
                borderColor: isActive ? "var(--moss)" : "var(--rule)",
                padding: "16px 20px",
                cursor: "pointer",
                opacity: revealed ? (dim ? 0.55 : 1) : 0,
                transform: revealed ? "translateY(0)" : "translateY(8px)",
                transition: reduced
                  ? "none"
                  : `opacity 480ms ease-out ${revealDelay}ms, transform 480ms ease-out ${revealDelay}ms, border-color 220ms ease, background-color 220ms ease`,
                outline: "none",
              }}
              aria-label={`${layer.l} ${layer.name}`}
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss" style={{ width: 32 }}>
                  {layer.l}
                </span>
                <span
                  className="font-display text-ink"
                  style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}
                >
                  {layer.name}
                  {layer.starred ? (
                    <span className="text-moss ml-2">★</span>
                  ) : null}
                </span>
                <span
                  className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto"
                >
                  {layer.responsibility}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <div
        className="border border-rule sticky"
        style={{
          background: "var(--paper-deep)",
          padding: "28px 32px",
          alignSelf: "start",
          top: 120,
          minHeight: 320,
        }}
      >
        {activeLayer ? (
          <>
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
              {activeLayer.l} · {activeLayer.responsibility}
            </div>
            <div
              className="font-display text-ink mt-3 mb-4"
              style={{
                fontSize: 28,
                fontWeight: 500,
                letterSpacing: "-0.015em",
                lineHeight: 1.1,
              }}
            >
              {activeLayer.name}
              {activeLayer.starred ? (
                <span className="text-moss ml-2">★</span>
              ) : null}
            </div>
            <p
              className="font-body text-ink-soft mb-5"
              style={{ fontSize: 15, lineHeight: 1.6 }}
            >
              {activeLayer.body}
            </p>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-3">
              components
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {activeLayer.parts.map((p) => (
                <li
                  key={p}
                  className="font-mono text-ink border-t border-rule"
                  style={{ fontSize: 13, padding: "8px 0", lineHeight: 1.5 }}
                >
                  {p}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
