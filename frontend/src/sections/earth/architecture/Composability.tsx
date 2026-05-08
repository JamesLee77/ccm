import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Protocol = {
  name: string;
  use: string;
};

type Lane = {
  id: string;
  label: string;
  standard: string;
  protocols: Protocol[];
};

const LANES: Lane[] = [
  {
    id: "erc20",
    label: "$CCM ERC-20",
    standard: "fungible · liquidity",
    protocols: [
      { name: "Uniswap V3/V4", use: "$CCM/USDC, $CCM/ETH AMM pools" },
      { name: "Curve", use: "$CCM/USDC stable pool" },
      { name: "Balancer", use: "Weighted multi-asset baskets" },
      { name: "Aave / Compound", use: "$CCM as collateral asset" },
      { name: "Yearn / Pendle", use: "Yield aggregation, PT/YT split" },
    ],
  },
  {
    id: "erc1155",
    label: "CCM-NFT ERC-1155",
    standard: "vintage · grade · provenance",
    protocols: [
      { name: "OpenSea / Blur", use: "P2P marketplace listings" },
      { name: "NFTfi / BendDAO", use: "External NFT-collateral lending" },
      { name: "Sudoswap", use: "NFT AMM pools" },
      { name: "Reservoir", use: "Aggregator API + indexer" },
      { name: "Foundation / Manifold", use: "Curated drops + creator tooling" },
    ],
  },
];

export default function Composability() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
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
      { threshold: 0.2 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className="grid"
      style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}
    >
      {LANES.map((lane, li) => (
        <div
          key={lane.id}
          className="border border-rule"
          style={{
            background: "var(--paper-deep)",
            padding: "28px 32px",
          }}
        >
          <div className="flex items-baseline justify-between mb-1">
            <div
              className="font-display text-ink"
              style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em" }}
            >
              {lane.label}
            </div>
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss">
              {lane.standard}
            </span>
          </div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-soft mb-5">
            5 protocols · plug-and-play
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {lane.protocols.map((p, i) => {
              const delay = li * 120 + 220 + i * 80;
              return (
                <li
                  key={p.name}
                  className="grid border-t border-rule items-baseline"
                  style={{
                    gridTemplateColumns: "180px 1fr",
                    gap: 12,
                    padding: "12px 0",
                    opacity: shown ? 1 : 0,
                    transform: shown ? "translateY(0)" : "translateY(6px)",
                    transition: reduced
                      ? "none"
                      : `opacity 320ms ease-out ${delay}ms, transform 320ms ease-out ${delay}ms`,
                  }}
                >
                  <span
                    className="font-mono text-ink"
                    style={{ fontSize: 13, fontWeight: 500 }}
                  >
                    {p.name}
                  </span>
                  <span
                    className="font-mono text-ink-soft"
                    style={{ fontSize: 12, lineHeight: 1.5 }}
                  >
                    {p.use}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
