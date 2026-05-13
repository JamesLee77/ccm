/**
 * Carbon credit reference price badge — single source of truth across
 * ccmnetwork.net, testnet, portal, admin.
 *
 * Reads from ccm-portal-api Worker. Identical component code in all 4
 * frontends. If the API call fails or returns stale data, the badge
 * degrades gracefully to "—" but stays visible.
 */
import { useEffect, useState } from "react";

const API_URL = "https://ccm-portal-api.misterylee.workers.dev/api/carbon-price";
const REFETCH_MS = 5 * 60 * 1000; // 5 min — matches edge cache

type CarbonPrice = {
  ok: true;
  price_usd: number;
  change_24h_pct: number | null;
  source: string;
  source_url: string;
  fetched_at: string;
  stale: boolean;
};

type CarbonPriceError = { ok: false; error: string };

function formatUsd(n: number): string {
  // BCT is sub-dollar; show 4 decimals
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function formatChange(n: number | null): string {
  if (n === null) return "—";
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

export default function CarbonPriceBadge() {
  const [data, setData] = useState<CarbonPrice | CarbonPriceError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(API_URL, { credentials: "omit" });
        const json = (await res.json()) as CarbonPrice | CarbonPriceError;
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setData({ ok: false, error: "fetch_failed" });
          setLoading(false);
        }
      }
    }
    void load();
    const id = setInterval(() => void load(), REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const isOk = data?.ok === true;
  const price = isOk ? formatUsd(data.price_usd) : loading ? "…" : "—";
  const change = isOk ? formatChange(data.change_24h_pct) : "—";
  const changeColor = isOk && data.change_24h_pct !== null
    ? data.change_24h_pct >= 0 ? "var(--moss)" : "var(--warn, #c8602e)"
    : "var(--ink-soft)";
  const stale = isOk && data.stale;

  return (
    <a
      href={isOk ? data.source_url : "https://www.coingecko.com/en/coins/toucan-protocol-base-carbon-tonne"}
      target="_blank"
      rel="noreferrer"
      title="Voluntary carbon credit reference price — Toucan BCT on Polygon. Click for source."
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        border: "1px solid var(--rule, rgba(0,0,0,0.18))",
        padding: "6px 12px",
        fontSize: 11,
        letterSpacing: "0.04em",
        textDecoration: "none",
        color: "inherit",
        background: "transparent",
      }}
    >
      <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
        Carbon · BCT
      </span>
      <span style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: 13 }}>{price}</span>
      <span style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: 11, color: changeColor }}>
        {change}
      </span>
      {stale && (
        <span title="data may be more than 90 minutes old" style={{ fontSize: 10, color: "var(--warn, #c8602e)" }}>
          stale
        </span>
      )}
    </a>
  );
}
