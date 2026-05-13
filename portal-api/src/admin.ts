import { Hono } from "hono";
import type { Env } from "./types";
import {
  getKYCStatus,
  getLatestSnapshot,
  getSchedule,
  listAllHolders,
  listSchedulesByBeneficiary,
  listSyncRuns,
  setKYCMetadata,
  setScheduleClassification,
  syncFromChain,
} from "./holders";

export const adminRoutes = new Hono<{ Bindings: Env }>();

// ============================================================================
// Bearer-token auth middleware. The token is a Wrangler secret
// (ADMIN_BEARER_TOKEN) — set with: wrangler secret put ADMIN_BEARER_TOKEN
// ============================================================================
adminRoutes.use("*", async (c, next) => {
  const expected = c.env.ADMIN_BEARER_TOKEN;
  if (!expected) {
    return c.json({ error: "admin disabled (no ADMIN_BEARER_TOKEN configured)" }, 503);
  }
  const auth = c.req.header("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return c.json({ error: "missing Bearer token" }, 401);
  }
  const token = auth.slice("Bearer ".length).trim();
  // Constant-time-ish compare (D1 worker doesn't have crypto.timingSafeEqual,
  // but we can avoid early-exit by xor-summing).
  if (token.length !== expected.length) {
    return c.json({ error: "unauthorized" }, 401);
  }
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
});

// ============================================================================
// Holder list (paginated)
//   GET /api/admin/holders?limit=100&offset=0
// ============================================================================
adminRoutes.get("/holders", async (c) => {
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") ?? "100"), 1), 1000);
  const offset = Math.max(parseInt(c.req.query("offset") ?? "0"), 0);
  const rows = await listAllHolders(c.env.DB, limit, offset);
  return c.json({ holders: rows, limit, offset });
});

// ============================================================================
// Single holder detail
//   GET /api/admin/holder/:address
// ============================================================================
adminRoutes.get("/holder/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) {
    return c.json({ error: "invalid address" }, 400);
  }
  const [schedules, kyc, snapshot] = await Promise.all([
    listSchedulesByBeneficiary(c.env.DB, address),
    getKYCStatus(c.env.DB, address),
    getLatestSnapshot(c.env.DB, address),
  ]);
  return c.json({ address, schedules, kyc, latest_snapshot: snapshot });
});

// ============================================================================
// Annotate KYC metadata (provider, level, notes) for a holder
//   POST /api/admin/holder/:address/kyc-meta
//   body: { provider?, provider_id?, level?, notes? }
// ============================================================================
adminRoutes.post("/holder/:address/kyc-meta", async (c) => {
  const address = c.req.param("address").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) {
    return c.json({ error: "invalid address" }, 400);
  }
  const body = (await c.req.json().catch(() => ({}))) as {
    provider?: string | null;
    provider_id?: string | null;
    level?: string | null;
    notes?: string | null;
  };
  // Ensure a row exists (so UPDATE has a target)
  const existing = await getKYCStatus(c.env.DB, address);
  if (!existing) {
    return c.json({ error: "no kyc_status row — sync first or add via on-chain registry" }, 404);
  }
  await setKYCMetadata(c.env.DB, address, body);
  return c.json({ ok: true });
});

// ============================================================================
// Annotate schedule classification (source/legal_entity/jurisdiction)
//   POST /api/admin/schedule/:id/classify
// ============================================================================
adminRoutes.post("/schedule/:id/classify", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (Number.isNaN(id) || id < 0) return c.json({ error: "invalid id" }, 400);
  const body = (await c.req.json().catch(() => ({}))) as {
    source?: string | null;
    legal_entity?: string | null;
    jurisdiction?: string | null;
  };
  const existing = await getSchedule(c.env.DB, id);
  if (!existing) return c.json({ error: "schedule not found" }, 404);
  await setScheduleClassification(c.env.DB, id, body);
  return c.json({ ok: true });
});

// ============================================================================
// Trigger a sync now (off-cycle)
//   POST /api/admin/sync
// ============================================================================
adminRoutes.post("/sync", async (c) => {
  const now = Math.floor(Date.now() / 1000);
  const res = await syncFromChain(c.env, now);
  return c.json(res);
});

// ============================================================================
// Recent sync run log
//   GET /api/admin/sync/runs?limit=20
// ============================================================================
adminRoutes.get("/sync/runs", async (c) => {
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") ?? "20"), 1), 200);
  const runs = await listSyncRuns(c.env.DB, limit);
  return c.json({ runs });
});
