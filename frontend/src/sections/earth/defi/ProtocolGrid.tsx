type Protocol = {
  name: string;
  group: string;
  use: string;
};

const PROTOCOLS: Protocol[] = [
  // ERC-20 protocols
  { name: "Uniswap", group: "AMM", use: "$CCM/USDC, $CCM/ETH primary pools" },
  { name: "Curve", group: "AMM", use: "$CCM/USDC stable pool" },
  { name: "Balancer", group: "AMM", use: "Weighted index baskets" },
  { name: "Aave", group: "Lending", use: "$CCM as collateral asset" },
  { name: "Compound", group: "Lending", use: "$CCM borrow market" },
  { name: "Yearn", group: "Yield", use: "$CCM-A vault aggregator" },
  { name: "Pendle", group: "Yield", use: "$CCM yield PT/YT split" },
  // ERC-1155 protocols
  { name: "OpenSea", group: "NFT market", use: "P2P NFT listings" },
  { name: "Blur", group: "NFT market", use: "Pro-trader NFT listings" },
  { name: "NFTfi", group: "NFT lending", use: "External NFT-collateral loans" },
  { name: "Sudoswap", group: "NFT AMM", use: "NFT pools without listings" },
  { name: "Reservoir", group: "Aggregator", use: "Cross-marketplace API + indexer" },
];

export default function ProtocolGrid() {
  return (
    <>
      {/* Desktop: full table */}
      <div
        className="border border-rule hidden md:block"
        style={{ background: "var(--paper-deep)" }}
      >
        <div
          className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
          style={{
            gridTemplateColumns: "1fr 1fr 2fr",
            gap: 16,
            padding: "16px 24px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <span className="text-moss">protocol</span>
          <span>group</span>
          <span>use case</span>
        </div>
        {PROTOCOLS.map((p, i) => (
          <div
            key={p.name}
            className="grid items-baseline transition-colors hover:bg-paper"
            style={{
              gridTemplateColumns: "1fr 1fr 2fr",
              gap: 16,
              padding: "16px 24px",
              borderBottom: i < PROTOCOLS.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <span
              className="font-display text-ink"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {p.name}
            </span>
            <span className="font-mono text-moss" style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
              {p.group}
            </span>
            <span className="font-body text-ink-soft" style={{ fontSize: 13 }}>
              {p.use}
            </span>
          </div>
        ))}
      </div>
      {/* Mobile: stacked cards */}
      <div
        className="md:hidden border border-rule"
        style={{ background: "var(--paper-deep)" }}
      >
        {PROTOCOLS.map((p, i) => (
          <div
            key={p.name}
            style={{
              padding: "16px 20px",
              borderBottom: i < PROTOCOLS.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <div className="flex items-center gap-3 mb-1">
              <span
                className="font-display text-ink"
                style={{ fontSize: 15, fontWeight: 500 }}
              >
                {p.name}
              </span>
              <span
                className="ml-auto font-mono text-moss"
                style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}
              >
                {p.group}
              </span>
            </div>
            <div className="font-body text-ink-soft" style={{ fontSize: 13, lineHeight: 1.45 }}>
              {p.use}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
