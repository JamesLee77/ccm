import { env } from "cloudflare:test";
import { applyD1Migrations } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import { upsertUser, getUser, markSent, alreadySent } from "../src/db";

beforeEach(async () => {
  const migrations = JSON.parse((env as any).TEST_MIGRATIONS);
  await applyD1Migrations(env.DB, migrations);
});

describe("db", () => {
  it("upsertUser inserts a new row when address is new", async () => {
    const now = 1_700_000_000;
    await upsertUser(env.DB, "0xabc", { language: "en" }, now);
    const u = await getUser(env.DB, "0xabc");
    expect(u?.address).toBe("0xabc");
    expect(u?.email).toBeNull();
    expect(u?.language).toBe("en");
  });

  it("upsertUser updates existing row", async () => {
    const t1 = 1_700_000_000;
    const t2 = 1_700_000_100;
    await upsertUser(env.DB, "0xabc", { language: "en" }, t1);
    await upsertUser(env.DB, "0xabc", { language: "ko" }, t2);
    const u = await getUser(env.DB, "0xabc");
    expect(u?.language).toBe("ko");
    expect(u?.updated_at).toBe(t2);
  });

  it("markSent + alreadySent dedupe by (address, schedule_id, kind)", async () => {
    const now = 1_700_000_000;
    await upsertUser(env.DB, "0xabc", {}, now);
    expect(await alreadySent(env.DB, "0xabc", 0, "claim_ready")).toBe(false);
    await markSent(env.DB, "0xabc", 0, "claim_ready", now);
    expect(await alreadySent(env.DB, "0xabc", 0, "claim_ready")).toBe(true);
    expect(await alreadySent(env.DB, "0xabc", 0, "cliff_7d")).toBe(false);
  });

  it("consumeNonce returns address once then null on second call (atomic)", async () => {
    const now = 1_700_000_000;
    await (await import("../src/db")).putNonce(env.DB, "nonceA", "0xabc", now + 60);
    const first = await (await import("../src/db")).consumeNonce(env.DB, "nonceA", now);
    expect(first?.address).toBe("0xabc");
    const second = await (await import("../src/db")).consumeNonce(env.DB, "nonceA", now);
    expect(second).toBeNull();
  });

  it("consumeNonce returns null when nonce expired (and still deletes the row)", async () => {
    const now = 1_700_000_000;
    const past = now - 1; // already expired
    await (await import("../src/db")).putNonce(env.DB, "nonceB", "0xabc", past);
    const result = await (await import("../src/db")).consumeNonce(env.DB, "nonceB", now);
    expect(result).toBeNull();
    // Calling again should still be null (row was deleted by the previous call)
    const again = await (await import("../src/db")).consumeNonce(env.DB, "nonceB", now);
    expect(again).toBeNull();
  });

  it("upsertUser preserves email_token when not specified in input", async () => {
    const now = 1_700_000_000;
    await upsertUser(env.DB, "0xabc", {
      email: "alice@example.com",
      email_token: "tok123",
      email_token_exp: now + 3600,
    }, now);
    // Partial update of language only — should NOT clobber the pending email_token
    await upsertUser(env.DB, "0xabc", { language: "ko" }, now + 10);
    const u = await getUser(env.DB, "0xabc");
    expect(u?.email_token).toBe("tok123");
    expect(u?.email_token_exp).toBe(now + 3600);
    expect(u?.language).toBe("ko");
  });

  it("markEmailVerified sets email_verified and clears token fields", async () => {
    const now = 1_700_000_000;
    const { markEmailVerified } = await import("../src/db");
    await upsertUser(env.DB, "0xabc", {
      email: "alice@example.com",
      email_token: "tok123",
      email_token_exp: now + 3600,
    }, now);
    await markEmailVerified(env.DB, "0xabc", now + 10);
    const u = await getUser(env.DB, "0xabc");
    expect(u?.email_verified).toBe(1);
    expect(u?.email_token).toBeNull();
    expect(u?.email_token_exp).toBeNull();
  });
});
