import { describe, it, expect } from "vitest";
import { formatCCM, formatUnlockDate } from "../src/format";

describe("format", () => {
  it("formatCCM formats 1e18 wei as '1'", () => {
    expect(formatCCM(10n ** 18n)).toBe("1");
  });
  it("formatCCM formats 1.234 with 4dp default", () => {
    expect(formatCCM(1234n * 10n ** 15n)).toBe("1.234");
  });
  it("formatCCM caps to maxFractionDigits", () => {
    expect(formatCCM(1234567890123456789n, 2)).toBe("1.23");
  });
  it("formatUnlockDate produces YYYY-MM-DD UTC", () => {
    expect(formatUnlockDate(1_700_000_000n)).toBe("2023-11-14");
  });
});
