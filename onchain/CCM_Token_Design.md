# CCM Network Utility Token ($CCM) Design Document

**Version**: 1.0
**Standard**: ERC-20 (Ethereum L1 / Base L2)
**License**: MIT

---

## 1. Token Overview

| Property | Value |
|---|---|
| **Name** | CCM Network Token |
| **Symbol** | CCM (or $CCM) |
| **Standard** | ERC-20 (with extensions) |
| **Decimals** | 18 |
| **Total Supply** | 5,000,000,000 (5B) — Hard cap |
| **Chain** | Base L2 (primary) + Ethereum L1 (bridge) |
| **Issuer** | CCM Network ADGM Ltd (VARA-licensed) |
| **Target audience** | Non-US persons (geo-blocked) |

---

## 2. Distribution

| Category | Share | Tokens (M) | Vesting | Purpose |
|---|---|---|---|---|
| Mining rewards (DePIN) | 40% | 2,000 | Linear over 10 years | Container Node operator rewards |
| DeFi / ecosystem | 15% | 750 | Linear over 5 years | Liquidity, incentives |
| Foundation | 15% | 750 | 1y cliff + 3y vest | Foundation operations, R&D |
| Partners | 10% | 500 | 2y cliff + 3y vest | Strategic partners |
| **Strategic (TGE portion)** | **8%** | **400** | **6mo lock + 24mo vest** | **Series A** |
| **Public (TGE portion)** | **5%** | **250** | **3mo lock + 12mo vest** | **Public sale** |
| Airdrop | 4% | 200 | Distributed over 2 years | Community incentives |
| Marketing | 3% | 150 | Distributed over 4 years | Marketing, opex |

**TGE allocation**: Strategic 200M + Public 0M = **200M (4% of supply)** at avg $0.183 → **$36.5M raise**

---

## 3. Token Mechanisms

### 3.1 ERC-20 base
Standard ERC-20 functions: `transfer`, `approve`, `balanceOf`, etc. Plus:
- **Burnable** (`ERC20Burnable`) — user or treasury can burn
- **Capped** (`ERC20Capped`) — 5B hard cap, no further minting beyond cap
- **Pausable** — emergency transfer halt (governance-controlled)
- **AccessControl** — separate `MINTER_ROLE`, `PAUSER_ROLE`, `BURNER_ROLE`

### 3.2 Multi-tier TGE Sale (`CCMTGESale.sol`)
- 2-tier pricing: Seed ($0.15) / Series A ($0.20)
- KYC whitelist (eligible investors only)
- Per-round lockup automatically applied
- USD/USDC/ETH payment

### 3.3 Vesting (`CCMVesting.sol`)
- Linear vesting with cliff
- Per-allocation independent vesting schedule
- Revoke capability (per-category, governance-controlled)

### 3.4 Early-Investor Staking (`CCMStaking.sol`)
**Core mechanism** — price-elastic yield with automatic decay

```
yield_rate(P, pool) = R₀ × (P_TGE/P) × (pool_left/pool_init)
                    ≤ R₀ = 10%/month (cap)
```

- Eligibility: TGE stakers only (whitelist)
- Pool cap: **200M $CCM** (4% of supply, funded from Foundation pool)
- Continuous decay (no floor) → yield → 0 once pool is exhausted
- Auto sunset: pool drained in 4-6 months

### 3.5 Buyback-and-burn (Treasury, off-chain or on-chain)
- 6% of carbon-credit revenue used to buy $CCM on the market
- Purchased $CCM is permanently burned
- Y10 cumulative burn: ~970M (19% of total supply)

### 3.6 veCCM (Future — Phase 2)
Curve veCRV-style vote-escrow lock:
- Lock period: 1 week ~ 4 years
- voting power = staked_amount × time_to_unlock / max_time
- veCCM holders receive a share of protocol revenue (cashflow asset)
- *Deployed as a separate contract in Phase 2*

---

## 4. Smart Contract Architecture

```
┌──────────────────────────────────────────────────┐
│                  CCMToken.sol                    │
│   ERC20 + Capped + Burnable + Pausable + AC      │
│              (5B hard cap)                       │
└──────────────────────────────────────────────────┘
              ↑                       ↑
              │ mint()                │ burn()
              │                       │
   ┌──────────┴──────────┐  ┌─────────┴──────────┐
   │  CCMVesting.sol     │  │  CCMStaking.sol    │
   │  ─ Foundation       │  │  ─ Early investors │
   │  ─ Partners         │  │  ─ Yield decay     │
   │  ─ Strategic        │  │  ─ 200M cap        │
   │  ─ Public           │  └────────────────────┘
   │  ─ Airdrop          │
   │  ─ Marketing        │
   └─────────────────────┘
              ↑
              │ deposit()
              │
   ┌──────────┴──────────┐
   │   CCMTGESale.sol    │
   │   ─ Seed @ $0.15    │
   │   ─ Series A @ $0.20│
   │   ─ KYC whitelist   │
   └─────────────────────┘
```

---

## 5. Deployment Plan

### Phase 0 (just before TGE)
1. Deploy `CCMToken` → owner mints the entire 5B
2. Deploy `CCMVesting` → create vesting schedules per category
3. Deploy `CCMStaking` → fund 200M pool
4. Deploy `CCMTGESale` → fund Seed 70M + Series A 130M

### Phase 1 (TGE)
1. Open Seed round → KYC-approved buyers purchase
2. Open Series A round → KYC-approved buyers purchase
3. Public listing (Coinbase International, Binance)

### Phase 2 (TGE + 6mo)
1. Staking pool exhausted → emissions auto-stop
2. Deploy veCCM (separate contract)
3. Deploy DeFi primitives (cDEX, cLend, cBond)

### Phase 3 (TGE + 12mo+)
1. Activate buyback-burn treasury
2. Cross-chain bridge (L1 ↔ L2)
3. Governance contract (CCMGovernor)

---

## 6. Security Considerations

### 6.1 Audits
- External audit (Trail of Bits / OpenZeppelin / Quantstamp)
- Monthly bug bounty (Immunefi) before TGE

### 6.2 Access Control
- `DEFAULT_ADMIN_ROLE`: Multisig (3-of-5)
- `MINTER_ROLE`: TGESale + Vesting (revocable)
- `PAUSER_ROLE`: Multisig only
- All admin actions go through a `Timelock` (48 hours)

### 6.3 Emergency Procedures
- `pause()` — halt all transfers in an emergency
- `recoverERC20()` — recover other tokens accidentally sent in
- Upgrade pattern: every contract is `non-upgradeable` (user trust first) — the next version is migrated to via a new contract

### 6.4 Compliance
- **US geo-blocking**: TGE Sale's `purchase()` checks IP/nationality through a KYC oracle
- **VARA / SEC Reg S compliance**: $CCM is classified as a utility token, US persons blocked from purchasing
- **Sanctions screening**: automatic OFAC list block

---

## 7. Files

| File | Description |
|---|---|
| `CCMToken.sol` | ERC-20 main token |
| `CCMVesting.sol` | Linear vesting with cliff |
| `CCMStaking.sol` | Price-elastic yield staking pool |
| `CCMTGESale.sol` | Multi-tier TGE sale |
| `CCMMigration.sol` | v1 → v2 swap |
| `CCM_Token_Design.md` | This design document |

---

## 8. Standards & References

- ERC-20: https://eips.ethereum.org/EIPS/eip-20
- ERC-2612 (Permit): gasless approve
- OpenZeppelin Contracts v5.0
- Curve veCRV (https://curve.readthedocs.io/dao-vecrv.html) — veCCM reference

---

## 9. License

These contracts are released under the **MIT License**. Anyone may freely use, copy, modify, and redistribute them.
