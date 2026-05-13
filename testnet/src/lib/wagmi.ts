/**
 * Single-chain wagmi config: Base Sepolia only. No mainnet path.
 */
import { http } from "viem";
import { baseSepolia } from "viem/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const TESTNET_CHAIN = baseSepolia;
export const TESTNET_CHAIN_ID = baseSepolia.id; // 84532

const RPC = import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

export const wagmiConfig = getDefaultConfig({
  appName: "CCM Testnet Playground",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(RPC),
  },
  ssr: false,
});
