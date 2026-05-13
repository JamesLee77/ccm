import { type Page, expect } from "@playwright/test";

export type Persona = "super_admin" | "treasury" | "compliance" | "read_only";

const PERSONA_LABEL: Record<Persona, string> = {
  super_admin: "Super-admin",
  treasury: "Treasury",
  compliance: "Compliance",
  read_only: "Read-only",
};

/**
 * Activate the local-key test wallet by visiting /e2e?key=… and waiting
 * for the redirect to /. After this returns, wagmi's auto-connect has
 * fired and the 🧪 E2E badge is visible in the header.
 */
export async function activateTestWallet(page: Page, key: string) {
  await page.goto(`/e2e?key=${key}`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/$/, { timeout: 8_000 });
  // Auto-connect emits the 🧪 E2E badge once wagmi.connect() resolves
  await expect(page.locator("text=🧪 E2E").first()).toBeVisible({ timeout: 12_000 });
}

/**
 * Switch the dev persona on testnet. Triggers a full page reload — the
 * caller should re-await any state they want.
 */
export async function switchPersona(page: Page, p: Persona) {
  // The PersonaBadge button has a title="Dev persona switcher (testnet only)"
  await page.locator('button[title*="Dev persona"]').first().click();
  await page.locator(`button:has-text("${PERSONA_LABEL[p]}")`).first().click();
  // setDevPersona() does window.location.reload — wait for navigation
  await page.waitForLoadState("networkidle");
  // Re-verify the test wallet is still connected (sessionStorage survived)
  await expect(page.locator("text=🧪 E2E").first()).toBeVisible({ timeout: 12_000 });
}

/** Read the current NAV tab labels in document order. */
export async function getVisibleNav(page: Page): Promise<string[]> {
  return await page.locator("nav a").allTextContents();
}

export const TEST_KEY = process.env.PLAYWRIGHT_TEST_KEY;
export const TEST_ADDR = (process.env.PLAYWRIGHT_TEST_ADDR ?? "").toLowerCase();
