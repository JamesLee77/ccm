import { test, expect } from "@playwright/test";
import { activateTestWallet, switchPersona, TEST_KEY } from "./fixtures";

/**
 * Verifies the test wallet connector's personal_sign path works against
 * the real portal-api SIWE endpoint. No popup, no MetaMask — the
 * embedded private key signs the EIP-4361 message in-process and the
 * Worker accepts the signature.
 *
 * After successful sign-in, the audit-log Card flips from "sign in to
 * enable audit logging" to "active session".
 */
test.describe("SIWE sign-in via test wallet", () => {
  test.skip(!TEST_KEY, "PLAYWRIGHT_TEST_KEY env var is required");

  test("compliance wallet signs in on /vesting", async ({ page }) => {
    await activateTestWallet(page, TEST_KEY!);
    await switchPersona(page, "compliance");

    // Compliance NAV → Vesting tab
    await page.click('nav a:has-text("Vesting")');
    await page.waitForLoadState("networkidle");

    // The SIWE Card initially shows "Sign in with wallet" CTA
    const signInBtn = page.locator("button", { hasText: /Sign in with wallet/i });
    await expect(signInBtn.first()).toBeVisible({ timeout: 10_000 });
    await signInBtn.first().click();

    // After sign-in: status text changes to "active session"
    await expect(page.locator("text=active session").first()).toBeVisible({
      timeout: 20_000,
    });
    // ✓ signed in indicator
    await expect(page.locator("text=✓ signed in").first()).toBeVisible();
  });
});
