# CCM Network Token — Business Model & Requirements Specification

**Document**: CCM-BRD-001
**Version**: 1.0
**Status**: Draft for Engineering
**Date**: 2026

---

## Part 1 ─ Business Model

### 1.1 Vision

CCM Network is the infrastructure that **converts verified carbon reductions into a digital financial asset that global capital markets can trade directly**.

> "Carbon is the New Gold."

### 1.2 Value chain (5 stages)

```
Waste ──▶ Decomposition/treatment ──▶ Verified carbon credits ──▶ Digital assets (cNFT/ST) ──▶ DeFi/exchanges
                                          │                                │
                                          └─ ACR/Verra/CCP                 └─ $CCM utility token
```

| Stage | Activity | Actor | Output |
|---|---|---|---|
| 1. Decomposition | Treatment of waste refrigerants, F-gas, used tyres, etc. | GreenScience (Korea) + Local ProjectCo | DRE measurements |
| 2. Verification | On-site VVB verification | DNV / SCS / Bureau Veritas | VVB certificate |
| 3. Registration | Registration with international registry | GreenScience + ACR/Verra | CCP label |
| 4. Tokenisation | cNFT issuance, $CCM as gas | CCM Network ADGM Ltd | On-chain assets |
| 5. Distribution | DEX/DeFi trading, exchange listings | CCM Network ADGM Ltd + market | Capital recovery |

### 1.3 Revenue streams (5)

| # | Source | Operator | Share (Y10 est.) |
|---|---|---|---|
| 1 | cNFT sales (direct carbon credit sale) | US company | ~50% |
| 2 | $CCM token transaction fees | Dubai company | ~15% |
| 3 | DeFi protocol fees (cDEX, cLend) | Dubai company | ~12% |
| 4 | Technology licence royalty | Korean company | ~10% |
| 5 | EPC + equipment sales | Korean company | ~13% |

### 1.4 Stakeholders (3-Company SOTP)

| Company | Role | Token relationship |
|---|---|---|
| **GreenScience Co., Ltd.** (Korea) | Technology + carbon credits + US business | Revenue → cNFT, royalty → $CCM, IPO/Series A planned |
| **CCM Network ADGM Ltd** (UAE) | $CCM issuance/operation, DeFi | Token issuer, VARA-licensed |
| **Planet Earth Corp** (US) | RWA SPV, STO issuance | Issuer of CCM Network ST (security token) |

### 1.5 Token's business roles

$CCM is not just an "investment asset"; it simultaneously plays **5 roles**:

1. **Gas / Fee token** — used for gas in cNFT issuance/transfer and DeFi
2. **Node operator collateral** — Container Node operators must stake to mine
3. **Governance** — voting power when locked into veCCM (Phase 2)
4. **Cashflow asset** — protocol revenue distributed to holders (97% of price formation)
5. **Liquidity layer** — supplied to DeFi pools to drive trading

---

## Part 2 ─ Token Economic Model

### 2.1 Supply

| Property | Value |
|---|---|
| Total supply | 5,000,000,000 (5B) — Hard cap |
| Distribution schedule | Released gradually over 10 years |
| Decimals | 18 |
| Standard | ERC-20 |

### 2.2 Distribution (8 categories)

| Category | Share | Tokens (M) | Vesting |
|---|---|---|---|
| Mining rewards | 40% | 2,000 | Linear over 10 years |
| DeFi / ecosystem | 15% | 750 | Linear over 5 years |
| Foundation | 15% | 750 | 1y cliff + 3y vest |
| Partners | 10% | 500 | 2y cliff + 3y vest |
| Strategic (Series A) | 8% | 400 | 6mo cliff + 18mo vest |
| Public (public sale) | 5% | 250 | 3mo cliff + 12mo vest |
| Airdrop | 4% | 200 | Distributed over 2 years |
| Marketing | 3% | 150 | Distributed over 4 years |

### 2.3 TGE pricing (Series A-Heavy)

| Round | Price | Quantity | Raise |
|---|---|---|---|
| Seed | $0.150 | 70M | $10.5M |
| Series A | $0.200 | 130M | $26.0M |
| **Total** | **avg $0.183** | **200M** | **$36.5M (~₩47B)** |

### 2.4 Staking yield mechanism

```
yield_rate(P, pool) = R₀ × (P_TGE / P) × (pool_left / pool_init)
                    ≤ R₀ = 10% / month
                    → 0% / month  (auto-stops when pool is exhausted)
```

- Eligibility: TGE stakers only (whitelist)
- Pool cap: **200M $CCM** (4% of supply)
- Estimated time to drain pool: 4-6 months
- Long-term price impact: **-1.1%** (within market noise)

### 2.5 Buyback-and-burn

- 6% of carbon credit revenue used to buy $CCM on the market and permanently burn
- Y10 cumulative burn estimate: 970M (19% of total supply)

### 2.6 Long-term price equilibrium

| Scenario | Y10 price | Market cap | Cohort A (Seed) ROI |
|---|---|---|---|
| Bear | $0.45 | $884M | 4× |
| **Base** | **$1.73** | **$5.0B** | **16×** |
| Bull | $3.49 | $14.4B | 33× |

---

## Part 3 ─ Functional Requirements

### 3.1 FR-1 — Token core (CCMToken)

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | ERC-20 standard compliance (transfer, approve, balanceOf, allowance) | P0 |
| FR-1.2 | 5,000,000,000 hard cap (`ERC20Capped`) | P0 |
| FR-1.3 | Burn (`ERC20Burnable`) — user self-burn + treasury burn | P0 |
| FR-1.4 | Pausable — emergency transfer halt | P0 |
| FR-1.5 | Permit (EIP-2612) — gasless approve | P1 |
| FR-1.6 | Role-based access control (MINTER, PAUSER) | P0 |
| FR-1.7 | Recovery of mistakenly-sent ERC-20 tokens (recoverERC20) | P2 |

### 3.2 FR-2 — TGE Sale (CCMTGESale)

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | Multi-round support (Seed, Series A, etc.) | P0 |
| FR-2.2 | Per-round price, hardCap, start/end timestamps | P0 |
| FR-2.3 | KYC whitelist (per-round) | P0 |
| FR-2.4 | USDC payment (USD-equivalent, 6 decimals) | P0 |
| FR-2.5 | Per-round vesting (cliff + linear) auto-applied | P0 |
| FR-2.6 | claim function — only vested portion claimable | P0 |
| FR-2.7 | Hardcap reached → no more purchases | P0 |
| FR-2.8 | Admin USDC withdrawal (cover foundation opex) | P0 |
| FR-2.9 | Force-close round (admin) | P1 |

### 3.3 FR-3 — Vesting (CCMVesting)

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | Linear vesting with cliff | P0 |
| FR-3.2 | Multiple schedules per user | P0 |
| FR-3.3 | release(id) — per-schedule withdrawal | P0 |
| FR-3.4 | releaseAll() — release all of caller's schedules | P1 |
| FR-3.5 | revoke (Foundation/Partners and other revocable schedules) | P0 |
| FR-3.6 | revoke pays vested portion to beneficiary, returns remainder to admin | P0 |

### 3.4 FR-4 — Staking (CCMStaking)

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | Eligibility whitelist management (set/batch) | P0 |
| FR-4.2 | Price-elastic yield rate calculation (yield ∝ 1/P × pool) | P0 |
| FR-4.3 | Real-time price oracle integration | P0 |
| FR-4.4 | Yield rate cap = R₀ (10%/mo) | P0 |
| FR-4.5 | Pool exhausted → yield = 0 | P0 |
| FR-4.6 | stake / unstake / claim — auto-settle reward | P0 |
| FR-4.7 | pendingReward query (simulation) | P1 |
| FR-4.8 | Recover pool remainder once all users have unstaked | P2 |

### 3.5 FR-5 — Burn mechanism (Treasury)

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | External Treasury buys $CCM on the market (off-chain automation) | P1 |
| FR-5.2 | Treasury calls burn() to permanently destroy purchased $CCM | P0 |
| FR-5.3 | Burn event emitted (aggregable) | P1 |
| FR-5.4 | Treasury controlled by multisig + Timelock | P0 |

### 3.6 FR-6 — Future Phase 2 (reference)

| ID | Requirement | Phase |
|---|---|---|
| FR-6.1 | veCCM (Curve veCRV-style 4-year lock) | Phase 2 |
| FR-6.2 | cDEX (carbon credit AMM) | Phase 2 |
| FR-6.3 | cLend (cNFT collateralised lending) | Phase 2 |
| FR-6.4 | cBond (Pendle-style PT/YT split) | Phase 2 |
| FR-6.5 | cInsure (mutual insurance pool) | Phase 3 |
| FR-6.6 | cUSD (carbon-collateralised stablecoin) | Phase 3 |

---

## Part 4 ─ Non-Functional Requirements

### 4.1 Security (NFR-SEC)

| ID | Requirement |
|---|---|
| NFR-SEC.1 | At least one external audit (Trail of Bits / OpenZeppelin / Quantstamp) |
| NFR-SEC.2 | All admin roles assigned to a multisig (3-of-5 Gnosis Safe) |
| NFR-SEC.3 | Admin actions gated by 48-hour timelock |
| NFR-SEC.4 | ReentrancyGuard applied (stake, unstake, claim, purchase) |
| NFR-SEC.5 | Bug bounty program (Immunefi, max $500K) |
| NFR-SEC.6 | Emergency pause |
| NFR-SEC.7 | Slither / Echidna / Foundry fuzz tests |

### 4.2 Compliance (NFR-COMP)

| ID | Requirement |
|---|---|
| NFR-COMP.1 | Operate under VARA Cat 4 license (issuance) |
| NFR-COMP.2 | Block US persons from buying (TGE Sale `purchase()` integrates KYC oracle) |
| NFR-COMP.3 | Automatic OFAC sanctions list block |
| NFR-COMP.4 | Only KYC-approved users may participate in TGE/Staking |
| NFR-COMP.5 | Auto-flag AML-monitored transactions (large transfers, suspicious patterns) |
| NFR-COMP.6 | Chainalysis / TRM Labs integration for anomalous activity monitoring |

### 4.3 Scalability (NFR-SCALE)

| ID | Requirement |
|---|---|
| NFR-SCALE.1 | Primary chain: Base L2 (low gas, Coinbase-friendly) |
| NFR-SCALE.2 | Bridge to Ethereum L1 (LayerZero / Wormhole) |
| NFR-SCALE.3 | CCM Network L3 (DePIN-dedicated — Phase 2) |
| NFR-SCALE.4 | TPS: Base L2 ~1000 TPS is sufficient |
| NFR-SCALE.5 | Gas optimisation: storage packing, batch operations |

### 4.4 Auditability (NFR-AUDIT)

| ID | Requirement |
|---|---|
| NFR-AUDIT.1 | Emit events on every state change |
| NFR-AUDIT.2 | All state queryable via view functions (totalStaked, poolRemaining, soldTokens, etc.) |
| NFR-AUDIT.3 | The Graph subgraph deployed (off-chain indexing) |
| NFR-AUDIT.4 | Dune Analytics dashboard |
| NFR-AUDIT.5 | BaseScan / Etherscan verify required |

### 4.5 Upgradability (NFR-UPGRADE)

| ID | Requirement |
|---|---|
| NFR-UPGRADE.1 | Every contract `non-upgradeable` (no proxy pattern) |
| NFR-UPGRADE.2 | Next version deployed as a new contract + migration tool |
| NFR-UPGRADE.3 | Migration incentive for users (e.g. 1.05× tokens) |

---

## Part 5 ─ External Integrations

### 5.1 Price Oracle

**Primary**: Chainlink Price Feed (CCM/USD)
- Use a self-hosted Time-Weighted Average Price (TWAP) oracle right after TGE
- Aggregation: Uniswap V3 + Coinbase International + Binance API (3-source average)
- Update frequency: 5 minutes
- Fallback: auto-pause if Chainlink feed becomes stale (>1 hour)

**Secondary**: Custom oracle with multisig confirmation
- 5-of-N price multisig (representatives from different exchanges)
- One price commit per day

### 5.2 KYC Oracle

| Provider | Role |
|---|---|
| Sumsub / Persona | KYC + AML screening |
| Chainalysis | Sanctions / AML risk scoring |
| Custom on-chain whitelist | Register approved addresses |

Workflow: off-chain KYC → approved → admin calls `setEligible()` / `setWhitelist()`

### 5.3 Carbon Credit Registries

| Registry | Role | Integration |
|---|---|---|
| ACR (American Carbon Registry) | ODS / F-Gas registration | API + manual verification |
| Verra VCS | Nature-based / process verification | API |
| ICVCM CCP | Quality label | Certificate PDF + on-chain hash |

When issuing a cNFT, the registry's serial number is included in metadata → on-chain proof.

### 5.4 Multi-chain bridges

| Bridge | Use |
|---|---|
| LayerZero | Base ↔ Ethereum (primary) |
| Wormhole | Base ↔ Solana (Phase 2) |
| Custom L3 bridge | Base ↔ CCM Network L3 (Phase 2) |

---

## Part 6 ─ Development Roadmap

### Phase 0 — Pre-TGE (M0~M3)

| Task | Owner |
|---|---|
| Develop 4 contracts (Token/Vesting/Staking/TGESale) | Blockchain dev team |
| Write Hardhat tests (95%+ coverage) | Blockchain dev team |
| Slither / Echidna fuzz tests | Security team |
| External audit (Trail of Bits) | External auditor |
| Multisig + Timelock setup | DevOps |
| Build price oracle | Backend team |
| KYC integration (Sumsub) | Backend + Compliance |

### Phase 1 — TGE (M3~M6)

| Task | Owner |
|---|---|
| Mainnet deploy (Base) | DevOps |
| Bulk-create vesting schedules | Operations |
| Register KYC whitelist | Compliance |
| Open Seed round | Sales / IR |
| Open Series A round | Sales / IR |
| Public listing (Coinbase International, Binance) | BD |
| Activate staking pool | Operations |

### Phase 2 — DeFi (M6~M18)

| Task | Owner |
|---|---|
| Develop / audit / deploy veCCM | Blockchain dev team |
| Develop cDEX (Uniswap V4 hook) | DeFi team |
| Develop cLend | DeFi team |
| Develop cBond (Pendle-style) | DeFi team |
| LayerZero bridge to Ethereum | Infrastructure |
| The Graph subgraph | Data team |

### Phase 3 — Scale (M18~)

| Task | Owner |
|---|---|
| Deploy CCM Network L3 (app-specific rollup) | Infrastructure |
| cInsure | DeFi team |
| cUSD stablecoin (carbon-collateralised) | DeFi team |
| Cross-chain expansion (Solana, Arbitrum) | Infrastructure |
| Governance contract (CCMGovernor) | Blockchain dev team |

---

## Part 7 ─ Acceptance Criteria

### 7.1 Code Quality

- Solidity ^0.8.20
- Lint: solhint + prettier (zero warnings)
- Test coverage: ≥ 95% (statements, branches)
- Gas optimisation: gas usage measured and documented per function

### 7.2 Security audit

- 0 critical/high findings in the external audit report
- Medium findings have explicit mitigations + are resolved
- Low/informational findings are reviewed and explicitly accepted or rejected

### 7.3 Functional tests

| Test | Pass criterion |
|---|---|
| 5B hard cap | Mint above the cap reverts |
| Pause + transfer | Reverts |
| Vesting cliff (before) | release = 0 |
| Vesting cliff (after) | release proportional to time |
| Vesting revoke | Vested paid + remainder returned |
| Staking yield (P=P_TGE) | rate = 10% (cap) |
| Staking yield (P=2×P_TGE) | rate = 5% (1/2) |
| Pool exhausted | rate = 0 |
| Non-eligible stake | Reverts |
| TGE round | hardcap respected, out-of-window purchases revert |
| TGE claim | 0 before cliff, then proportional vest |

### 7.4 Performance benchmarks

| Function | Target gas |
|---|---|
| `transfer` | < 60K gas |
| `purchase` (TGE) | < 200K gas |
| `stake` | < 150K gas |
| `claim` (vesting) | < 100K gas |

### 7.5 Compliance sign-off

- [ ] VARA Cat 4 licence held
- [ ] US-persons-block KYC verified working
- [ ] OFAC list auto-block verified
- [ ] AML monitoring system operational
- [ ] External legal opinion (UAE + Korea + US Reg S compliance)

---

## Part 8 ─ Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Smart contract bug | Med | Critical | External audit + bug bounty + non-upgradeable |
| Oracle manipulation | Med | High | Multi-source + TWAP + Chainlink fallback |
| Regulatory change (VARA, SEC) | Med | High | External legal monitoring + multi-jurisdiction diversification |
| US persons bypassing the block | Low | Med | OFAC + IP block + reinforced KYC |
| Pool drains too early | Low | Low | Monitor pool usage + add funds if needed |
| Bridge hack | Med | High | Use audited LayerZero + transfer limits |

---

## Part 9 ─ Glossary

| Term | Definition |
|---|---|
| $CCM | CCM Network Token (utility) |
| cNFT | Carbon Credit NFT (1 ton = 1 NFT) |
| CCM Network ST | CCM Network Security Token (Reg D 506(c)) |
| Cohort A | TGE-time staker group |
| DePIN | Decentralised Physical Infrastructure Network |
| DRE | Destruction Removal Efficiency |
| FDV | Fully Diluted Valuation |
| ICVCM CCP | Integrity Council for the Voluntary Carbon Market — Core Carbon Principles |
| MRV | Measurement, Reporting, Verification |
| TGE | Token Generation Event |
| veCCM | vote-escrowed CCM (4-year lock) |
| VVB | Validation/Verification Body (DNV / SCS / Bureau Veritas, etc.) |

---

## Part 10 ─ Document Control

| Item | Content |
|---|---|
| Author | CCM Network Engineering Team |
| Reviewers | GreenScience Co. + CCM Network ADGM founders |
| Approver | Founders' Committee |
| Next review | 2 weeks before TGE |
| Change procedure | PR + signature from both parties |

---

# Part II ─ User-Facing Application Requirements

Part II defines the web/mobile interface requirements per stakeholder group.

---

## Part 11 ─ User Roles & Personas

### 11.1 User group definitions

| Role | Definition | Authentication level | Primary permissions |
|---|---|---|---|
| **Public Visitor** | Non-authenticated visitor | None | View public information |
| **Holder** | $CCM holder | Wallet connect | Balance, vesting, staking |
| **Investor (KYC)** | TGE / Series A participant | Wallet + KYC | Above + TGE purchase, claim |
| **Node Operator** | Container Node operator | Wallet + KYC + hardware registration | Above + Node operations + Mining |
| **Miner** | cNFT minting authority | Wallet + Operator certification | Above + cNFT mint, registry sync |
| **Compliance Officer** | KYC / AML personnel | Email + 2FA + Multisig | Approve KYC, handle alerts |
| **VVB / Auditor** | External verification body | API key + cert | Upload verification data, sign-off |
| **Admin (Operator)** | Operations team | Email + 2FA + Multisig | General operations, monitoring |
| **Super Admin** | Multisig signer | 3-of-5 Gnosis Safe | All contract admin permissions |

### 11.2 Per-persona core Job-to-be-Done

| Persona | Core task | Frequency |
|---|---|---|
| **Holder (individual investor)** | "How many tokens do I have?", "When does it unlock?", "What is my staking yield?" | Daily |
| **Holder (institution)** | "Compliance report export", "API integration", "Bulk claim" | Quarterly |
| **Node Operator** | "Check uptime", "Settle revenue", "Handle sensor alerts" | Daily |
| **Miner** | "Process cNFT mint queue", "Confirm registry sync", "Get VVB sign-off" | Daily |
| **Compliance** | "Process new KYC", "Review OFAC alerts", "Investigate suspicious AML activity" | Hourly |
| **VVB** | "Confirm site visit schedule", "Upload evidence", "Final sign-off" | Monthly |
| **Admin** | "Manage TGE round", "Approve multisig tx", "Quarterly report" | Weekly |

---

## Part 12 ─ Holder Pages (Web App)

### 12.1 Dashboard (Home)

**URL**: `/dashboard`
**Access**: After wallet connect

**Layout**:
1. **Top header** — wallet address, network, notifications, settings
2. **Portfolio summary cards (4)**
   - Total Balance ($CCM + USD equivalent)
   - Staked Amount + Pending Reward
   - Vesting Amount + Next Unlock Date
   - 24h Price Change
3. **Quick action buttons** — Stake / Unstake / Claim / Transfer
4. **Recent activity** (last 5 transactions)
5. **CCM Network price chart** (24h / 7d / 30d / 90d / 1y / All)
6. **Notification area** — upcoming vesting unlock, accumulated staking reward, etc.

**Functional requirements**:
| ID | Requirement |
|---|---|
| HD-1.1 | Wallet connect (MetaMask, WalletConnect, Coinbase Wallet, Ledger) |
| HD-1.2 | Live balance refresh (per block) |
| HD-1.3 | USD-equivalent display (oracle price) |
| HD-1.4 | Multi-wallet management (up to 5 simultaneously) |
| HD-1.5 | Mobile responsive (320px ~ 1920px) |
| HD-1.6 | Dark mode / Light mode |
| HD-1.7 | Korean / English / Japanese / Chinese |

### 12.2 Vesting Page

**URL**: `/vesting`

**Layout**:
1. **List of all of caller's vesting schedules**
   - Schedule ID
   - Category (Seed / Series A / Airdrop / etc.)
   - Total Allocated
   - Released (already withdrawn)
   - Vested (claimable)
   - Locked (not yet vested)
   - Cliff End Date
   - Vesting End Date
2. **Vesting curve chart** (Time vs Released)
3. **Claim button** — per-schedule or batch
4. **Transaction history**

**Functional requirements**:
| ID | Requirement |
|---|---|
| HD-2.1 | Auto-load caller's schedules (CCMVesting contract query) |
| HD-2.2 | Schedules before cliff are greyed out (not claimable) |
| HD-2.3 | Claim button enabled for vested portion |
| HD-2.4 | Claim transaction modal (gas display, progress) |
| HD-2.5 | Auto-refresh balance after claim |
| HD-2.6 | CSV export (for accounting) |

### 12.3 Staking Page

**URL**: `/staking`
**Access**: Eligible whitelist members only

**Layout**:
1. **Top pool info cards (3)**
   - Pool Remaining (X M of 200M, progress bar)
   - Current Yield Rate (monthly %, annualised %)
   - Estimated Pool Sunset (expected exhaustion)
2. **Caller's staking info**
   - Staked Balance
   - Pending Reward (live)
   - Total Earned (cumulative)
   - APR / APY
3. **Stake / Unstake form**
   - Input field + Max button
   - Approve → Stake 2-step
4. **Yield rate chart** (price-driven simulation)
5. **Caller's staking history**

**Functional requirements**:
| ID | Requirement |
|---|---|
| HD-3.1 | Eligibility check — non-eligible users see "You are not eligible for staking" |
| HD-3.2 | ERC-20 approve flow on stake (max-approve option to save gas) |
| HD-3.3 | Pending reward live refresh (every 10s) |
| HD-3.4 | Visualised pool remaining (progress bar + %) |
| HD-3.5 | Notify users when yield rate changes (10% → 5%, etc.) |
| HD-3.6 | When pool is exhausted, display 0% emission with explainer |
| HD-3.7 | Unstake is immediate (lock-up applied separately) |

### 12.4 Buy / Trade Page

**URL**: `/buy`

**Layout**:
1. **TGE purchase (active round)**
   - Seed @ $0.15 (time remaining + supply remaining)
   - Series A @ $0.20 (time remaining + supply remaining)
   - Purchase form: USDC input → CCM equivalent display
   - Lock-up & Vesting notice
2. **Public exchange links**
   - Coinbase International / Binance / Bybit / OKX
   - Display current price per exchange
3. **DeFi DEX integration** (Phase 2)
   - cDEX or Uniswap V3
   - Swap UI

**Functional requirements**:
| ID | Requirement |
|---|---|
| HD-4.1 | Auto-detect active round (based on current time) |
| HD-4.2 | Purchase form enabled only for KYC-approved users |
| HD-4.3 | Non-KYC users see "Please complete KYC" + link |
| HD-4.4 | USDC approve → purchase 2-step |
| HD-4.5 | Receipt after purchase (PDF + email) |
| HD-4.6 | Warning when nearing hardcap (≥ 90%) |
| HD-4.7 | Auto-disable purchase form when round ends |

### 12.5 veCCM Lock Page (Phase 2)

**URL**: `/veccm`

**Layout**:
1. **Current lock status**
   - Lock amount
   - Lock expiry
   - Voting power
   - Cumulative yield distribution
2. **Lock form**
   - Amount input
   - Lock duration (1 week ~ 4 years slider)
   - Voting-power preview
3. **Yield distribution claim**
4. **Governance voting interface** (Active proposals)

**Functional requirements** (Phase 2):
| ID | Requirement |
|---|---|
| HD-5.1 | Auto-compute voting power per lock duration |
| HD-5.2 | Allow lock extension (before expiry) |
| HD-5.3 | Yield distribution accrues weekly |
| HD-5.4 | Governance voting history |

### 12.6 Transaction History

**URL**: `/history`

| Column | Content |
|---|---|
| Date | Transaction timestamp |
| Type | Stake / Unstake / Claim / Transfer / Buy, etc. |
| Amount | $CCM amount |
| Counter-party | Counter-party address (if available) |
| Tx Hash | Block-explorer link |
| Status | Success / Pending / Failed |

**Functional requirements**:
| ID | Requirement |
|---|---|
| HD-6.1 | The Graph subgraph integration (off-chain indexed) |
| HD-6.2 | Filter by Type, Date range, Amount range |
| HD-6.3 | CSV export |
| HD-6.4 | Quarterly PDF report |

### 12.7 Settings & KYC

**URL**: `/settings`

| Section | Description |
|---|---|
| Profile | Name, email, nationality |
| KYC Status | Not started / Pending / Approved / Rejected |
| KYC Documents | Upload (on resubmission) |
| 2FA | Authenticator app, SMS, Email |
| Notification | Choose which events to receive notifications for |
| Wallets | Connected wallet list + add/remove |
| Tax Reports | Quarterly PDF download |
| API Keys | For external integrations (institutional) |

---

## Part 13 ─ Admin Pages (Web Console)

### 13.1 Admin authentication and access control

| Layer | Authentication |
|---|---|
| 1. Email + Password | Auth0 or self-hosted |
| 2. 2FA | Authenticator (TOTP) |
| 3. Wallet Signature | EIP-191 sign with connected wallet |
| 4. Role check | RBAC: Operator / Compliance / SuperAdmin |
| 5. Multisig (critical actions) | Gnosis Safe 3-of-5 |

### 13.2 Admin Dashboard

**URL**: `/admin`

**Layout**:
1. **System status** — active/paused state of every contract
2. **Key KPI cards**
   - Total Holders
   - Total Staked
   - Pool Used (%)
   - 24h Volume
   - Total Burned
   - TGE round progress
3. **Pending multisig tx** list
4. **Compliance alerts** (KYC pending, AML flag)
5. **Quick actions menu**

### 13.3 Token Management

**URL**: `/admin/token`

| Function | Description |
|---|---|
| Mint | MINTER_ROLE only, requires multisig + timelock |
| Pause / Unpause | Halt transfers in an emergency |
| Recover ERC20 | Recover mistakenly-sent tokens |
| Role Management | grant/revoke MINTER / PAUSER / ADMIN roles |
| Supply Statistics | Total / Circulating / Locked / Burned |

### 13.4 Vesting Management

**URL**: `/admin/vesting`

| Function | Description |
|---|---|
| Create Schedule | Create a new vesting schedule |
| Bulk Create | CSV upload for batch creation (Foundation, Partners, etc.) |
| Revoke | Revoke a revocable schedule |
| Schedule List | Search / filter / sort all schedules |
| Total Vested | Cumulative vested amount per category |

### 13.5 TGE Sale Management

**URL**: `/admin/tge`

| Function | Description |
|---|---|
| Create Round | Create a new round (price, hardCap, vesting config) |
| Round List | All rounds with status (Active / Closed) |
| Sales Statistics | Buyer count, average ticket, hardcap progress |
| Whitelist Management | Add/remove KYC-approved addresses (single or CSV) |
| USDC Withdrawal | Withdraw raised USDC (multisig) |
| Force Close | Force-close a round |

### 13.6 KYC Whitelist Management

**URL**: `/admin/kyc`

| Function | Description |
|---|---|
| Pending Review | Queue of new applicants |
| Approve / Reject | Process KYC decision (mandatory reason) |
| Bulk Approve | CSV upload for batch processing |
| Sanctions Check | Chainalysis / TRM auto-screening result |
| Reapply Queue | Resubmissions |
| Audit Trail | All processing history (immutable) |

### 13.7 Staking Pool Management

**URL**: `/admin/staking`

| Function | Description |
|---|---|
| Pool Status | Remaining, Used %, Estimated Sunset |
| Eligibility List | Whitelisted users + bulk add/remove |
| Yield Rate Monitor | Time-series chart |
| Oracle Status | Operational status of Chainlink / Custom oracle |
| Recover Remainder | Recover remaining pool after all users have unstaked |

### 13.8 Treasury Management

**URL**: `/admin/treasury`

| Function | Description |
|---|---|
| Reserves | Treasury holdings (USDC, $CCM, BUIDL, etc.) |
| Buyback Schedule | Weekly/monthly buyback automation |
| Burn Execution | Burn purchased $CCM (multisig) |
| Allocation | Manage BUIDL / USDY / other RWA weights |
| Yield Tracker | RWA asset yield |

### 13.9 Compliance Dashboard

**URL**: `/admin/compliance`

| Function | Description |
|---|---|
| AML Alerts | Chainalysis auto-flags |
| Sanctions | Users affected by OFAC list updates |
| Geographic Distribution | Holder distribution by nationality |
| Suspicious Transactions | Pattern-based suspicious activity |
| Regulatory Reports | Auto-generate VARA quarterly report |
| Audit Logs | Immutable record of all admin actions |

### 13.10 Analytics Dashboard

**URL**: `/admin/analytics`

| Chart | Description |
|---|---|
| Holders Growth | New holders per day/week/month |
| Volume Trend | 24h / 7d / 30d trading volume |
| Staking Trend | Total staked over time |
| Pool Drain | Pool exhaustion rate |
| Yield Rate Curve | Time series of yield rate |
| Burn Cumulative | Cumulative burn |
| Geographic Heatmap | Holder regional distribution |
| Sankey Flow | TGE → Lock → Burn → Liquid |

### 13.11 Multisig & Emergency

**URL**: `/admin/multisig`

| Function | Description |
|---|---|
| Pending Tx | Multisig transactions awaiting approval |
| Sign | Sign if you are a designated signer |
| History | Past multisig actions |
| Emergency Pause | Pause all contracts immediately (multisig) |
| Emergency Unpause | Resume from pause |
| Timelock Queue | Tasks queued in the timelock |

---

## Part 14 ─ Node Operator Pages

A Node Operator is the responsible party for a Container Node operated by GreenScience or a Local ProjectCo.

### 14.1 Node Registration Flow

**URL**: `/operator/register`

**Steps**:
1. **Eligibility check** — pass KYB (Know Your Business)
2. **Operating bond staking** — stake [   ]M $CCM (per operator)
3. **Hardware registration** — Container Node serial number, location (GPS), specifications
4. **IoT pairing** — sensor ID input, QR scan
5. **Hardware verification** — site visit by GreenScience tech team
6. **Approval** — operator status = "Active"

**Functional requirements**:
| ID | Requirement |
|---|---|
| OP-1.1 | New operators must be vouched for by a Local ProjectCo |
| OP-1.2 | Operating bond locked in a separate staking pool |
| OP-1.3 | Photo / video upload during hardware registration |
| OP-1.4 | GPS verified by lat/long + photo |
| OP-1.5 | After registration, issue an NFT-form "Node ID" |

### 14.2 Operator Dashboard

**URL**: `/operator/dashboard`

**Layout**:
1. **List of caller's nodes**
   - Node ID, Location, Status (Active/Maintenance/Offline)
   - 24h DRE, 24h cNFT issued, 24h $CCM rewarded
2. **Aggregate KPIs**
   - Total runtime
   - Cumulative cNFT issued
   - Cumulative $CCM received
   - Operating bond balance
3. **Notifications** — sensor alerts, maintenance needed, VVB schedule

### 14.3 Sensor & Hardware Status

**URL**: `/operator/node/{id}`

**Monitoring data**:
| Sensor | Data | Alert threshold |
|---|---|---|
| Temperature | °C, real-time | Alert if above threshold |
| Pressure | bar | Alert on abnormal change |
| Flow | L/min | Alert if below minimum |
| DRE | % (decomposition efficiency) | Alert if < 99% |
| Power | kW, kWh | Power-loss alert |
| GPS | Location | Alert if movement detected |

**Functional requirements**:
| ID | Requirement |
|---|---|
| OP-2.1 | Real-time dashboard (1s refresh) |
| OP-2.2 | 24h / 7d / 30d charts |
| OP-2.3 | Integrated alerts (SMS / Email / Slack / Telegram) |
| OP-2.4 | Maintenance mode — pause + reason logged |
| OP-2.5 | Data export (CSV, JSON) |

### 14.4 Mining & Earnings Tracker

**URL**: `/operator/earnings`

| Column | Content |
|---|---|
| Date | Day |
| Tons Processed | Waste tonnage processed |
| tCO2 Reduced | CO2 reduced |
| cNFT Minted | Number of cNFTs issued |
| $CCM Reward | $CCM reward |
| USD Equivalent | USD equivalent |
| Status | Pending / VVB Verified / On-chain |

### 14.5 VVB Submission Portal

**URL**: `/operator/vvb`

| Function | Description |
|---|---|
| Schedule | Date of next VVB site visit |
| Evidence Upload | Photos, videos, measurement data |
| Site Visit Log | VVB visit records |
| Past Audits | History of past verifications |
| Sign-off Status | Verified / pending / delayed |

### 14.6 Maintenance Portal

**URL**: `/operator/maintenance`

| Function | Description |
|---|---|
| Service Request | Request inspection from GreenScience tech team |
| Spare Parts Order | Order parts |
| Maintenance Log | History of maintenance |
| Hardware Replacement | Register replaced parts |
| Calibration Schedule | Manage sensor calibration cycles |

### 14.7 Operating Bond Management

**URL**: `/operator/bond`

| Function | Description |
|---|---|
| Current Bond | Currently staked $CCM |
| Required Bond | Minimum bond required per node |
| Top-up | Stake more |
| Slashing History | Slashes incurred from operational violations |
| Withdraw | Withdraw bond on operations end (after cooldown) |

---

## Part 15 ─ Mining Pages (cNFT Issuance)

Mining is the stage in which MRV-verified carbon credits are issued as cNFTs.

### 15.1 Mining Dashboard

**URL**: `/mining/dashboard`

**Layout**:
1. **Global mining statistics** (read-only)
   - Cumulative cNFT issued
   - Today / Week / Month issuance
   - Average price
   - VVB pending count
2. **Caller's ProjectCo mining queue** (operator-specific)
   - Carbon credits awaiting issuance
   - Awaiting VVB verification
   - Awaiting registry registration

### 15.2 Proof-of-Capture (PoC) Status

**URL**: `/mining/poc`

Tracks the path of each Container Node's decomposition data onto the chain.

| Stage | Content |
|---|---|
| Captured | IoT sensor data collection complete |
| Aggregated | Edge → Cloud aggregation complete |
| Hashed | Data hash generated |
| Committed | On-chain commit complete |
| VVB Verified | Verifier sign-off received |
| Mintable | Eligible for cNFT minting |

### 15.3 cNFT Minting Process

**URL**: `/mining/mint`

**Steps**:
1. **Select an eligible carbon batch** (verified only)
2. **Enter metadata** — project name, methodology, vintage, location, registry serial
3. **Preview** — IPFS metadata + image
4. **Mint** — multisig approval then on-chain mint
5. **Distribute** — deliver to Asset SPV (US) or cDEX pool

**Functional requirements**:
| ID | Requirement |
|---|---|
| MN-1.1 | Auto-confirm VVB verification status |
| MN-1.2 | Prevent registry serial number duplication |
| MN-1.3 | Upload metadata to IPFS |
| MN-1.4 | Multisig required to mint |
| MN-1.5 | Auto-deliver to Asset SPV or market after mint |

### 15.4 Registry Integration

**URL**: `/mining/registry`

Sync status with each international registry.

| Registry | Connection | Last Sync | Pending | Action |
|---|---|---|---|---|
| ACR | API | 2026-XX-XX | X items | Sync now |
| Verra | API | 2026-XX-XX | X items | Sync now |
| ICVCM CCP | Manual | 2026-XX-XX | X items | Upload PDF |
| KOC (Korea) | API | 2026-XX-XX | X items | Sync now |

### 15.5 VVB Verification Tracker

**URL**: `/mining/vvb`

| Column | Content |
|---|---|
| Batch ID | Carbon batch identifier |
| Project | Originating ProjectCo |
| Tons CO2 | Tonnes |
| VVB Assigned | DNV / SCS / Bureau Veritas |
| Status | Scheduled / In Progress / Completed |
| Sign-off Date | Completion date |
| Document | Verification report PDF |

### 15.6 Reward Distribution Tracker

**URL**: `/mining/rewards`

Tracks the $CCM reward distribution from cNFT issuance.

| Stage | Recipient | Share |
|---|---|---|
| Operator | Node operator | 50% |
| Foundation | Foundation pool | 20% |
| veCCM Stakers | veCCM holders | 20% |
| Treasury | Buyback fund | 10% |

### 15.7 Historical Mining Data

**URL**: `/mining/history`

| Function | Description |
|---|---|
| Time series | Daily / weekly / monthly mining trend |
| By Project | Per ProjectCo |
| By Methodology | ODS / HFC / Plastic, etc. |
| By Country | Per country |
| Export | CSV, PDF (for accounting) |

---

## Part 16 ─ Compliance Officer Pages

### 16.1 KYC Review Queue

**URL**: `/compliance/kyc`

**Workflow**:
1. Applicant submits via Sumsub / Persona
2. Show first-pass auto review result from Sumsub
3. Compliance officer reviews → Approve / Reject / Request More Info
4. On approval, admin triggers `setEligible()`

**Fields**:
- Applicant info (name, nationality, DoB)
- Submitted documents (passport, address, income)
- AML score (Chainalysis)
- Risk rating (Low / Medium / High)
- Notes (officer input)

### 16.2 AML Alert Dashboard

**URL**: `/compliance/aml`

| Alert type | Trigger |
|---|---|
| Large Transfer | Single transfer > $100K |
| Sudden Volume | 24h volume ≥ 10× the rolling average |
| OFAC Hit | Sender/recipient on OFAC list |
| Mixer | Tornado Cash or other mixing service detected |
| Sanctions Country | IP or wallet activity from a sanctioned country |

### 16.3 Regulatory Reporting

**URL**: `/compliance/reports`

| Report | Frequency | Recipient |
|---|---|---|
| VARA Quarterly | Quarterly | UAE VARA |
| US Reg S Annual | Annually | Internal records |
| K-FSC STO | Quarterly | Korea FSC |
| AUSTRAC (Australia) | Quarterly | (where applicable) |

Auto-generated → officer reviews → multisig approves → submit.

### 16.4 Audit Logs

**URL**: `/compliance/audit-logs`

Immutable log of all admin / compliance actions.

| Field | Content |
|---|---|
| Timestamp | UTC |
| User | Operator |
| Action | What was done |
| Target | Subject (user, transaction) |
| Reason | Reason |
| Hash | Hash of previous record → blockchain anchoring |

---

## Part 17 ─ VVB / External Auditor Portal

A separate portal for verification bodies (DNV, SCS, Bureau Veritas, etc.).

### 17.1 Verification Queue

**URL**: `/vvb/queue`

Verification jobs assigned to this verifier.

### 17.2 Site Visit Schedule

**URL**: `/vvb/schedule`

| Function | Description |
|---|---|
| Calendar | Monthly schedule |
| Site Locations | Map of all ProjectCos |
| Scheduling | Coordinate scheduling with operators |

### 17.3 Evidence Portal

**URL**: `/vvb/evidence`

Review evidence submitted by operators for verification.

### 17.4 Sign-off Portal

**URL**: `/vvb/signoff`

On final verification, sign cryptographically → record on-chain.

| Function | Description |
|---|---|
| Verification Cert | PDF upload + IPFS |
| On-chain Sign-off | EIP-712 signature → smart contract record |
| Methodology | Methodology declared |
| Tons Verified | Verified tonnage |

---

## Part 18 ─ Mobile App Considerations

### 18.1 iOS / Android app

**Phase 1**: PWA (Progressive Web App)
- Mobile-compatible PWA covering all web features
- WalletConnect integration

**Phase 2**: Native app
- React Native
- Push notifications (vesting unlock, staking reward, KYC outcome)
- Biometric auth (Face ID, fingerprint)
- Apple Pay / Google Pay integration (USDC payment)

### 18.2 Operator mobile app (separate)

A mobile app dedicated to Container Node operators.

| Function | Description |
|---|---|
| Real-time monitoring | Sensor alert push |
| Quick actions | Toggle maintenance |
| Earnings dashboard | $CCM receipt history |
| Site photos | Upload inspection photos |
| QR scan | Spare-parts inventory |

---

## Part 19 ─ API & Integration Requirements

### 19.1 Public API (read-only)

**Base URL**: `https://api.ccm.earth/v1`

| Endpoint | Description |
|---|---|
| `GET /token/info` | Token info (supply, holders, price) |
| `GET /token/holders` | Top holder list |
| `GET /token/transfers` | Recent transfers |
| `GET /staking/info` | Staking pool status |
| `GET /staking/yield` | Current yield rate |
| `GET /vesting/schedule/{address}` | Vesting for the given address |
| `GET /tge/rounds` | All TGE rounds |
| `GET /mining/cnfts` | Issued cNFT list |

### 19.2 Authenticated API (Holder)

**Auth**: API Key + Wallet signature

| Endpoint | Description |
|---|---|
| `GET /me` | Caller info |
| `GET /me/balance` | Caller balance |
| `GET /me/vesting` | Caller vesting |
| `GET /me/staking` | Caller staking |
| `GET /me/transactions` | Caller transactions |
| `POST /me/claim/{scheduleId}` | Trigger claim |

### 19.3 Webhook (subscriptions)

| Event | Payload |
|---|---|
| `transfer` | Transfer involving caller's wallet |
| `vesting.unlock` | Cliff reached |
| `staking.reward` | Reward accrual reaches threshold |
| `kyc.status_changed` | KYC outcome changed |
| `tge.round_started` | New round started |
| `price.alert` | Price threshold hit |

### 19.4 GraphQL Subgraph (The Graph)

**URL**: `https://api.thegraph.com/subgraphs/name/ccm/main`

All on-chain events indexed by subgraph for fast querying.

### 19.5 SDKs

| Language | Use |
|---|---|
| JavaScript / TypeScript | Web app, mobile |
| Python | Data analysis, institutional |
| Go | Backend integration |
| Rust | High-performance integration |

---

## Part 20 ─ Localisation (i18n)

### 20.1 Supported languages

| Language | Priority | Timing |
|---|---|---|
| Korean (ko) | P0 | TGE |
| English (en) | P0 | TGE |
| Japanese (ja) | P1 | TGE +3mo |
| Chinese Simplified (zh-CN) | P1 | TGE +3mo |
| Chinese Traditional (zh-TW) | P2 | TGE +6mo |
| Vietnamese (vi) | P2 | TGE +6mo |
| Indonesian (id) | P2 | TGE +6mo |
| Arabic (ar) | P2 | TGE +6mo (UAE operations) |

### 20.2 RTL support

Auto-switch to RTL (Right-to-Left) layout for Arabic / Hebrew, etc.

### 20.3 Currency display

| Currency | Use |
|---|---|
| USD | Default |
| KRW | Korean users |
| AED | UAE users |
| EUR | EU users |
| JPY, CNY | Respective users |

---

## Part 21 ─ Accessibility (a11y)

### 21.1 Standards

- **WCAG 2.1 Level AA** or higher
- Full keyboard navigation
- Screen reader (NVDA, JAWS, VoiceOver) compatibility
- Colour contrast 4.5:1 minimum (text), 3:1 minimum (UI)

### 21.2 Visual impairment support

- Alt text for every image
- ARIA labels on all interactive elements
- Visible focus indicator

### 21.3 Hearing impairment support

- Subtitles on every video
- Notifications surface visually + audibly + via vibration

---

## Part 22 ─ Updated Document Control

| Item | Content |
|---|---|
| Author | CCM Network Engineering Team |
| Reviewers | GreenScience Co. + CCM Network ADGM founders + UX team + Compliance team |
| Approver | Founders' Committee |
| Next review | 2 weeks before TGE |
| Change procedure | PR + signature from both parties |

| Part | Estimated pages | Priority |
|---|---|---|
| Part I (Backend / Smart Contract) | Parts 1-10 | P0 |
| Part II (User Apps) | Parts 11-21 | P0 (some P1) |

**Development priorities (TGE-relative)**:
1. **Just before TGE (P0)**: Holder Dashboard, Vesting, Staking, Buy, Settings, Admin (TGE/KYC/Token), Compliance KYC Review
2. **Just after TGE (P1)**: Operator Dashboard, Mining Dashboard, Audit Logs, Public API
3. **TGE +3mo (P2)**: VVB Portal, veCCM, Mobile App, Webhooks
4. **TGE +6mo (P3)**: Native Mobile, RTL languages, advanced analytics

---

## Appendix A ─ Quick reference

### A.1 Key numbers
- Total supply: 5B / 18 decimals
- TGE sale: 200M @ avg $0.183 → $36.5M
- Staking pool: 200M (4% of supply)
- Y10 base price: $1.73 (11.5× appreciation)
- Cohort A ROI (Seed): 16×

### A.2 Key ratios
- Mining rewards: 40% (10-year vesting)
- User/ecosystem allocation: 60%+
- Company allocation: ≤ 25%
- Capital raise: ≤ 13%
- Buyback-burn rate: 6% of carbon revenue
- Lock-up at maturity: 65% (veCCM 45% + Stake 20%)

### A.3 Key timing
- Seed cliff: 12 months
- Series A cliff: 6 months
- Foundation cliff: 12 months
- Partners cliff: 24 months
- Expected staking pool drain: 4-6 months
