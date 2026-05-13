import { env } from "cloudflare:test";
import { describe, it, expect, vi, afterEach } from "vitest";
import { sendEmail, renderEmailVerify, renderClaimReady, renderCliff7d, renderCliff1d } from "../src/email";

afterEach(() => vi.unstubAllGlobals());

describe("renderers", () => {
  it("renderEmailVerify produces a verify link with the token", () => {
    const { subject, html, text } = renderEmailVerify({
      apiBaseUrl: "https://api.example",
      token: "abc123",
    });
    expect(subject).toMatch(/verify/i);
    expect(html).toContain("https://api.example/api/email/verify?token=abc123");
    expect(text).toContain("https://api.example/api/email/verify?token=abc123");
  });

  it("renderClaimReady includes amount and link", () => {
    const r = renderClaimReady({
      appBaseUrl: "https://x.example",
      releasable: "100",
      symbol: "CCM",
      scheduleId: 0,
    });
    expect(r.subject).toMatch(/ready to claim/i);
    expect(r.text).toContain("100 CCM");
  });

  it("renderCliff7d / renderCliff1d include unlock date", () => {
    const fmt = "2027-01-01";
    const a = renderCliff7d({ appBaseUrl: "https://x", unlockDate: fmt });
    const b = renderCliff1d({ appBaseUrl: "https://x", unlockDate: fmt });
    expect(a.text).toContain(fmt);
    expect(b.text).toContain(fmt);
  });
});

describe("sendEmail", () => {
  it("posts to Resend with API key", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: "msg_x" }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const ok = await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.RESEND_FROM,
      to: "alice@example.com",
      subject: "hi",
      html: "<p>hi</p>",
      text: "hi",
    });
    expect(ok).toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        }),
      }),
    );
  });

  it("returns false on non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("err", { status: 500 })));
    const ok = await sendEmail({
      apiKey: "k",
      from: "a@b",
      to: "c@d",
      subject: "s",
      html: "h",
      text: "t",
    });
    expect(ok).toBe(false);
  });
});
