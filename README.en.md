# CCM Network

**Carbon Credit Measurement** — an open standard, verification, and DeFi network for carbon credits.

> The Carbon Credit Standard. Verified. Onchain. DeFi-native.

Just as **PPM** became the de facto unit for atmospheric CO₂ concentration, **CCM** aims to become the universal unit for one verified ton of CO₂ reduction or removal.

🌐 **Languages**: [한국어](README.md) · **English**

---

## Market Opportunity — Voluntary Carbon Market 2030

| Year | Market Size (USD) |
|------|-------------------|
| 2024 | $2B |
| 2026E | $8B |
| 2028E | $25B |
| **2030E** | **$50B** |
| 2050E | $250B |

> **25× growth by 2030, 125× by 2050 — but the market is broken.** (Source: McKinsey, 2024)

---

## Trinity: Network · Unit · Token

Just as Bitcoin runs on three layers — *Network + bitcoin + $BTC* — CCM operates as three coordinated layers.

| Layer | Name | Role |
|-------|------|------|
| **N**etwork | **CCM Network** | Foundation, standard, governance — the global standard network coordinating VVBs, Oracles, and Registry |
| **U**nit | **CCM** | A universal unit for verified carbon reduction (1 ton CO₂e verified), usable by anyone — like PPM |
| **T**oken | **$CCM** | ERC-20 wrapper — a fungible asset freely composable across AMMs, lending, and DeFi |

---

## Core Concepts

### 1 CCM = 1 ton CO₂e (verified, onchain)

CCM is a **unit**, not a token. It represents a verified amount of carbon reduction. Onchain, it exists in two forms simultaneously.

### Dual Representation Architecture

| Form | Standard | Role |
|------|----------|------|
| **CCM-NFT** | ERC-1155 | Source-of-truth (metadata: vintage, grade, project ID, VVB signatures) |
| **$CCM token** | ERC-20 | Fungible wrapper (AMM, lending, payment) |

The two forms wrap/unwrap 1:1 through a vault. The result is the first onchain carbon primitive that combines NFT-grade **traceability and uniqueness** with ERC-20 **liquidity and DeFi composability**.

### 4-Tier Grading System

| Grade | Permanence | MRV | Representative Categories |
|-------|------------|-----|---------------------------|
| **CCM-A** | 1,000+ years | Tier-1 | DAC, mineralization, ocean alkalinity |
| **CCM-B** | 100+ years | Tier-1 | Biochar, enhanced weathering, building materials |
| **CCM-C** | 40–100 years | Tier-2 | Afforestation, soil carbon, wetland restoration |
| **CCM-D** | <40 years | Tier-2 | REDD+, methane avoidance, cookstoves |

### SI Prefix Unit System

μCCM (1g) · mCCM (1kg) · CCM (1 ton) · kCCM · MCCM · GCCM — a unified expression spanning individual flights (≈200 mCCM) to national NDCs (e.g., Korea 2030 ≈ 290 MCCM).

---

## Four Market Failures We Solve

1. **Opacity** → onchain registry with real-time mint / transfer / burn events
2. **Double counting** → globally unique tokenIds, retire-once invariant
3. **Liquidity shortage** → DeFi composability (AMM, lending, indices)
4. **No grade differentiation** → 4-tier grading, grade-specific wrappers

---

## Architecture — 8-Layer Stack

| Layer | Role |
|-------|------|
| L8 Application | Wallet, marketplace, ESG dashboard |
| **L7 DeFi Primitives** ★ | Wrap, AMM, Vault, Index, Insurance |
| L6 Token Layer | $CCM ERC-20, veCCM |
| **L5 NFT Registry** ★ | CCM-NFT ERC-1155 (source-of-truth) |
| L4 Verification | VVB consensus, ZK proof |
| L3 Oracle / MRV | Satellites (Sentinel-2, Planet Labs), IoT, LiDAR |
| L2 Mining (CCMine) | Physical / Verification nodes |
| L1 Settlement | Base (Coinbase L2) |

**Core separation of concerns**: L5 NFT = **traceability** · L6 Token = **liquidity** · L7 DeFi = **composability**

---

## CCMine — Proof of Carbon Removal/Reduction (PoCR)

Just as Bitcoin issues BTC through PoW, CCMine nodes mint CCM-NFTs through verified reduction activity.

- **Physical Miner**: operates DAC equipment, mineralization plants, biochar kilns, afforestation sites, etc.
- **Verification Miner**: runs oracle / attestation nodes
- **Storage Miner**: provides distributed storage (IPFS / Arweave)

### Issuance Flow (5 steps)

```
1. Reduction Activity   2. Oracle Capture      3. VVB Verification
   DAC, mineralization, →  Satellite, IoT,   →  M-of-N consensus,
   afforestation           LiDAR data            grade assignment
                                                 ↓
5. Wrap / Sell          4. NFT Mint
   Convert to $CCM,  ←   CCM-NFT (ERC-1155)
   activate DeFi         issued
```

---

## $CCM Token

- **Hard cap**: 5,000,000,000 (5B, enforced by ERC20Capped — no further minting ever)
- **Settlement layer**: Base (EVM L2)

### Allocation

| Category | % | Notes |
|----------|---|-------|
| Mining Rewards | 40% | 10-year decelerating emission |
| Foundation / Ecosystem | 18% | 4Y vesting + 1Y cliff |
| Strategic / Partners | 10% | 4Y vesting + 1Y cliff |
| Liquidity / AMM | 9% | Unlocked at TGE |
| Treasury Reserve | 8% | DAO-controlled |
| Public Sale (TGE) | 5% | Seed + Series A |
| Staking Pool | 5% | Price-elastic yield |
| Team & Advisors | 5% | 4Y vesting + 1Y cliff |

### Utilities

1. Settlement currency
2. VVB / CCMiner staking
3. Governance (veCCM lock-and-vote)
4. 50% marketplace fee discount
5. DeFi liquidity primitive

---

## CCM × DeFi Synergies

| Primitive | Description |
|-----------|-------------|
| **Wrap / Unwrap** | NFT ↔ ERC-20 1:1 (Standard / Premium / Specific modes) |
| **Grade Wrappers** | $CCM-A, $CCM-B, $CCM-C, $CCM-D pools |
| **NFT Vault Lending** | NFT collateral, grade-tiered LTV 30–70% |
| **Fractionalization** | Splits large NFTs for retail accessibility |
| **NFT Yield** | Hold-to-Earn, weighted by grade and vintage |
| **Retire-to-Earn** | ESG retire → Retirement Certificate + $CCM rebate |
| **Insurance Vault** | Hedges dispute / invalidation risk |
| **Index Tokens** | $CCM-PRIME (A+B), $CCM-FOREST (NbS), $CCM-TECH (TbS) |

Standard ERC-20 / ERC-1155 compatibility means free composability with Uniswap, Curve, Aave, Pendle, Yearn, OpenSea, Sudoswap, and other external DeFi.

---

## vs. Existing Onchain Carbon Projects

| Dimension | Toucan (BCT) | Moss (MCO2) | KlimaDAO | **CCM Network** |
|-----------|--------------|-------------|----------|-----------------|
| Originate vs Tokenize | Tokenize | Tokenize | Tokenize | ✅ **Originate** |
| NFT × ERC-20 Dual | ❌ ERC-20 only | ❌ ERC-20 only | ❌ ERC-20 only | ✅ **Both, 1:1 wrap** |
| Grade differentiation | ❌ Single pool | ❌ Single | ❌ | ✅ **A/B/C/D tiers** |
| DeFi Native (Vault, Index) | Limited | ❌ | Partial | ✅ **8 primitives** |
| Verification governance | External (Verra) | External | External | ✅ **Multi-VVB DAO** |
| Bridge risk | ⚠️ Frozen (Verra ban) | ⚠️ | ⚠️ | ✅ **Originate, no bridge** |

**CCM is the first Originate × NFT/Token Dual × DeFi-native carbon infrastructure.**

---

## Governance — veCCM

| Lock duration | Weight |
|---------------|--------|
| 4 years | 1.0× |
| 2 years | 0.5× |
| 1 year | 0.25× |
| 6 months | 0.1× |

veCCM is non-transferable. Votes cover CCM Standard amendments, VVB whitelist, treasury spending, fee rates, vault parameters, and more.

**Progressive decentralization**: Y0 multisig → Y1 treasury votes binding → Y2 standard amendments by vote → Y3+ full DAO.

---

## Roadmap

| Phase | Timing | Key Milestones |
|-------|--------|----------------|
| 0 — Foundation | Done | Standard v1.0, Whitepaper v1.0, core contract drafts |
| 1 — Mainnet | 2026 Q3 | External audit, Base deployment, TGE, AMM seeding, Foundation setup |
| 2 — Mining + DeFi launch | 2026 Q4 | 5 CCMine pilots, 5 VVBs onboarded, Wrapper/Staking deployed |
| 3 — DeFi at scale | 2027 H1 | Vault, Fractional, Index, Insurance, veCCM governance live |
| 4 — Scale | 2027 H2–2028 | 100+ nodes, 20+ VVBs, multi-language, multi-chain |
| 5 — Standard Adoption | 2028+ | UNFCCC Article 6 / ISO TC 207 alignment, A6.4ER ↔ CCM bridge |

---

## Interoperability

- **Verra VCS**: 1 VCU = 1 CCM (grade assigned post-verification)
- **Gold Standard**: 1 GS-VER = 1 CCM
- **ACR**: 1 ERT = 1 CCM
- **Paris Agreement Article 6.4**: 1 A6.4ER ≥ CCM-B
- **ICVCM CCP**: CCP-eligible → CCM-A or CCM-B candidate

---

## Security Policy

- All contracts are **non-upgradeable**
- At least one external audit required (Trail of Bits / OpenZeppelin / Quantstamp)
- Immunefi bug bounty post-TGE (up to $500K)
- Slither and Mythril static analysis required
- Admin roles: 3-of-5 Gnosis Safe + 48-hour timelock

---

## Documents

- [Whitepaper v1.0](docs/CCM_Network_Whitepaper_v1.0.pdf) (39 pages)
- [Deck v1.0](docs/CCM_Network_Deck_v1.0.pdf)

---

## Licenses

- **Whitepaper**: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **CCM Standard** (separate document): Apache License 2.0
- **Smart contract source code**: MIT License

---

## Links

- Website: ccm.network · ccm.earth
- Issued by: CCM Foundation, May 2026

---

> **Disclaimer**: Materials in this repository are for informational purposes only and do not constitute investment advice or a securities offering. See the whitepaper, Section 12, for risks associated with $CCM token purchases.
