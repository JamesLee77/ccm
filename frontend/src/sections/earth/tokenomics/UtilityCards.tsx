type Utility = {
  id: string;
  num: string;
  label: string;
  body: string;
  /** Inline pictogram in 32x32 viewBox. */
  icon: React.ReactNode;
};

const UTILITIES: Utility[] = [
  {
    id: "settlement",
    num: "01",
    label: "Settlement",
    body: "Native unit of account for CCM marketplaces. Buy, retire, or transfer; no wrap layer required.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={16} cy={16} r={10} />
        <path d="M11 13h10M11 19h10M14 10v12M18 10v12" />
      </g>
    ),
  },
  {
    id: "staking",
    num: "02",
    label: "VVB / CCMiner staking",
    body: "Bond $CCM to qualify as a verifier or miner. Misattestations are slashed; honest work earns fees.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x={8} y={14} width={16} height={12} rx={1} />
        <path d="M11 14v-3a5 5 0 0 1 10 0v3" />
        <line x1={16} y1={18} x2={16} y2={22} />
      </g>
    ),
  },
  {
    id: "governance",
    num: "03",
    label: "Governance · veCCM",
    body: "Lock $CCM up to 4 years for vote-escrowed weight. Determines fees, vault LTV, VVB whitelist.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4l9 5v7c0 5-4 9-9 11-5-2-9-6-9-11V9z" />
        <path d="M12 16l3 3 6-6" />
      </g>
    ),
  },
  {
    id: "discount",
    num: "04",
    label: "Fee discount",
    body: "Pay marketplace fees in $CCM and receive an automatic 50% discount. Routes net buy-pressure into the token.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1={9} y1={23} x2={23} y2={9} />
        <circle cx={11} cy={11} r={2.4} />
        <circle cx={21} cy={21} r={2.4} />
      </g>
    ),
  },
  {
    id: "defi",
    num: "05",
    label: "DeFi liquidity primitive",
    body: "Composable across Uniswap, Curve, Aave, Pendle. Wrap NFT → ERC-20 unlocks AMM and lending markets.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={9} cy={9} r={4} />
        <circle cx={23} cy={23} r={4} />
        <path d="M12 12l8 8M9 13v6h4M23 19v-6h-4" />
      </g>
    ),
  },
];

export default function UtilityCards() {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}
    >
      {UTILITIES.map((u) => (
        <div
          key={u.id}
          className="border border-rule transition-all"
          style={{
            background: "var(--paper-deep)",
            padding: "24px 20px",
            cursor: "default",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--moss)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--rule)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-moss" style={{ width: 28, height: 28 }}>
              <svg viewBox="0 0 32 32" width="28" height="28">
                {u.icon}
              </svg>
            </div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-moss">
              {u.num}
            </div>
          </div>
          <div
            className="font-display text-ink mt-3 mb-2"
            style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}
          >
            {u.label}
          </div>
          <div
            className="font-body text-ink-soft"
            style={{ fontSize: 13, lineHeight: 1.55 }}
          >
            {u.body}
          </div>
        </div>
      ))}
    </div>
  );
}
