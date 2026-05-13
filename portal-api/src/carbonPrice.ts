/**
 * Carbon credit reference price oracle (off-chain).
 *
 * Fetches Toucan BCT (Base Carbon Tonne) price from DefiLlama's free
 * public coins API and stores one row per fetch into D1. The
 * `/api/carbon-price` endpoint returns the most recent row plus a 24h
 * change derived from the historical rows in D1.
 *
 * Single reference price across ccmnetwork.net, testnet, portal, admin.
 * No auth on read; 5-min edge cache via Cache-Control.
 *
 * Why DefiLlama over CoinGecko: CoinGecko aggressively rate-limits
 * Cloudflare Worker egress IPs (HTTP 429 even for low-volume free tier),
 * while DefiLlama's coins API has Worker-friendly limits.
 */
import type { Env } from "./types";

// BCT on Polygon — Toucan Protocol Base Carbon Tonne
const BCT_KEY = "polygon:0x2F800Db0fdb5223b3C3f354886d907A671414A7F";
const DEFILLAMA_URL = `https://coins.llama.fi/prices/current/${BCT_KEY}`;

const SOURCE_ID = "toucan-bct";
const SOURCE_URL =
  "https://www.coingecko.com/en/coins/toucan-protocol-base-carbon-tonne";
const FETCH_TTL_SECONDS = 3600; // worker cron is hourly
const STALE_AFTER_SECONDS = 5400; // 1.5 × hourly cron
const ONE_DAY_SECONDS = 86_400;

interface DefiLlamaResponse {
  coins?: Record<
    string,
    { decimals?: number; symbol?: string; price?: number; timestamp?: number; confidence?: number }
  >;
}

export interface CarbonPriceResponse {
  ok: true;
  price_usd: number;
  change_24h_pct: number | null;
  source: string;
  source_url: string;
  fetched_at: string;
  fetched_at_unix: number;
  source_last_updated_at: number | null;
  ttl_seconds: number;
  stale: boolean;
}

export interface CarbonPriceError {
  ok: false;
  error: string;
}

export async function fetchAndStore(env: Env): Promise<{ price_usd: number; fetched_at: number } | null> {
  let payload: DefiLlamaResponse;
  try {
    const res = await fetch(DEFILLAMA_URL, {
      headers: { accept: "application/json", "user-agent": "ccm-portal-api/1" },
    });
    if (!res.ok) {
      console.error("carbonPrice: defillama HTTP", res.status, await res.text().catch(() => ""));
      return null;
    }
    payload = (await res.json()) as DefiLlamaResponse;
  } catch (e) {
    console.error("carbonPrice: fetch failed", e instanceof Error ? e.message : String(e));
    return null;
  }

  const entry = payload.coins?.[BCT_KEY];
  if (!entry || typeof entry.price !== "number" || !Number.isFinite(entry.price) || entry.price <= 0) {
    console.error("carbonPrice: invalid payload", JSON.stringify(payload));
    return null;
  }

  const fetched_at = Math.floor(Date.now() / 1000);
  const price_usd = entry.price;
  const source_last_updated_at = typeof entry.timestamp === "number" ? entry.timestamp : null;

  await env.DB.prepare(
    `INSERT INTO carbon_price_log
     (source, price_usd, change_24h_pct, source_last_updated_at, fetched_at, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(SOURCE_ID, price_usd, null, source_last_updated_at, fetched_at, JSON.stringify(payload))
    .run();

  return { price_usd, fetched_at };
}

export async function getLatest(env: Env): Promise<CarbonPriceResponse | CarbonPriceError> {
  const latest = await env.DB.prepare(
    `SELECT price_usd, source_last_updated_at, fetched_at
     FROM carbon_price_log
     WHERE source = ?
     ORDER BY fetched_at DESC
     LIMIT 1`,
  )
    .bind(SOURCE_ID)
    .first<{ price_usd: number; source_last_updated_at: number | null; fetched_at: number }>();

  if (!latest) {
    return { ok: false, error: "no_data_yet" };
  }

  // 24h change: closest row at or before (fetched_at - 86400)
  const target = latest.fetched_at - ONE_DAY_SECONDS;
  const baseline = await env.DB.prepare(
    `SELECT price_usd FROM carbon_price_log
     WHERE source = ? AND fetched_at <= ?
     ORDER BY fetched_at DESC
     LIMIT 1`,
  )
    .bind(SOURCE_ID, target)
    .first<{ price_usd: number }>();

  const change_24h_pct =
    baseline && baseline.price_usd > 0
      ? ((latest.price_usd - baseline.price_usd) / baseline.price_usd) * 100
      : null;

  const now = Math.floor(Date.now() / 1000);
  const stale = now - latest.fetched_at > STALE_AFTER_SECONDS;

  return {
    ok: true,
    price_usd: latest.price_usd,
    change_24h_pct,
    source: SOURCE_ID,
    source_url: SOURCE_URL,
    fetched_at: new Date(latest.fetched_at * 1000).toISOString(),
    fetched_at_unix: latest.fetched_at,
    source_last_updated_at: latest.source_last_updated_at,
    ttl_seconds: FETCH_TTL_SECONDS,
    stale,
  };
}
