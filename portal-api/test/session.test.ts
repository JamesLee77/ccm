import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "../src/session";

describe("session", () => {
  it("sign + verify round-trip", async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const cookie = await signSession(env.SIWE_SECRET, "0xabc", exp);
    const result = await verifySession(env.SIWE_SECRET, cookie);
    expect(result?.address).toBe("0xabc");
    expect(result?.exp).toBe(exp);
  });

  it("verifySession returns null for tampered payload", async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const cookie = await signSession(env.SIWE_SECRET, "0xabc", exp);
    // Flip a character in the body (before the dot) to tamper with the signature
    const tampered = cookie[0] + (cookie[1] === "A" ? "B" : "A") + cookie.slice(2);
    expect(await verifySession(env.SIWE_SECRET, tampered)).toBeNull();
  });

  it("verifySession returns null when expired", async () => {
    const exp = Math.floor(Date.now() / 1000) - 1;
    const cookie = await signSession(env.SIWE_SECRET, "0xabc", exp);
    expect(await verifySession(env.SIWE_SECRET, cookie)).toBeNull();
  });

  it("verifySession returns null for malformed cookie", async () => {
    expect(await verifySession(env.SIWE_SECRET, "garbage")).toBeNull();
  });

  it("verifySession returns null for cookie with invalid base64 signature length", async () => {
    // Signature with length 1 mod 4 — invalid base64 padding
    const cookie = "validbody.x";
    expect(await verifySession(env.SIWE_SECRET, cookie)).toBeNull();
  });
});
