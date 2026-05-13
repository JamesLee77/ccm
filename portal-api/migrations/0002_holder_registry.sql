-- 0002 holder registry
--
-- Off-chain mirror of on-chain state for fast admin queries, communication,
-- and migration / airdrop reference points.
--
-- Source of truth remains on-chain — these tables are caches written by
-- the hourly sync job. They MUST NOT be authoritative for value: any
-- code that pays out, mints, or transfers must read from chain directly.

-- One row per CCMVesting schedule on-chain. Indexed by beneficiary
-- so admin queries "who is wallet X" or "who has cliff in 7 days" are
-- a single key lookup instead of N RPC reads.
CREATE TABLE vesting_schedules (
  schedule_id        INTEGER PRIMARY KEY,           -- on-chain id
  beneficiary        TEXT    NOT NULL,              -- lowercase 0x address
  total_amount_wei   TEXT    NOT NULL,              -- as decimal string (bigint)
  start_time         INTEGER NOT NULL,              -- unix sec
  cliff_duration     INTEGER NOT NULL,
  vesting_duration   INTEGER NOT NULL,
  released_wei       TEXT    NOT NULL,              -- decimal string (bigint)
  revocable          INTEGER NOT NULL,              -- bool 0/1
  revoked            INTEGER NOT NULL,              -- bool 0/1
  source             TEXT    NOT NULL DEFAULT 'saft',  -- saft|airdrop|other (manual classification)
  legal_entity       TEXT,                          -- nullable, SAFT investor name (PII — admin only)
  jurisdiction       TEXT,                          -- nullable, ISO-3166-1 alpha-2 (e.g. 'US' is blocked)
  synced_at          INTEGER NOT NULL,              -- unix sec when this row last got chain-refreshed
  created_at         INTEGER NOT NULL
);

CREATE INDEX idx_vs_beneficiary ON vesting_schedules(beneficiary);
CREATE INDEX idx_vs_synced_at ON vesting_schedules(synced_at);
CREATE INDEX idx_vs_revoked ON vesting_schedules(revoked);

-- Mirror of on-chain CCMKYCRegistry. Source of truth is the registry
-- contract. We cache here so admin endpoints can return holder + KYC
-- in one query without N RPC calls.
CREATE TABLE kyc_status (
  address            TEXT PRIMARY KEY,              -- lowercase 0x
  is_kyced           INTEGER NOT NULL,              -- bool 0/1
  kyced_at_chain     INTEGER NOT NULL,              -- on-chain timestamp the registry recorded (kycedAt())
  synced_at          INTEGER NOT NULL,              -- when we last refreshed from chain
  -- KYC provider metadata (sourced off-chain, written by the operator's KYC backend)
  provider           TEXT,                          -- 'sumsub' | 'persona' | NULL
  provider_id        TEXT,                          -- provider's external id for the KYCed person
  level              TEXT,                          -- 'basic' | 'enhanced' | NULL (provider-specific)
  notes              TEXT                           -- free-form admin notes
);

CREATE INDEX idx_kyc_synced_at ON kyc_status(synced_at);

-- Point-in-time snapshots of holder balances. Useful for migration
-- reference (v1 → v2 holders), airdrops, and compliance reporting.
-- Append-only — never UPDATEd in place. Keyed by (address, snapshot_at).
CREATE TABLE holder_snapshots (
  address            TEXT    NOT NULL,
  snapshot_at        INTEGER NOT NULL,              -- unix sec
  block_number       INTEGER NOT NULL,
  ccm_balance_wei    TEXT    NOT NULL,              -- ERC20 balanceOf, decimal string
  vested_total_wei   TEXT    NOT NULL,              -- sum of total over all schedules
  released_total_wei TEXT    NOT NULL,              -- sum of released over all schedules
  PRIMARY KEY (address, snapshot_at)
);

CREATE INDEX idx_hs_snapshot_at ON holder_snapshots(snapshot_at);

-- Sync run log. One row per scheduled sync attempt — tracks whether
-- chain reads succeeded, how many rows were updated, and any error.
CREATE TABLE sync_runs (
  run_at             INTEGER PRIMARY KEY,           -- unix sec
  schedules_synced   INTEGER NOT NULL DEFAULT 0,
  kyc_synced         INTEGER NOT NULL DEFAULT 0,
  snapshots_taken    INTEGER NOT NULL DEFAULT 0,
  duration_ms        INTEGER NOT NULL DEFAULT 0,
  error              TEXT
);
