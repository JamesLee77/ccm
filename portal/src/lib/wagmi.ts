import { http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { IS_MAINNET } from "./env";

/**
 * SAFT investor portal — single-chain per build.
 *  - portal.ccmnetwork.net          (VITE_ENV=mainnet) → only Base mainnet
 *  - portal-testnet.ccmnetwork.net  (VITE_ENV=testnet) → only Base Sepolia
 *
 * Mirrors the operator console split (admin/admin-testnet). Build-time
 * chain pinning eliminates "wrong network" footguns and lets the
 * mainnet investor experience be visually distinguishable from the
 * testnet rehearsal at-a-glance.
 */
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id";

const chain = IS_MAINNET ? base : baseSepolia;
const rpc = IS_MAINNET
  ? import.meta.env.VITE_BASE_RPC || "https://mainnet.base.org"
  : import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

export const config = getDefaultConfig({
  appName: IS_MAINNET ? "CCM Portal" : "CCM Portal (testnet)",
  projectId,
  chains: [chain],
  transports: { [chain.id]: http(rpc) },
  ssr: false,
});
