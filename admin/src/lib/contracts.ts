import type { Address } from "viem";
import { ADMIN_CHAIN_ID, ADMIN_EXPLORER, ADMIN_ENV, IS_MAINNET } from "./env";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

const CONTRACTS_MAINNET = {
  // Phase 1 mainnet deploy (2026-05-12, see onchain/DEPLOYMENT.md):
  ccmTokenV1: "0x398b2eB83C59890a01418b8D661e9A36a7c9d23d" as Address,
  ccmVesting: "0x019B68683a8c31f4A8295215D8Da7f8Ec95582dc" as Address,
  // Deferred to Phase 2/3:
  ccmKycRegistry: ZERO,
  ccmTimelock: ZERO,
  ccmTgeSale: ZERO,
  usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, // canonical Base USDC
  // Set only if audit triggers a v2:
  ccmTokenV2: ZERO,
  ccmMigration: ZERO,
};

const CONTRACTS_TESTNET = {
  ccmTokenV1: "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD" as Address,
  ccmVesting: "0x0b04C87D925C35C71Ff736ceCc6A78c8EB28023F" as Address,
  ccmKycRegistry: "0x9172D6eaF05587b595f4eE894B4C7917Be652E46" as Address,
  ccmTimelock: "0x3EbA7887525f1E68dc946760a96B01d1E1a1d979" as Address,
  ccmTgeSale: "0x487eb25aBE20C85d55695eBD0eA2275C5bdD1745" as Address,
  usdc: "0x87D1726B81095257A9ed70Aa1e67AA740bE485B6" as Address, // CCMSandboxUSDC
  ccmTokenV2: ZERO,
  ccmMigration: ZERO,
};

/** Active contract set — pinned by the build env. */
export const CONTRACTS = IS_MAINNET ? CONTRACTS_MAINNET : CONTRACTS_TESTNET;

/** Active chain id (pinned by build). */
export const CHAIN_ID = ADMIN_CHAIN_ID;

/** Active block explorer base URL. */
export const EXPLORER = ADMIN_EXPLORER;

export function chainLabel(): "mainnet" | "testnet" {
  return ADMIN_ENV;
}

// Legacy helpers — kept for compatibility while pages migrate to direct
// CONTRACTS / CHAIN_ID imports.
export function contractsFor(_chainId: number | undefined) {
  return CONTRACTS;
}
export function explorerBase(_chainId: number | undefined): string {
  return EXPLORER;
}

// ===================== ABIs =====================

export const CCMTokenAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "transfer", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "VERSION", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "cap", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "paused", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
  // Admin
  { type: "function", name: "mint", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "pause", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unpause", inputs: [], outputs: [], stateMutability: "nonpayable" },
  // AccessControl
  { type: "function", name: "DEFAULT_ADMIN_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "MINTER_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "PAUSER_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "hasRole", inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "grantRole", inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "revokeRole", inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "renounceRole", inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }], outputs: [], stateMutability: "nonpayable" },
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
    name: "rounds",
    inputs: [{ type: "uint256" }],
    outputs: [
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
    stateMutability: "view",
  },
  { type: "function", name: "whitelist", inputs: [{ type: "uint256" }, { type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  // ── admin writes
  {
    type: "function",
    name: "createRound",
    inputs: [
      { name: "name", type: "string" },
      { name: "priceUsdc", type: "uint256" },
      { name: "hardCapTokens", type: "uint256" },
      { name: "cliffSeconds", type: "uint256" },
      { name: "vestSeconds", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
  },
  { type: "function", name: "closeRound", inputs: [{ name: "roundId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setWhitelist", inputs: [{ name: "roundId", type: "uint256" }, { name: "user", type: "address" }, { name: "ok", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setWhitelistBatch", inputs: [{ name: "roundId", type: "uint256" }, { name: "users", type: "address[]" }, { name: "ok", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "withdrawUSDC", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  // ── access control
  { type: "function", name: "ADMIN_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "hasRole", inputs: [{ type: "bytes32" }, { type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  // ── events (used by event-sourcing the whitelist)
  { type: "event", name: "RoundCreated", inputs: [
    { type: "uint256", indexed: true },
    { type: "string" },
    { type: "uint256" },
    { type: "uint256" },
  ] },
  { type: "event", name: "WhitelistSet", inputs: [
    { type: "uint256", indexed: true },
    { type: "address", indexed: true },
    { type: "bool" },
  ] },
  { type: "event", name: "RoundClosed", inputs: [
    { type: "uint256", indexed: true },
  ] },
] as const;

// ===================== USDC (minimal) =====================

export const USDCAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

// ===================== CCMKYCRegistry =====================

export const CCMKYCRegistryAbi = [
  { type: "function", name: "isKYCed", inputs: [{ type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "kycedAt", inputs: [{ type: "address" }], outputs: [{ type: "uint64" }], stateMutability: "view" },
  { type: "function", name: "kycedCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "setKYCed", inputs: [{ name: "user", type: "address" }, { name: "ok", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setKYCedBatch", inputs: [{ type: "address[]" }, { type: "bool[]" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setKYCedBatchUniform", inputs: [{ type: "address[]" }, { type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "KYC_OPERATOR_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "hasRole", inputs: [{ type: "bytes32" }, { type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
] as const;

// ===================== CCMTimelock =====================

export const CCMTimelockAbi = [
  // ── reads
  { type: "function", name: "getMinDelay", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "MIN_DELAY", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "VERSION", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "isOperation", inputs: [{ type: "bytes32" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "isOperationPending", inputs: [{ type: "bytes32" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "isOperationReady", inputs: [{ type: "bytes32" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "isOperationDone", inputs: [{ type: "bytes32" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "getTimestamp", inputs: [{ type: "bytes32" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "hashOperation",
    inputs: [
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "predecessor", type: "bytes32" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [{ type: "bytes32" }],
    stateMutability: "view",
  },
  // ── writes
  {
    type: "function",
    name: "schedule",
    inputs: [
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "predecessor", type: "bytes32" },
      { name: "salt", type: "bytes32" },
      { name: "delay", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "execute",
    inputs: [
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "payload", type: "bytes" },
      { name: "predecessor", type: "bytes32" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  { type: "function", name: "cancel", inputs: [{ type: "bytes32" }], outputs: [], stateMutability: "nonpayable" },
  // ── access control
  { type: "function", name: "PROPOSER_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "EXECUTOR_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "CANCELLER_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "hasRole", inputs: [{ type: "bytes32" }, { type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  // ── events (used to build pending ops list)
  {
    type: "event",
    name: "CallScheduled",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "index", type: "uint256", indexed: true },
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "predecessor", type: "bytes32" },
      { name: "delay", type: "uint256" },
    ],
  },
  { type: "event", name: "CallExecuted", inputs: [{ name: "id", type: "bytes32", indexed: true }, { name: "index", type: "uint256", indexed: true }, { name: "target", type: "address" }, { name: "value", type: "uint256" }, { name: "data", type: "bytes" }] },
  { type: "event", name: "Cancelled", inputs: [{ name: "id", type: "bytes32", indexed: true }] },
] as const;

// ===================== CCMVesting =====================

export const CCMVestingAbi = [
  { type: "function", name: "ccm", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "getScheduleCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
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
  // ── investor writes
  { type: "function", name: "release", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "releaseAll", inputs: [], outputs: [], stateMutability: "nonpayable" },
  // ── admin writes (SCHEDULE_MANAGER_ROLE)
  {
    type: "function",
    name: "createSchedule",
    inputs: [
      { name: "beneficiary", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "cliffDuration", type: "uint256" },
      { name: "vestingDuration", type: "uint256" },
      { name: "revocable", type: "bool" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createScheduleBatch",
    inputs: [
      { name: "beneficiaries", type: "address[]" },
      { name: "totalAmounts", type: "uint256[]" },
      { name: "startTime", type: "uint256" },
      { name: "cliffDuration", type: "uint256" },
      { name: "vestingDuration", type: "uint256" },
      { name: "revocable", type: "bool" },
    ],
    outputs: [{ type: "uint256[]" }],
    stateMutability: "nonpayable",
  },
  { type: "function", name: "revoke", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  // ── access control
  { type: "function", name: "SCHEDULE_MANAGER_ROLE", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "hasRole", inputs: [{ type: "bytes32" }, { type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
] as const;
