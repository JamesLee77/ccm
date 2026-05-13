import { createPublicClient, http, parseAbi } from "viem";
import { base } from "viem/chains";
import type { Env } from "./types";

export interface VestingSchedule {
  beneficiary: `0x${string}`;
  totalAmount: bigint;
  startTime: bigint;
  cliffDuration: bigint;
  vestingDuration: bigint;
  released: bigint;
  revocable: boolean;
  revoked: boolean;
}

const VESTING_ABI = parseAbi([
  "function getScheduleCount() view returns (uint256)",
  "function schedules(uint256) view returns (address beneficiary, uint256 totalAmount, uint256 startTime, uint256 cliffDuration, uint256 vestingDuration, uint256 released, bool revocable, bool revoked)",
  "function releasable(uint256) view returns (uint256)",
]);

const KYC_REGISTRY_ABI = parseAbi([
  "function isKYCed(address) view returns (bool)",
  "function kycedAt(address) view returns (uint64)",
  "function kycedCount() view returns (uint256)",
]);

const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
]);

const ZERO = "0x0000000000000000000000000000000000000000";

/** True if the given env var holds a real (non-zero) contract address. */
export function isAddressConfigured(addr: string | undefined): boolean {
  return !!addr && addr.toLowerCase() !== ZERO;
}

function makeClient(env: Env) {
  return createPublicClient({
    chain: base,
    transport: http(env.RPC_URL),
  });
}

export async function readScheduleCount(env: Env): Promise<bigint> {
  const client = makeClient(env);
  return await client.readContract({
    address: env.CCM_VESTING_ADDRESS as `0x${string}`,
    abi: VESTING_ABI,
    functionName: "getScheduleCount",
  });
}

export async function readSchedule(env: Env, id: bigint): Promise<VestingSchedule> {
  const client = makeClient(env);
  const [beneficiary, totalAmount, startTime, cliffDuration, vestingDuration, released, revocable, revoked] =
    (await client.readContract({
      address: env.CCM_VESTING_ADDRESS as `0x${string}`,
      abi: VESTING_ABI,
      functionName: "schedules",
      args: [id],
    })) as readonly [`0x${string}`, bigint, bigint, bigint, bigint, bigint, boolean, boolean];
  return { beneficiary, totalAmount, startTime, cliffDuration, vestingDuration, released, revocable, revoked };
}

export async function readReleasable(env: Env, id: bigint): Promise<bigint> {
  const client = makeClient(env);
  return (await client.readContract({
    address: env.CCM_VESTING_ADDRESS as `0x${string}`,
    abi: VESTING_ABI,
    functionName: "releasable",
    args: [id],
  })) as bigint;
}

// ============== KYC registry ==============

export async function readIsKYCed(env: Env, address: `0x${string}`): Promise<boolean> {
  const client = makeClient(env);
  return (await client.readContract({
    address: env.CCM_KYC_REGISTRY_ADDRESS as `0x${string}`,
    abi: KYC_REGISTRY_ABI,
    functionName: "isKYCed",
    args: [address],
  })) as boolean;
}

export async function readKYCedAt(env: Env, address: `0x${string}`): Promise<bigint> {
  const client = makeClient(env);
  return (await client.readContract({
    address: env.CCM_KYC_REGISTRY_ADDRESS as `0x${string}`,
    abi: KYC_REGISTRY_ABI,
    functionName: "kycedAt",
    args: [address],
  })) as bigint;
}

// ============== ERC20 balance ==============

export async function readBalanceOf(env: Env, address: `0x${string}`): Promise<bigint> {
  const client = makeClient(env);
  return (await client.readContract({
    address: env.CCM_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
  })) as bigint;
}

export async function readBlockNumber(env: Env): Promise<bigint> {
  const client = makeClient(env);
  return await client.getBlockNumber();
}
