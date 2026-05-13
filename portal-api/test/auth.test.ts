import { env, SELF } from "cloudflare:test";
import { applyD1Migrations } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

beforeEach(async () => {
  const migrations = JSON.parse((env as any).TEST_MIGRATIONS);
  await applyD1Migrations(env.DB, migrations);
});

describe("auth", () => {
  it("POST /api/auth/nonce returns nonce + message", async () => {
    const res = await SELF.fetch("http://localhost/api/auth/nonce", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address: "0x048f42B850cC126468EE112852b6aC67e08e5d24" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { nonce: string; message: string };
    expect(body.nonce).toMatch(/^[a-f0-9]{32}$/);
    expect(body.message).toContain("0x048f42B850cC126468EE112852b6aC67e08e5d24");
    expect(body.message).toContain(body.nonce);
  });

  it("POST /api/auth/nonce rejects malformed address", async () => {
    const res = await SELF.fetch("http://localhost/api/auth/nonce", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address: "not-an-address" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/verify accepts a valid SIWE signature and sets cookie", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    // 1. Get a nonce
    const nonceRes = await SELF.fetch("http://localhost/api/auth/nonce", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address: account.address }),
    });
    const { message } = (await nonceRes.json()) as { nonce: string; message: string };
    // 2. Sign it
    const signature = await account.signMessage({ message });
    // 3. Verify
    const verifyRes = await SELF.fetch("http://localhost/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, signature }),
    });
    expect(verifyRes.status).toBe(200);
    const body = (await verifyRes.json()) as { address: string };
    expect(body.address).toBe(account.address.toLowerCase());
    expect(verifyRes.headers.get("set-cookie")).toMatch(/siwe_session=/);
  });

  it("verify response sets cookie with SameSite=None", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const nonceRes = await SELF.fetch("http://localhost/api/auth/nonce", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address: account.address }),
    });
    const { message } = (await nonceRes.json()) as { message: string };
    const signature = await account.signMessage({ message });
    const verifyRes = await SELF.fetch("http://localhost/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, signature }),
    });
    const setCookie = verifyRes.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/SameSite=None/i);
    expect(setCookie).toMatch(/Secure/i);
    expect(setCookie).toMatch(/HttpOnly/i);
  });

  it("POST /api/auth/logout clears the siwe_session cookie", async () => {
    const res = await SELF.fetch("http://localhost/api/auth/logout", { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: true };
    expect(body.ok).toBe(true);

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/siwe_session=/);
    // cookie must be cleared: either Max-Age=0 or Expires set to a past date
    expect(setCookie).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970)/i);
    // and must keep the same flags so the browser actually overwrites the live cookie
    expect(setCookie).toMatch(/SameSite=None/i);
    expect(setCookie).toMatch(/Secure/i);
    expect(setCookie).toMatch(/Path=\//i);
  });

  it("POST /api/auth/verify rejects when nonce was never issued", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const fakeMessage = [
      `ccm-portal.pages.dev wants you to sign in with your Ethereum account:`,
      account.address,
      "",
      "Sign in to the CCM Network Investor Portal.",
      "",
      `URI: https://ccm-portal.pages.dev`,
      `Version: 1`,
      `Chain ID: 8453`,
      `Nonce: deadbeefdeadbeefdeadbeefdeadbeef`,
      `Issued At: ${new Date().toISOString()}`,
    ].join("\n");
    const signature = await account.signMessage({ message: fakeMessage });
    const res = await SELF.fetch("http://localhost/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: fakeMessage, signature }),
    });
    expect(res.status).toBe(401);
  });
});
