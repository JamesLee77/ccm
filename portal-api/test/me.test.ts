import { env, SELF } from "cloudflare:test";
import { applyD1Migrations } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import { signSession } from "../src/session";
import { upsertUser } from "../src/db";

beforeEach(async () => {
  const migrations = JSON.parse((env as any).TEST_MIGRATIONS);
  await applyD1Migrations(env.DB, migrations);
});

async function authedFetch(path: string, init?: RequestInit, address = "0xabc") {
  const cookie = await signSession(env.SIWE_SECRET, address, Math.floor(Date.now() / 1000) + 3600);
  return SELF.fetch(`http://localhost${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), cookie: `siwe_session=${cookie}`, "content-type": "application/json" },
  });
}

describe("/api/me", () => {
  it("GET /api/me returns defaults for newly-authed user", async () => {
    await upsertUser(env.DB, "0xabc", {}, Math.floor(Date.now() / 1000));
    const res = await authedFetch("/api/me");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.address).toBe("0xabc");
    expect(body.email).toBeNull();
    expect(body.email_verified).toBe(false);
    expect(body.notif_prefs).toEqual({ cliff_7d: true, cliff_1d: true, claim_ready: true });
    expect(body.language).toBe("en");
  });

  it("PUT /api/me updates language and prefs", async () => {
    await upsertUser(env.DB, "0xabc", {}, Math.floor(Date.now() / 1000));
    const res = await authedFetch("/api/me", {
      method: "PUT",
      body: JSON.stringify({
        language: "en",
        notif_prefs: { cliff_7d: false, cliff_1d: true, claim_ready: true },
      }),
    });
    expect(res.status).toBe(200);
    const fresh = await (await authedFetch("/api/me")).json() as Record<string, unknown>;
    expect(fresh.language).toBe("en");
    expect(fresh.notif_prefs).toEqual({ cliff_7d: false, cliff_1d: true, claim_ready: true });
  });

  it("GET /api/me without cookie is 401", async () => {
    const res = await SELF.fetch("http://localhost/api/me");
    expect(res.status).toBe(401);
  });
});
