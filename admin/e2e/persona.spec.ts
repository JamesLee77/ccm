import { test, expect } from "@playwright/test";
import {
  activateTestWallet,
  getVisibleNav,
  switchPersona,
  TEST_KEY,
  TEST_ADDR,
} from "./fixtures";

test.describe("persona model", () => {
  test.skip(!TEST_KEY, "PLAYWRIGHT_TEST_KEY env var is required");

  test.beforeEach(async ({ page }) => {
    await activateTestWallet(page, TEST_KEY!);
  });

  test("test wallet auto-connects and badge shows truncated address", async ({ page }) => {
    const trunc = `${TEST_ADDR.slice(0, 6)}…${TEST_ADDR.slice(-4)}`;
    await expect(page.locator(`text=${trunc}`).first()).toBeVisible();
  });

  test("super_admin (default testnet) shows all 5 NAV tabs", async ({ page }) => {
    const tabs = await getVisibleNav(page);
    for (const t of ["Token", "Presale", "Vesting", "KYC", "Timelock"]) {
      expect(tabs).toContain(t);
    }
  });

  test("treasury persona — only Token / Presale / Timelock", async ({ page }) => {
    await switchPersona(page, "treasury");
    const tabs = await getVisibleNav(page);
    expect(tabs).toEqual(expect.arrayContaining(["Token", "Presale", "Timelock"]));
    expect(tabs).not.toContain("Vesting");
    expect(tabs).not.toContain("KYC");
  });

  test("compliance persona — only Vesting / KYC", async ({ page }) => {
    await switchPersona(page, "compliance");
    const tabs = await getVisibleNav(page);
    expect(tabs).toEqual(expect.arrayContaining(["Vesting", "KYC"]));
    expect(tabs).not.toContain("Token");
    expect(tabs).not.toContain("Presale");
    expect(tabs).not.toContain("Timelock");
  });

  test("read_only persona — all 5 tabs visible", async ({ page }) => {
    await switchPersona(page, "read_only");
    const tabs = await getVisibleNav(page);
    for (const t of ["Token", "Presale", "Vesting", "KYC", "Timelock"]) {
      expect(tabs).toContain(t);
    }
  });

  test("URL guard — compliance can't reach /tokens path", async ({ page }) => {
    await switchPersona(page, "compliance");
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("text=No access").first()).toBeVisible();
    await expect(page.getByText(/Compliance.*persona cannot view/i)).toBeVisible();
  });

  test("URL guard — treasury can't reach /vesting path", async ({ page }) => {
    await switchPersona(page, "treasury");
    await page.goto("/vesting", { waitUntil: "networkidle" });
    await expect(page.locator("text=No access").first()).toBeVisible();
    await expect(page.getByText(/Treasury.*persona cannot view/i)).toBeVisible();
  });

  test("read_only persona — Vesting CTAs disabled + banner shown", async ({ page }) => {
    await switchPersona(page, "read_only");
    await page.click('nav a:has-text("Vesting")');
    await page.waitForLoadState("networkidle");
    // Banner present
    await expect(page.locator("text=Read-only").first()).toBeVisible();
    // The "Create schedule" CTA exists but is disabled — wait for it then check
    const createBtn = page.locator("button", { hasText: /Create schedule/i });
    if ((await createBtn.count()) > 0) {
      await expect(createBtn.first()).toBeDisabled();
    }
  });

  test("read_only persona — Token CTAs disabled", async ({ page }) => {
    await switchPersona(page, "read_only");
    await page.click('nav a:has-text("Token")');
    await page.waitForLoadState("networkidle");
    // Mint button (only visible when wallet connected and panel rendered)
    const mintBtn = page.locator("button", { hasText: /^Mint$/ });
    if ((await mintBtn.count()) > 0) {
      await expect(mintBtn.first()).toBeDisabled();
    }
    // Send CCM button
    const sendBtn = page.locator("button", { hasText: /^Send$/ });
    if ((await sendBtn.count()) > 0) {
      await expect(sendBtn.first()).toBeDisabled();
    }
  });
});
