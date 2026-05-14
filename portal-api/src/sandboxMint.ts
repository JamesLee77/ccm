/**
 * Sandbox auto-mint keeper — runs on the Worker's hourly cron.
 *
 * Mints one carbon-credit NFT per cron tick from the keeper wallet so the
 * testnet timeline keeps producing fresh records even when no human is
 * interacting. CCMSandboxNFT enforces a 1-hour per-address cooldown, which
 * matches the cron cadence. If the keeper is still on cooldown for any
 * reason, the function exits cleanly without throwing.
 *
 * Reuses CARBON_KEEPER_PRIVATE_KEY (already provisioned, Sepolia ETH).
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  stringToHex,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { nonceManager } from "viem/nonce";
import { baseSepolia } from "viem/chains";
import type { Env } from "./types";

const NFT_ABI = [
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "grade", type: "uint8" },
      { name: "vintage", type: "uint16" },
      { name: "tonnage", type: "uint256" },
      { name: "projectId", type: "bytes32" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cooldownRemaining",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// Grade distribution skews high-quality: A 40%, B 40%, C 20%.
function pickGrade(): number {
  const r = Math.random();
  if (r < 0.4) return 0; // A
  if (r < 0.8) return 1; // B
  return 2;              // C
}

function pickTonnage(): bigint {
  // 50–200 tCO2e per batch — well under contract cap (1000).
  return BigInt(50 + Math.floor(Math.random() * 151));
}

function pickProjectId(): Hex {
  const seed = `ccm-keeper-bot-01:${Date.now()}:${Math.floor(Math.random() * 1e9)}`;
  return keccak256(stringToHex(seed));
}

export async function runSandboxMint(env: Env): Promise<Hex | null> {
  if (!env.CARBON_KEEPER_PRIVATE_KEY || !env.CCM_SANDBOX_NFT_ADDRESS) {
    console.log("sandboxMint: not configured, skipping");
    return null;
  }

  const rpc = env.CARBON_ORACLE_RPC ?? "https://sepolia.base.org";
  const nftAddress = env.CCM_SANDBOX_NFT_ADDRESS as Address;
  const keeperKey = env.CARBON_KEEPER_PRIVATE_KEY.startsWith("0x")
    ? (env.CARBON_KEEPER_PRIVATE_KEY as Hex)
    : (`0x${env.CARBON_KEEPER_PRIVATE_KEY}` as Hex);

  // Shared nonceManager singleton — across keeper modules within one Worker
  // invocation, this maintains a sequential nonce counter that doesn't rely
  // on the public RPC reflecting freshly-submitted txs in its pending pool.
  const account = privateKeyToAccount(keeperKey, { nonceManager });
  const transport = http(rpc);
  const publicClient = createPublicClient({ chain: baseSepolia, transport });

  const cooldown = await publicClient.readContract({
    address: nftAddress,
    abi: NFT_ABI,
    functionName: "cooldownRemaining",
    args: [account.address],
  });
  if (cooldown > 0n) {
    console.log(`sandboxMint: keeper on cooldown (${cooldown}s remaining), skipping`);
    return null;
  }

  const grade = pickGrade();
  const vintage = 2026;
  const tonnage = pickTonnage();
  const projectId = pickProjectId();

  const walletClient = createWalletClient({ account, chain: baseSepolia, transport });
  const hash = await walletClient.writeContract({
    address: nftAddress,
    abi: NFT_ABI,
    functionName: "mint",
    args: [grade, vintage, tonnage, projectId],
  });

  console.log(
    "sandboxMint: minted",
    `grade=${["A", "B", "C", "D"][grade]}`,
    `vintage=${vintage}`,
    `tonnage=${tonnage.toString()}t`,
    "tx",
    hash,
  );
  return hash;
}
