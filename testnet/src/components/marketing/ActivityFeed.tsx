import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, type Address, type Hex } from "viem";
import { SANDBOX, EXPLORER } from "../../lib/contracts";
import {
  publicClient,
  usePolling,
  getScanRange,
  transferSingleEvent,
  stakedEvent,
  rewardClaimedEvent,
  unstakedEvent,
  nodeRegisteredEvent,
} from "../../lib/onchain";
import { onActivityPing } from "../../lib/activityBus";

type FeedRow = {
  blockNumber: bigint;
  txHash: Hex;
  kind: "mint" | "stake" | "claim" | "unstake" | "register";
  who: Address;
  detail: string;
};

function truncAddr(a: Address): string { return a.slice(0, 6) + "…" + a.slice(-4); }
function fmtCcm(v: bigint): string { return Number(formatUnits(v, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " CCM"; }

async function loadFeed(): Promise<FeedRow[]> {
  const { from, to } = await getScanRange();
  const [mints, stakes, claims, unstakes, regs] = await Promise.all([
    publicClient.getLogs({ address: SANDBOX.ccmSandboxNFT, event: transferSingleEvent, args: { from: "0x0000000000000000000000000000000000000000" as Address }, fromBlock: from, toBlock: to }),
    publicClient.getLogs({ address: SANDBOX.ccmSandboxStaking, event: stakedEvent, fromBlock: from, toBlock: to }),
    publicClient.getLogs({ address: SANDBOX.ccmSandboxStaking, event: rewardClaimedEvent, fromBlock: from, toBlock: to }),
    publicClient.getLogs({ address: SANDBOX.ccmSandboxStaking, event: unstakedEvent, fromBlock: from, toBlock: to }),
    publicClient.getLogs({ address: SANDBOX.nodeRegistry, event: nodeRegisteredEvent, fromBlock: from, toBlock: to }),
  ]);
  const rows: FeedRow[] = [];
  for (const l of mints) {
    const a = (l as unknown as { args: { to: Address; value: bigint; id: bigint } }).args;
    rows.push({ blockNumber: l.blockNumber!, txHash: l.transactionHash!, kind: "mint", who: a.to, detail: `#${a.id.toString()} × ${a.value.toString()}` });
  }
  for (const l of stakes) {
    const a = (l as unknown as { args: { user: Address; amount: bigint } }).args;
    rows.push({ blockNumber: l.blockNumber!, txHash: l.transactionHash!, kind: "stake", who: a.user, detail: fmtCcm(a.amount) });
  }
  for (const l of claims) {
    const a = (l as unknown as { args: { user: Address; amount: bigint } }).args;
    rows.push({ blockNumber: l.blockNumber!, txHash: l.transactionHash!, kind: "claim", who: a.user, detail: fmtCcm(a.amount) });
  }
  for (const l of unstakes) {
    const a = (l as unknown as { args: { user: Address; amount: bigint } }).args;
    rows.push({ blockNumber: l.blockNumber!, txHash: l.transactionHash!, kind: "unstake", who: a.user, detail: fmtCcm(a.amount) });
  }
  for (const l of regs) {
    const a = (l as unknown as { args: { owner: Address; label: string } }).args;
    rows.push({ blockNumber: l.blockNumber!, txHash: l.transactionHash!, kind: "register", who: a.owner, detail: a.label });
  }
  rows.sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : b.blockNumber < a.blockNumber ? -1 : 0));
  return rows.slice(0, 10);
}

export default function ActivityFeed() {
  const { t } = useTranslation();
  const [pingCounter, setPingCounter] = useState(0);
  useEffect(() => {
    return onActivityPing(() => setPingCounter((n) => n + 1));
  }, []);
  const feed = usePolling(loadFeed, 15000, [pingCounter]);
  const labelFor = (k: FeedRow["kind"]): string => t(`feed.${k}`);

  return (
    <section style={{ marginBottom: 64 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--moss)", marginBottom: 12 }}>
        {t("feed.title")}
      </div>
      <p style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.6, margin: "0 0 24px 0", maxWidth: 720 }}>
        {t("feed.subtitle")}
      </p>
      <div style={{ border: "1px solid var(--rule)", background: "var(--paper-deep)" }}>
        {!feed.data || feed.data.length === 0 ? (
          <div style={{ padding: "20px 24px", color: "var(--ink-soft)", fontSize: 13 }}>
            {feed.isLoading ? "…" : t("feed.empty")}
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {feed.data.map((row, i) => (
              <li key={`${row.txHash}-${i}`} style={{ padding: "12px 24px", borderTop: i === 0 ? "none" : "1px solid var(--rule)", display: "grid", gridTemplateColumns: "80px 1fr 1fr 80px", gap: 16, alignItems: "center", fontSize: 13 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--moss)" }}>{labelFor(row.kind)}</span>
                <span style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace", color: "var(--ink-soft)" }}>{truncAddr(row.who)}</span>
                <span style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>{row.detail}</span>
                <a href={`${EXPLORER}/tx/${row.txHash}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--moss)", justifySelf: "end" }}>
                  {t("feed.tx")} ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
