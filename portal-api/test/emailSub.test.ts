import { env, SELF } from "cloudflare:test";
import { applyD1Migrations } from "cloudflare:test";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { signSession } from "../src/session";
import { upsertUser, getUser } from "../src/db";

beforeEach(async () => {
  const migrations = JSON.parse((env as any).TEST_MIGRATIONS);
  await applyD1Migrations(env.DB, migrations);
});
afterEach(() => vi.unstubAllGlobals());

async function authedFetch(path: string, init?: RequestInit, address = "0xabc") {
  const cookie = await signSession(env.SIWE_SECRET, address, Math.floor(Date.now()/1000)+3600);
  return SELF.fetch(`http://localhost${path}`, {
    ...init,
    headers: {...(init?.headers ?? {}), cookie: `siwe_session=${cookie}`, "content-type": "application/json"},
  });
}

describe("email subscribe", () => {
  it("POST /api/me/email stores token + sends verify email", async () => {
    await upsertUser(env.DB, "0xabc", {}, Math.floor(Date.now()/1000));
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await authedFetch("/api/me/email", {
      method: "POST",
      body: JSON.stringify({ email: "alice@example.com" }),
    });
    expect(res.status).toBe(200);
    const u = await getUser(env.DB, "0xabc");
    expect(u?.email).toBe("alice@example.com");
    expect(u?.email_verified).toBe(0);
    expect(u?.email_token).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("POST /api/me/email lowercases and trims email before storing + sending", async () => {
    await upsertUser(env.DB, "0xabc", {}, Math.floor(Date.now()/1000));
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await authedFetch("/api/me/email", {
      method: "POST",
      body: JSON.stringify({ email: "  Alice@Example.COM  " }),
    });
    expect(res.status).toBe(200);
    const u = await getUser(env.DB, "0xabc");
    expect(u?.email).toBe("alice@example.com");

    const sentBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sentBody.to).toBe("alice@example.com");
  });

  it("POST /api/me/email rejects malformed email", async () => {
    await upsertUser(env.DB, "0xabc", {}, Math.floor(Date.now()/1000));
    const res = await authedFetch("/api/me/email", {
      method: "POST",
      body: JSON.stringify({ email: "not-email" }),
    });
    expect(res.status).toBe(400);
  });

  it("GET /api/email/verify?token=... marks verified and clears token", async () => {
    const now = Math.floor(Date.now()/1000);
    await upsertUser(env.DB, "0xabc", {
      email: "alice@example.com",
      email_token: "tok123",
      email_token_exp: now + 3600,
    }, now);

    const res = await SELF.fetch(`http://localhost/api/email/verify?token=tok123`, { redirect: "manual" });
    expect(res.status).toBe(302); // redirect
    const u = await getUser(env.DB, "0xabc");
    expect(u?.email_verified).toBe(1);
    expect(u?.email_token).toBeNull();
  });

  it("GET /api/email/verify with bad token redirects with error", async () => {
    const res = await SELF.fetch(`http://localhost/api/email/verify?token=nope`, { redirect: "manual" });
    expect(res.status).toBe(302);
    const loc = res.headers.get("location") ?? "";
    expect(loc).toContain("emailVerified=error");
  });
});
