import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { isAddress } from "viem";
import type { Env } from "./types";
import { putNonce, consumeNonce, upsertUser } from "./db";
import { signSession } from "./session";

const SESSION_TTL_SEC = 7 * 24 * 60 * 60;     // 7 days
const NONCE_TTL_SEC = 5 * 60;                 // 5 min

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildSiweMessage(opts: {
  domain: string;
  address: string;
  uri: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  statement: string;
}): string {
  return [
    `${opts.domain} wants you to sign in with your Ethereum account:`,
    opts.address,
    "",
    opts.statement,
    "",
    `URI: ${opts.uri}`,
    `Version: 1`,
    `Chain ID: ${opts.chainId}`,
    `Nonce: ${opts.nonce}`,
    `Issued At: ${opts.issuedAt}`,
  ].join("\n");
}

const ALLOWED_CHAIN_IDS = new Set([8453, 84532]);

const APP_STATEMENTS: Record<string, string> = {
  portal: "Sign in to the CCM Network Investor Portal.",
  admin: "Sign in to the CCM Network Operator Console. Every action you take after this signature is recorded in the admin audit log.",
};

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post("/nonce", async (c) => {
  const body = await c.req.json().catch(() => null);
  const address = body?.address;
  if (typeof address !== "string" || !isAddress(address)) {
    return c.json({ error: "INVALID_ADDRESS" }, 400);
  }
  const requestedChainId = typeof body?.chainId === "number" ? body.chainId : parseInt(c.env.CHAIN_ID, 10);
  if (!ALLOWED_CHAIN_IDS.has(requestedChainId)) {
    return c.json({ error: "INVALID_CHAIN" }, 400);
  }
  const app: keyof typeof APP_STATEMENTS = body?.app === "admin" ? "admin" : "portal";

  // The SIWE message's `domain` and `uri` should match the calling app
  // surface, not the API. For admin we trust the caller's stated origin
  // (validated at the CORS layer). For portal we use the configured
  // APP_BASE_URL (server-trusted).
  let appOrigin: string;
  if (app === "admin") {
    const origin = c.req.header("Origin") || "";
    // Admin must come from a known admin origin. Otherwise refuse — we
    // don't want an attacker on a random domain signing on behalf of a
    // wallet that thinks it's signing for "admin.ccmnetwork.net".
    const ALLOWED_ADMIN_ORIGINS = [
      "https://admin.ccmnetwork.net",
      "https://admin-testnet.ccmnetwork.net",
      "http://localhost:5173",
    ];
    if (!ALLOWED_ADMIN_ORIGINS.includes(origin)) {
      return c.json({ error: "INVALID_ORIGIN" }, 400);
    }
    appOrigin = origin;
  } else {
    appOrigin = c.env.APP_BASE_URL;
  }

  const nonce = randomHex(16);
  const now = Math.floor(Date.now() / 1000);
  await putNonce(c.env.DB, nonce, address, now + NONCE_TTL_SEC);
  const url = new URL(appOrigin);
  const message = buildSiweMessage({
    domain: url.host,
    address,
    uri: appOrigin,
    chainId: requestedChainId,
    nonce,
    issuedAt: new Date(now * 1000).toISOString(),
    statement: APP_STATEMENTS[app],
  });
  return c.json({ nonce, message });
});

authRoutes.post("/verify", async (c) => {
  const body = await c.req.json().catch(() => null);
  const message: unknown = body?.message;
  const signature: unknown = body?.signature;
  if (typeof message !== "string" || typeof signature !== "string") {
    return c.json({ error: "INVALID_BODY" }, 400);
  }

  // Parse + extract address/nonce from the message before signature verification
  const { parseSiweMessage, verifySiweMessage } = await import("viem/siwe");
  let parsed: ReturnType<typeof parseSiweMessage>;
  try {
    parsed = parseSiweMessage(message);
  } catch {
    return c.json({ error: "INVALID_MESSAGE" }, 400);
  }
  if (!parsed.address || !parsed.nonce) {
    return c.json({ error: "INVALID_MESSAGE" }, 400);
  }
  const claimedAddress = parsed.address.toLowerCase();
  const portalDomain = new URL(c.env.APP_BASE_URL).host;

  // Domain allowlist — the SIWE message must claim one of these origins.
  // We don't trust the request Origin header here (the message itself
  // already names a domain that the wallet showed the user; we just
  // check that domain is one of ours).
  const ALLOWED_DOMAINS = new Set<string>([
    portalDomain,
    "portal.ccmnetwork.net",
    "portal-testnet.ccmnetwork.net",
    "admin.ccmnetwork.net",
    "admin-testnet.ccmnetwork.net",
    "localhost:5173",
  ]);
  if (!parsed.domain || !ALLOWED_DOMAINS.has(parsed.domain)) {
    return c.json({ error: "INVALID_DOMAIN" }, 401);
  }

  // Consume nonce (atomic). Verifies the nonce was issued AND for this address.
  const now = Math.floor(Date.now() / 1000);
  const nonceRow = await consumeNonce(c.env.DB, parsed.nonce, now);
  if (!nonceRow || nonceRow.address !== claimedAddress) {
    return c.json({ error: "INVALID_NONCE" }, 401);
  }

  // Full SIWE validation: domain, uri, chainId, signature, time bounds.
  // Phase 1 only supports EOA wallets — pass a stub client and mode:"eoa" so
  // verifySiweMessage uses pure ECDSA recovery (no RPC required).
  const ok = await verifySiweMessage({ chain: null } as any, {
    address: parsed.address,
    message,
    signature: signature as `0x${string}`,
    domain: parsed.domain,
    nonce: parsed.nonce,
    mode: "eoa",
  } as any);
  if (!ok) return c.json({ error: "INVALID_SIGNATURE" }, 401);

  // Enforce chainId from the parsed message is in our allowlist (portal
  // signs with Base mainnet; admin testnet rehearsal signs with Base Sepolia).
  if (!ALLOWED_CHAIN_IDS.has(parsed.chainId ?? -1)) {
    return c.json({ error: "INVALID_CHAIN" }, 401);
  }

  await upsertUser(c.env.DB, claimedAddress, {}, now);

  const exp = now + SESSION_TTL_SEC;
  const token = await signSession(c.env.SIWE_SECRET, claimedAddress, exp);

  // Set cookie for same-origin clients (portal). Cross-origin clients
  // (admin) read the token from the response body and pass it back via
  // Authorization: Bearer header.
  setCookie(c, "siwe_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
  return c.json({ address: claimedAddress, token, exp });
});

authRoutes.post("/logout", async (c) => {
  deleteCookie(c, "siwe_session", { path: "/", secure: true, sameSite: "None" });
  return c.json({ ok: true });
});
