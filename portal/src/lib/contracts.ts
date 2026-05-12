/**
 * Deployed CCM contract addresses + minimal ABIs.
 *
 * Env-driven: VITE_ENV=mainnet → Base mainnet contracts;
 * VITE_ENV=testnet → Base Sepolia rehearsal contracts.
 *
 * The investor-facing surface is split into two sites with single-chain
 * builds (portal.ccmnetwork.net + portal-testnet.ccmnetwork.net) so the
 * SAFT investor never has to wonder which chain they're on.
 */
import type { Address } from "viem";
import { ADMIN_CHAIN_ID, ADMIN_EXPLORER, IS_MAINNET } from "./env";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

const CONTRACTS_MAINNET = {
  // Phase 1 mainnet deploy (2026-05-12, see onchain/DEPLOYMENT.md):
  ccmTokenV1: "0x398b2eB83C59890a01418b8D661e9A36a7c9d23d" as Address,
  ccmVesting: "0x019B68683a8c31f4A8295215D8Da7f8Ec95582dc" as Address,
  // Deferred to Phase 2/3:
  ccmTgeSale: ZERO,
  usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, // canonical Base USDC
  // Set only if audit triggers a v2 (Phase 1):
  ccmTokenV2: ZERO,
  ccmMigration: ZERO,
};

const CONTRACTS_TESTNET = {
  ccmTokenV1: "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD" as Address,
  ccmVesting: "0x0b04C87D925C35C71Ff736ceCc6A78c8EB28023F" as Address,
  ccmTgeSale: "0x487eb25aBE20C85d55695eBD0eA2275C5bdD1745" as Address,
  usdc: "0x87D1726B81095257A9ed70Aa1e67AA740bE485B6" as Address, // CCMSandboxUSDC
  ccmTokenV2: ZERO,
  ccmMigration: ZERO,
};

/** Active contract set — pinned by build env. */
export const CONTRACTS = IS_MAINNET ? CONTRACTS_MAINNET : CONTRACTS_TESTNET;

/** Active chain id, pinned by build. */
export const CHAIN_ID = ADMIN_CHAIN_ID;

/** Active block explorer base URL. */
export const EXPLORER = ADMIN_EXPLORER;

// ===================== ABIs (minimal) =====================

export const CCMTokenAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "transfer", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "VERSION", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "cap", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "paused", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
] as const;

export const CCMVestingAbi = [
  {
    type: "function",
    name: "schedules",
    inputs: [{ type: "uint256" }],
    outputs: [
      { name: "beneficiary", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "cliffDuration", type: "uint256" },
      { name: "vestingDuration", type: "uint256" },
      { name: "released", type: "uint256" },
      { name: "revocable", type: "bool" },
      { name: "revoked", type: "bool" },
    ],
    stateMutability: "view",
  },
  { type: "function", name: "scheduleIdsOf", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "releasable", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "release", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "releaseAll", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getScheduleCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export const CCMMigrationAbi = [
  { type: "function", name: "migrate", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "totalMigrated", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "migratedBy", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "deadline", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "paused", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "closed", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "bonusBps", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

// ===================== CCMTGESale ABI =====================

export const CCMTGESaleAbi = [
  // ── reads
  { type: "function", name: "ccm", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "usdc", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "getRoundCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "getRound",
    inputs: [{ type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "priceUsdc", type: "uint256" },
          { name: "hardCapTokens", type: "uint256" },
          { name: "soldTokens", type: "uint256" },
          { name: "cliffSeconds", type: "uint256" },
          { name: "vestSeconds", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allocations",
    inputs: [{ type: "uint256" }, { type: "address" }],
    outputs: [
      { name: "totalAllocated", type: "uint256" },
      { name: "claimed", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "cliffSeconds", type: "uint256" },
      { name: "vestSeconds", type: "uint256" },
    ],
    stateMutability: "view",
  },
  { type: "function", name: "whitelist", inputs: [{ type: "uint256" }, { type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "claimable", inputs: [{ name: "roundId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  // ── investor writes
  { type: "function", name: "purchase", inputs: [{ name: "roundId", type: "uint256" }, { name: "ccmAmount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "claim", inputs: [{ name: "roundId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  // ── events
  { type: "event", name: "Purchased", inputs: [
    { type: "uint256", indexed: true },
    { type: "address", indexed: true },
    { type: "uint256" },
    { type: "uint256" },
  ] },
  { type: "event", name: "Claimed", inputs: [
    { type: "uint256", indexed: true },
    { type: "address", indexed: true },
    { type: "uint256" },
  ] },
] as const;

// ===================== USDC =====================

export const USDCAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
] as const;
