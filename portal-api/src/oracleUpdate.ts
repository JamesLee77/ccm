/**
 * Sandbox oracle auto-updater — runs on the Worker's recurring cron.
 *
 * The four MockPriceOracles behind the OracleConsensusPanel are owned by
 * the carbon-oracle keeper (post-2026-05-13 redeploy), so this module
 * publishes a fresh price for each one every cron tick. The resulting
 * stream of PriceUpdated events is what feeds the testnet's Oracle Price
 * History timeline.
 *
 * Each oracle has a distinct "personality" so the 4 chart lines visibly
 * separate instead of clustering. Per-index profile (matches the order of
 * env.ORACLE_ADDRESSES):
 *
 *   A — low-cost provider:  anchor $0.18, ±2.0%
 *   B — premium market:     anchor $0.22, ±3.0%
 *   C — noisy aggregator:   anchor $0.20, ±4.0%
 *   D — primary, stable:    anchor $0.20, ±1.5%  (consumed by staking)
 *
 * Walk: next = curr + drag·(anchor − curr) + vol·z·curr, where z is a
 * uniform random in [-1, +1]. Drag (20%) pulls each oracle toward its
 * anchor; volatility scales the noise. Result is clamped to
 * [$0.15, $0.25] so the median stays in a plausible band.
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
import { nonceManager } from "viem/nonce";
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

type Profile = { label: string; anchor: bigint; volBps: number; dragBps: number };

const PROFILES: Profile[] = [
  { label: "A", anchor: parseUnits("0.18", 18), volBps: 200, dragBps: 2000 },
  { label: "B", anchor: parseUnits("0.22", 18), volBps: 300, dragBps: 2000 },
  { label: "C", anchor: parseUnits("0.20", 18), volBps: 400, dragBps: 2000 },
  { label: "D", anchor: parseUnits("0.20", 18), volBps: 150, dragBps: 2000 },
];

function nextPrice(current: bigint, profile: Profile): bigint {
  // Mean reversion: drag · (anchor − curr)
  const drag = ((profile.anchor - current) * BigInt(profile.dragBps)) / 10000n;
  // Noise: vol · z · curr,  z ∈ uniform[-1, +1] represented as bps in [-10000, +10000]
  const zBps = BigInt(Math.floor(Math.random() * 20001) - 10000);
  const noise = (current * BigInt(profile.volBps) * zBps) / 100_000_000n;
  let next = current + drag + noise;
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
  // Attach viem's default nonceManager so the 4 sequential setPrice txs
  // get strictly increasing nonces from a local counter, instead of each
  // call re-querying eth_getTransactionCount('pending') from the public
  // RPC (which lags and intermittently returns the same nonce twice,
  // causing one of the 4 txs to drop as underpriced).
  const account = privateKeyToAccount(keeperKey, { nonceManager });
  const transport = http(rpc);
  const publicClient = createPublicClient({ chain: baseSepolia, transport });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport });

  const hashes: Hex[] = [];
  for (const [i, oracle] of addresses.entries()) {
    const profile = PROFILES[i] ?? PROFILES[PROFILES.length - 1];
    try {
      const current = await publicClient.readContract({
        address: oracle,
        abi: ORACLE_ABI,
        functionName: "getPrice",
      });
      const next = nextPrice(current, profile);
      const hash = await walletClient.writeContract({
        address: oracle,
        abi: ORACLE_ABI,
        functionName: "setPrice",
        args: [next],
      });
      console.log(
        `oracleUpdate[${profile.label}]: $${formatUnits(current, 18)} -> $${formatUnits(next, 18)} tx ${hash}`,
      );
      hashes.push(hash);
    } catch (e) {
      console.error(`oracleUpdate[${profile.label}] failed for ${oracle}:`, e);
    }
  }
  return hashes;
}
