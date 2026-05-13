import { defineConfig, devices } from "@playwright/test";

/**
 * E2E test config for the operator console.
 *
 * Targets the DEPLOYED testnet site by default — admin-testnet.ccmnetwork.net.
 * That's intentional: we want to catch regressions in the actual production
 * build (CSP headers, Pages Functions, Cloudflare CDN, etc.), not just a
 * local dev server. Override with TEST_BASE_URL env var to point elsewhere.
 *
 * Tests assume a Compliance test wallet exists with:
 *   • SCHEDULE_MANAGER_ROLE on CCMVesting (testnet)
 *   • some Sepolia ETH for gas
 *   • NO Treasury-scoped roles (Token MINTER, TGE ADMIN, KYC OPERATOR)
 *
 * The wallet's private key comes from PLAYWRIGHT_TEST_KEY (or its address
 * from PLAYWRIGHT_TEST_ADDR) — set both before running:
 *
 *   PLAYWRIGHT_TEST_KEY=0x... \
 *   PLAYWRIGHT_TEST_ADDR=0xD3Be... \
 *   npx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // sessionStorage state interferes — run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "https://admin-testnet.ccmnetwork.net",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // CSP errors from Cloudflare beacon are pre-existing noise — don't fail
    // the test on them; specs explicitly assert what they care about.
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Some ISPs (e.g. KT) return NXDOMAIN for fresh ccmnetwork.net
        // subdomains. Pin known Cloudflare IPs at the browser level so
        // the test isn't at the mercy of the system resolver. Override
        // by setting PLAYWRIGHT_HOST_RULES to a different mapping.
        launchOptions: {
          args: process.env.PLAYWRIGHT_HOST_RULES
            ? [`--host-resolver-rules=${process.env.PLAYWRIGHT_HOST_RULES}`]
            : [
                "--host-resolver-rules=" +
                  "MAP admin-testnet.ccmnetwork.net 104.21.49.13," +
                  "MAP admin.ccmnetwork.net 104.21.49.13," +
                  "MAP testnet.ccmnetwork.net 104.21.49.13," +
                  "MAP portal.ccmnetwork.net 104.21.49.13," +
                  "MAP portal-testnet.ccmnetwork.net 104.21.49.13",
              ],
        },
      },
    },
  ],
});
