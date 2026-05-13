import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { requireSession } from "../src/middleware";
import { signSession } from "../src/session";

function makeApp() {
  const app = new Hono<{ Bindings: typeof env; Variables: { address: string } }>();
  app.use("/protected/*", requireSession);
  app.get("/protected/me", (c) => c.json({ address: c.var.address }));
  return app;
}

describe("requireSession", () => {
  it("returns 401 when cookie missing", async () => {
    const res = await makeApp().fetch(new Request("http://x/protected/me"), env);
    expect(res.status).toBe(401);
  });

  it("returns 401 when cookie tampered", async () => {
    const cookie = await signSession(env.SIWE_SECRET, "0xabc", Math.floor(Date.now() / 1000) + 3600);
    // Flip the second body byte to break the HMAC
    const tampered = cookie[0] + (cookie[1] === "A" ? "B" : "A") + cookie.slice(2);
    const res = await makeApp().fetch(
      new Request("http://x/protected/me", { headers: { cookie: `siwe_session=${tampered}` } }),
      env,
    );
    expect(res.status).toBe(401);
  });

  it("attaches lowercase address when cookie valid", async () => {
    const cookie = await signSession(env.SIWE_SECRET, "0xABC", Math.floor(Date.now() / 1000) + 3600);
    const res = await makeApp().fetch(
      new Request("http://x/protected/me", { headers: { cookie: `siwe_session=${cookie}` } }),
      env,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ address: "0xabc" });
  });
});
