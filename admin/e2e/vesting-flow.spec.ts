import { test, expect } from "@playwright/test";
import { activateTestWallet, switchPersona, TEST_KEY } from "./fixtures";

/**
 * Full Vesting create flow through the UI on testnet.
 *   1. Activate compliance test wallet
 *   2. Persona = Compliance
 *   3. Navigate to /vesting
 *   4. SIWE sign-in (auto via test connector)
 *   5. Fill the create-schedule form (carol = beneficiary, 1 CCM, 0d cliff, 1d vest)
 *   6. Click "Create schedule" → real on-chain tx
 *   7. Wait for "✓ Confirmed" indicator
 *   8. Verify schedule appears in the list
 *
 * COSTS gas (a few thousand wei on Base Sepolia). The compliance wallet
 * has plenty of headroom for repeated runs. To pause this spec when
 * iterating on UI, run only the persona+SIWE specs.
 *
 * REQUIRES: PLAYWRIGHT_TEST_KEY + PLAYWRIGHT_BENEFICIARY env vars.
 *   PLAYWRIGHT_BENEFICIARY = address that will receive a 1 CCM schedule
 *   (typically carol's testnet address from onchain/.env).
 */
const BENEFICIARY = process.env.PLAYWRIGHT_BENEFICIARY ?? "";

function nowPlusMin(min: number): string {
  // datetime-local input expects YYYY-MM-DDTHH:mm in LOCAL time
  const d = new Date(Date.now() + min * 60_000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

test.describe("vesting create flow (real on-chain tx)", () => {
  test.skip(!TEST_KEY, "PLAYWRIGHT_TEST_KEY env var is required");
  test.skip(!BENEFICIARY || !/^0x[0-9a-fA-F]{40}$/.test(BENEFICIARY),
    "PLAYWRIGHT_BENEFICIARY env var must be a 0x-prefixed address");

  // Real txs take time on testnet — bump the test timeout
  test.setTimeout(180_000);

  test("compliance wallet creates a 1 CCM schedule", async ({ page }) => {
    // ── 1: activate + persona
    await activateTestWallet(page, TEST_KEY!);
    await switchPersona(page, "compliance");

    // ── 2: navigate to /vesting
    await page.click('nav a:has-text("Vesting")');
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator('text=Create schedule · single')).toBeVisible({ timeout: 15_000 });

    // ── 3: SIWE sign in
    const signInBtn = page.locator("button", { hasText: /Sign in with wallet/i });
    if (await signInBtn.count() > 0) {
      await signInBtn.first().click();
      await expect(page.locator("text=active session").first()).toBeVisible({ timeout: 20_000 });
    }

    // ── 4: fill the create-single form
    // Beneficiary
    const benefField = page.locator('label:has-text("Beneficiary address")').locator("input");
    await benefField.fill(BENEFICIARY);
    // Amount
    await page.locator('label:has-text("Amount (whole CCM)")').locator("input").fill("1");
    // Cliff days = 0
    await page.locator('label:has-text("Cliff (days)")').first().locator("input").fill("0");
    // Vest days = 1
    await page.locator('label:has-text("Total vest duration")').locator("input").fill("1");
    // Start time (local datetime) — start ~2 minutes from now
    await page.locator('label:has-text("Start (local datetime)")').locator("input").fill(nowPlusMin(2));

    // ── 5: submit
    const createBtn = page.locator('button', { hasText: /^Create schedule$/i });
    await expect(createBtn.first()).toBeEnabled({ timeout: 5_000 });
    await createBtn.first().click();

    // ── 6: wait for tx hash to appear ("Last transaction" card)
    await expect(page.locator("text=Last transaction").first()).toBeVisible({ timeout: 30_000 });

    // ── 7: wait for ✓ Confirmed
    await expect(page.locator("text=✓ Confirmed").first()).toBeVisible({ timeout: 90_000 });

    // ── 8: verify a schedule with our beneficiary appears
    // The list shows truncated address like 0xAF2f…098D
    const trunc = `${BENEFICIARY.slice(0, 6)}…${BENEFICIARY.slice(-4)}`;
    await expect(page.locator(`text=${trunc}`).first()).toBeVisible({ timeout: 10_000 });

    // ── 9: verify audit row added (recentAudit re-fetches after isSuccess)
    await expect(page.locator("text=Recent vesting actions").first()).toBeVisible();
    // a freshly added row with status=confirmed
    await expect(page.locator(":text('confirmed')").first()).toBeVisible({ timeout: 10_000 });
  });
});
