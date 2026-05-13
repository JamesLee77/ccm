/**
 * Sandbox oracle auto-updater — runs on the Worker's recurring cron.
 *
 * The four MockPriceOracles behind the OracleConsensusPanel are owned by
 * the carbon-oracle keeper (post-2026-05-13 redeploy), so this module
 * walks each price by a small bounded delta every cron tick. The resulting
 * stream of PriceUpdated events is what feeds the testnet's Oracle Price
 * History timeline.
 *
 * Walk: new = old * (1 + delta) where delta ~ uniform(-2%, +2%), then
 * clamped to [$0.15, $0.25]. The clamps keep the median anchored near
 * the design price ($0.20) so the staking yield-decay viz stays in range.
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import type { Env } from "./types";

const ORACLE_ABI = [
  {
    type: "function",
    name: "getPrice",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setPrice",
    inputs: [{ name: "newPrice", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const MIN_PRICE = parseUnits("0.15", 18);
const MAX_PRICE = parseUnits("0.25", 18);
const MAX_DELTA_BPS = 200n; // ±2%

function nextPrice(current: bigint): bigint {
  // delta ∈ [-200, +200] basis points
  const delta = BigInt(Math.floor(Math.random() * Number(MAX_DELTA_BPS * 2n + 1n))) - MAX_DELTA_BPS;
  let next = current + (current * delta) / 10000n;
  if (next < MIN_PRICE) next = MIN_PRICE;
  if (next > MAX_PRICE) next = MAX_PRICE;
  return next;
}

export async function runOracleUpdate(env: Env): Promise<Hex[]> {
  if (!env.CARBON_KEEPER_PRIVATE_KEY || !env.ORACLE_ADDRESSES) {
    console.log("oracleUpdate: not configured, skipping");
    return [];
  }
  const addresses = env.ORACLE_ADDRESSES.split(",").map((s) => s.trim()).filter(Boolean) as Address[];
  if (addresses.length === 0) {
    console.log("oracleUpdate: empty ORACLE_ADDRESSES, skipping");
    return [];
  }

  const rpc = env.CARBON_ORACLE_RPC ?? "https://sepolia.base.org";
  const keeperKey = env.CARBON_KEEPER_PRIVATE_KEY.startsWith("0x")
    ? (env.CARBON_KEEPER_PRIVATE_KEY as Hex)
    : (`0x${env.CARBON_KEEPER_PRIVATE_KEY}` as Hex);
  const account = privateKeyToAccount(keeperKey);
  const transport = http(rpc);
  const publicClient = createPublicClient({ chain: baseSepolia, transport });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport });

  const hashes: Hex[] = [];
  for (const [i, oracle] of addresses.entries()) {
    try {
      const current = await publicClient.readContract({
        address: oracle,
        abi: ORACLE_ABI,
        functionName: "getPrice",
      });
      const next = nextPrice(current);
      const hash = await walletClient.writeContract({
        address: oracle,
        abi: ORACLE_ABI,
        functionName: "setPrice",
        args: [next],
      });
      console.log(
        `oracleUpdate[${i}]: $${formatUnits(current, 18)} -> $${formatUnits(next, 18)} tx ${hash}`,
      );
      hashes.push(hash);
    } catch (e) {
      console.error(`oracleUpdate[${i}] failed for ${oracle}:`, e);
    }
  }
  return hashes;
}
