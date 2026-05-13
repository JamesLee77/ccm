import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

const initSql = readFileSync(resolve(__dirname, "migrations/0001_init.sql"), "utf-8");
const holderSql = readFileSync(resolve(__dirname, "migrations/0002_holder_registry.sql"), "utf-8");
const auditSql = readFileSync(resolve(__dirname, "migrations/0003_admin_audit.sql"), "utf-8");
const notesSql = readFileSync(resolve(__dirname, "migrations/0004_audit_notes.sql"), "utf-8");
const TEST_MIGRATIONS = [
  { name: "0001_init", queries: initSql.split(/;\s*\n/).filter(Boolean) },
  { name: "0002_holder_registry", queries: holderSql.split(/;\s*\n/).filter(Boolean) },
  { name: "0003_admin_audit", queries: auditSql.split(/;\s*\n/).filter(Boolean) },
  { name: "0004_audit_notes", queries: notesSql.split(/;\s*\n/).filter(Boolean) },
];

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        isolatedStorage: true,
        miniflare: {
          d1Databases: ["DB"],
          d1Persist: false,
          bindings: {
            ALLOWED_ORIGIN: "https://ccm-portal.pages.dev",
            RPC_URL: "https://mainnet.base.org",
            CHAIN_ID: "8453",
            CCM_VESTING_ADDRESS: "0xa73d068Bf89F303C009E19d05Fbe40f47eeE1d79",
            CCM_KYC_REGISTRY_ADDRESS: "0x0000000000000000000000000000000000000000",
            CCM_TOKEN_ADDRESS: "0x0000000000000000000000000000000000000000",
            APP_BASE_URL: "https://ccm-portal.pages.dev",
            API_BASE_URL: "https://api.example",
            RESEND_FROM: "test@example.com",
            RESEND_API_KEY: "test_resend_key",
            SIWE_SECRET: "test_siwe_secret_at_least_32_chars_long_xx",
            ADMIN_BEARER_TOKEN: "test_admin_token_at_least_24_chars_long",
            TEST_MIGRATIONS: JSON.stringify(TEST_MIGRATIONS),
          },
        },
      },
    },
  },
});
