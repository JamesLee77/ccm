import { http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id";

export const config = getDefaultConfig({
  appName: "CCM Network",
  projectId,
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(
      import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    ),
    [base.id]: http(
      import.meta.env.VITE_BASE_RPC || "https://mainnet.base.org",
    ),
  },
  ssr: false,
});
