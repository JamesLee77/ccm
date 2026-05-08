type Row = {
  layer: string;
  bitcoin: string;
  ccm: string;
};

const ROWS: Row[] = [
  { layer: "Network", bitcoin: "Bitcoin Network", ccm: "CCM Network" },
  { layer: "Unit", bitcoin: "1 bitcoin (BTC)", ccm: "1 CCM (1 ton CO₂e)" },
  { layer: "Token", bitcoin: "$BTC", ccm: "$CCM (ERC-20)" },
  { layer: "Issuance", bitcoin: "Proof of Work · hash", ccm: "Proof of Carbon Removal · attestation" },
  { layer: "Unit invariant", bitcoin: "21M cap", ccm: "5B token cap · NFT 1:1 backing" },
];

export default function BitcoinAnalogue() {
  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          analogue · bitcoin to CCM
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          same trinity, different physics
        </div>
      </div>
      <p
        className="font-body text-ink-soft mb-6"
        style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 720 }}
      >
        Bitcoin proved that an open network can issue a verifiable digital
        unit governed by transparent rules. CCM applies the same separation —
        network, unit, token — to verified carbon reduction.
      </p>

      <div
        className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-rule"
        style={{ gridTemplateColumns: "180px 1fr 1fr", gap: 24, padding: "12px 0" }}
      >
        <span>layer</span>
        <span>bitcoin</span>
        <span className="text-moss">CCM Network</span>
      </div>
      {ROWS.map((r, i) => (
        <div
          key={r.layer}
          className="grid items-center"
          style={{
            gridTemplateColumns: "180px 1fr 1fr",
            gap: 24,
            padding: "16px 0",
            borderBottom: i < ROWS.length - 1 ? "1px solid var(--rule)" : "none",
          }}
        >
          <div className="font-mono text-moss" style={{ fontSize: 12, letterSpacing: 1.2 }}>
            {r.layer}
          </div>
          <div
            className="font-display text-ink-soft"
            style={{ fontSize: 16, fontWeight: 500 }}
          >
            {r.bitcoin}
          </div>
          <div
            className="font-display text-ink"
            style={{ fontSize: 16, fontWeight: 500 }}
          >
            {r.ccm}
          </div>
        </div>
      ))}
    </div>
  );
}
