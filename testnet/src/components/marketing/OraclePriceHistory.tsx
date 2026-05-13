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

const MAX_LIST = 8;
const MAX_LOAD = 50;

type OracleKey = "A" | "B" | "C" | "D";
const ORACLE_LIST: { key: OracleKey; addr: Address; color: string }[] = [
  { key: "A", addr: SANDBOX.oracleA, color: "var(--moss)" },
  { key: "B", addr: SANDBOX.oracleB, color: "var(--clay)" },
  { key: "C", addr: SANDBOX.oracleC, color: "var(--sky)" },
  { key: "D", addr: SANDBOX.mockPriceOracle, color: "var(--moss-2)" },
];

function keyFor(addr: Address): OracleKey | null {
  const a = addr.toLowerCase();
  for (const o of ORACLE_LIST) {
    if (a === o.addr.toLowerCase()) return o.key;
  }
  return null;
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
  const perOracle = await Promise.all(
    ORACLE_LIST.map((o) =>
      publicClient.getLogs({ address: o.addr, event: priceUpdatedEvent, fromBlock: from, toBlock: to }),
    ),
  );
  const flat = perOracle.flat();
  flat.sort((a, b) =>
    b.blockNumber! > a.blockNumber! ? 1 : b.blockNumber! < a.blockNumber! ? -1 : 0,
  );
  const top = flat.slice(0, MAX_LOAD);
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

// --- Chart -----------------------------------------------------------------

const V_W = 600;
const V_H = 160;
const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 26;
const Y_MIN = 0.15;
const Y_MAX = 0.25;

function OraclePriceChart({ rows, now }: { rows: Row[]; now: number }) {
  if (rows.length === 0) return null;

  // Build series per oracle (oldest first). The current price for each
  // oracle is the newPrice of its most recent event; older points are
  // taken from each row's newPrice in chronological order.
  const series = new Map<OracleKey, { t: number; p: number }[]>();
  for (const o of ORACLE_LIST) series.set(o.key, []);
  // rows is newest-first, walk it oldest-first.
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    const k = keyFor(r.oracleAddr);
    if (!k) continue;
    series.get(k)!.push({ t: r.timestamp, p: Number(formatUnits(r.newPrice, 18)) });
  }
  const anyPoints = [...series.values()].some((s) => s.length > 0);
  if (!anyPoints) return null;

  const allTimes = rows.map((r) => r.timestamp);
  const tMin = Math.min(...allTimes);
  const tMax = Math.max(...allTimes, now);
  const tSpan = Math.max(60, tMax - tMin);

  const x = (t: number) => PAD_L + ((t - tMin) / tSpan) * (V_W - PAD_L - PAD_R);
  const y = (p: number) => {
    const clamped = Math.min(Y_MAX, Math.max(Y_MIN, p));
    const t = (clamped - Y_MIN) / (Y_MAX - Y_MIN);
    return V_H - PAD_B - t * (V_H - PAD_T - PAD_B);
  };

  // Right edge of each series extended to "now" so the latest level
  // stays drawn at the right edge.
  const polylines: { key: OracleKey; color: string; points: string }[] = [];
  for (const o of ORACLE_LIST) {
    const pts = series.get(o.key)!;
    if (pts.length === 0) continue;
    const last = pts[pts.length - 1];
    const segments = pts.map((pt) => `${x(pt.t).toFixed(1)},${y(pt.p).toFixed(1)}`);
    segments.push(`${x(now).toFixed(1)},${y(last.p).toFixed(1)}`);
    polylines.push({ key: o.key, color: o.color, points: segments.join(" ") });
  }

  const yRefP = 0.2;
  const yRefY = y(yRefP);
  const yTicks = [0.25, 0.2, 0.15];
  const xTicks = [
    { t: tMin, label: timeAgo(now - tMin) },
    { t: tMin + (tMax - tMin) / 2, label: timeAgo(now - (tMin + (tMax - tMin) / 2)) },
    { t: tMax, label: "now" },
  ];

  return (
    <div style={{ background: "var(--paper-deep)", border: "1px solid var(--rule)", padding: "16px 20px", marginBottom: 16 }}>
      <svg
        viewBox={`0 0 ${V_W} ${V_H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 160, display: "block" }}
      >
        {/* grid */}
        {yTicks.map((yp) => (
          <line key={yp} x1={PAD_L} x2={V_W - PAD_R} y1={y(yp)} y2={y(yp)} stroke="var(--rule)" strokeWidth={0.5} />
        ))}
        {/* $0.20 ref line — emphasized */}
        <line x1={PAD_L} x2={V_W - PAD_R} y1={yRefY} y2={yRefY} stroke="var(--ink-soft)" strokeWidth={0.8} strokeDasharray="4 4" opacity={0.6} />
        {/* Y labels */}
        {yTicks.map((yp) => (
          <text key={yp} x={PAD_L - 6} y={y(yp) + 3} textAnchor="end" fontSize={9} fontFamily="JetBrains Mono, ui-monospace, monospace" fill="var(--ink-soft)">
            ${yp.toFixed(2)}
          </text>
        ))}
        {/* X labels */}
        {xTicks.map((xt, i) => (
          <text key={i} x={x(xt.t)} y={V_H - PAD_B + 14} textAnchor="middle" fontSize={9} fontFamily="JetBrains Mono, ui-monospace, monospace" fill="var(--ink-soft)">
            {xt.label}
          </text>
        ))}
        {/* polylines per oracle */}
        {polylines.map((pl) => (
          <polyline key={pl.key} points={pl.points} fill="none" stroke={pl.color} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 8, fontSize: 11, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>
        {ORACLE_LIST.map((o) => (
          <div key={o.key} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-soft)" }}>
            <span style={{ width: 10, height: 2, background: o.color, display: "inline-block" }} />
            <span>Oracle-{o.key}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-soft)" }}>
          <span style={{ width: 10, height: 0, borderTop: "1px dashed var(--ink-soft)", display: "inline-block" }} />
          <span>$0.20 ref</span>
        </div>
      </div>
    </div>
  );
}

// --- Section ---------------------------------------------------------------

export default function OraclePriceHistory() {
  const { t } = useTranslation();
  const rows = usePolling(loadHistory, 20000, []);
  const now = Math.floor(Date.now() / 1000);
  const data = rows.data ?? [];

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
      <OraclePriceChart rows={data} now={now} />
      <div style={{ border: "1px solid var(--rule)", background: "var(--paper-deep)" }}>
        {data.length === 0 ? (
          <div style={{ padding: "20px 24px", color: "var(--ink-soft)", fontSize: 13 }}>
            {rows.isLoading ? "…" : t("oracleHistory.empty")}
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {data.slice(0, MAX_LIST).map((row, i) => {
              const up = row.newPrice >= row.oldPrice;
              const k = keyFor(row.oracleAddr);
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
                    Oracle-{k ?? "?"}
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
