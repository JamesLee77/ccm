/**
 * wagmi v2 connector for testnet browser e2e — accepts a private key,
 * signs transactions and messages locally without ever showing a wallet
 * popup. Backed by viem's privateKeyToAccount + http transport.
 *
 * SAFETY:
 *   This module is BUILD-GUARDED via IS_MAINNET. The /e2e route that
 *   uses it is also gated. Mainnet builds should NOT load this module.
 *   We belt-and-suspenders by re-checking IS_MAINNET inside the
 *   connector itself — if accidentally invoked on mainnet, it throws.
 *
 * USAGE:
 *   const connector = testWalletConnector({
 *     privateKey: "0x...",
 *     chain: baseSepolia,
 *     rpcUrl: "https://sepolia.base.org",
 *   });
 *   wagmi.connect({ connector });
 */

import { createConnector, type Connector } from "wagmi";
import {
  type Chain,
  type WalletClient,
  createWalletClient,
  http,
  type EIP1193Provider,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { IS_MAINNET } from "../lib/env";

export const TEST_CONNECTOR_ID = "ccmTestWallet";

interface TestWalletParams {
  privateKey: `0x${string}`;
  chain: Chain;
  rpcUrl: string;
}

export function testWalletConnector(params: TestWalletParams) {
  if (IS_MAINNET) {
    throw new Error("testWalletConnector is forbidden on mainnet builds");
  }
  const account = privateKeyToAccount(params.privateKey);

  // Build a wallet client up front; reuse for every request.
  const walletClient: WalletClient = createWalletClient({
    account,
    chain: params.chain,
    transport: http(params.rpcUrl),
  });

  // Minimal EIP-1193 provider — wagmi calls this for some operations.
  // We forward read-only methods to the RPC and intercept signing methods
  // so they sign locally with the embedded account.
  const provider: EIP1193Provider = {
    request: async ({ method, params: rpcParams }: any) => {
      switch (method) {
        case "eth_chainId":
          return `0x${params.chain.id.toString(16)}`;
        case "eth_accounts":
        case "eth_requestAccounts":
          return [account.address];
        case "personal_sign": {
          // params: [message, address]
          const [message] = rpcParams ?? [];
          return await account.signMessage({
            message: typeof message === "string" && message.startsWith("0x")
              ? { raw: message as `0x${string}` }
              : message,
          });
        }
        case "eth_signTypedData_v4": {
          // params: [address, jsonString]
          const [, json] = rpcParams ?? [];
          const data = typeof json === "string" ? JSON.parse(json) : json;
          return await account.signTypedData(data);
        }
        case "eth_sendTransaction": {
          const [tx] = rpcParams ?? [];
          const hash = await walletClient.sendTransaction({
            ...tx,
            account,
            chain: params.chain,
          });
          return hash;
        }
        case "wallet_switchEthereumChain":
          // Single-chain build — only the configured chain is allowed
          if (rpcParams?.[0]?.chainId !== `0x${params.chain.id.toString(16)}`) {
            throw new Error("test wallet is bound to a single chain");
          }
          return null;
        default: {
          // Forward everything else to the configured RPC
          const r = await fetch(params.rpcUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: rpcParams ?? [] }),
          });
          const body = await r.json();
          if (body.error) throw new Error(body.error.message ?? "rpc error");
          return body.result;
        }
      }
    },
    on: () => {/* no-op */},
    removeListener: () => {/* no-op */},
  } as any;

  return createConnector((config) => ({
    id: TEST_CONNECTOR_ID,
    name: "CCM Test Wallet",
    type: "injected" as const,
    icon: undefined,
    rdns: "xyz.cogo.ccm.test",

    async setup() {
      // nothing
    },

    async connect() {
      config.emitter.emit("connect", {
        accounts: [account.address] as readonly `0x${string}`[],
        chainId: params.chain.id,
      });
      return {
        accounts: [account.address] as readonly `0x${string}`[],
        chainId: params.chain.id,
      };
    },

    async disconnect() {
      config.emitter.emit("disconnect");
    },

    async getAccounts() {
      return [account.address] as readonly `0x${string}`[];
    },

    async getChainId() {
      return params.chain.id;
    },

    async getProvider(): Promise<EIP1193Provider> {
      return provider;
    },

    async getClient(_p?: { chainId?: number }) {
      return walletClient;
    },

    async isAuthorized() {
      return true;
    },

    async switchChain({ chainId }: { chainId: number }) {
      if (chainId !== params.chain.id) {
        throw new Error("test wallet is single-chain");
      }
      return params.chain;
    },

    onAccountsChanged() {/* */},
    onChainChanged() {/* */},
    onDisconnect() {
      config.emitter.emit("disconnect");
    },
  } as unknown as Connector));
}

/**
 * sessionStorage key for the active test private key. The /e2e page
 * stores this; main.tsx checks it on boot to decide whether to add the
 * test connector.
 */
export const E2E_KEY_STORAGE = "ccm-admin-e2e-key";

export function readE2eKey(): `0x${string}` | null {
  try {
    const raw = sessionStorage.getItem(E2E_KEY_STORAGE);
    if (!raw) return null;
    if (!/^0x[0-9a-fA-F]{64}$/.test(raw)) return null;
    return raw as `0x${string}`;
  } catch {
    return null;
  }
}

export function saveE2eKey(key: `0x${string}`) {
  try {
    sessionStorage.setItem(E2E_KEY_STORAGE, key);
  } catch {/* */}
}

export function clearE2eKey() {
  try {
    sessionStorage.removeItem(E2E_KEY_STORAGE);
  } catch {/* */}
}
