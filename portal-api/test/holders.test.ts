import { env, applyD1Migrations } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import {
  appendSnapshot,
  getKYCStatus,
  getLatestSnapshot,
  getSchedule,
  listAllHolders,
  listSchedulesByBeneficiary,
  listSyncRuns,
  recordSyncRun,
  setKYCMetadata,
  setScheduleClassification,
  syncFromChain,
  upsertKYC,
  upsertSchedule,
} from "../src/holders";

beforeEach(async () => {
  const migrations = JSON.parse((env as any).TEST_MIGRATIONS);
  await applyD1Migrations(env.DB, migrations);
});

const ALICE = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const BOB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

describe("holders / vesting_schedules", () => {
  it("upsertSchedule inserts then updates", async () => {
    await upsertSchedule(env.DB, {
      schedule_id: 0,
      beneficiary: ALICE,
      total_amount_wei: "1000000000000000000",
      start_time: 1700000000,
      cliff_duration: 3600,
      vesting_duration: 86400,
      released_wei: "0",
      revocable: 1,
      revoked: 0,
      synced_at: 1700000000,
    });
    let s = await getSchedule(env.DB, 0);
    expect(s?.beneficiary).toBe(ALICE);
    expect(s?.total_amount_wei).toBe("1000000000000000000");
    expect(s?.released_wei).toBe("0");
    expect(s?.source).toBe("saft"); // default

    // Update with released_wei advancing
    await upsertSchedule(env.DB, {
      schedule_id: 0,
      beneficiary: ALICE,
      total_amount_wei: "1000000000000000000",
      start_time: 1700000000,
      cliff_duration: 3600,
      vesting_duration: 86400,
      released_wei: "500000000000000000",
      revocable: 1,
      revoked: 0,
      synced_at: 1700001000,
    });
    s = await getSchedule(env.DB, 0);
    expect(s?.released_wei).toBe("500000000000000000");
    expect(s?.synced_at).toBe(1700001000);
  });

  it("listSchedulesByBeneficiary returns ordered by id", async () => {
    for (const id of [2, 0, 1]) {
      await upsertSchedule(env.DB, {
        schedule_id: id,
        beneficiary: ALICE,
        total_amount_wei: "1",
        start_time: 0,
        cliff_duration: 0,
        vesting_duration: 0,
        released_wei: "0",
        revocable: 0,
        revoked: 0,
        synced_at: 0,
      });
    }
    const rows = await listSchedulesByBeneficiary(env.DB, ALICE);
    expect(rows.map((r) => r.schedule_id)).toEqual([0, 1, 2]);
  });

  it("setScheduleClassification updates source/legal_entity/jurisdiction", async () => {
    await upsertSchedule(env.DB, {
      schedule_id: 0,
      beneficiary: ALICE,
      total_amount_wei: "1",
      start_time: 0,
      cliff_duration: 0,
      vesting_duration: 0,
      released_wei: "0",
      revocable: 0,
      revoked: 0,
      synced_at: 0,
    });
    await setScheduleClassification(env.DB, 0, {
      legal_entity: "Acme Capital LLC",
      jurisdiction: "KY",
    });
    const s = await getSchedule(env.DB, 0);
    expect(s?.legal_entity).toBe("Acme Capital LLC");
    expect(s?.jurisdiction).toBe("KY");
    expect(s?.source).toBe("saft"); // unchanged via COALESCE
  });
});

describe("holders / kyc_status", () => {
  it("upsertKYC inserts then updates", async () => {
    await upsertKYC(env.DB, ALICE, 1, 1700000000, 1700000010);
    let k = await getKYCStatus(env.DB, ALICE);
    expect(k?.is_kyced).toBe(1);
    expect(k?.kyced_at_chain).toBe(1700000000);

    await upsertKYC(env.DB, ALICE, 0, 1700000500, 1700000600);
    k = await getKYCStatus(env.DB, ALICE);
    expect(k?.is_kyced).toBe(0);
    expect(k?.synced_at).toBe(1700000600);
  });

  it("setKYCMetadata patches fields without touching others", async () => {
    await upsertKYC(env.DB, ALICE, 1, 1700000000, 1700000010);
    await setKYCMetadata(env.DB, ALICE, { provider: "sumsub", level: "enhanced" });
    let k = await getKYCStatus(env.DB, ALICE);
    expect(k?.provider).toBe("sumsub");
    expect(k?.level).toBe("enhanced");
    expect(k?.notes).toBeNull();

    // Second update only sets notes
    await setKYCMetadata(env.DB, ALICE, { notes: "Verified Q1 2026" });
    k = await getKYCStatus(env.DB, ALICE);
    expect(k?.notes).toBe("Verified Q1 2026");
    expect(k?.provider).toBe("sumsub"); // preserved
  });
});

describe("holders / snapshots", () => {
  it("appendSnapshot is idempotent on (address, snapshot_at)", async () => {
    await appendSnapshot(env.DB, {
      address: ALICE,
      snapshot_at: 1700000000,
      block_number: 100,
      ccm_balance_wei: "5000",
      vested_total_wei: "10000",
      released_total_wei: "3000",
    });
    // Same key — INSERT OR IGNORE
    await appendSnapshot(env.DB, {
      address: ALICE,
      snapshot_at: 1700000000,
      block_number: 200,
      ccm_balance_wei: "9999",
      vested_total_wei: "9999",
      released_total_wei: "9999",
    });
    const latest = await getLatestSnapshot(env.DB, ALICE);
    expect(latest?.block_number).toBe(100);
    expect(latest?.ccm_balance_wei).toBe("5000");
  });

  it("getLatestSnapshot returns the newest snapshot_at", async () => {
    await appendSnapshot(env.DB, {
      address: ALICE,
      snapshot_at: 1700000000,
      block_number: 100,
      ccm_balance_wei: "1",
      vested_total_wei: "1",
      released_total_wei: "0",
    });
    await appendSnapshot(env.DB, {
      address: ALICE,
      snapshot_at: 1700001000,
      block_number: 200,
      ccm_balance_wei: "2",
      vested_total_wei: "2",
      released_total_wei: "1",
    });
    const latest = await getLatestSnapshot(env.DB, ALICE);
    expect(latest?.block_number).toBe(200);
  });
});

describe("holders / listAllHolders", () => {
  it("aggregates schedules per beneficiary with KYC join", async () => {
    await upsertSchedule(env.DB, {
      schedule_id: 0,
      beneficiary: ALICE,
      total_amount_wei: "100",
      start_time: 0, cliff_duration: 0, vesting_duration: 0,
      released_wei: "30", revocable: 0, revoked: 0, synced_at: 0,
    });
    await upsertSchedule(env.DB, {
      schedule_id: 1,
      beneficiary: ALICE,
      total_amount_wei: "200",
      start_time: 0, cliff_duration: 0, vesting_duration: 0,
      released_wei: "70", revocable: 0, revoked: 0, synced_at: 0,
    });
    await upsertSchedule(env.DB, {
      schedule_id: 2,
      beneficiary: BOB,
      total_amount_wei: "500",
      start_time: 0, cliff_duration: 0, vesting_duration: 0,
      released_wei: "0", revocable: 0, revoked: 0, synced_at: 0,
    });
    await upsertKYC(env.DB, ALICE, 1, 1, 1);

    const all = await listAllHolders(env.DB, 100, 0);
    const byAddr = Object.fromEntries(all.map((h) => [h.address, h]));
    expect(byAddr[ALICE].schedules).toBe(2);
    expect(byAddr[ALICE].total_amount_wei).toBe("300");
    expect(byAddr[ALICE].released_wei).toBe("100");
    expect(byAddr[ALICE].is_kyced).toBe(1);
    expect(byAddr[BOB].schedules).toBe(1);
    expect(byAddr[BOB].is_kyced).toBeNull();
  });
});

describe("holders / sync_runs", () => {
  it("recordSyncRun inserts and listSyncRuns returns desc", async () => {
    await recordSyncRun(env.DB, {
      run_at: 1700000000,
      schedules_synced: 5,
      kyc_synced: 3,
      snapshots_taken: 5,
      duration_ms: 1234,
      error: null,
    });
    await recordSyncRun(env.DB, {
      run_at: 1700001000,
      schedules_synced: 0,
      kyc_synced: 0,
      snapshots_taken: 0,
      duration_ms: 50,
      error: "no chain pointers",
    });
    const runs = await listSyncRuns(env.DB, 10);
    expect(runs[0].run_at).toBe(1700001000); // most recent first
    expect(runs[0].error).toBe("no chain pointers");
    expect(runs[1].schedules_synced).toBe(5);
  });
});

describe("holders / syncFromChain (no-op when chain unconfigured)", () => {
  it("records a sync_runs row with explanatory error when no addresses set", async () => {
    // env has CCM_VESTING_ADDRESS set but CCM_KYC and CCM_TOKEN are 0x0...
    // The fn requires *all three* to be unconfigured to early-exit; with one
    // configured, it'll attempt the chain read and fail (unreachable RPC in
    // test env). Either path is acceptable — both record a sync_run.
    const summary = await syncFromChain(
      { ...env, CCM_VESTING_ADDRESS: "0x0000000000000000000000000000000000000000" } as any,
      1700000000,
    );
    expect(summary.run_at).toBe(1700000000);
    expect(summary.error).toMatch(/no chain pointers/i);
    const runs = await listSyncRuns(env.DB, 10);
    expect(runs[0].run_at).toBe(1700000000);
  });
});
