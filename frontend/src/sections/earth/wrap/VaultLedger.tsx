import { useTestnetSnapshot, fmtWad, fmtInt, fmtRatio, WAD } from "../../../lib/testnet";

/**
 * Vault state — read from the Base Sepolia sandbox vault every 15s.
 * Shows `—` while loading and keeps the last good value on RPC errors.
 */
export default function VaultLedger() {
  const { data, error } = useTestnetSnapshot();

  const cells = [
    { id: "locked", label: "Tonnes locked in vault", value: fmtInt(data?.vaultTonnage) },
    { id: "circulating", label: "$CCM supply", value: fmtWad(data?.ccmSupply) },
    {
      id: "ratio",
      label: "Lockup ratio (vault / supply)",
      value: fmtRatio(data ? data.vaultTonnage * WAD : undefined, data?.ccmSupply),
    },
    { id: "nodes", label: "CCMine nodes registered", value: fmtInt(data?.nodeCount) },
  ];

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--panel, var(--paper-deep))", padding: "32px 40px" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          testnet · vault · base sepolia
        </span>
        {error ? (
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-clay">
            · rpc unreachable
          </span>
        ) : null}
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto">
          non-custodial · invariant 1:1
        </span>
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: "var(--rule)",
        }}
      >
        {cells.map((c) => (
          <div
            key={c.id}
            style={{ background: "var(--panel, var(--paper-deep))", padding: "20px 24px" }}
          >
            <div
              className="font-display text-ink"
              style={{
                fontSize: 36,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {c.value}
            </div>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft mt-2">
              {c.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
