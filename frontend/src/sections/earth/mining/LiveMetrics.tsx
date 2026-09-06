import {
  useTestnetSnapshot,
  useRecentMints,
  fmtWad,
  fmtInt,
} from "../../../lib/testnet";

/**
 * Network metrics — read from the Base Sepolia sandbox contracts.
 * Snapshot every 15s, mint-event scan every 30s.
 */
export default function LiveMetrics() {
  const snap = useTestnetSnapshot();
  const mints = useRecentMints();
  const error = snap.error ?? mints.error;

  const cells = [
    { id: "nodes", label: "CCMine nodes registered", value: fmtInt(snap.data?.nodeCount) },
    { id: "mints", label: "NFT mints (last ~1h)", value: fmtInt(mints.data) },
    { id: "staked", label: "$CCM staked", value: fmtWad(snap.data?.totalStaked) },
    { id: "pool", label: "Reward pool remaining", value: fmtWad(snap.data?.poolRemaining) },
  ];

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--panel, var(--paper-deep))", padding: "32px 40px" }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          testnet · network · base sepolia
        </span>
        {error ? (
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-clay">
            · rpc unreachable
          </span>
        ) : null}
        <a
          href="https://testnet.ccmnetwork.net"
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft hover:text-moss ml-auto transition-colors"
        >
          open testnet ↗
        </a>
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
