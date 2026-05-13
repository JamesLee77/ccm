import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { Env } from "./types";
import { verifySession } from "./session";

/**
 * Resolve a session token from either:
 *  - the `siwe_session` cookie (portal.ccmnetwork.net, same-origin), or
 *  - the `Authorization: Bearer <token>` header (admin.ccmnetwork.net,
 *    cross-origin to the worker — SameSite=None cookies don't always
 *    survive across embedded contexts and CDN edges, so the admin uses
 *    explicit header passing).
 */
export const requireSession = createMiddleware<{
  Bindings: Env;
  Variables: { address: string };
}>(async (c, next) => {
  let token: string | null = getCookie(c, "siwe_session") ?? null;
  if (!token) {
    const auth = c.req.header("Authorization");
    if (auth && auth.startsWith("Bearer ")) token = auth.slice("Bearer ".length).trim();
  }
  if (!token) return c.json({ error: "UNAUTHENTICATED" }, 401);
  const session = await verifySession(c.env.SIWE_SECRET, token);
  if (!session) return c.json({ error: "UNAUTHENTICATED" }, 401);
  c.set("address", session.address);
  await next();
});
