import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// Per docs/ccm-phase0-architecture.md §3.1: testnet builds register ONLY
// Base Sepolia. Cross-chain confusion is prevented at build time, not at
// runtime — there is no code path in this bundle that can talk to mainnet.
// The mainnet portal lives at portal.ccmnetwork.net with its own bundle.

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id";

export const config = getDefaultConfig({
  appName: "CCM Network · Testnet",
  projectId,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org"),
  },
  ssr: false,
});
