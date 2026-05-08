import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Contract = {
  name: string;
  role: string;
};

type Group = {
  id: string;
  label: string;
  color: string;
  contracts: Contract[];
};

const GROUPS: Group[] = [
  {
    id: "core",
    label: "core",
    color: "var(--moss)",
    contracts: [
      { name: "CCMToken.sol", role: "ERC-20, 5B cap, AccessControl" },
      { name: "CCMCreditNFT.sol", role: "ERC-1155 source-of-truth" },
      { name: "CCMVesting.sol", role: "Linear vesting w/ cliff" },
      { name: "CCMStaking.sol", role: "Price-elastic yield pool" },
      { name: "CCMTGESale.sol", role: "Multi-tier round runner" },
    ],
  },
  {
    id: "defi",
    label: "defi",
    color: "var(--moss-2)",
    contracts: [
      { name: "CCMWrapper.sol", role: "NFT ↔ ERC-20 1:1 wrap" },
      { name: "CCMGradeWrapper.sol", role: "$CCM-A/B/C/D pools" },
      { name: "CCMVault.sol", role: "NFT-collateral lending" },
      { name: "CCMFractional.sol", role: "Large NFT splitter" },
      { name: "CCMNFTStaking.sol", role: "Hold-to-Earn yield" },
      { name: "CCMRetireRebate.sol", role: "Retire-to-Earn payouts" },
      { name: "CCMInsurance.sol", role: "Dispute insurance pool" },
      { name: "CCMIndex.sol", role: "Basket index tokens" },
    ],
  },
  {
    id: "governance",
    label: "governance",
    color: "var(--sky)",
    contracts: [
      { name: "CCMVotingEscrow.sol", role: "veCCM lock-and-vote" },
      { name: "CCMGovernor.sol", role: "Proposal · vote · timelock" },
      { name: "CCMTimelock.sol", role: "48h admin action delay" },
    ],
  },
  {
    id: "verification",
    label: "verification",
    color: "var(--clay)",
    contracts: [
      { name: "CCMVVBRegistry.sol", role: "VVB whitelist + slash" },
      { name: "CCMOracleAggregator.sol", role: "Chainlink + custom feeds" },
      { name: "CCMDispute.sol", role: "Dispute proposer + panel" },
    ],
  },
];

export default function ContractMap() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(reduced);
  const [active, setActive] = useState<string | null>(null);

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
      {GROUPS.map((group, gi) => (
        <div
          key={group.id}
          className="border border-rule"
          style={{
            background: "var(--paper-deep)",
            padding: "24px 28px",
            opacity: shown ? 1 : 0,
            transform: shown ? "translateY(0)" : "translateY(8px)",
            transition: reduced
              ? "none"
              : `opacity 480ms ease-out ${gi * 120}ms, transform 480ms ease-out ${gi * 120}ms`,
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <span
              aria-hidden
              style={{ width: 14, height: 14, background: group.color }}
            />
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
              {group.label}
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-soft ml-auto">
              {group.contracts.length} contracts
            </span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {group.contracts.map((c, i) => {
              const id = `${group.id}-${c.name}`;
              const isActive = active === id;
              return (
                <li
                  key={c.name}
                  className="grid items-baseline border-t border-rule"
                  style={{
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    padding: "10px 0",
                    background: isActive ? "var(--paper)" : "transparent",
                    transition: "background-color 180ms ease",
                    opacity: shown ? 1 : 0,
                    transitionProperty: "background-color, opacity",
                    transitionDuration: "180ms, 360ms",
                    transitionTimingFunction: "ease, ease-out",
                    transitionDelay: shown ? `0ms, ${gi * 120 + 200 + i * 40}ms` : "0ms, 0ms",
                  }}
                  onMouseEnter={() => setActive(id)}
                  onMouseLeave={() => setActive(null)}
                  tabIndex={0}
                  onFocus={() => setActive(id)}
                  onBlur={() => setActive(null)}
                >
                  <code
                    className="font-mono text-ink"
                    style={{ fontSize: 13 }}
                  >
                    {c.name}
                  </code>
                  <span
                    className="font-mono text-ink-soft"
                    style={{ fontSize: 11, textAlign: "right" }}
                  >
                    {c.role}
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
