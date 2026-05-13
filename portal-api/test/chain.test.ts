import { env } from "cloudflare:test";
import { describe, it, expect, vi, afterEach } from "vitest";
import { readScheduleCount, readSchedule, readReleasable } from "../src/chain";

afterEach(() => vi.unstubAllGlobals());

function rpcMock(payload: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(payload), {
    status: 200, headers: { "content-type": "application/json" },
  }));
}

describe("chain", () => {
  it("readScheduleCount decodes uint256", async () => {
    vi.stubGlobal("fetch", rpcMock({ jsonrpc: "2.0", id: 1, result: "0x" + (5n).toString(16).padStart(64, "0") }));
    const n = await readScheduleCount(env);
    expect(n).toBe(5n);
  });

  it("readReleasable decodes uint256", async () => {
    vi.stubGlobal("fetch", rpcMock({ jsonrpc: "2.0", id: 1, result: "0x" + (123n).toString(16).padStart(64, "0") }));
    const r = await readReleasable(env, 0n);
    expect(r).toBe(123n);
  });

  it("readSchedule decodes the struct", async () => {
    // Build a synthetic ABI-encoded tuple
    const beneficiary = "0x048f42B850cC126468EE112852b6aC67e08e5d24";
    const total = 1000n;
    const start = 1_700_000_000n;
    const cliff = 0n;
    const dur = 300n;
    const released = 0n;
    const revocable = true;
    const revoked = false;
    const word = (v: bigint | string | boolean) => {
      if (typeof v === "boolean") return (v ? "1" : "0").padStart(64, "0");
      if (typeof v === "string") return v.toLowerCase().replace("0x", "").padStart(64, "0");
      return v.toString(16).padStart(64, "0");
    };
    const result =
      "0x" +
      word(beneficiary) +
      word(total) +
      word(start) +
      word(cliff) +
      word(dur) +
      word(released) +
      word(revocable) +
      word(revoked);
    vi.stubGlobal("fetch", rpcMock({ jsonrpc: "2.0", id: 1, result }));

    const s = await readSchedule(env, 0n);
    expect(s.beneficiary.toLowerCase()).toBe(beneficiary.toLowerCase());
    expect(s.totalAmount).toBe(total);
    expect(s.startTime).toBe(start);
    expect(s.cliffDuration).toBe(cliff);
    expect(s.vestingDuration).toBe(dur);
    expect(s.released).toBe(released);
    expect(s.revocable).toBe(true);
    expect(s.revoked).toBe(false);
  });
});
