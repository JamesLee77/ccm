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

type Kind = "mint" | "stake" | "claim" | "unstake" | "register";

type FeedRow = {
  blockNumber: bigint;
  txHash: Hex;
  kind: Kind;
  who: Address;
  detail: string;
  timestamp: number;
};

const KIND_ORDER: Kind[] = ["mint", "stake", "claim", "unstake", "register"];
const KIND_COLOR: Record<Kind, string> = {
  mint: "var(--moss)",
  stake: "var(--clay)",
  claim: "var(--moss-2)",
  unstake: "var(--sky)",
  register: "var(--ink-soft)",
};

const MAX_LIST = 10;
const MAX_LOAD = 50;
const BUCKETS = 6;

function truncAddr(a: Address): string { return a.slice(0, 6) + "…" + a.slice(-4); }
function fmtCcm(v: bigint): string { return Number(formatUnits(v, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " CCM"; }

function timeAgo(secondsAgo: number): string {
  if (secondsAgo < 60) return `${Math.max(0, Math.floor(secondsAgo))}s ago`;
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  return `${Math.floor(secondsAgo / 86400)}d ago`;
}

async function loadFeed(): Promise<FeedRow[]> {
  const { from, to } = await getScanRange();
  const [mints, stakes, claims, unstakes, regs] = await Promise.all([
    publicClient.getLogs({ address: SANDBOX.ccmSandboxNFT, event: transferSingleEvent, args: { from: "0x0000000000000000000000000000000000000000" as Address }, fromBlock: from, toBlock: to }),
    publicClient.getLogs({ address: SANDBOX.ccmSandboxStaking, event: stakedEvent, fromBlock: from, toBlock: to }),
    publicClient.getLogs({ address: SANDBOX.ccmSandboxStaking, event: rewardClaimedEvent, fromBlock: from, toBlock: to }),
    publicClient.getLogs({ address: SANDBOX.ccmSandboxStaking, event: unstakedEvent, fromBlock: from, toBlock: to }),
    publicClient.getLogs({ address: SANDBOX.nodeRegistry, event: nodeRegisteredEvent, fromBlock: from, toBlock: to }),
  ]);
  type Pending = { row: Omit<FeedRow, "timestamp">; block: bigint };
  const pending: Pending[] = [];
  for (const l of mints) {
    const a = (l as unknown as { args: { to: Address; value: bigint; id: bigint } }).args;
    pending.push({ row: { blockNumber: l.blockNumber!, txHash: l.transactionHash!, kind: "mint", who: a.to, detail: `#${a.id.toString()} × ${a.value.toString()}` }, block: l.blockNumber! });
  }
  for (const l of stakes) {
    const a = (l as unknown as { args: { user: Address; amount: bigint } }).args;
    pending.push({ row: { blockNumber: l.blockNumber!, txHash: l.transactionHash!, kind: "stake", who: a.user, detail: fmtCcm(a.amount) }, block: l.blockNumber! });
  }
  for (const l of claims) {
    const a = (l as unknown as { args: { user: Address; amount: bigint } }).args;
    pending.push({ row: { blockNumber: l.blockNumber!, txHash: l.transactionHash!, kind: "claim", who: a.user, detail: fmtCcm(a.amount) }, block: l.blockNumber! });
  }
  for (const l of unstakes) {
    const a = (l as unknown as { args: { user: Address; amount: bigint } }).args;
    pending.push({ row: { blockNumber: l.blockNumber!, txHash: l.transactionHash!, kind: "unstake", who: a.user, detail: fmtCcm(a.amount) }, block: l.blockNumber! });
  }
  for (const l of regs) {
    const a = (l as unknown as { args: { owner: Address; label: string } }).args;
    pending.push({ row: { blockNumber: l.blockNumber!, txHash: l.transactionHash!, kind: "register", who: a.owner, detail: a.label }, block: l.blockNumber! });
  }
  pending.sort((a, b) => (b.block > a.block ? 1 : b.block < a.block ? -1 : 0));
  const top = pending.slice(0, MAX_LOAD);
  // Approximate timestamps from block height (Base Sepolia ~2 s/block) — see
  // OraclePriceHistory for the rationale. Avoids fan-out of N parallel
  // eth_getBlockByNumber that public RPC rate-limits.
  const nowSec = Math.floor(Date.now() / 1000);
  return top.map((p) => {
    const blocksAgo = Number(to - p.block);
    return { ...p.row, timestamp: nowSec - blocksAgo * 2 };
  });
}

// --- Chart -----------------------------------------------------------------

const V_W = 600;
const V_H = 160;
const PAD_L = 32;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 26;

function ActivityChart({ rows, now }: { rows: FeedRow[]; now: number }) {
  if (rows.length === 0) return null;
  const tMax = now;
  // Bucket span: cover from oldest row to now, but at least 60min.
  const tMin = Math.min(now - 3600, ...rows.map((r) => r.timestamp));
  const span = Math.max(60, tMax - tMin);
  const bucketSec = span / BUCKETS;

  // counts[bucketIdx][kind]
  const counts: Record<Kind, number>[] = Array.from({ length: BUCKETS }, () => ({ mint: 0, stake: 0, claim: 0, unstake: 0, register: 0 }));
  for (const r of rows) {
    let idx = Math.floor((r.timestamp - tMin) / bucketSec);
    if (idx < 0) idx = 0;
    if (idx >= BUCKETS) idx = BUCKETS - 1;
    counts[idx][r.kind] += 1;
  }
  const yMax = Math.max(1, ...counts.map((c) => KIND_ORDER.reduce((a, k) => a + c[k], 0)));

  const colW = (V_W - PAD_L - PAD_R) / BUCKETS;
  const barW = colW * 0.7;
  const chartTop = PAD_T;
  const chartBottom = V_H - PAD_B;
  const chartH = chartBottom - chartTop;

  const yTicks = yMax <= 4
    ? [0, 1, 2, 3, 4].slice(0, yMax + 1)
    : [0, Math.ceil(yMax / 2), yMax];

  const xTicks = [
    { idx: 0, label: timeAgo(now - tMin) },
    { idx: BUCKETS / 2, label: timeAgo(now - (tMin + span / 2)) },
    { idx: BUCKETS, label: "now" },
  ];

  return (
    <div style={{ background: "var(--paper-deep)", border: "1px solid var(--rule)", padding: "16px 20px", marginBottom: 16 }}>
      <svg viewBox={`0 0 ${V_W} ${V_H}`} preserveAspectRatio="none" style={{ width: "100%", height: 160, display: "block" }}>
        {/* y grid */}
        {yTicks.map((v) => {
          const yy = chartBottom - (v / yMax) * chartH;
          return (
            <g key={v}>
              <line x1={PAD_L} x2={V_W - PAD_R} y1={yy} y2={yy} stroke="var(--rule)" strokeWidth={0.5} />
              <text x={PAD_L - 6} y={yy + 3} textAnchor="end" fontSize={9} fontFamily="JetBrains Mono, ui-monospace, monospace" fill="var(--ink-soft)">{v}</text>
            </g>
          );
        })}
        {/* stacked bars */}
        {counts.map((c, i) => {
          const xCenter = PAD_L + colW * (i + 0.5);
          const xLeft = xCenter - barW / 2;
          let yCursor = chartBottom;
          return (
            <g key={i}>
              {KIND_ORDER.map((k) => {
                const v = c[k];
                if (v === 0) return null;
                const h = (v / yMax) * chartH;
                yCursor -= h;
                return (
                  <rect
                    key={k}
                    x={xLeft}
                    y={yCursor}
                    width={barW}
                    height={h}
                    fill={KIND_COLOR[k]}
                    opacity={0.85}
                  />
                );
              })}
            </g>
          );
        })}
        {/* x labels */}
        {xTicks.map((xt, i) => {
          const xx = PAD_L + colW * xt.idx;
          return (
            <text key={i} x={xx} y={V_H - PAD_B + 14} textAnchor="middle" fontSize={9} fontFamily="JetBrains Mono, ui-monospace, monospace" fill="var(--ink-soft)">{xt.label}</text>
          );
        })}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 8, fontSize: 11, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>
        {KIND_ORDER.map((k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-soft)" }}>
            <span style={{ width: 10, height: 10, background: KIND_COLOR[k], display: "inline-block" }} />
            <span style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Section ---------------------------------------------------------------

export default function ActivityFeed() {
  const { t } = useTranslation();
  const [pingCounter, setPingCounter] = useState(0);
  useEffect(() => {
    return onActivityPing(() => setPingCounter((n) => n + 1));
  }, []);
  const feed = usePolling(loadFeed, 15000, [pingCounter]);
  const now = Math.floor(Date.now() / 1000);
  const data = feed.data ?? [];
  const labelFor = (k: Kind): string => t(`feed.${k}`);

  return (
    <section style={{ marginBottom: 64 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--moss)", marginBottom: 12 }}>
        {t("feed.title")}
      </div>
      <p style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.6, margin: "0 0 24px 0", maxWidth: 720 }}>
        {t("feed.subtitle")}
      </p>
      <ActivityChart rows={data} now={now} />
      <div style={{ border: "1px solid var(--rule)", background: "var(--paper-deep)" }}>
        {data.length === 0 ? (
          <div style={{ padding: "20px 24px", color: "var(--ink-soft)", fontSize: 13 }}>
            {feed.isLoading ? "…" : t("feed.empty")}
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {data.slice(0, MAX_LIST).map((row, i) => (
              <li key={`${row.txHash}-${i}`} className="r-feed-row" style={{ padding: "12px 24px", borderTop: i === 0 ? "none" : "1px solid var(--rule)", fontSize: 13 }}>
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
