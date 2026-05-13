-- Migration: carbon credit reference price log
-- Source of truth for the carbon credit price displayed across
-- ccmnetwork.net, testnet, portal, admin. Worker cron fetches hourly
-- from CoinGecko (Toucan BCT) and appends one row per fetch.
-- The /api/carbon-price endpoint reads the most recent row.

CREATE TABLE IF NOT EXISTS carbon_price_log (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  source                   TEXT    NOT NULL,
  price_usd                REAL    NOT NULL,
  change_24h_pct           REAL,
  source_last_updated_at   INTEGER,
  fetched_at               INTEGER NOT NULL,
  raw_payload              TEXT
);

CREATE INDEX IF NOT EXISTS idx_carbon_price_source_fetched
  ON carbon_price_log(source, fetched_at DESC);
