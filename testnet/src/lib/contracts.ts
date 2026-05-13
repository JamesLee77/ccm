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
  ccmSandboxStaking:  "0xAaeF319bc3B653DF68502a5A713989BB29ea8C48" as Address,
  mockPriceOracle:    "0x467b5f3Deb6750866ae2D5e05705A9Edae13b30e" as Address,
  // New (Task 3)
  oracleA:            "0xC04aba12B9ECF3465832dee6b814A0dd6ed0991c" as Address,
  oracleB:            "0xd82596F1dcAA5aA2dfA688eAde568cdFf82C9427" as Address,
  oracleC:            "0xe1Da27b2122A6b875a8E46B8b089FBf1151887eC" as Address,
  medianAggregator:   "0x58CD4De9f68a1982e6AF0258863CeCc7E68beaE6" as Address,
  nodeRegistry:       "0xE9AD5DC60a799Cc037824f2B030E641f4d460136" as Address,
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
  { type: "function", name: "mint", inputs: [{ name: "grade", type: "uint8" }, { name: "vintage", type: "uint16" }, { name: "tonnage", type: "uint256" }, { name: "projectId", type: "bytes32" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "meta", inputs: [{ type: "uint256" }], outputs: [
    { name: "grade", type: "uint8" },
    { name: "vintage", type: "uint16" },
    { name: "tonnage", type: "uint256" },
    { name: "projectId", type: "bytes32" },
    { name: "minter", type: "address" },
    { name: "mintedAt", type: "uint64" },
  ], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "nextMintAt", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "cooldownRemaining", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "isApprovedForAll", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "setApprovalForAll", inputs: [{ type: "address" }, { type: "bool" }], outputs: [], stateMutability: "nonpayable" },
] as const;

export const CCMSandboxVaultAbi = [
  { type: "function", name: "wrap", inputs: [{ name: "id", type: "uint256" }, { name: "tonnage", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unwrap", inputs: [{ name: "ccmAmount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "totalWrapped", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
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

export const MockPriceOracleAbi = [
  { type: "function", name: "getPrice", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "price", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export const CCMSandboxMedianAggregatorAbi = [
  { type: "function", name: "getPrice", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "sourcePrices",
    inputs: [],
    outputs: [{ type: "uint256[4]" }],
    stateMutability: "view",
  },
  { type: "function", name: "sources", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "pure" },
] as const;

export const CCMSandboxNodeRegistryAbi = [
  { type: "function", name: "register", inputs: [{ name: "label", type: "string" }, { name: "endpoint", type: "string" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "update", inputs: [{ name: "label", type: "string" }, { name: "endpoint", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unregister", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "count", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalEver", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "nodeOf", inputs: [{ type: "address" }], outputs: [
    { components: [
      { name: "owner", type: "address" },
      { name: "label", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "registeredAt", type: "uint64" },
      { name: "active", type: "bool" },
    ], type: "tuple" },
  ], stateMutability: "view" },
  { type: "function", name: "recent", inputs: [{ type: "uint256" }], outputs: [
    { components: [
      { name: "owner", type: "address" },
      { name: "label", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "registeredAt", type: "uint64" },
      { name: "active", type: "bool" },
    ], type: "tuple[]" },
  ], stateMutability: "view" },
  { type: "event", name: "NodeRegistered", inputs: [
    { indexed: true, name: "owner", type: "address" },
    { indexed: true, name: "nodeId", type: "uint256" },
    { name: "label", type: "string" },
    { name: "endpoint", type: "string" },
  ] },
  { type: "event", name: "NodeUpdated", inputs: [
    { indexed: true, name: "owner", type: "address" },
    { indexed: true, name: "nodeId", type: "uint256" },
    { name: "label", type: "string" },
    { name: "endpoint", type: "string" },
  ] },
  { type: "event", name: "NodeUnregistered", inputs: [
    { indexed: true, name: "owner", type: "address" },
    { indexed: true, name: "nodeId", type: "uint256" },
  ] },
] as const;
