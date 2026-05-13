import type { Address } from "viem";

/**
 * Base Sepolia sandbox contract addresses + minimal ABIs needed by the
 * playground UI. CCMSandboxStaking address comes from Task 2's deploy
 * (replace <STAKING> below with the deployed address).
 */
export const SANDBOX = {
  ccmToken:           "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD" as Address,
  ccmSandboxNFT:      "0xbC3EAc7514F82A868807b81b165D2121495380E9" as Address,
  ccmSandboxVault:    "0xEd62b71e9ff0200CFf02C8F38618Af153C609334" as Address,
  ccmSandboxStaking:  "0xAaeF319bc3B653DF68502a5A713989BB29ea8C48" as Address,    // Task 2 output
  mockPriceOracle:    "0x467b5f3Deb6750866ae2D5e05705A9Edae13b30e"  as Address,    // Task 2 output
};

export const EXPLORER = "https://sepolia.basescan.org";

// --- minimal ABIs ----------------------------------------------------

export const CCMTokenAbi = [
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
] as const;

export const CCMSandboxNFTAbi = [
  { type: "function", name: "mint", inputs: [{ name: "grade", type: "uint8" }, { name: "vintage", type: "uint16" }, { name: "tonnage", type: "uint16" }, { name: "projectId", type: "bytes32" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "meta", inputs: [{ type: "uint256" }], outputs: [
    { name: "grade", type: "uint8" },
    { name: "vintage", type: "uint16" },
    { name: "tonnage", type: "uint16" },
    { name: "projectId", type: "bytes32" },
    { name: "minter", type: "address" },
  ], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "mintCooldown", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "isApprovedForAll", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "setApprovalForAll", inputs: [{ type: "address" }, { type: "bool" }], outputs: [], stateMutability: "nonpayable" },
] as const;

export const CCMSandboxVaultAbi = [
  { type: "function", name: "wrap", inputs: [{ name: "nftIds", type: "uint256[]" }, { name: "amounts", type: "uint256[]" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "reserves", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export const CCMSandboxStakingAbi = [
  { type: "function", name: "stake", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unstake", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "claim", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "pendingReward", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "users", inputs: [{ type: "address" }], outputs: [
    { name: "staked", type: "uint256" },
    { name: "lastAccruedAt", type: "uint256" },
  ], stateMutability: "view" },
  { type: "function", name: "currentYieldRateBps", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalStaked", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "poolRemaining", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "poolUsedPct", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;
