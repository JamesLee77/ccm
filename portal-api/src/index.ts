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

app.use("*", async (c, next) => {
  const allowed = new Set([...PORTAL_ORIGINS(c.env.ALLOWED_ORIGIN), ...ADMIN_ORIGINS]);
  const corsMw = cors({
    origin: (origin) => (origin && allowed.has(origin) ? origin : null),
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  });
  return corsMw(c, next);
});

app.get("/health", (c) => c.json({ ok: true, service: "ccm-portal-api" }));
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
    ctx.waitUntil(
      Promise.all([
        runScheduled(env),
        syncFromChain(env, now),
      ]),
    );
  },
} satisfies ExportedHandler<Env>;
