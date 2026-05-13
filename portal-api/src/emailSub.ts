import { Hono } from "hono";
import type { Env } from "./types";
import { requireSession } from "./middleware";
import { upsertUser, clearEmail, markEmailVerified } from "./db";
import { sendEmail, renderEmailVerify } from "./email";

const VERIFY_TTL_SEC = 24 * 60 * 60; // 24 hours

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailRoutes = new Hono<{ Bindings: Env; Variables: { address: string } }>();

emailRoutes.post("/", requireSession, async (c) => {
  const body = await c.req.json().catch(() => null);
  const raw: unknown = body?.email;
  if (typeof raw !== "string") {
    return c.json({ error: "INVALID_EMAIL" }, 400);
  }
  const email = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return c.json({ error: "INVALID_EMAIL" }, 400);
  }
  const now = Math.floor(Date.now() / 1000);
  const token = randomHex(24);

  await upsertUser(c.env.DB, c.var.address, {
    email,
    email_verified: 0,
    email_token: token,
    email_token_exp: now + VERIFY_TTL_SEC,
  }, now);

  const tpl = renderEmailVerify({ apiBaseUrl: c.env.API_BASE_URL, token });
  const ok = await sendEmail({
    apiKey: c.env.RESEND_API_KEY,
    from: c.env.RESEND_FROM,
    to: email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
  if (!ok) return c.json({ error: "EMAIL_SEND_FAILED" }, 502);
  return c.json({ ok: true });
});

emailRoutes.delete("/", requireSession, async (c) => {
  await clearEmail(c.env.DB, c.var.address, Math.floor(Date.now() / 1000));
  return c.json({ ok: true });
});

// Public verify endpoint — registered under /api/email/verify by index.ts
export const emailVerifyRoute = new Hono<{ Bindings: Env }>();
emailVerifyRoute.get("/verify", async (c) => {
  const token = c.req.query("token");
  const back = (suffix: string) => c.redirect(`${c.env.APP_BASE_URL}/settings?${suffix}`, 302);
  if (!token) return back("emailVerified=error");

  const now = Math.floor(Date.now() / 1000);
  const row = await c.env.DB
    .prepare("SELECT address, email_token_exp FROM users WHERE email_token = ?")
    .bind(token)
    .first<{ address: string; email_token_exp: number | null }>();

  if (!row || !row.email_token_exp || row.email_token_exp < now) {
    return back("emailVerified=error");
  }
  await markEmailVerified(c.env.DB, row.address, now);
  return back("emailVerified=ok");
});
