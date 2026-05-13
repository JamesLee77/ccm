import { useTranslation } from "react-i18next";
import { type Address, type Hex } from "viem";
import { SANDBOX, EXPLORER } from "../../lib/contracts";
import {
  publicClient,
  usePolling,
  getScanRange,
  mintedEvent,
} from "../../lib/onchain";

type Row = {
  blockNumber: bigint;
  txHash: Hex;
  to: Address;
  id: bigint;
  grade: number;
  vintage: number;
  tonnage: bigint;
  timestamp: number;
};

const GRADES = ["A", "B", "C", "D"] as const;
const MAX_ROWS = 8;

function truncAddr(a: Address): string {
  return a.slice(0, 6) + "…" + a.slice(-4);
}

function timeAgo(secondsAgo: number): string {
  if (secondsAgo < 60) return `${Math.max(0, Math.floor(secondsAgo))}s ago`;
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  return `${Math.floor(secondsAgo / 86400)}d ago`;
}

async function loadMints(): Promise<Row[]> {
  const { from, to } = await getScanRange();
  const logs = await publicClient.getLogs({
    address: SANDBOX.ccmSandboxNFT,
    event: mintedEvent,
    fromBlock: from,
    toBlock: to,
  });
  logs.sort((a, b) =>
    b.blockNumber! > a.blockNumber! ? 1 : b.blockNumber! < a.blockNumber! ? -1 : 0,
  );
  const top = logs.slice(0, MAX_ROWS);

  // Resolve block timestamps in parallel (small N).
  const blocks = await Promise.all(
    top.map((l) => publicClient.getBlock({ blockNumber: l.blockNumber! })),
  );

  return top.map((l, i) => {
    const args = (l as unknown as {
      args: { to: Address; id: bigint; grade: number; vintage: number; tonnage: bigint };
    }).args;
    return {
      blockNumber: l.blockNumber!,
      txHash: l.transactionHash!,
      to: args.to,
      id: args.id,
      grade: Number(args.grade),
      vintage: Number(args.vintage),
      tonnage: args.tonnage,
      timestamp: Number(blocks[i].timestamp),
    };
  });
}

export default function MiningTimeline() {
  const { t } = useTranslation();
  const rows = usePolling(loadMints, 20000, []);
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
        {t("miningTimeline.title")}
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
        {t("miningTimeline.subtitle")}
      </p>
      <div style={{ border: "1px solid var(--rule)", background: "var(--paper-deep)" }}>
        {!rows.data || rows.data.length === 0 ? (
          <div style={{ padding: "20px 24px", color: "var(--ink-soft)", fontSize: 13 }}>
            {rows.isLoading ? "…" : t("miningTimeline.empty")}
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {rows.data.map((row, i) => (
              <li
                key={`${row.txHash}-${row.id.toString()}`}
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
                  {t("miningTimeline.grade")} {GRADES[row.grade] ?? "?"}
                </span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                    color: "var(--ink-soft)",
                  }}
                >
                  {truncAddr(row.to)}
                </span>
                <span style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>
                  {row.tonnage.toString()}t · {row.vintage} · {timeAgo(now - row.timestamp)}
                </span>
                <a
                  href={`${EXPLORER}/tx/${row.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, color: "var(--moss)", justifySelf: "end" }}
                >
                  {t("miningTimeline.tx")} ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
