import { env, SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("health", () => {
  it("GET /health returns ok", async () => {
    void env;
    const res = await SELF.fetch("http://localhost/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, service: "ccm-portal-api" });
  });
});
