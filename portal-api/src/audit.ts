import { Hono } from "hono";
import { isAddress } from "viem";
import type { AdminAuditAction, AdminAuditRow, AdminAuditStatus, Env } from "./types";
import { requireSession } from "./middleware";

const lc = (a: string) => a.toLowerCase();

// ============================================================================
// DB helpers
// ============================================================================

interface NewAuditInput {
  wallet: string;
  chain_id: number;
  action: AdminAuditAction;
  target_contract: string;
  target_address?: string | null;
  amount_wei?: string | null;
  role_name?: string | null;
  tx_hash?: string | null;
  status: AdminAuditStatus;
  notes?: string | null;
  ip_country?: string | null;
  user_agent?: string | null;
}

export async function insertAudit(
  db: D1Database,
  row: NewAuditInput,
  now: number,
): Promise<number> {
  const res = await db
    .prepare(
      `INSERT INTO admin_audit_log
       (wallet, chain_id, action, target_contract, target_address, amount_wei,
        role_name, tx_hash, status, notes, ip_country, user_agent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind(
      lc(row.wallet),
      row.chain_id,
      row.action,
      lc(row.target_contract),
      row.target_address ? lc(row.target_address) : null,
      row.amount_wei ?? null,
      row.role_name ?? null,
      row.tx_hash ?? null,
      row.status,
      row.notes ? row.notes.slice(0, 1000) : null,
      row.ip_country ?? null,
      row.user_agent ? row.user_agent.slice(0, 200) : null,
      now,
      now,
    )
    .first<{ id: number }>();
  if (!res) throw new Error("audit insert failed");
  return res.id;
}

export async function patchAudit(
  db: D1Database,
  id: number,
  wallet: string,
  patch: { tx_hash?: string | null; status?: AdminAuditStatus; error_msg?: string | null },
  now: number,
): Promise<boolean> {
  // Walls patch behind ownership check (only the wallet that created the
  // entry can update it). This means a SIWE-authenticated user can only
  // mutate their own audit rows, not someone else's.
  const r = await db
    .prepare(
      `UPDATE admin_audit_log
       SET tx_hash   = COALESCE(?, tx_hash),
           status    = COALESCE(?, status),
           error_msg = COALESCE(?, error_msg),
           updated_at = ?
       WHERE id = ? AND wallet = ?`,
    )
    .bind(
      patch.tx_hash ?? null,
      patch.status ?? null,
      patch.error_msg ? patch.error_msg.slice(0, 500) : null,
      now,
      id,
      lc(wallet),
    )
    .run();
  return (r.meta?.changes ?? 0) > 0;
}

export async function listAuditByWallet(
  db: D1Database,
  wallet: string,
  limit: number,
): Promise<AdminAuditRow[]> {
  const r = await db
    .prepare(
      `SELECT * FROM admin_audit_log WHERE wallet = ?
       ORDER BY id DESC LIMIT ?`,
    )
    .bind(lc(wallet), limit)
    .all<AdminAuditRow>();
  return r.results ?? [];
}

export async function listAllAudit(
  db: D1Database,
  limit: number,
  offset: number,
): Promise<AdminAuditRow[]> {
  const r = await db
    .prepare(
      `SELECT * FROM admin_audit_log ORDER BY id DESC LIMIT ? OFFSET ?`,
    )
    .bind(limit, offset)
    .all<AdminAuditRow>();
  return r.results ?? [];
}

// ============================================================================
// Routes — all require SIWE session (the wallet whose audit rows are written)
// ============================================================================

export const auditRoutes = new Hono<{ Bindings: Env; Variables: { address: string } }>();

auditRoutes.use("*", requireSession);

const VALID_ACTIONS: AdminAuditAction[] = [
  "sign_in",
  "mint",
  "transfer",
  "manual_transfer",
  "pause",
  "unpause",
  "grant_role",
  "revoke_role",
  "create_round",
  "close_round",
  "whitelist_set",
  "whitelist_set_batch",
  "withdraw_usdc",
  "create_schedule",
  "create_schedule_batch",
  "revoke_schedule",
  "schedule_op",
  "execute_op",
  "cancel_op",
  "kyc_set",
  "kyc_set_batch",
];
const VALID_STATUS: AdminAuditStatus[] = ["pending", "submitted", "confirmed", "failed"];

interface PostBody {
  chain_id?: number;
  action?: string;
  target_contract?: string;
  target_address?: string | null;
  amount_wei?: string | null;
  role_name?: string | null;
  tx_hash?: string | null;
  status?: string;
  notes?: string | null;
}

auditRoutes.post("/", async (c) => {
  const wallet = c.get("address");
  const body = (await c.req.json().catch(() => ({}))) as PostBody;

  if (typeof body.chain_id !== "number") return c.json({ error: "chain_id required" }, 400);
  if (typeof body.action !== "string" || !VALID_ACTIONS.includes(body.action as AdminAuditAction)) {
    return c.json({ error: "invalid action" }, 400);
  }
  if (typeof body.target_contract !== "string" || !isAddress(body.target_contract)) {
    return c.json({ error: "target_contract must be an address" }, 400);
  }
  if (
    body.target_address !== null &&
    body.target_address !== undefined &&
    body.target_address !== "" &&
    !isAddress(body.target_address)
  ) {
    return c.json({ error: "invalid target_address" }, 400);
  }
  const status = (body.status ?? "pending") as AdminAuditStatus;
  if (!VALID_STATUS.includes(status)) return c.json({ error: "invalid status" }, 400);

  const now = Math.floor(Date.now() / 1000);
  const ipCountry = c.req.header("CF-IPCountry") || null;
  const userAgent = c.req.header("User-Agent") || null;

  const id = await insertAudit(
    c.env.DB,
    {
      wallet,
      chain_id: body.chain_id,
      action: body.action as AdminAuditAction,
      target_contract: body.target_contract,
      target_address: body.target_address || null,
      amount_wei: body.amount_wei ?? null,
      role_name: body.role_name ?? null,
      tx_hash: body.tx_hash ?? null,
      status,
      notes: body.notes ?? null,
      ip_country: ipCountry,
      user_agent: userAgent,
    },
    now,
  );
  return c.json({ id, wallet, status });
});

interface PatchBody {
  tx_hash?: string | null;
  status?: string;
  error_msg?: string | null;
}

auditRoutes.patch("/:id", async (c) => {
  const wallet = c.get("address");
  const id = parseInt(c.req.param("id"));
  if (Number.isNaN(id) || id <= 0) return c.json({ error: "invalid id" }, 400);

  const body = (await c.req.json().catch(() => ({}))) as PatchBody;
  if (body.status !== undefined && !VALID_STATUS.includes(body.status as AdminAuditStatus)) {
    return c.json({ error: "invalid status" }, 400);
  }
  if (
    body.tx_hash !== null &&
    body.tx_hash !== undefined &&
    !/^0x[0-9a-fA-F]{64}$/.test(body.tx_hash)
  ) {
    return c.json({ error: "invalid tx_hash" }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const ok = await patchAudit(
    c.env.DB,
    id,
    wallet,
    {
      tx_hash: body.tx_hash ?? null,
      status: (body.status as AdminAuditStatus | undefined) ?? null,
      error_msg: body.error_msg ?? null,
    } as { tx_hash?: string | null; status?: AdminAuditStatus; error_msg?: string | null },
    now,
  );
  if (!ok) return c.json({ error: "not found or not yours" }, 404);
  return c.json({ ok: true });
});

auditRoutes.get("/", async (c) => {
  const wallet = c.get("address");
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") ?? "50"), 1), 200);
  const rows = await listAuditByWallet(c.env.DB, wallet, limit);
  return c.json({ rows });
});
