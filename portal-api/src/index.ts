import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { authRoutes } from "./auth";
import { meRoutes } from "./me";
import { emailRoutes, emailVerifyRoute } from "./emailSub";
import { adminRoutes } from "./admin";
import { auditRoutes } from "./audit";
import { runScheduled } from "./scheduled";
import { syncFromChain } from "./holders";
import { fetchAndStore as fetchCarbonPrice, getLatest as getLatestCarbonPrice } from "./carbonPrice";
import { runSandboxMint } from "./sandboxMint";
import { runOracleUpdate } from "./oracleUpdate";

const app = new Hono<{ Bindings: Env }>();

// CORS — allow portal (cookie-credentialed) + admin (Authorization-header).
// Admin requests don't carry the SiWE cookie so credentials aren't strictly
// required for them, but keeping `credentials: true` lets portal continue to
// work. The origin function below echoes the allowed origin per request.
const PORTAL_ORIGINS = (allowed: string) => new Set([
  allowed,
  "https://portal.ccmnetwork.net",
  "https://portal-testnet.ccmnetwork.net",
]);
const ADMIN_ORIGINS = new Set([
  "https://admin.ccmnetwork.net",
  "https://admin-testnet.ccmnetwork.net",
  "http://localhost:5173", // local dev
]);
// Public-read endpoints (e.g. /api/carbon-price) are accessible to all
// CCM web properties, not just the auth/admin domains.
const PUBLIC_ORIGINS = new Set([
  "https://ccmnetwork.net",
  "https://www.ccmnetwork.net",
  "https://testnet.ccmnetwork.net",
]);

app.use("*", async (c, next) => {
  const allowed = new Set([
    ...PORTAL_ORIGINS(c.env.ALLOWED_ORIGIN),
    ...ADMIN_ORIGINS,
    ...PUBLIC_ORIGINS,
  ]);
  const corsMw = cors({
    origin: (origin) => (origin && allowed.has(origin) ? origin : null),
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  });
  return corsMw(c, next);
});

app.get("/health", (c) => c.json({ ok: true, service: "ccm-portal-api" }));

// Public carbon-credit reference price feed. Single source of truth used by
// ccmnetwork.net, testnet, portal, admin. No auth, 5-min edge cache.
app.get("/api/carbon-price", async (c) => {
  const result = await getLatestCarbonPrice(c.env);
  c.header("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  return c.json(result, result.ok ? 200 : 503);
});


app.route("/api/auth", authRoutes);
app.route("/api/me", meRoutes);
app.route("/api/me/email", emailRoutes);
app.route("/api/me/audit", auditRoutes);
app.route("/api/email", emailVerifyRoute);
app.route("/api/admin", adminRoutes);

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const now = Math.floor(Date.now() / 1000);
    // Each cron task is wrapped in its own .catch so a transient failure in
    // one (e.g. mainnet RPC rate-limit on the vesting notifier) cannot
    // short-circuit the others (e.g. the Sepolia oracle/mint keeper).
    ctx.waitUntil(
      Promise.all([
        runScheduled(env).catch((e) => console.error("scheduled:", e)),
        syncFromChain(env, now).catch((e) => console.error("syncFromChain:", e)),
        fetchCarbonPrice(env).catch((e) => console.error("carbonPrice:", e)),
        runSandboxMint(env).catch((e) => console.error("sandboxMint:", e)),
        runOracleUpdate(env).catch((e) => console.error("oracleUpdate:", e)),
      ]),
    );
  },
} satisfies ExportedHandler<Env>;
