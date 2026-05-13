import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { IS_MAINNET } from "./env";
import { readE2eKey, testWalletConnector } from "../e2e/testConnector";

/**
 * Operator console — single-chain per build.
 *  - admin.ccmnetwork.net          (VITE_ENV=mainnet) → only Base mainnet
 *  - admin-testnet.ccmnetwork.net  (VITE_ENV=testnet) → only Base Sepolia
 *
 * Locking the chain at build time eliminates the "wrong network" footgun
 * — the operator literally cannot act on the other chain from the wrong
 * site. Site identity (URL + visual banner) and chain identity become
 * 1:1.
 */

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id";

const chain = IS_MAINNET ? base : baseSepolia;
const rpc = IS_MAINNET
  ? import.meta.env.VITE_BASE_RPC || "https://mainnet.base.org"
  : import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

// On testnet, if /e2e has stashed a private key in sessionStorage we
// build a *minimal* wagmi config with ONLY the auto-signing test
// connector. This lets browser e2e tools (Playwright / Claude-in-Chrome)
// drive the site without MetaMask popups. The clay "🧪 E2E" badge in
// the header makes the mode visible.
const e2eKey = !IS_MAINNET ? readE2eKey() : null;

// e2eKey can only be set on a testnet build, so we hardcode baseSepolia
// in that branch to keep TS happy with the strict transports record.
export const config = e2eKey
  ? createConfig({
      chains: [baseSepolia],
      connectors: [
        testWalletConnector({ privateKey: e2eKey, chain: baseSepolia, rpcUrl: rpc }),
      ],
      transports: { [baseSepolia.id]: http(rpc) },
      ssr: false,
    })
  : getDefaultConfig({
      appName: IS_MAINNET ? "CCM Operator Console" : "CCM Operator Console (testnet)",
      projectId,
      chains: [chain],
      transports: { [chain.id]: http(rpc) },
      ssr: false,
    });
