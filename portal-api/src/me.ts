import { Hono } from "hono";
import type { Env } from "./types";
import { requireSession } from "./middleware";
import { getUser, upsertUser } from "./db";

export const meRoutes = new Hono<{ Bindings: Env; Variables: { address: string } }>();

meRoutes.use("*", requireSession);

const VALID_LANGS = new Set(["en"]); // expand when ko.json/ja.json etc. ship

meRoutes.get("/", async (c) => {
  const user = await getUser(c.env.DB, c.var.address);
  if (!user) return c.json({ error: "NOT_FOUND" }, 404);
  return c.json({
    address: user.address,
    email: user.email,
    email_verified: user.email_verified === 1,
    notif_prefs: JSON.parse(user.notif_prefs),
    language: user.language,
  });
});

meRoutes.put("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "INVALID_BODY" }, 400);

  const update: { notif_prefs?: string; language?: string } = {};

  if (body.language !== undefined) {
    if (typeof body.language !== "string" || !VALID_LANGS.has(body.language)) {
      return c.json({ error: "INVALID_LANGUAGE" }, 400);
    }
    update.language = body.language;
  }

  if (body.notif_prefs !== undefined) {
    const np = body.notif_prefs;
    if (
      !np || typeof np !== "object" ||
      typeof np.cliff_7d !== "boolean" ||
      typeof np.cliff_1d !== "boolean" ||
      typeof np.claim_ready !== "boolean"
    ) {
      return c.json({ error: "INVALID_NOTIF_PREFS" }, 400);
    }
    update.notif_prefs = JSON.stringify({
      cliff_7d: np.cliff_7d,
      cliff_1d: np.cliff_1d,
      claim_ready: np.claim_ready,
    });
  }

  await upsertUser(c.env.DB, c.var.address, update, Math.floor(Date.now() / 1000));
  return c.json({ ok: true });
});
