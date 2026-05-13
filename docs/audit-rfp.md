# CCM Network — external audit pre-engagement package

> **Audience**: external smart-contract audit firms preparing a quote.
> **Doc owner**: CCM Network engineering. Send questions to `security@ccmnetwork.net`.
> **Snapshot date**: 2026-05-09. Stats below match commit on this date.
> **Target engagement**: pre-mainnet review, Phase 0 deploy on Base (chainId 8453).

---

## TL;DR — for the firm's first read

CCM Network is a tokenized carbon-credit project preparing its Phase 0
mainnet deploy on Base. We're seeking a primary external audit on **7
Solidity contracts**, ~**820 LOC** (non-blank, non-comment), built on
OpenZeppelin Contracts v5. The codebase is moderate complexity — no AMM,
no oracles, no exotic math — but it touches user funds (USDC for sale,
CCM for distribution) and has a $5B-cap supply.

| Number | Value |
|---|---|
| Mainnet contracts in scope | 7 |
| Solidity LOC (in-scope, non-blank-non-comment) | ~820 |
| Solidity LOC (in-scope, raw including comments) | ~1,054 |
| Test files | 23 |
| Test LOC | ~4,789 |
| Tests passing | 370 / 370 |
| Slither status (0.11.5) | Re-validated 2026-05-09; 0 High, 3 Medium (carryover, documented), 14 Low (timestamp), 8 Informational |
| Compiler | Solidity 0.8.24, optimizer 200 runs, evmVersion `cancun` |
| Target chain | Base mainnet (8453) — pre-deploy |
| Deployment safety | OZ Timelock 48 h + Gnosis Safe 3-of-5 + non-upgradeable |
| Bug bounty | $500 K cap drafted (`onchain/BUG_BOUNTY.md`), goes live with mainnet |
| Pre-flight rehearsal | Full mainnet handoff already proven on Base Sepolia 2026-05-09 — Safe → Timelock → grantRole flow |

We've already (a) shipped a 322 → 370 test suite, (b) re-run Slither on
the renamed sources, (c) deployed and rehearsed the Safe + Timelock +
KYCRegistry handoff on Base Sepolia. The audit is the last quality gate
before the Phase 0 mainnet deploy.

---

## What we're asking for

Please send a written quote covering:

1. **Engagement scope** — which contracts you'll cover (we expect all 7).
2. **Quote (USD)** — primary review fee.
3. **Timeline** — earliest possible start date and duration in
   calendar days.
4. **Team composition** — number of auditors, and the **named lead
   auditor** if your model is engagement-by-engagement (Spearbit,
   Cantina). For firm-led models (OpenZeppelin, Trail of Bits), the
   senior reviewer's name and number of years in EVM auditing.
5. **Sample report** — one comparable engagement (similar size /
   ERC-20 + vesting + sale pattern) so we can calibrate depth.
6. **Fix-verify rounds** — fee structure for re-review of patched
   issues. Inclusive or per-round.
7. **Public report** — your default policy, and the cost delta if we
   ask for a public report (we want one).
8. **Engagement model** — Markdown report, narrative report, both?
   Severity scheme (CVSS, your own, Immunefi-aligned)?
9. **NDA template** — your standard, or you'll review ours.

---

## Project overview

**One-paragraph pitch**: CCM Network bridges high-quality voluntary carbon
credits (DAC, biochar, reforestation, REDD+) into on-chain ESG-grade
financial primitives. Phase 0 is the Token Generation Event (TGE): we
sell CCM to KYC-cleared SAFT investors via a multi-round sale, lock the
allocations into a vesting contract with cliff + linear release, and
provide an opt-in early-investor staking program. The smart contracts in
scope below are the Phase 0 surface — what touches user funds and
allocates supply pre-mainnet.

The DeFi primitives that ride on top of CCM (NFT-collateralised lending,
fractionalisation, retire-to-earn rebates, etc.) are **out of scope** —
they live in `onchain/contracts/sandbox/*` and are explicitly testnet-only,
guarded by `block.chainid != 8453` constructor reverts. This audit covers
*only* the Phase 0 token + distribution + governance layer.

**Key invariants** (please verify):

- `CCMToken.totalSupply` ≤ `cap` (5,000,000,000 × 1e18) at all times.
- `MINTER_ROLE` is held only by contracts whose minting paths are
  themselves bounded by `cap`.
- `CCMVesting.releasable(id)` monotonically non-decreasing in time before
  revocation.
- `CCMTGESale.buy()` cannot oversell a round's `hardCapTokens`.
- `CCMTimelock.MIN_DELAY` (48 h) is enforced for every privileged op on
  mainnet — there is no on-chain path to bypass it short of `updateDelay`,
  which itself goes through the timelock (we have a test for this).
- After the post-deploy renounce sequence, the deployer EOA holds **zero**
  privileged roles on **any** in-scope contract.

---

## In-scope contracts

Sources at `onchain/contracts/`. Compiler `0.8.24`, optimizer 200, evmVersion `cancun`.

| # | Contract | LOC (raw / non-blank-non-comment) | OZ deps | Risk surface |
|---|---|---|---|---|
| 1 | `CCMToken.sol` | 87 / 68 | `ERC20`, `ERC20Burnable`, `ERC20Capped`, `ERC20Pausable`, `ERC20Permit`, `AccessControl` | Token cap, role layout, pause hook ordering, permit replay. |
| 2 | `CCMVesting.sol` | 206 / 178 | `IERC20`, `SafeERC20`, `AccessControl`, `ReentrancyGuard` | Linear-with-cliff math, revocation accounting, reentrancy on `release()`, batch creation. |
| 3 | `CCMStaking.sol` | 215 / 151 | `IERC20`, `SafeERC20`, `AccessControl`, `ReentrancyGuard` | Eligibility-gated stake/unstake, reward accrual, donation-attack resistance. |
| 4 | `CCMTGESale.sol` | 214 / 165 | `IERC20`, `SafeERC20`, `AccessControl`, `ReentrancyGuard` | Multi-round state, USDC accounting, KYC gating, hardcap enforcement, vesting hand-off. |
| 5 | `CCMMigration.sol` | 159 / 124 | `IERC20`, `SafeERC20`, `AccessControl`, `ReentrancyGuard` | One-shot v1 → v2 atomic burn/mint, opt-in, deadline window, MINTER_ROLE bounds. |
| 6 | `CCMTimelock.sol` | 50 / 40 | `TimelockController` (OZ governance) | 48 h floor enforcement on `chainid` 8453/84532; subclass correctness. |
| 7 | `CCMKYCRegistry.sol` | 123 / 94 | `AccessControl` | Two-role split (operator hot, admin slow), batch ops, count consistency. |
| **Total** | **7 contracts** | **~1,054 / ~820** |

`CCMMigration` is deployed *only* if external audit identifies a critical
issue requiring a v2. Audit it as live code, but its mainnet deployment
is conditional.

---

## Out of scope

Please do **not** spend audit hours on the following — they are either
testnet-only, mocks, or known-design centralisation:

- **Sandbox primitives** at `onchain/contracts/sandbox/*` (faucet, NFT,
  lending, fractionalizer, yield, insurance, baskets, rebate, vault,
  grade-wrappers). These have a `chainid != 8453` constructor revert
  baked in. They are part of the testnet UX, not the mainnet token surface.
- **Mocks** at `onchain/contracts/mocks/*` (`MockUSDC`, `MockPriceOracle`,
  `ReentrantToken`) — test-only.
- **Frontend** (`testnet/`, `portal/`, marketing site) — separate concern,
  not Solidity.
- **Off-chain backend** (`portal-api/`) — Cloudflare Worker, separate scope.
- **Centralisation by design**: the Safe + Timelock can pause the token
  and revoke roles. This is intentional and documented; please flag it
  as a centralisation note rather than a finding.

---

## Architecture & flows

### Deploy + handoff sequence

```
1. Deployer EOA deploys, in this order:
     CCMToken    → admin = deployer (DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE)
     CCMVesting  → admin = deployer (DEFAULT_ADMIN_ROLE, SCHEDULE_MANAGER_ROLE)
     CCMStaking  → admin = deployer
     CCMTGESale  → admin = deployer
     CCMKYCRegistry → admin = deployer (DEFAULT_ADMIN_ROLE), operator = Safe (KYC_OPERATOR_ROLE)
     CCMTimelock → proposers/executors = [Safe], admin = address(0)

2. Wire roles between contracts:
     Token.grantRole(MINTER_ROLE, Vesting)
     Token.grantRole(MINTER_ROLE, TGESale)
     ... etc.

3. Hand off admin to the Timelock (per privileged contract):
     Token.grantRole(DEFAULT_ADMIN_ROLE, Timelock)
     Token.grantRole(PAUSER_ROLE, Timelock)
     Vesting.grantRole(DEFAULT_ADMIN_ROLE, Timelock)
     Vesting.grantRole(SCHEDULE_MANAGER_ROLE, Timelock)
     KYCRegistry.grantRole(DEFAULT_ADMIN_ROLE, Timelock)
     ... etc.

4. Deployer renounces every role they held (non-admin first, admin last).

5. Final state:
     - Deployer EOA: zero privileged roles anywhere.
     - Safe (3-of-5): can propose/cancel/execute Timelock operations only.
       Can flip KYC status directly (operator role, no timelock — daily ops).
     - Timelock (48h): can grant/revoke any role on any in-scope contract,
       can pause/unpause Token, can manage Vesting schedules.
     - Anyone: can read all view functions; can call beneficiary functions
       (Vesting.release, TGESale.buy if KYCed, etc.) according to their state.
```

This sequence has been **rehearsed end-to-end on Base Sepolia 2026-05-09**;
artefacts are documented in `onchain/DEPLOYMENT.md` (search "Mainnet
pre-flight rehearsal").

### Money flow (Phase 0 SAFT round)

```
USDC investor                     Sale contract           Vesting contract        Investor
     |                                  |                       |                    |
     |  setWhitelist(round, investor)   |                       |                    |
     |<--- (admin, pre-KYC) -----------+|                       |                    |
     |                                  |                       |                    |
     |  approve(USDC, sale, X)          |                       |                    |
     |--+ buy(round, ccmAmount) ------->|                       |                    |
     |                                  |                       |                    |
     |              SafeERC20.transferFrom(USDC, investor → sale, USDC needed)        |
     |                                  |                       |                    |
     |                                  |  Token.mint(vesting, ccmAmount)             |
     |                                  +---------------------->|                    |
     |                                  |  Vesting.createSchedule(investor, ...)      |
     |                                  +---------------------->|                    |
     |                                  |                       |                    |
     |                                  |                       |  release()         |
     |                                  |                       |<-------------------+
     |                                  |                       |                    |
     |                                  |                       |  Token.transfer    |
     |                                  |                       +------------------->| (after cliff)
```

Trust boundary: USDC enters at `sale.buy()`, immediately credits the
investor's vesting balance via mint, and stays under sale-contract
custody for treasury withdrawal (admin → Timelock-gated).

### Privileged action flow (post-handoff)

```
3-of-5 Safe signers
        |
        | EIP-712 SafeTx (3 sigs)
        v
   Gnosis Safe ─────── execTransaction ───────►  CCMTimelock
                                                       │
                                                       │ MIN_DELAY = 48h
                                                       │
                                                       ▼ schedule()
                                                   [pending op]
                                                       │
                                                       │ time.elapsed >= delay
                                                       │
                                                   [ready op]
                                                       │
                                                       ▼ execute() (any executor)
                                              CCMToken / CCMVesting / etc.
                                                       │
                                                       ▼
                                                  privileged side-effect
```

The Safe's role is **only proposing/executing** — it cannot fast-forward
the delay or self-grant additional power on any in-scope contract,
because Timelock holds those roles, not the Safe.

---

## Trust model & threat model

### Privileged actors

| Actor | Powers | Mitigations |
|---|---|---|
| Deployer EOA (post-handoff) | None | Renounces every role. Holds no on-chain privilege. |
| Safe 3-of-5 (mainnet) | Propose / cancel / execute Timelock ops; flip KYC status | 3-of-5 threshold; key rotation possible via Safe ownership change. KYC operations are operational only — they can prevent users from buying, but cannot mint, transfer user funds, or grant other roles. |
| Timelock (48 h) | grantRole, revokeRole, pause, unpause, createSchedule, revokeSchedule, withdrawUSDC, etc. | 48 h delay gives users time to exit before any malicious or buggy op lands. Cancellable by Safe. |
| Anyone | View funcs, `release()` (own schedules), `buy()` (if KYCed + whitelisted + within sale window), `migrate()` (if v2 deployed) | Standard ACL. |

### Threats we want auditor focus on

- **Cap bypass**: any path that mints CCM beyond `cap`. Specifically:
  vesting + sale + staking rewards + migration all share the cap. Cap
  enforcement is in `CCMToken._update`; we want the auditor to confirm
  every mint route lands there.
- **Vesting math**: linear-with-cliff. Edge cases: cliff exactly equal to
  vesting duration, totalAmount exactly mod the duration, schedules
  created with `startTime` in the past, revocation mid-vesting.
- **TGE round state**: hardcap accounting under concurrent buys, USDC
  precision (USDC is 6 decimals, CCM is 18 — conversion is in
  `_quote()`), close-then-reopen, off-by-one on time windows.
- **Migration atomicity**: v1 burn must happen before v2 mint, both must
  occur or neither. Reentrancy on either side. Deadline enforcement.
- **AccessControl drift**: any path where a role can leak across
  contracts (e.g., Vesting's MINTER_ROLE on Token getting confused with
  Vesting's own SCHEDULE_MANAGER_ROLE). Renounce-order matters in the
  handoff script.
- **Pause interaction**: CCMToken extends `ERC20Pausable`. Confirm
  pausing blocks all transfers including sale `buy`, vesting `release`,
  migration, etc., and that pausing during an in-flight sale doesn't
  leave inconsistent state.
- **Reentrancy**: every state-mutating external function is `nonReentrant`,
  but please verify — and check that read-only reentrancy via view
  functions can't be exploited (e.g., balance reads during a hook).
- **Donation attack resistance** on Staking — does sending CCM directly
  to the staking contract corrupt accounting?
- **EIP-2612 permit replay** on CCMToken (OZ default impl, but worth
  spot-check).
- **Centralisation risks beyond what's documented** — find the path we
  didn't think of.

### Threats explicitly de-scoped

- The Safe being malicious or compromised (signer collusion). This is
  governance risk, not contract risk; the 48 h timelock buys reaction
  time but cannot defeat 3-of-5 collusion.
- The deployer EOA being compromised **before the renounce**. Deploy
  steps are sequenced under one operator session.
- KYC oracle accuracy (Sumsub / Persona). The on-chain `CCMKYCRegistry`
  is just a mirror; the off-chain provider's vetting quality is not in
  scope for this audit.
- Out-of-band fund-loss vectors (private-key theft, phishing, rugpull
  social-engineering of investors).

---

## Existing security work (to avoid you re-doing it)

The following has already been performed; please use as input rather
than re-running unless you'd like to:

1. **Slither 0.11.5** — re-run on the renamed CCM sources on 2026-05-09.
   Result: 0 High, 3 Medium (all carryover from the prior `czero`
   codebase; documented), 14 Low (`timestamp` — standard pattern for
   time-gated logic), 8 Informational. Full report in
   `onchain/SECURITY_REVIEW.md`.

2. **Manual review** — internal review pass on every contract,
   documented in the same file. Two issues found and fixed pre-rename
   (`L-02`, `L-03`).

3. **Test suite** — 370 passing, ~4,789 LOC of test code across 23
   files. Coverage is "behavioural" (not pure line coverage):
   constructor, role lifecycle, happy path, every failure mode, OZ
   integration. The test for the timelock handoff alone runs the
   schedule → wait → execute round-trip end-to-end with a 1 s delay
   variant locally and a 48 h variant on testnet.

4. **Base Sepolia rehearsal** — every privileged contract has been
   deployed to Base Sepolia and the admin handoff to a real Gnosis Safe
   v1.4.1 (3-of-4) + 48 h Timelock has been completed. Op IDs and tx
   hashes in `onchain/DEPLOYMENT.md`.

5. **npm audit** — clean on hardhat / OZ / viem / wagmi as of snapshot.

If your engagement model normally re-runs Slither anyway, that's fine —
we just want to flag that a recent run is on file so you can compare.

---

## Test posture

```
$ cd onchain && npx hardhat test
  370 passing (4s)
```

Layout:

```
test/
├── CCMToken.test.ts              ← happy path + cap + role + permit + pause
├── CCMToken.requirements.test.ts ← business-rule scenarios from CCM_Token_Design.md
├── CCMVesting.test.ts            ← cliff/linear/revoke
├── CCMVesting.requirements.test.ts
├── CCMStaking.test.ts            ← stake/unstake/reward
├── CCMStaking.requirements.test.ts
├── CCMTGESale.test.ts            ← multi-round, hardcap, USDC math
├── CCMTGESale.requirements.test.ts
├── CCMMigration.test.ts          ← v1→v2 atomic, deadline
├── CCMMigration.requirements.test.ts
├── CCMTimelock.test.ts           ← schedule/execute/cancel/handoff
├── CCMKYCRegistry.test.ts        ← role split, batch, count consistency
└── sandbox/                      ← OUT OF SCOPE (sandbox primitives)
```

Coverage report (`hardhat coverage`) is available on request — we
haven't pinned a number to the RFP because line coverage isn't the
metric we optimise (behavioural is). Happy to run it for any specific
contract you ask about.

Fuzzing: we've not yet run Echidna / Foundry invariant testing — if the
firm includes property-based fuzzing in their default scope (Trail of
Bits typically does), please flag that as a value-add in the quote.

---

## Repo access & repro

The repository is private. We'll send a GitHub repo invite once an NDA
is in place. Specifics:

- **Branch / commit** to audit: `main` at the SHA we agree on at
  engagement kickoff. We will tag a `audit-freeze-YYYY-MM-DD` commit at
  engagement start and not push to that tag for the duration.
- **Build**: `cd onchain && npm ci && npx hardhat compile && npx hardhat test`.
  Should be clean on macOS / Linux with Node 20+. No special dependencies
  beyond what `package.json` lists.
- **Re-run Slither**: from `onchain/`, `slither . --filter-paths "node_modules|sandbox|mocks"`.
- **Re-run npm audit**: `npm audit --omit=dev` against the lockfile.
- **Coverage**: `npx hardhat coverage`.
- **Compile profile**: `solc 0.8.24`, optimizer 200 runs, evmVersion `cancun`.

Fork-tests are not yet wired (we have nothing on mainnet to fork). Once
we deploy, we'll set up a Base mainnet fork harness for the auditor's
use; if your team prefers to run their own forks, our deployer EOA's
public key + the Timelock + Safe addresses will be all you need.

---

## Deploy plan

Phase 0 mainnet deploy is currently **gated on this audit completing**.

| Item | Status |
|---|---|
| Mainnet contracts compiled + tested | ✅ |
| Slither re-validated | ✅ |
| Multisig + Timelock implementation + rehearsal | ✅ Base Sepolia 2026-05-09 |
| KYC registry implementation + rehearsal | ✅ Base Sepolia 2026-05-09 |
| Bug bounty program scope drafted | ✅ `onchain/BUG_BOUNTY.md`, $500 K cap |
| Holder registry (off-chain D1) | ✅ `dbd8f008-…fe` deployed, migrations applied |
| **External audit** | ⏳ **this engagement** |
| Mainnet Safe (3-of-5) — real signers | Out-of-band policy decision |
| Mainnet deploy + handoff | Scheduled immediately after audit fix-verify completes |
| Bug bounty live on Immunefi | Activates with mainnet deploy |
| External audit fix-verify round | TBD with engaged firm |

Full status in `onchain/DEPLOYMENT.md` "Mainnet pre-deployment checklist
(consolidated)".

We're targeting a kickoff inside the next 4 weeks of receiving quotes.

---

## Logistics

### NDA

We'll either sign your standard NDA or send our short MNDA (one-page,
mutual, 2-year term, perpetual confidentiality on the codebase). We
prefer to keep it simple — please send your default if you have one.

### Engagement contract

Standard SoW. Payment terms negotiable but our default is 50 % on
kickoff, 50 % on draft report delivery. Net 30 on the second half. USDC
or wire, your preference.

### Communication

- **Primary**: Telegram or Slack channel created at kickoff. We
  monitor business hours KST (UTC+9), but the lead engineer is
  reachable for urgent questions during overlap windows for any time
  zone.
- **Async**: shared GitHub issue tracker on the audit repo (private),
  one issue per finding.
- **Encrypted email** for severity-sensitive content: PGP key shared
  on NDA signing.

### Public report

We want a public report and will reference it on `ccmnetwork.net/security`
plus the bug-bounty program page. If your default is private and there's
a delta to make it public, please quote both.

### Primary contact

- Engineering lead: see the `from` line of the inquiry email you
  received from us, or `security@ccmnetwork.net`.
- Legal / NDA: `legal@ccmnetwork.net`.

---

## Appendix — reference documents

All files below are in the same repository; will share on NDA.

| Doc | Path | What it contains |
|---|---|---|
| Phase-0 architecture | `docs/ccm-phase0-architecture.md` | Full architecture of Phase 0, including the off-chain components and migration plan. |
| Whitepaper | `docs/CCM_Network_Whitepaper_v1.0.pdf` | Token economics, carbon-credit grading model, DeFi primitive lineup. |
| Token design | `onchain/CCM_Token_Design.md` | Tokenomics: cap, distribution waterfall, vesting schedules per category. |
| Business model | `onchain/CCM_Business_Model_and_Requirements.md` | Functional + non-functional requirements (NFR-SEC-* in particular). |
| Security review | `onchain/SECURITY_REVIEW.md` | Slither findings + manual review notes + delta vs prior czero codebase. |
| Bug bounty scope | `onchain/BUG_BOUNTY.md` | Public bounty program scope; mirrors the audit scope. |
| Responsible disclosure | `onchain/SECURITY.md` | Disclosure policy + PGP key plan. |
| Deployment runbook | `onchain/DEPLOYMENT.md` | Deploy sequence, rehearsal records, gating list. |
| README | `onchain/README.md` | Repo top-level README. |

---

## Changelog

| Date | Author | Change |
|---|---|---|
| 2026-05-09 | CCM eng | Initial draft. Snapshot at `main` HEAD as of this date. |
