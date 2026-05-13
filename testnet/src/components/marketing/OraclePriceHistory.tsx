import { useTranslation } from "react-i18next";
import { formatUnits, type Address, type Hex } from "viem";
import { SANDBOX, EXPLORER } from "../../lib/contracts";
import {
  publicClient,
  usePolling,
  getScanRange,
  priceUpdatedEvent,
} from "../../lib/onchain";

type Row = {
  blockNumber: bigint;
  txHash: Hex;
  oracleAddr: Address;
  oldPrice: bigint;
  newPrice: bigint;
  timestamp: number;
};

const MAX_ROWS = 8;

// Map an oracle contract address → human-readable label.
function labelFor(addr: Address): string {
  const a = addr.toLowerCase();
  if (a === SANDBOX.oracleA.toLowerCase()) return "Oracle-A";
  if (a === SANDBOX.oracleB.toLowerCase()) return "Oracle-B";
  if (a === SANDBOX.oracleC.toLowerCase()) return "Oracle-C";
  if (a === SANDBOX.mockPriceOracle.toLowerCase()) return "Oracle-D";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function fmtUsd(v: bigint): string {
  return "$" + Number(formatUnits(v, 18)).toFixed(4);
}

function timeAgo(secondsAgo: number): string {
  if (secondsAgo < 60) return `${Math.max(0, Math.floor(secondsAgo))}s ago`;
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  return `${Math.floor(secondsAgo / 86400)}d ago`;
}

async function loadHistory(): Promise<Row[]> {
  const { from, to } = await getScanRange();
  const addresses: Address[] = [
    SANDBOX.oracleA,
    SANDBOX.oracleB,
    SANDBOX.oracleC,
    SANDBOX.mockPriceOracle,
  ];
  const perOracle = await Promise.all(
    addresses.map((addr) =>
      publicClient.getLogs({ address: addr, event: priceUpdatedEvent, fromBlock: from, toBlock: to }),
    ),
  );
  const flat = perOracle.flat();
  flat.sort((a, b) =>
    b.blockNumber! > a.blockNumber! ? 1 : b.blockNumber! < a.blockNumber! ? -1 : 0,
  );
  const top = flat.slice(0, MAX_ROWS);

  const blocks = await Promise.all(
    top.map((l) => publicClient.getBlock({ blockNumber: l.blockNumber! })),
  );

  return top.map((l, i) => {
    const args = (l as unknown as { args: { oldPrice: bigint; newPrice: bigint } }).args;
    return {
      blockNumber: l.blockNumber!,
      txHash: l.transactionHash!,
      oracleAddr: l.address as Address,
      oldPrice: args.oldPrice,
      newPrice: args.newPrice,
      timestamp: Number(blocks[i].timestamp),
    };
  });
}

export default function OraclePriceHistory() {
  const { t } = useTranslation();
  const rows = usePolling(loadHistory, 20000, []);
  const now = Math.floor(Date.now() / 1000);

  return (
    <section style={{ marginBottom: 64 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--moss)",
          marginBottom: 12,
        }}
      >
        {t("oracleHistory.title")}
      </div>
      <p
        style={{
          fontSize: 15,
          color: "var(--ink-soft)",
          lineHeight: 1.6,
          margin: "0 0 24px 0",
          maxWidth: 720,
        }}
      >
        {t("oracleHistory.subtitle")}
      </p>
      <div style={{ border: "1px solid var(--rule)", background: "var(--paper-deep)" }}>
        {!rows.data || rows.data.length === 0 ? (
          <div style={{ padding: "20px 24px", color: "var(--ink-soft)", fontSize: 13 }}>
            {rows.isLoading ? "…" : t("oracleHistory.empty")}
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {rows.data.map((row, i) => {
              const up = row.newPrice >= row.oldPrice;
              return (
                <li
                  key={`${row.txHash}-${i}`}
                  className="r-feed-row"
                  style={{
                    padding: "12px 24px",
                    borderTop: i === 0 ? "none" : "1px solid var(--rule)",
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--moss)",
                    }}
                  >
                    {labelFor(row.oracleAddr)}
                  </span>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, ui-monospace, monospace",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {timeAgo(now - row.timestamp)}
                  </span>
                  <span style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>
                    {fmtUsd(row.oldPrice)} {up ? "↑" : "↓"} {fmtUsd(row.newPrice)}
                  </span>
                  <a
                    href={`${EXPLORER}/tx/${row.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: "var(--moss)", justifySelf: "end" }}
                  >
                    {t("oracleHistory.tx")} ↗
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
