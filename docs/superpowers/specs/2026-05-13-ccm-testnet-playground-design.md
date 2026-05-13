# CCM Testnet Playground Design Spec

**Date**: 2026-05-13
**Status**: Draft for review
**Owner**: james.lee@finenex.net
**Target domain**: `testnet.ccmnetwork.net` (Cloudflare Pages project: `ccm-testnet`)
**Network**: Base Sepolia (chainId 84532) — single chain build

---

## 1. Goal

Replace the current `testnet.ccmnetwork.net` content — which is a mirror of the `ccmnetwork.net` marketing site — with a hands-on playground where prospective investors and general evaluators can experience the CCM Network ecosystem end-to-end in 5–15 minutes. The user-facing flow is:

> **Mine a carbon-credit NFT → Wrap it into CCM → Stake CCM → Claim reward**

All on Base Sepolia, with sandbox tokens that have no real value.

## 2. Out of scope

- Mainnet integration. The playground is single-chain (Sepolia only).
- KYC, vesting, OTC distribution. Investor-facing portal work belongs to `portal.ccmnetwork.net`.
- Full coverage of every sandbox contract. Lending / Yield / Index Basket / Retire-to-Earn are referenced in a "Try more" section but not interactive in this spec (Phase 2 follow-up).
- Server-side state. Everything is on-chain; the SPA only reads/writes via wagmi.

## 3. Users

Primary user: a prospective investor / general evaluator who has heard of CCM Network and wants to see how it actually works. Assumed wallet skill: knows MetaMask basics; not necessarily comfortable with raw contract addresses. Wants a guided, sequential, one-page experience with clear status and friendly error messages.

Secondary user: internal team and partners using the same site for demos.

Not the audience: DeFi power users hunting raw contract function surface (they can read BaseScan directly).

## 4. Architecture

```
testnet.ccmnetwork.net  (Cloudflare Pages: ccm-testnet)
        │
        ▼
    SPA: testnet/
        Vite + React + wagmi + RainbowKit
        Base Sepolia hardcoded (chainId 84532)
        i18n: Korean (default) + English
        │
        ▼
    Sepolia sandbox contracts:
        CCMSandboxNFT          (Step 1: mint carbon credit ERC-1155)
        CCMSandboxVault        (Step 2: wrap NFT → CCM 1:1)
        CCMSandboxStaking (NEW) (Steps 3, 4: stake / claim / unstake)
        CCMToken (sandbox)     (balance + approval)
        MockPriceOracle (NEW)  (CCM/USD oracle for yield rate)
```

The marketing testnet mirror is intentionally retired by this work — `testnet.ccmnetwork.net` after deploy serves only the playground.

## 5. Page structure (single page, vertical scroll)

```
┌──────────────────────────────────────────────┐
│ Nav: ccm testnet wordmark · theme · 🌐 KO/EN │
├──────────────────────────────────────────────┤
│ Hero                                          │
│  "Experience CCM on Base Sepolia."            │
│  "Mine, wrap, stake, earn."                   │
│  ⚠ Testnet — tokens have no real value.       │
├──────────────────────────────────────────────┤
│ Wallet status (sticky)                        │
│  [Connect] OR  0xABCD…1234 · Sepolia          │
├──────────────────────────────────────────────┤
│ STEP 1 / 4 — Mine a Carbon Credit             │
│  Grade [A▼] Vintage [2026▼] Tonnage [50]      │
│  [Mine]  (or cooldown 47:23)                  │
│  Your NFTs: #41 A 2026 50t  [Wrap]            │
├──────────────────────────────────────────────┤
│ STEP 2 / 4 — Wrap NFT → CCM                   │
│  1 tonne = 1 CCM (FIFR: D→C→B→A)              │
│  [Wrap selected]  (5 NFT/tx cap)              │
│  Your CCM balance: 350.00                     │
├──────────────────────────────────────────────┤
│ STEP 3 / 4 — Stake CCM                        │
│  Amount: [200] [Max] · APY: 12% (testnet)     │
│  [Approve & Stake] (2 tx)                     │
│  Your stake: 200 CCM                          │
├──────────────────────────────────────────────┤
│ STEP 4 / 4 — Claim Reward                     │
│  Pending: 0.045 CCM (live↑)                   │
│  [Claim]  [Unstake]                           │
├──────────────────────────────────────────────┤
│ Try more (placeholder cards)                  │
│  Lending · Yield · Basket · Retire (soon)     │
├──────────────────────────────────────────────┤
│ Footer: contract addresses + BaseScan links   │
│         portal.ccmnetwork.net · github link   │
└──────────────────────────────────────────────┘
```

### Step gating policy

The 1/2/3/4 numbering is a narrative cue, not a hard gate. As long as the wallet is connected to Sepolia, every step is independently interactive. A user who already has CCM (e.g., from the existing `CCMSandboxFaucet`) can jump straight to Step 3 without first mining and wrapping.

### Sticky behaviour

The Wallet status bar is sticky-top so the connection state is visible at every scroll position. When a transaction is pending, a sticky toast surfaces in the bottom-right with a BaseScan link.

## 6. Components

Twelve components, each with a single clear responsibility. Keeping each component focused makes them easier to reason about, edit, and replace independently.

| Component | Responsibility |
|---|---|
| `<TestnetLayout>` | Page chrome — nav, footer, testnet banner |
| `<WalletStatusBar>` | One of three states: not-connected / wrong-chain / connected-on-Sepolia |
| `<StepCard>` | Reusable card — title, "Step N / 4" badge, status pill, slotted body |
| `<MintForm>` | Step 1 — grade / vintage / tonnage inputs + Mine button |
| `<CooldownTimer>` | hh:mm:ss countdown, 1 sec interval, reads `mintCooldown(user)` once and decrements client-side |
| `<NFTInventory>` | User's owned sandbox NFTs, each with per-row Wrap action |
| `<WrapForm>` | Step 2 — multi-select NFTs + Wrap button, honouring 5-NFT/tx cap |
| `<StakeForm>` | Step 3 — amount input, automatic Approve-then-Stake two-step |
| `<RewardPanel>` | Step 4 — pending reward live update (5s poll), Claim button, Unstake action |
| `<TxToast>` | tx pending/success/failed notifications with BaseScan link |
| `<TryMoreGrid>` | 4 placeholder cards (Lending / Yield / Basket / Retire) — disabled, "coming soon" |
| `<ContractInfoFooter>` | Listed contract addresses + explorer links + "this is testnet" note |

## 7. On-chain wiring

Per step, the contract functions called and the read queries the UI polls.

### Step 1 — Mine (`CCMSandboxNFT`, `0xbC3EAc7514F82A868807b81b165D2121495380E9`)

```
write   mint(uint8 grade, uint16 vintage, uint16 tonnage, bytes32 projectId)
        // 1-hour cooldown per address; returns sequential ERC-1155 token id
read    meta(uint256 id) → { grade, vintage, tonnage, projectId, minter }
read    balanceOf(address, uint256 id) → uint256
read    mintCooldown(address) → uint256  (next allowed timestamp)
```

`projectId` is a `bytes32` parameter on the contract. The UI sets it to `keccak256("ccm-testnet-playground")` for every mint (one constant). The contract does not enforce uniqueness so this is fine.

### Step 2 — Wrap (`CCMSandboxVault`, `0xEd62b71e9ff0200CFf02C8F38618Af153C609334`)

```
prep    nft.isApprovedForAll(user, vault)               // check approval
prep    nft.setApprovalForAll(vault, true)              // one-time, if not yet
write   vault.wrap(uint256[] nftIds, uint256[] amounts) // ≤ 5 NFTs per tx
read    vault.reserves() → uint256                       // total tonnage held by vault
```

The UI inspects approval state first and inserts the approval tx automatically before the user's first wrap.

### Step 3 — Stake (`CCMSandboxStaking`, **new contract to deploy**)

```
prep    ccmToken.allowance(user, staking) ≥ amount      // check approval
prep    ccmToken.approve(staking, MAX_UINT256)          // one-time, if not enough
write   staking.stake(uint256 amount) nonReentrant
read    staking.users(address) → UserInfo { staked, ... }
read    staking.currentYieldRateBps() → uint256
read    staking.totalStaked() → uint256
read    staking.poolUsedPct() → uint256
```

### Step 4 — Claim / Unstake (same contract)

```
read    staking.pendingReward(address user) → uint256   // 5s poll for live UI
write   staking.claim() nonReentrant
write   staking.unstake(uint256 amount) nonReentrant    // returns principal (+ claim)
```

### Data flow

```
user → wallet → eth_sendTransaction → Base Sepolia RPC → contracts
                                                          ↓
UI ← wagmi useReadContract (5 s polling) ← eth_call ──────
   (balances, NFT list, pendingReward, cooldown, yield rate)
```

## 8. New contracts to deploy

### `CCMSandboxStaking.sol` (new)

A sandbox-only variant of `CCMStaking.sol`. The mainnet contract gates `stake()` on a whitelist via `eligible[msg.sender]`; the sandbox variant removes this gate so any wallet can stake without admin intervention. All other mechanics — 10%/month max yield decaying with pool exhaustion, `claim`, `unstake`, oracle dependency — are preserved.

Source approach: a new file under `onchain/contracts/sandbox/CCMSandboxStaking.sol` that copies the staking logic and drops the `require(eligible[msg.sender], ...)` line. Not inheritance, since the gate is hardcoded inside a require — copy with the require removed is simpler and the sandbox file's purpose is explicit in its name.

### `MockPriceOracle` deployment

Already exists at `onchain/contracts/mocks/MockPriceOracle.sol`. Deploy a fresh instance for the playground with `price = $0.20` (CCM/USD in 18 decimals). `CCMSandboxStaking` references this for `currentYieldRateBps()` calculations.

### Initial pool funding

After deploy, the operator mints 5M CCM from the sandbox token and transfers it to `CCMSandboxStaking`'s reserve pool. When `poolRemaining` falls below 1M (yield decays as pool empties), the operator tops up. Monitoring is BaseScan or a simple log-scrape script; not in scope for v1.

## 9. i18n

- Library: i18next (same configuration as `frontend/src/lib/i18n.ts`)
- Languages: Korean (default) and English
- File layout: `testnet/src/locales/{en,ko}.json`
- Namespace per step group: `nav`, `hero`, `wallet`, `step1`, `step2`, `step3`, `step4`, `tryMore`, `footer`, `errors`
- Switcher: `<LanguageSwitcher>` in the nav, choice persisted in localStorage
- All user-facing strings live in the locale files; no hardcoded text in component bodies

## 10. Style

- Design tokens import the CSS variables from `frontend/src/index.css` (paper, ink, moss, rule, etc.) so the brand palette is the same as the live marketing site
- Wordmark: port `frontend/src/components/brand/Wordmark.tsx` into `testnet/src/components/brand/Wordmark.tsx` (or move into a shared package if monorepo refactor lands first)
- Tailwind: same `@tailwindcss/vite` 4.x setup
- Theme: dark/light via the same `ThemeProvider` pattern used by `frontend/` and `portal/`
- Testnet warning: a persistent yellow banner immediately under the hero — "⚠ Base Sepolia testnet — tokens have no real value"

## 11. Error handling matrix

| Trigger | UI response |
|---|---|
| Wallet not connected | Steps grey out with "Connect wallet to start" hint |
| Wrong chain | Sticky bar shows "Switch to Base Sepolia" + auto-switch attempt |
| Mint cooldown active | Mine button disabled + countdown ("Mine again in 47:23") |
| Inventory empty (Step 2) | Step 2 body: "Mine some carbon credit first" + anchor link to Step 1 |
| Insufficient CCM balance (Step 3) | Stake button disabled + "Wrap NFTs first to get CCM" |
| Approval not granted | Stake button label becomes "Approve" → after approval, becomes "Stake" automatically |
| Staking pool exhausted (`poolRemaining` = 0) | Banner on Step 3: "Pool exhausted — testnet refresh needed" (operator-side issue) |
| RPC transient failure | Toast: "Network error, retrying…" with three auto-retries |
| User rejects in wallet | Toast: "Transaction cancelled" (grey, no error styling) |
| Tx reverted on-chain | Toast: revert reason + BaseScan tx link |

## 12. Testing

| Level | Tool | Coverage |
|---|---|---|
| Contract unit | Hardhat | `onchain/test/sandbox/CCMSandboxStaking.test.ts` — stake / unstake / claim, yield decay edge cases, pool exhaustion behaviour |
| Type check | tsc | Compile-time validation across all of `testnet/src/` |
| E2E | Playwright | `testnet/e2e/playground.spec.ts` — connect → mine → wrap → stake → claim. Test wallet seeded with Sepolia ETH from a public faucet |
| Local smoke | `vite dev` | Manual click-through before each deploy |

Component-level unit tests are deferred. Coverage from the e2e walk-through is sufficient given the small surface and the contract layer's existing testing.

## 13. Deployment sequence

1. Deploy `CCMSandboxStaking` and `MockPriceOracle` to Sepolia via `scripts/deploy-sandbox-staking.ts` (new). BaseScan verify both. Update `onchain/DEPLOYMENT.md` sandbox section with addresses + verify links + initial state snapshot.
2. Fund the staking pool — admin mints 5M sandbox CCM and transfers to `CCMSandboxStaking`. Record the tx in DEPLOYMENT.md.
3. Replace `testnet/` source — remove the legacy 3-page SPA (Home / Demo / About), add the 12 components + single-page App. Wire env via `testnet/.env`.
4. Build (`vite build`) and deploy (`wrangler pages deploy dist --project-name=ccm-testnet --branch=main`). `testnet.ccmnetwork.net` switches over.
5. Verify on live: connect wallet, click through all 4 steps, confirm one successful tx per step.

The marketing-mirror content that currently lives at `testnet.ccmnetwork.net` disappears at step 4. Footer of the new playground links back to `ccmnetwork.net` for users who land there expecting marketing.

## 14. Pool top-up operational notes

The yield rate in `CCMSandboxStaking` is `R0 × (P_TGE / P) × (poolLeft / poolInit)`. Reward emissions are bounded by `poolRemaining`. When `poolRemaining` approaches zero, yield trends to zero and new stakers stop accruing meaningfully.

For ongoing testnet UX:
- Initial seed: 5M CCM
- Trigger: when `poolRemaining < 1M`, operator tops up 5M
- Mechanism: admin mints sandbox CCM, transfers directly to the staking contract
- Frequency expectation: highly variable, depends on traffic. Initial estimate: refresh every 1–3 months once usage is steady

This is a manual operator task. Automation deferred until the playground proves it's actively used.

## 15. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| New `CCMSandboxStaking` introduces a regression vs `CCMStaking` | Medium | Medium | Copy-with-removal pattern is small (one line). Unit tests mirror `CCMStaking`'s coverage. |
| User connects to mainnet by mistake and gets confused | Low | Low | Sticky bar enforces Sepolia; switch button prominent |
| RPC issues on the public Sepolia endpoint | Medium | Low | Use CDP-backed Sepolia RPC (same key namespace as mainnet, configured in `.env`) |
| Marketing-site traffic that lands on `testnet.ccmnetwork.net` after the switch loses context | Low | Low | Footer link back to `ccmnetwork.net`; over time, search indexes will catch up |
| `MockPriceOracle` returns a stale price and yield rate computes oddly | Low | Low | Fix price at $0.20 (testnet — it doesn't need to track real CCM price) |
| Pool exhaustion before operator notices | Medium | Low | Step 3 surfaces "Pool exhausted" banner directly to users; operator script can poll BaseScan |

## 16. Open questions

1. **Shared package for brand assets**: should we factor `Wordmark.tsx` and design tokens into a shared package consumed by `frontend/`, `portal/`, `admin/`, and `testnet/`? Doing it now adds plan scope; deferring it duplicates the wordmark. Recommendation: copy for now, refactor in a separate cleanup pass.
2. **Initial yield rate display**: yield is time-decayed and varies with `pool`/`price`. The "12%" example in mockups is the maximum (R0). Should the UI show "up to 12%" or the live computed rate? Recommendation: show the live rate from `currentYieldRateBps()` with a tooltip explaining decay.
3. **Cooldown across reloads**: NFT mint cooldown is on-chain (`mintCooldown(user)`), so it survives reloads naturally. The client-side timer only needs to fetch once and decrement locally. Confirmed — no localStorage required.
