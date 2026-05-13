import { env } from "cloudflare:test";
import { applyD1Migrations } from "cloudflare:test";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { runScheduled } from "../src/scheduled";
import { upsertUser, alreadySent } from "../src/db";
import * as chain from "../src/chain";
import * as email from "../src/email";

const ALICE = "0x048f42b850cc126468ee112852b6ac67e08e5d24";

beforeEach(async () => {
  const migrations = JSON.parse((env as any).TEST_MIGRATIONS);
  await applyD1Migrations(env.DB, migrations);
});
afterEach(() => vi.restoreAllMocks());

describe("runScheduled", () => {
  it("sends claim_ready when releasable > 0 and user verified", async () => {
    const now = 1_800_000_000;
    await upsertUser(env.DB, ALICE, {
      email: "alice@example.com",
      email_verified: 1,
    }, now);

    vi.spyOn(chain, "readScheduleCount").mockResolvedValue(1n);
    vi.spyOn(chain, "readSchedule").mockResolvedValue({
      beneficiary: ALICE as `0x${string}`,
      totalAmount: 1_000n * 10n ** 18n,
      startTime: BigInt(now - 3600),
      cliffDuration: 0n,
      vestingDuration: 7200n,
      released: 0n,
      revocable: false,
      revoked: false,
    });
    vi.spyOn(chain, "readReleasable").mockResolvedValue(500n * 10n ** 18n);
    const sendMock = vi.spyOn(email, "sendEmail").mockResolvedValue(true);

    await runScheduled(env, () => now);

    expect(sendMock).toHaveBeenCalledOnce();
    const arg = sendMock.mock.calls[0][0];
    expect(arg.subject).toMatch(/ready to claim/i);
    expect(await alreadySent(env.DB, ALICE, 0, "claim_ready")).toBe(true);
  });

  it("skips revoked schedules", async () => {
    await upsertUser(env.DB, ALICE, { email: "alice@example.com", email_verified: 1 }, 100);
    vi.spyOn(chain, "readScheduleCount").mockResolvedValue(1n);
    vi.spyOn(chain, "readSchedule").mockResolvedValue({
      beneficiary: ALICE as `0x${string}`,
      totalAmount: 1n,
      startTime: 0n,
      cliffDuration: 0n,
      vestingDuration: 1n,
      released: 0n,
      revocable: true,
      revoked: true,
    });
    const sendMock = vi.spyOn(email, "sendEmail").mockResolvedValue(true);
    await runScheduled(env, () => 1_900_000_000);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("dedupes — second run does not resend", async () => {
    const now = 1_800_000_000;
    await upsertUser(env.DB, ALICE, { email: "alice@example.com", email_verified: 1 }, now);
    vi.spyOn(chain, "readScheduleCount").mockResolvedValue(1n);
    vi.spyOn(chain, "readSchedule").mockResolvedValue({
      beneficiary: ALICE as `0x${string}`,
      totalAmount: 1_000n,
      startTime: BigInt(now - 100),
      cliffDuration: 0n,
      vestingDuration: 200n,
      released: 0n,
      revocable: false,
      revoked: false,
    });
    vi.spyOn(chain, "readReleasable").mockResolvedValue(500n);
    const sendMock = vi.spyOn(email, "sendEmail").mockResolvedValue(true);

    await runScheduled(env, () => now);
    await runScheduled(env, () => now + 60);
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it("respects notif_prefs (claim_ready=false → no send)", async () => {
    const now = 1_800_000_000;
    await upsertUser(env.DB, ALICE, {
      email: "alice@example.com",
      email_verified: 1,
      notif_prefs: JSON.stringify({ cliff_7d: true, cliff_1d: true, claim_ready: false }),
    }, now);
    vi.spyOn(chain, "readScheduleCount").mockResolvedValue(1n);
    vi.spyOn(chain, "readSchedule").mockResolvedValue({
      beneficiary: ALICE as `0x${string}`,
      totalAmount: 1n,
      startTime: BigInt(now - 100),
      cliffDuration: 0n,
      vestingDuration: 200n,
      released: 0n,
      revocable: false,
      revoked: false,
    });
    vi.spyOn(chain, "readReleasable").mockResolvedValue(1n);
    const sendMock = vi.spyOn(email, "sendEmail").mockResolvedValue(true);
    await runScheduled(env, () => now);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends cliff_7d when 7 days away", async () => {
    const now = 1_800_000_000;
    const sevenDays = 7 * 24 * 60 * 60;
    await upsertUser(env.DB, ALICE, { email: "alice@example.com", email_verified: 1 }, now);
    vi.spyOn(chain, "readScheduleCount").mockResolvedValue(1n);
    vi.spyOn(chain, "readSchedule").mockResolvedValue({
      beneficiary: ALICE as `0x${string}`,
      totalAmount: 1n,
      startTime: BigInt(now),
      cliffDuration: BigInt(sevenDays),
      vestingDuration: BigInt(sevenDays * 4),
      released: 0n,
      revocable: false,
      revoked: false,
    });
    vi.spyOn(chain, "readReleasable").mockResolvedValue(0n);
    const sendMock = vi.spyOn(email, "sendEmail").mockResolvedValue(true);
    await runScheduled(env, () => now);
    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock.mock.calls[0][0].subject).toMatch(/cliff ends in 7 days/i);
  });

  it("sends cliff_1d when 1 day away", async () => {
    const now = 1_800_000_000;
    const oneDay = 24 * 60 * 60;
    await upsertUser(env.DB, ALICE, { email: "alice@example.com", email_verified: 1 }, now);
    vi.spyOn(chain, "readScheduleCount").mockResolvedValue(1n);
    vi.spyOn(chain, "readSchedule").mockResolvedValue({
      beneficiary: ALICE as `0x${string}`,
      totalAmount: 1n,
      startTime: BigInt(now),
      cliffDuration: BigInt(oneDay),
      vestingDuration: BigInt(oneDay * 4),
      released: 0n,
      revocable: false,
      revoked: false,
    });
    vi.spyOn(chain, "readReleasable").mockResolvedValue(0n);
    const sendMock = vi.spyOn(email, "sendEmail").mockResolvedValue(true);
    await runScheduled(env, () => now);
    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock.mock.calls[0][0].subject).toMatch(/cliff ends tomorrow/i);
  });
});
