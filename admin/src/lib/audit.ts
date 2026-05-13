/**
 * Thin client for portal-api SIWE + admin audit log.
 *
 * Cross-origin (admin → portal-api worker), so we don't rely on cookies.
 * Session token is stored in sessionStorage (NOT localStorage — operator
 * console session shouldn't survive browser restart on a shared device)
 * and passed via Authorization: Bearer header on every audit call.
 */

const API_BASE = (import.meta.env.VITE_PORTAL_API as string | undefined) ?? "https://ccm-portal-api.misterylee.workers.dev";
const STORAGE_KEY = "ccm-admin-siwe";

export interface SiweSession {
  token: string;
  address: string;
  exp: number; // unix sec
}

export function readSession(): SiweSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as SiweSession;
    if (typeof obj.token !== "string" || typeof obj.exp !== "number") return null;
    if (Date.now() / 1000 >= obj.exp) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function saveSession(s: SiweSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

/**
 * Trigger the SIWE flow against portal-api. Caller passes a `signFn`
 * that produces a signature over the SIWE message — this lets us avoid
 * importing wagmi here and keeps this module wallet-library-agnostic.
 */
export async function signIn(opts: {
  address: `0x${string}`;
  chainId: number;
  signFn: (message: string) => Promise<`0x${string}`>;
}): Promise<SiweSession> {
  const nonceRes = await fetch(`${API_BASE}/api/auth/nonce`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      address: opts.address,
      chainId: opts.chainId,
      app: "admin",
    }),
  });
  if (!nonceRes.ok) {
    const err = (await nonceRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(`nonce failed (${nonceRes.status}): ${err.error ?? "unknown"}`);
  }
  const { message } = (await nonceRes.json()) as { message: string; nonce: string };

  const signature = await opts.signFn(message);

  const verifyRes = await fetch(`${API_BASE}/api/auth/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });
  if (!verifyRes.ok) {
    const err = (await verifyRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(`verify failed (${verifyRes.status}): ${err.error ?? "unknown"}`);
  }
  const body = (await verifyRes.json()) as { address: string; token: string; exp: number };
  const session: SiweSession = { address: body.address, token: body.token, exp: body.exp };
  saveSession(session);
  return session;
}

// ============================================================================
// Audit log API
// ============================================================================

export type AuditAction =
  | "sign_in"
  | "mint"
  | "transfer"
  | "manual_transfer"
  | "pause"
  | "unpause"
  | "grant_role"
  | "revoke_role"
  | "create_round"
  | "close_round"
  | "whitelist_set"
  | "whitelist_set_batch"
  | "withdraw_usdc"
  | "create_schedule"
  | "create_schedule_batch"
  | "revoke_schedule"
  | "schedule_op"
  | "execute_op"
  | "cancel_op"
  | "kyc_set"
  | "kyc_set_batch";

export type AuditStatus = "pending" | "submitted" | "confirmed" | "failed";

export interface AuditEntry {
  chain_id: number;
  action: AuditAction;
  target_contract: `0x${string}`;
  target_address?: `0x${string}` | null;
  amount_wei?: string | null;
  role_name?: string | null;
  tx_hash?: `0x${string}` | null;
  status: AuditStatus;
  notes?: string | null;
}

export interface AuditRow {
  id: number;
  wallet: string;
  chain_id: number;
  action: AuditAction;
  target_contract: string;
  target_address: string | null;
  amount_wei: string | null;
  role_name: string | null;
  tx_hash: string | null;
  status: AuditStatus;
  error_msg: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

async function authedFetch(
  session: SiweSession,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "content-type": "application/json",
      authorization: `Bearer ${session.token}`,
    },
  });
}

export async function logAuditStart(
  session: SiweSession,
  entry: AuditEntry,
): Promise<{ id: number }> {
  const r = await authedFetch(session, "/api/me/audit", {
    method: "POST",
    body: JSON.stringify(entry),
  });
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(`audit log start failed (${r.status}): ${err.error ?? "unknown"}`);
  }
  return (await r.json()) as { id: number };
}

export async function logAuditUpdate(
  session: SiweSession,
  id: number,
  patch: { tx_hash?: `0x${string}` | null; status?: AuditStatus; error_msg?: string | null },
): Promise<void> {
  const r = await authedFetch(session, `/api/me/audit/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!r.ok) {
    // Don't throw — audit-log failures should never block the user-facing flow.
    // Log to console for ops visibility.
    console.warn("audit update failed", r.status, await r.text().catch(() => ""));
  }
}

export async function listMyAudit(
  session: SiweSession,
  limit = 10,
): Promise<AuditRow[]> {
  const r = await authedFetch(session, `/api/me/audit?limit=${limit}`, { method: "GET" });
  if (!r.ok) return [];
  const body = (await r.json()) as { rows: AuditRow[] };
  return body.rows ?? [];
}
