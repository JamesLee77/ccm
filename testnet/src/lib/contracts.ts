/**
 * CCM testnet (Base Sepolia) contract addresses + ABIs.
 *
 * Per docs/ccm-phase0-architecture.md §6.3: this bundle targets Base Sepolia
 * only. The mainnet block lives in portal/src/lib/contracts.ts and is never
 * imported here. There is no scenario in which a tx from this site can land
 * on mainnet.
 *
 * Addresses are placeholders until the CCM-renamed contracts are deployed
 * to Base Sepolia. The czero precursor's testnet deployment used the CZM
 * symbol and is unrelated.
 */
import type { Address } from "viem";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

export const CONTRACTS = {
  baseSepolia: {
    // Deployed 2026-05-09 from /Users/hyunsuklee/Developer/ccm/onchain — see
    // onchain/DEPLOYMENT.md for the full record.
    ccmToken: "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD" as Address,
    ccmVesting: "0xc3E1bC1073b89DB6593e4257aD903A1611Bb24C5" as Address,
    /** Sandbox-only mint helper: anyone can call claim() to receive 100 test CCM (24h cooldown). */
    ccmSandboxFaucet: "0xfADAc6697d2Ee295d03a4De0F5ef79A431290E46" as Address,
    /** Sandbox-only ERC-1155 carbon-credit NFT: anyone can mint(grade, vintage, tonnage, projectId) with 1h cooldown. */
    ccmSandboxNFT: "0xbC3EAc7514F82A868807b81b165D2121495380E9" as Address,
    /** Sandbox-only NFT ⇄ test $CCM 1:1 wrap vault with FIFR (lowest-grade-first redemption). */
    ccmSandboxVault: "0xEd62b71e9ff0200CFf02C8F38618Af153C609334" as Address,
    /** Sandbox-only §7.3 per-grade wrapper. Deploys 4 grade-specific ERC-20s ($CCM-A/B/C/D). */
    ccmSandboxGradeWrapper: "0x35A4f714847cDB0e34e40cFA99A9CDB0ed232986" as Address,
    /** Per-grade ERC-20 token addresses (managed by ccmSandboxGradeWrapper). */
    gradeTokens: {
      A: "0x90f9654B8e912715614aE8072D272c456323F8F4" as Address,
      B: "0xa13374DAbc181A7d0657252F16B37eEC95570C8B" as Address,
      C: "0xb0c14AcbAa95364AC359d0AecAf2885B52e1c9B2" as Address,
      D: "0x35571eC6301B2Ef57D153a08D05cdDa1dF9721B2" as Address,
    },
    /** Sandbox-only test USDC (6 decimals, public claim 1000/24h). */
    sandboxUSDC: "0x87D1726B81095257A9ed70Aa1e67AA740bE485B6" as Address,
    /** Sandbox-only §7.4 lending vault (NFT collateral → USDC, grade-tier LTV). */
    ccmSandboxLending: "0x307e18456647B81A6BA5e90aE90949e70bB8f8C6" as Address,
    /** Sandbox-only §7.5 fractionalizer (lock NFT, mint per-id ERC-20 fractions, reassemble for full set). */
    ccmSandboxFractionalizer: "0x39FefEE1f75e711c51BA303F70CC2053eAF9Fe3a" as Address,
    /** Sandbox-only §7.6 hold-to-earn yield vault (NFT staking, grade-weighted CCM emissions). */
    ccmSandboxYield: "0x566010522f7B93b89a823Be1cFfCead53c6e1dF4" as Address,
    /** Sandbox-only §7.7 insurance vault (VVB failure → pro-rata USDC payout to NFT holders). */
    ccmSandboxInsurance: "0xb0F2dDB07fcE42EC677eC7a45D642f88adcc48c3" as Address,
    /** Sandbox-only §7.8 index basket manager (PRIME/FOREST/TECH ETF-style baskets of grade tokens). */
    ccmSandboxIndexBasket: "0x4dcea36A3d6C11dA6a7d443C05908c0a4D405423" as Address,
    /** §7.8 basket ERC-20s deployed by ccmSandboxIndexBasket constructor. */
    basketTokens: {
      PRIME: "0x8f3Ab4641EaF59b81a07D8bABd97D93e94245D8A" as Address,
      FOREST: "0x3bD1A48345F5D11EFe7C458daB4584474b3Db9d8" as Address,
      TECH: "0x886320E5fbc3Ba482d6148D2e15B941C6a201FBf" as Address,
    },
    /** Sandbox-only §7.9 retire-to-earn rebate vault (burn NFT, mint CCM with cumulative-tier multiplier). */
    ccmSandboxRebate: "0x11213DBc93999b95b5d5a6fdC8a0ddE7e01c5fbD" as Address,
    // Only relevant if a v2/migration is ever rehearsed on testnet:
    ccmTokenV2: ZERO,
    ccmMigration: ZERO,
  },
} as const;

export const CCMSandboxIndexBasketAbi = [
  { type: "function", name: "mint", inputs: [{ name: "basketIdx", type: "uint8" }, { name: "basketAtoms", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "redeem", inputs: [{ name: "basketIdx", type: "uint8" }, { name: "basketAtoms", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "tokenOf", inputs: [{ type: "uint8" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "weightsOf", inputs: [{ type: "uint8" }], outputs: [{ type: "uint16[4]" }], stateMutability: "view" },
  { type: "function", name: "quoteMint", inputs: [{ name: "basketIdx", type: "uint8" }, { name: "basketAtoms", type: "uint256" }], outputs: [{ type: "uint256[4]" }], stateMutability: "view" },
  { type: "function", name: "quoteRedeem", inputs: [{ name: "basketIdx", type: "uint8" }, { name: "basketAtoms", type: "uint256" }], outputs: [{ type: "uint256[4]" }], stateMutability: "view" },
  { type: "event", name: "BasketMinted", inputs: [{ type: "uint8", indexed: true }, { type: "address", indexed: true }, { type: "uint256" }] },
  { type: "event", name: "BasketRedeemed", inputs: [{ type: "uint8", indexed: true }, { type: "address", indexed: true }, { type: "uint256" }] },
] as const;

export const BASKET_KIND = ["PRIME", "FOREST", "TECH"] as const;
export const BASKET_DESCRIPTIONS: Record<number, string> = {
  0: "Top-grade weighted",
  1: "Nature-based",
  2: "Engineered removal",
};

/** Same shape as CCMGradeToken (allowance-free burn from minter), reused. */
export const CCMBasketTokenAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export const CCMSandboxInsuranceAbi = [
  { type: "function", name: "declareFailure", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "claim", inputs: [{ name: "nftId", type: "uint256" }, { name: "tonnage", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "failures", inputs: [{ type: "uint256" }], outputs: [{ name: "declared", type: "bool" }, { name: "payoutPerTonne", type: "uint256" }, { name: "budget", type: "uint256" }, { name: "atSupply", type: "uint256" }, { name: "totalClaimed", type: "uint256" }, { name: "declaredAt", type: "uint64" }, { name: "declarer", type: "address" }], stateMutability: "view" },
  { type: "function", name: "totalDeclared", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalPaidOut", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "reserves", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "FAILURE_POOL_BPS", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "FailureDeclared", inputs: [{ type: "uint256", indexed: true }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "address", indexed: true }] },
  { type: "event", name: "Claimed", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "uint256" }, { type: "uint256" }] },
] as const;

export const CCMSandboxYieldAbi = [
  { type: "function", name: "stake", inputs: [{ name: "nftId", type: "uint256" }, { name: "tonnage", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "claim", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unstake", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "pendingReward", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "stakes", inputs: [{ type: "uint256" }], outputs: [{ name: "staker", type: "address" }, { name: "nftId", type: "uint256" }, { name: "tonnage", type: "uint256" }, { name: "grade", type: "uint8" }, { name: "startedAt", type: "uint64" }, { name: "lastClaimedAt", type: "uint64" }, { name: "active", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "userStakesOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "stakeCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalStaked", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalEarned", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "gradeWeight", inputs: [{ type: "uint8" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "BASE_RATE", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "Staked", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "uint256", indexed: true }, { type: "uint8" }, { type: "uint256" }] },
  { type: "event", name: "Claimed", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "uint256" }] },
  { type: "event", name: "Unstaked", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "uint256" }] },
] as const;

export const CCMSandboxFractionalizerAbi = [
  { type: "function", name: "fractionalize", inputs: [{ name: "nftId", type: "uint256" }, { name: "tonnage", type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "nonpayable" },
  { type: "function", name: "reassemble", inputs: [{ name: "nftId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "fractionToken", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "lockedTonnage", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "isActive", inputs: [{ type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "totalActiveSeries", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "TOKEN_PER_TONNE", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "Fractionalized", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "address", indexed: true }, { type: "uint256" }] },
  { type: "event", name: "Reassembled", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "uint256" }] },
] as const;

/** Minimal ERC-20 ABI for fraction tokens. */
export const CCMFractionTokenAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "transfer", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
] as const;

export const CCMSandboxUSDCAbi = [
  { type: "function", name: "claim", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "cooldownRemaining", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "CLAIM_AMOUNT", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalClaimed", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export const CCMSandboxLendingAbi = [
  { type: "function", name: "open", inputs: [{ name: "id", type: "uint256" }, { name: "tonnage", type: "uint256" }, { name: "borrowAmount", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "close", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "liquidate", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "maxBorrow", inputs: [{ name: "grade", type: "uint8" }, { name: "tonnage", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "gradeParams", inputs: [{ type: "uint256" }], outputs: [{ name: "pricePerTonne", type: "uint256" }, { name: "ltvBps", type: "uint16" }], stateMutability: "view" },
  { type: "function", name: "positions", inputs: [{ type: "uint256" }], outputs: [{ name: "borrower", type: "address" }, { name: "nftId", type: "uint256" }, { name: "nftAmount", type: "uint256" }, { name: "grade", type: "uint8" }, { name: "borrowed", type: "uint256" }, { name: "openedAt", type: "uint64" }, { name: "status", type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "userPositionsOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "positionCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalBorrowed", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalRepaid", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "reserves", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "LIQUIDATION_AFTER", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "Opened", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "uint256" }, { type: "uint8", indexed: true }, { type: "uint256" }, { type: "uint256" }] },
  { type: "event", name: "Closed", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }, { type: "uint256" }] },
  { type: "event", name: "Liquidated", inputs: [{ type: "uint256", indexed: true }, { type: "address", indexed: true }] },
] as const;

export const CCMSandboxGradeWrapperAbi = [
  { type: "function", name: "wrap", inputs: [{ name: "id", type: "uint256" }, { name: "tonnage", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unwrap", inputs: [{ name: "grade", type: "uint8" }, { name: "ccmAmount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "tokenOf", inputs: [{ type: "uint8" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "gradeBalance", inputs: [{ type: "uint8" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "queueLength", inputs: [{ type: "uint8" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalWrapped", inputs: [{ type: "uint8" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalUnwrapped", inputs: [{ type: "uint8" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "TOKEN_PER_TONNE", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "Wrapped", inputs: [{ type: "address", indexed: true }, { type: "uint256", indexed: true }, { type: "uint8", indexed: true }, { type: "uint256" }] },
  { type: "event", name: "Unwrapped", inputs: [{ type: "address", indexed: true }, { type: "uint256", indexed: true }, { type: "uint8", indexed: true }, { type: "uint256" }] },
] as const;

/** Minimal ERC-20 ABI for grade tokens (no approve needed for unwrap — wrapper-mediated burns). */
export const CCMGradeTokenAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export const CCMSandboxVaultAbi = [
  { type: "function", name: "wrap", inputs: [{ name: "id", type: "uint256" }, { name: "tonnage", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unwrap", inputs: [{ name: "ccmAmount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "gradeBalance", inputs: [{ type: "uint8" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "queueLength", inputs: [{ type: "uint8" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "previewUnwrapHead", inputs: [], outputs: [{ name: "grade", type: "uint8" }, { name: "id", type: "uint256" }, { name: "available", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalWrapped", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalUnwrapped", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "TOKEN_PER_TONNE", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "MAX_HOPS_PER_UNWRAP", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "Wrapped", inputs: [{ type: "address", indexed: true }, { type: "uint256", indexed: true }, { type: "uint8", indexed: true }, { type: "uint256" }] },
  { type: "event", name: "Unwrapped", inputs: [{ type: "address", indexed: true }, { type: "uint256", indexed: true }, { type: "uint8", indexed: true }, { type: "uint256" }] },
] as const;

export const CCMSandboxNFTAbi = [
  { type: "function", name: "mint", inputs: [{ name: "grade", type: "uint8" }, { name: "vintage", type: "uint16" }, { name: "tonnage", type: "uint256" }, { name: "projectId", type: "bytes32" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "retire", inputs: [{ name: "id", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }, { name: "id", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "meta", inputs: [{ type: "uint256" }], outputs: [{ name: "grade", type: "uint8" }, { name: "vintage", type: "uint16" }, { name: "tonnage", type: "uint256" }, { name: "projectId", type: "bytes32" }, { name: "minter", type: "address" }, { name: "mintedAt", type: "uint64" }], stateMutability: "view" },
  { type: "function", name: "nextId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "retiredTotal", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "cooldownRemaining", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "MINT_COOLDOWN", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "MAX_TONNAGE", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "setApprovalForAll", inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "isApprovedForAll", inputs: [{ name: "account", type: "address" }, { name: "operator", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "event", name: "Minted", inputs: [{ type: "address", indexed: true }, { type: "uint256", indexed: true }, { type: "uint8" }, { type: "uint16" }, { type: "uint256" }, { type: "bytes32" }] },
  { type: "event", name: "Retired", inputs: [{ type: "address", indexed: true }, { type: "uint256", indexed: true }, { type: "uint256" }, { type: "uint256" }] },
] as const;

export const GRADE_LABELS = ["A", "B", "C", "D"] as const;
export const GRADE_DESCRIPTIONS: Record<number, string> = {
  0: "Direct Air Capture · Mineralization (1,000+ yr)",
  1: "Biochar · Enhanced Weathering (100+ yr)",
  2: "Reforestation · Soil carbon (40+ yr)",
  3: "REDD+ · Legacy methodologies (10–40 yr)",
};

export const CCMSandboxFaucetAbi = [
  { type: "function", name: "claim", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "lastClaim", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "nextClaimAt", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "cooldownRemaining", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "CLAIM_AMOUNT", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "COOLDOWN", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalMinted", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "claimCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "Claimed", inputs: [{ type: "address", indexed: true }, { type: "uint256" }, { type: "uint256" }] },
] as const;

export const TESTNET_CHAIN_ID = 84532;
export const TESTNET_FAUCETS = [
  // External faucets only — we do not run our own.
  { name: "Coinbase Faucet (Base Sepolia)", url: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet" },
  { name: "Alchemy Faucet (Base Sepolia)", url: "https://www.alchemy.com/faucets/base-sepolia" },
  { name: "QuickNode Faucet (Base Sepolia)", url: "https://faucet.quicknode.com/base/sepolia" },
];

// ===================== ABIs (minimal) =====================

export const CCMTokenAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "VERSION", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "cap", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "paused", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export const CCMSandboxRebateAbi = [
  { type: "function", name: "retire", inputs: [{ name: "nftId", type: "uint256" }, { name: "tonnage", type: "uint64" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "baseRebatePerTonne", inputs: [{ type: "uint8" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "currentMultiplierBps", inputs: [{ type: "address" }], outputs: [{ type: "uint16" }], stateMutability: "view" },
  { type: "function", name: "quoteRebate", inputs: [{ name: "user", type: "address" }, { name: "grade", type: "uint8" }, { name: "tonnage", type: "uint64" }], outputs: [{ name: "rebate", type: "uint256" }, { name: "multiplierBps", type: "uint16" }], stateMutability: "view" },
  { type: "function", name: "cumulativeRetired", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalRetired", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalRebated", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "RetiredWithRebate", inputs: [
    { name: "retirer", type: "address", indexed: true },
    { name: "nftId", type: "uint256", indexed: true },
    { name: "grade", type: "uint8" },
    { name: "tonnage", type: "uint64" },
    { name: "rebateAmount", type: "uint256" },
    { name: "multiplierBps", type: "uint16" },
  ] },
] as const;
