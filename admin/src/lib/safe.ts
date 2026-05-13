/**
 * Safe wallet detection + Safe Transaction Service read-only client.
 *
 * The active admin codebase ALREADY supports Safe wallets via WalletConnect:
 * when an operator connects a Safe, the Safe wallet handler intercepts
 * writeContract calls, builds a SafeTx, and posts to the Safe Transaction
 * Service. Our admin UI doesn't need to know about this — wagmi treats it
 * like any other wallet.
 *
 * This module adds two value-adds on top:
 *   1) Detect when the connected wallet IS a Safe (so we can show a badge
 *      and remind the operator that actions go through multisig).
 *   2) Read pending multisig txs from the Safe TS REST API so operators
 *      can see the queue without leaving admin (signing still happens in
 *      the Safe app — that part we don't reimplement).
 */

import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

export interface SafePendingTx {
  safe: string;
  safeTxHash: string;
  to: string;
  value: string;
  data: string | null;
  nonce: number;
  confirmationsRequired: number;
  confirmations: { owner: string; submissionDate: string }[];
  isExecuted: boolean;
  submissionDate: string;
}

/**
 * Returns the Safe Transaction Service base URL for the chain.
 *  - Base mainnet: https://safe-transaction-base.safe.global
 *  - Base Sepolia: https://safe-transaction-base-sepolia.safe.global
 */
function safeTsBase(chainId: number): string | null {
  if (chainId === 8453) return "https://safe-transaction-base.safe.global";
  if (chainId === 84532) return "https://safe-transaction-base-sepolia.safe.global";
  return null;
}

/**
 * Returns the safe.global app URL for opening a specific Safe.
 *  - basesep: prefix for Base Sepolia
 *  - base: prefix for Base mainnet
 */
export function safeAppUrl(chainId: number, address: string): string {
  const prefix = chainId === 84532 ? "basesep" : "base";
  return `https://app.safe.global/home?safe=${prefix}:${address}`;
}

/**
 * Detect whether `address` is a Safe contract on `chainId`. We don't trust
 * WalletConnect connector metadata — we ask the chain directly: does the
 * address have code, and does it expose Safe v1.x's well-known view
 * functions (VERSION + getThreshold)?
 */
export async function isSafeWallet(
  chainId: number,
  address: `0x${string}`,
  rpc?: string,
): Promise<{ isSafe: boolean; version?: string; threshold?: number; owners?: string[] }> {
  const chain = chainId === 8453 ? base : baseSepolia;
  const client = createPublicClient({
    chain,
    transport: http(rpc),
  });
  const code = await client.getCode({ address });
  if (!code || code === "0x") return { isSafe: false };

  // Safe v1.4.1 (and v1.3) expose: VERSION() string, getThreshold() uint256, getOwners() address[]
  const safeAbi = [
    { type: "function", name: "VERSION", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
    { type: "function", name: "getThreshold", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
    { type: "function", name: "getOwners", inputs: [], outputs: [{ type: "address[]" }], stateMutability: "view" },
  ] as const;

  try {
    const [version, threshold, owners] = await Promise.all([
      client.readContract({ address, abi: safeAbi, functionName: "VERSION" }),
      client.readContract({ address, abi: safeAbi, functionName: "getThreshold" }),
      client.readContract({ address, abi: safeAbi, functionName: "getOwners" }),
    ]);
    return {
      isSafe: true,
      version: version as string,
      threshold: Number(threshold),
      owners: owners as string[],
    };
  } catch {
    // Has code but doesn't match Safe interface (could be any other contract)
    return { isSafe: false };
  }
}

/**
 * List multisig txs that are queued (not yet executed) for the given Safe.
 * Returns up to 20 most recent, oldest-first by nonce so operators see
 * the next-to-execute first.
 */
export async function listPendingSafeTxs(
  chainId: number,
  safeAddress: string,
): Promise<SafePendingTx[]> {
  const base = safeTsBase(chainId);
  if (!base) return [];
  const url = `${base}/api/v1/safes/${safeAddress}/multisig-transactions/?executed=false&trusted=true&limit=20&ordering=nonce`;
  try {
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) return [];
    const body = await r.json();
    const results: any[] = body.results ?? body;
    return results.map((tx) => ({
      safe: tx.safe,
      safeTxHash: tx.safeTxHash,
      to: tx.to,
      value: tx.value ?? "0",
      data: tx.data ?? null,
      nonce: tx.nonce,
      confirmationsRequired: tx.confirmationsRequired,
      confirmations: (tx.confirmations ?? []).map((c: any) => ({
        owner: c.owner,
        submissionDate: c.submissionDate,
      })),
      isExecuted: tx.isExecuted ?? false,
      submissionDate: tx.submissionDate,
    }));
  } catch {
    return [];
  }
}
