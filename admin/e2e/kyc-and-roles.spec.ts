import { test, expect } from "@playwright/test";
import { activateTestWallet, switchPersona, TEST_KEY } from "./fixtures";

/**
 * Verifies layered defense: even when persona allows the user onto a
 * page, the on-chain RBAC role check disables write CTAs if the connected
 * wallet doesn't hold the required role.
 *
 * Compliance test wallet has SCHEDULE_MANAGER_ROLE on Vesting but NOT
 * KYC_OPERATOR_ROLE on the registry (granting that requires a 48h
 * timelock — intentionally skipped). So /kyc should:
 *   • show the page (Compliance persona has view + write rights to /kyc)
 *   • show the "✗ KYC_OPERATOR_ROLE required" badge
 *   • disable the Approve / Revoke CTAs
 *   • keep the address-lookup field functional (read-only RPC)
 *   • keep the recent-events list rendering
 */
test.describe("KYC page — role-based CTA gating (compliance wallet, no KYC role)", () => {
  test.skip(!TEST_KEY, "PLAYWRIGHT_TEST_KEY env var is required");

  test.beforeEach(async ({ page }) => {
    await activateTestWallet(page, TEST_KEY!);
    await switchPersona(page, "compliance");
  });

  test("/kyc shows ✗ KYC_OPERATOR_ROLE required + disabled CTAs", async ({ page }) => {
    await page.click('nav a:has-text("KYC")');
    await page.waitForLoadState("domcontentloaded");
    // The role badge in the "Set status · single address" card
    await expect(page.locator("text=✗ KYC_OPERATOR_ROLE required").first())
      .toBeVisible({ timeout: 15_000 });
    // The Approve CTA exists but is disabled
    const approveBtn = page.locator("button", { hasText: /^Approve$/ });
    if ((await approveBtn.count()) > 0) {
      await expect(approveBtn.first()).toBeDisabled();
    }
  });

  test("/kyc address lookup field is interactive (read-only RPC)", async ({ page }) => {
    await page.click('nav a:has-text("KYC")');
    await page.waitForLoadState("domcontentloaded");
    const lookup = page.locator('label:has-text("Address")').first().locator("input");
    // Type a known KYCed address (carol from the e2e suite); UI then runs
    // isKYCed read against the RPC. We don't assert true/false because
    // state changes between runs, but we DO assert the input accepted
    // the value.
    await lookup.fill("0xAF2f45364657d9A9e40b80489Ed15baDC4dc098D");
    await expect(lookup).toHaveValue("0xAF2f45364657d9A9e40b80489Ed15baDC4dc098D");
  });

  test("/kyc renders 'Recent on-chain status changes' section", async ({ page }) => {
    await page.click('nav a:has-text("KYC")');
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("text=Recent on-chain status changes").first())
      .toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Treasury wallet RBAC — compliance wallet, treasury persona", () => {
  test.skip(!TEST_KEY, "PLAYWRIGHT_TEST_KEY env var is required");

  test("/tokens disables Mint and Send despite treasury persona", async ({ page }) => {
    await activateTestWallet(page, TEST_KEY!);
    // Compliance wallet pretending to be treasury via dev switcher —
    // persona allows the page, but on-chain MINTER_ROLE check blocks.
    await switchPersona(page, "treasury");
    await page.click('nav a:has-text("Token")');
    await page.waitForLoadState("domcontentloaded");

    // Mint button (only renders when wallet connected and section visible)
    const mintBtn = page.locator("button", { hasText: /^Mint$/ });
    if ((await mintBtn.count()) > 0) {
      await expect(mintBtn.first()).toBeDisabled();
    }
    // Send CCM button — has on-chain balance check too (compliance has 0 CCM)
    const sendBtn = page.locator("button", { hasText: /^Send$/ });
    if ((await sendBtn.count()) > 0) {
      await expect(sendBtn.first()).toBeDisabled();
    }
  });
});
