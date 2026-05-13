import type {
  Env,
  HolderSnapshotRow,
  KYCStatusRow,
  SyncRunRow,
  VestingScheduleRow,
} from "./types";
import {
  isAddressConfigured,
  readBalanceOf,
  readBlockNumber,
  readIsKYCed,
  readKYCedAt,
  readSchedule,
  readScheduleCount,
} from "./chain";

const lc = (a: string) => a.toLowerCase();

// ============================================================================
// Reads
// ============================================================================

export async function getSchedule(
  db: D1Database,
  scheduleId: number,
): Promise<VestingScheduleRow | null> {
  return (
    (await db
      .prepare("SELECT * FROM vesting_schedules WHERE schedule_id = ?")
      .bind(scheduleId)
      .first<VestingScheduleRow>()) ?? null
  );
}

export async function listSchedulesByBeneficiary(
  db: D1Database,
  address: string,
): Promise<VestingScheduleRow[]> {
  const res = await db
    .prepare(
      "SELECT * FROM vesting_schedules WHERE beneficiary = ? ORDER BY schedule_id ASC",
    )
    .bind(lc(address))
    .all<VestingScheduleRow>();
  return res.results ?? [];
}

export async function listAllHolders(
  db: D1Database,
  limit = 100,
  offset = 0,
): Promise<{
  address: string;
  schedules: number;
  total_amount_wei: string;
  released_wei: string;
  is_kyced: number | null;
}[]> {
  // Aggregate schedules per beneficiary, LEFT JOIN kyc_status
  // total_amount and released are stored as decimal text — SQLite's SUM
  // will coerce via REAL which is lossy for very large numbers, but for
  // ~5e9 * 1e18 we exceed Number.MAX_SAFE_INTEGER. Instead, we sum
  // client-side after fetching per-row.
  const rowsRes = await db
    .prepare(
      `SELECT vs.beneficiary AS address,
              vs.total_amount_wei AS total,
              vs.released_wei AS released,
              k.is_kyced AS is_kyced
       FROM vesting_schedules vs
       LEFT JOIN kyc_status k ON k.address = vs.beneficiary
       ORDER BY vs.beneficiary, vs.schedule_id
       LIMIT ? OFFSET ?`,
    )
    .bind(limit * 100, offset * 100) // overfetch then aggregate; small registries
    .all<{ address: string; total: string; released: string; is_kyced: number | null }>();

  const acc = new Map<
    string,
    { schedules: number; total: bigint; released: bigint; is_kyced: number | null }
  >();
  for (const r of rowsRes.results ?? []) {
    const e = acc.get(r.address) ?? {
      schedules: 0,
      total: 0n,
      released: 0n,
      is_kyced: r.is_kyced,
    };
    e.schedules += 1;
    e.total += BigInt(r.total);
    e.released += BigInt(r.released);
    e.is_kyced = r.is_kyced;
    acc.set(r.address, e);
  }
  const all = [...acc.entries()].map(([address, v]) => ({
    address,
    schedules: v.schedules,
    total_amount_wei: v.total.toString(),
    released_wei: v.released.toString(),
    is_kyced: v.is_kyced,
  }));
  return all.slice(offset, offset + limit);
}

export async function getKYCStatus(
  db: D1Database,
  address: string,
): Promise<KYCStatusRow | null> {
  return (
    (await db
      .prepare("SELECT * FROM kyc_status WHERE address = ?")
      .bind(lc(address))
      .first<KYCStatusRow>()) ?? null
  );
}

export async function getLatestSnapshot(
  db: D1Database,
  address: string,
): Promise<HolderSnapshotRow | null> {
  return (
    (await db
      .prepare(
        "SELECT * FROM holder_snapshots WHERE address = ? ORDER BY snapshot_at DESC LIMIT 1",
      )
      .bind(lc(address))
      .first<HolderSnapshotRow>()) ?? null
  );
}

export async function listSyncRuns(
  db: D1Database,
  limit = 20,
): Promise<SyncRunRow[]> {
  const res = await db
    .prepare("SELECT * FROM sync_runs ORDER BY run_at DESC LIMIT ?")
    .bind(limit)
    .all<SyncRunRow>();
  return res.results ?? [];
}

// ============================================================================
// Writes (used by sync, and by admin endpoints for off-chain metadata)
// ============================================================================

export async function upsertSchedule(
  db: D1Database,
  row: Omit<VestingScheduleRow, "created_at" | "synced_at" | "source" | "legal_entity" | "jurisdiction"> & {
    synced_at: number;
  },
): Promise<void> {
  const beneficiary = lc(row.beneficiary);
  const existing = await getSchedule(db, row.schedule_id);
  if (!existing) {
    await db
      .prepare(
        `INSERT INTO vesting_schedules
         (schedule_id, beneficiary, total_amount_wei, start_time, cliff_duration,
          vesting_duration, released_wei, revocable, revoked, source, synced_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'saft', ?, ?)`,
      )
      .bind(
        row.schedule_id,
        beneficiary,
        row.total_amount_wei,
        row.start_time,
        row.cliff_duration,
        row.vesting_duration,
        row.released_wei,
        row.revocable,
        row.revoked,
        row.synced_at,
        row.synced_at,
      )
      .run();
    return;
  }
  await db
    .prepare(
      `UPDATE vesting_schedules SET
         beneficiary = ?, total_amount_wei = ?, start_time = ?, cliff_duration = ?,
         vesting_duration = ?, released_wei = ?, revocable = ?, revoked = ?, synced_at = ?
       WHERE schedule_id = ?`,
    )
    .bind(
      beneficiary,
      row.total_amount_wei,
      row.start_time,
      row.cliff_duration,
      row.vesting_duration,
      row.released_wei,
      row.revocable,
      row.revoked,
      row.synced_at,
      row.schedule_id,
    )
    .run();
}

export async function upsertKYC(
  db: D1Database,
  address: string,
  isKYCed: number,
  kycedAtChain: number,
  syncedAt: number,
): Promise<void> {
  const addr = lc(address);
  const existing = await getKYCStatus(db, addr);
  if (!existing) {
    await db
      .prepare(
        `INSERT INTO kyc_status (address, is_kyced, kyced_at_chain, synced_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(addr, isKYCed, kycedAtChain, syncedAt)
      .run();
    return;
  }
  await db
    .prepare(
      `UPDATE kyc_status SET is_kyced = ?, kyced_at_chain = ?, synced_at = ?
       WHERE address = ?`,
    )
    .bind(isKYCed, kycedAtChain, syncedAt, addr)
    .run();
}

export async function setKYCMetadata(
  db: D1Database,
  address: string,
  meta: { provider?: string | null; provider_id?: string | null; level?: string | null; notes?: string | null },
): Promise<void> {
  await db
    .prepare(
      `UPDATE kyc_status SET
         provider = COALESCE(?, provider),
         provider_id = COALESCE(?, provider_id),
         level = COALESCE(?, level),
         notes = COALESCE(?, notes)
       WHERE address = ?`,
    )
    .bind(
      meta.provider ?? null,
      meta.provider_id ?? null,
      meta.level ?? null,
      meta.notes ?? null,
      lc(address),
    )
    .run();
}

export async function setScheduleClassification(
  db: D1Database,
  scheduleId: number,
  meta: { source?: string | null; legal_entity?: string | null; jurisdiction?: string | null },
): Promise<void> {
  await db
    .prepare(
      `UPDATE vesting_schedules SET
         source = COALESCE(?, source),
         legal_entity = COALESCE(?, legal_entity),
         jurisdiction = COALESCE(?, jurisdiction)
       WHERE schedule_id = ?`,
    )
    .bind(
      meta.source ?? null,
      meta.legal_entity ?? null,
      meta.jurisdiction ?? null,
      scheduleId,
    )
    .run();
}

export async function appendSnapshot(
  db: D1Database,
  row: HolderSnapshotRow,
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO holder_snapshots
       (address, snapshot_at, block_number, ccm_balance_wei, vested_total_wei, released_total_wei)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      lc(row.address),
      row.snapshot_at,
      row.block_number,
      row.ccm_balance_wei,
      row.vested_total_wei,
      row.released_total_wei,
    )
    .run();
}

export async function recordSyncRun(
  db: D1Database,
  row: SyncRunRow,
): Promise<void> {
  await db
    .prepare(
      `INSERT OR REPLACE INTO sync_runs
       (run_at, schedules_synced, kyc_synced, snapshots_taken, duration_ms, error)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.run_at,
      row.schedules_synced,
      row.kyc_synced,
      row.snapshots_taken,
      row.duration_ms,
      row.error,
    )
    .run();
}

// ============================================================================
// Sync orchestration — called by scheduled.ts
// ============================================================================

/**
 * Pull every on-chain vesting schedule into the local cache and write a
 * holder_snapshots row per distinct beneficiary. Refresh KYC status for
 * each beneficiary that has a row in kyc_status (or insert if missing).
 *
 * No-op if the chain pointers are not configured (mainnet not deployed
 * yet) — the run is recorded with an explanatory error so ops can see
 * the gate clearly.
 */
export async function syncFromChain(env: Env, now: number): Promise<SyncRunRow> {
  const t0 = Date.now();
  const summary: SyncRunRow = {
    run_at: now,
    schedules_synced: 0,
    kyc_synced: 0,
    snapshots_taken: 0,
    duration_ms: 0,
    error: null,
  };

  const haveVesting = isAddressConfigured(env.CCM_VESTING_ADDRESS);
  const haveKYC = isAddressConfigured(env.CCM_KYC_REGISTRY_ADDRESS);
  const haveToken = isAddressConfigured(env.CCM_TOKEN_ADDRESS);
  if (!haveVesting && !haveKYC && !haveToken) {
    summary.error = "no chain pointers configured (mainnet not deployed yet)";
    summary.duration_ms = Date.now() - t0;
    await recordSyncRun(env.DB, summary);
    return summary;
  }

  try {
    // 1. Schedules
    const beneficiaries = new Set<string>();
    if (haveVesting) {
      const count = await readScheduleCount(env);
      for (let id = 0n; id < count; id++) {
        const s = await readSchedule(env, id);
        await upsertSchedule(env.DB, {
          schedule_id: Number(id),
          beneficiary: s.beneficiary,
          total_amount_wei: s.totalAmount.toString(),
          start_time: Number(s.startTime),
          cliff_duration: Number(s.cliffDuration),
          vesting_duration: Number(s.vestingDuration),
          released_wei: s.released.toString(),
          revocable: s.revocable ? 1 : 0,
          revoked: s.revoked ? 1 : 0,
          synced_at: now,
        });
        beneficiaries.add(lc(s.beneficiary));
        summary.schedules_synced++;
      }
    }

    // 2. KYC status — for every beneficiary we know about, plus any
    //    address already in kyc_status.
    const knownKyc = await env.DB.prepare(
      "SELECT address FROM kyc_status",
    ).all<{ address: string }>();
    const allAddrs = new Set<string>(beneficiaries);
    for (const r of knownKyc.results ?? []) allAddrs.add(r.address);

    if (haveKYC) {
      for (const addr of allAddrs) {
        const isKYCed = await readIsKYCed(env, addr as `0x${string}`);
        const kycedAt = await readKYCedAt(env, addr as `0x${string}`);
        await upsertKYC(env.DB, addr, isKYCed ? 1 : 0, Number(kycedAt), now);
        summary.kyc_synced++;
      }
    }

    // 3. Snapshots — one per distinct beneficiary at current block
    if (haveToken && beneficiaries.size > 0) {
      const blockNumber = Number(await readBlockNumber(env));
      // Aggregate per-beneficiary totals from cached schedules
      const totals = new Map<string, { total: bigint; released: bigint }>();
      for (const addr of beneficiaries) {
        const rows = await listSchedulesByBeneficiary(env.DB, addr);
        let total = 0n;
        let released = 0n;
        for (const r of rows) {
          total += BigInt(r.total_amount_wei);
          released += BigInt(r.released_wei);
        }
        totals.set(addr, { total, released });
      }
      for (const addr of beneficiaries) {
        const balance = await readBalanceOf(env, addr as `0x${string}`);
        const t = totals.get(addr)!;
        await appendSnapshot(env.DB, {
          address: addr,
          snapshot_at: now,
          block_number: blockNumber,
          ccm_balance_wei: balance.toString(),
          vested_total_wei: t.total.toString(),
          released_total_wei: t.released.toString(),
        });
        summary.snapshots_taken++;
      }
    }
  } catch (e: unknown) {
    summary.error = e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500);
  }

  summary.duration_ms = Date.now() - t0;
  await recordSyncRun(env.DB, summary);
  return summary;
}
