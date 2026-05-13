import type { SessionPayload } from "./types";

const ENC = new TextEncoder();
const DEC = new TextDecoder();

function b64url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromB64url(s: string): Uint8Array {
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(
  secret: string,
  address: string,
  exp: number,
): Promise<string> {
  const payload: SessionPayload = { address: address.toLowerCase(), exp };
  const body = b64url(ENC.encode(JSON.stringify(payload)));
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, ENC.encode(body));
  return `${body}.${b64url(new Uint8Array(sig))}`;
}

export async function verifySession(
  secret: string,
  cookie: string,
): Promise<SessionPayload | null> {
  try {
    const dot = cookie.indexOf(".");
    if (dot < 0) return null;
    const body = cookie.slice(0, dot);
    const sig = cookie.slice(dot + 1);
    const key = await importKey(secret);
    const ok = await crypto.subtle.verify("HMAC", key, fromB64url(sig), ENC.encode(body));
    if (!ok) return null;
    const payload: SessionPayload = JSON.parse(DEC.decode(fromB64url(body)));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
