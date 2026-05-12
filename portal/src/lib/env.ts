/**
 * Build-time environment selector. The admin codebase compiles to two
 * separate sites:
 *   - admin.ccmnetwork.net          (VITE_ENV=mainnet)
 *   - admin-testnet.ccmnetwork.net  (VITE_ENV=testnet)
 *
 * Each build registers exactly ONE chain in wagmi and exposes contracts
 * for that chain only. There is no runtime path that lets the operator
 * accidentally act on the wrong network from the wrong site.
 */

export type AdminEnv = "mainnet" | "testnet";

export const ADMIN_ENV: AdminEnv =
  (import.meta.env.VITE_ENV as AdminEnv | undefined) === "mainnet" ? "mainnet" : "testnet";

export const IS_MAINNET = ADMIN_ENV === "mainnet";
export const IS_TESTNET = ADMIN_ENV === "testnet";

/** Chain id pinned by the build. Mainnet → 8453, testnet → 84532. */
export const ADMIN_CHAIN_ID: number = IS_MAINNET ? 8453 : 84532;

/** Block explorer base URL for the active chain. */
export const ADMIN_EXPLORER: string = IS_MAINNET
  ? "https://basescan.org"
  : "https://sepolia.basescan.org";
