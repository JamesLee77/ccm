# CCM Network — Phase 0 architecture

**Date**: 2026-05-09
**Origin**: czero (C-ZERO Mining Token, $CZM) precursor brand. Contracts and
investor portal infrastructure already battle-tested on Base Sepolia.
**Status**: Decisions recorded; implementation pending.

This document captures the architectural decisions taken on 2026-05-09 to
move from the czero brand (testnet only) to CCM Network (mainnet Phase 0
launch). It is the source of truth for *which artifact does what*, *which
chain it lives on*, and *who is allowed to interact with it*.

---

## 1. Funding & contract phasing

### Approach: Option B (czero pattern) — mainnet pre-audit deploy

| Phase | Trigger | Action |
|---|---|---|
| **Phase 0** | Now | Mainnet Base deploy of CCM v1 (Token + Vesting). SAFT investors receive real CCM in their wallets via vesting schedules. portal.ccmnetwork.net + testnet.ccmnetwork.net go live. |
| **Phase 0.5** | After private sale closes (initial costs covered) | External audit (Trail of Bits / OpenZeppelin / Quantstamp). Foundation legal entity setup (ADGM Cat 4 license preferred). |
| **Phase 1** | Audit complete | If audit-mandated changes: deploy CCMTokenV2 + CCMMigration; investors call `migrate()` to swap v1 → v2 same-chain. If audit clean: proceed with v1. |
| **Phase 2** | Foundation operational | Public TGE sale (Seed + Series A rounds). Mainnet dApp app.ccmnetwork.net launches. |
| **Phase 3** | Post-TGE | DeFi composability primitives (8 surfaces per whitepaper §8). Marketplace and retire UX. |

### Why pre-audit mainnet (vs testnet-only or SAFT-only)
- **Investor trust**: SAFT-only leaves investors with a paper claim. Tokens
  in their wallet (with vesting, with on-chain proof) is the trust signal.
- **Migration plumbing already proven**: czero's CCMMigration was verified
  on Base Sepolia (1000 CZM swap, 4 holders, CEI pattern, 0 Slither warnings).
  Same code, same chain, same audit posture.
- **Risk envelope**: 5B hard cap + Pausable + Multisig 3-of-5 + 48h Timelock
  + Bug bounty + non-upgradeable + emergency `pause()` confines blast radius.

### Phase 0 deploy invariants (must be true before mainnet tx is signed)
1. Admin role on every deployed contract is granted to a **Gnosis Safe 3-of-5**, not an EOA.
2. All admin-gated functions go through an OpenZeppelin **TimelockController**, 48h delay.
3. Bug bounty registered on Immunefi (max $500K) before deploy.
4. Slither + manual review (re-run on the renamed CCM* sources, not just on the original CZM*).
5. KYC oracle integration set up (Sumsub/Persona) — at minimum off-chain whitelist with admin gate.

These are documented in `docs/site-revisions-2026-05.md` §8 (pending) as the
gating list before any mainnet tx.

---

## 2. Site architecture — 4 distinct frontends

| URL | Audience | Chain | Auth | Primary UX |
|---|---|---|---|---|
| **ccmnetwork.net** | General public | none | none | Marketing, whitepaper, vision, contact |
| **testnet.ccmnetwork.net** | Anyone (sandbox) | **Base Sepolia only** | wallet connect (no KYC) | Try CCM Network, mint test cNFT, wrap, retire — fake tokens |
| **portal.ccmnetwork.net** | SAFT investors only | **Base mainnet** | SIWE + KYC whitelist | Vesting balance, claim, migrate v1 → v2 |
| **app.ccmnetwork.net** | General public *(Phase 2+)* | Base mainnet | wallet connect + per-feature KYC | Marketplace, retire, governance |

### Why 4 sites and not 1
- **Different chain configurations cannot safely coexist in one bundle.**
  A user on mainnet wallet hitting the testnet UI by accident is a real
  risk; baking only one chain into each build (build-time wagmi config)
  eliminates address confusion at the source.
- **Different audience contracts.** Public marketing answers "what is CCM";
  portal answers "where are my vested tokens"; testnet answers "let me try
  this without losing money"; mainnet dApp answers "let me trade and
  retire". Mashing them produces a worse experience for every persona.
- **Different security postures.** Portal needs strict KYC + audit logging;
  testnet needs aggressive watermarking; marketing needs none of that.

### Source-tree mapping

```
ccm/                              ← repo root
  frontend/                       ← ccmnetwork.net (current marketing site)
  portal/                         ← portal.ccmnetwork.net (copy of czero/frontend with rename)
  portal-api/                     ← portal Worker API (copy of czero/backend with rename)
  testnet/                        ← testnet.ccmnetwork.net (new — see §3)
  testnet-api/                    ← (optional, if testnet needs its own Worker)
  onchain/                        ← copied from czero/contracts + scripts + test (CZM→CCM rename)
  docs/                           ← architecture, runbooks, this file
```

Each frontend is a separate Cloudflare Pages project; backends are
separate Cloudflare Workers. Domain mapping and env vars are set
independently per project.

| Cloudflare project | Type | Domain | Build dir |
|---|---|---|---|
| `ccm-site` (existing) | Pages | ccmnetwork.net | `frontend/dist` |
| `ccm-portal` (new) | Pages | portal.ccmnetwork.net | `portal/dist` |
| `ccm-portal-api` (new) | Worker | portal API | `portal-api/` |
| `ccm-testnet` (new) | Pages | testnet.ccmnetwork.net | `testnet/dist` |
| `ccm-app` (Phase 2+) | Pages | app.ccmnetwork.net | TBD |

---

## 3. Testnet safety rails (testnet.ccmnetwork.net)

The hardest single problem in Phase 0 is preventing accidental real-fund
loss when a public sandbox is exposed. Defense in depth:

### 3.1 Build-time chain isolation
- Wagmi config registers **only** `baseSepolia`. No mainnet chain object exists in the bundle. There is no code path that can talk to mainnet from this site.
- Symmetrically: portal and app builds register only `base`.
- Contract addresses are split into `addresses.testnet.ts` and `addresses.mainnet.ts`. The testnet build imports only the testnet file and vice versa.

### 3.2 Runtime chain gate
- `useChainId() !== baseSepolia.id` → **full-screen modal** "Switch to Base Sepolia" with disabled-everything-else state.
- Modal is non-dismissible until chain switches.
- Pre-tx confirmation modal echoes "Network: Base Sepolia (Chain ID 84532)" with the contract address being called.

### 3.3 Visual differentiation
- **Distinct theme**: dark + amber accent (vs marketing's light + moss). Cannot be mistaken for ccmnetwork.net at a glance.
- **Persistent watermark**: diagonal translucent "TESTNET" text behind every page, top-fixed banner "TESTNET — fake tokens, no real value", footer reminder.
- **Token metadata**: ERC-20 `name` field is `"CCM (Testnet)"`, symbol `"tCCM"`. Even if a wallet imports the address, it labels itself.

### 3.4 Address hygiene
- Testnet site never displays mainnet contract addresses (and vice versa).
- BaseScan links are `sepolia.basescan.org/...` only.
- No "copy mainnet address" button anywhere on testnet.

### 3.5 Faucet handling
- Provide an **external** faucet link (e.g., Alchemy/QuickNode public Base Sepolia faucet).
- We do not run our own faucet that distributes real-looking tokens.
- Faucet card has "Free test ETH — has no value, only for sandbox" copy.

### 3.6 User education (one-time + persistent)
- First visit: full-screen explainer "This is a testnet sandbox. Connect a wallet, switch to Base Sepolia, get free test ETH from the faucet, then experiment freely. Tokens received here have no real value and cannot be moved to the mainnet CCM Network."
- Persistent footer reminder on every page.
- "What is testnet?" link in nav for re-read.

### 3.7 Asymmetry between portal and testnet
- portal: real tokens, KYC required, every action shows mainnet `chainId 8453`.
- testnet: fake tokens, no KYC, every action shows sepolia `chainId 84532`.
- Visual themes are intentionally divergent to prevent the user thinking "I'm on a CCM site, this looks similar, let me try the same thing".

---

## 4. ccmnetwork.net updates (marketing site)

### 4.1 CTA changes
- **Open App ↗** (currently → `/markets`) **→ Try testnet ↗** (→ `https://testnet.ccmnetwork.net`).
- Rationale: there is no mainnet app yet; "Open App" implies one exists. "Try testnet" is honest and channels curiosity into the safe sandbox.
- After Phase 2 mainnet TGE: Try testnet stays, plus a new **Open app ↗** CTA appears pointing at `app.ccmnetwork.net`.

### 4.2 New "Phase 0 — testnet now live" section (optional)
- A new home section between Hero and Market: "Phase 0 — Try CCM Network on testnet" with a CTA, screenshots, and explainer.
- Could replace the existing "Read the whitepaper" CTA position or add as a banner.

### 4.3 What does NOT change
- Whitepaper, /defi, /roadmap content unchanged.
- Footer Network column unchanged.
- DeFi top-nav item unchanged (still routes to `/defi`).

---

## 5. portal.ccmnetwork.net (investor portal)

### 5.1 Source
Copy of `czero/frontend/` (the existing investor portal) → `ccm/portal/`.

### 5.2 Renames
- "CZM" → "CCM"
- "C-ZERO" → "CCM Network"
- "C-ZERO Mining Token" → "Carbon Credit Measurement"
- Branding assets: czero logo → ccm wordmark
- Cloudflare project name: `czero-portal` → `ccm-portal`
- D1 database: `czero-portal-db` → keep or rebuild as `ccm-portal-db`

### 5.3 Backend
Same backend pattern as czero-portal-api: Cloudflare Worker + D1 + Resend.
- New Worker: `ccm-portal-api` at `ccm-portal-api.<account>.workers.dev` (later mapped to `api.portal.ccmnetwork.net` if desired).
- New D1: `ccm-portal-db`.
- Auth: SIWE (EIP-4361) + HMAC-signed HttpOnly cookie. KYC whitelist gate added on top of SIWE.

### 5.4 KYC gate
- Off-chain admin whitelist (table `kyc_approved` or column `users.kyc_status`).
- After SIWE sign-in, server checks `kyc_status === 'approved'`. If not, returns 403 with a "contact foundation" link.
- Manual KYC flow: investor signs SAFT → submits ID via Sumsub/Persona → admin approves in the portal admin tool → portal access unlocks.

### 5.5 Pages
1. **Dashboard** — wallet balance, total vested, claimable now, next unlock date.
2. **Vesting** — per-schedule progress bars, release button, schedule details.
3. **Claim** — release vested tokens.
4. **Migrate** *(activated in Phase 1 if v2 deploy)* — approve v1 + call migrate, balances refresh.
5. **Settings** — email subscribe (notifications), notification preferences.

### 5.6 Notifications (via existing czero pattern)
- Hourly cron scans vesting schedules, sends emails:
  - cliff_7d (7 days before cliff)
  - cliff_1d (1 day before)
  - claim_ready (vested portion available)
- Dedupe table prevents repeats.

---

## 6. testnet.ccmnetwork.net (sandbox)

### 6.1 Source
New Vite app under `ccm/testnet/`. Could share components with `frontend/` (marketing site) and `portal/` for consistency, but no shared chain config.

### 6.2 Functionality
**Phase 0 testnet experience scope (initial)**:
- Connect wallet (Base Sepolia gated).
- View test CCM balance.
- Faucet panel (links to external faucet for test ETH).
- Wrap/Unwrap demo (test CCM-NFT → tCCM and back) — uses the same contracts as portal but on Base Sepolia addresses.
- Mint a demo CCM-NFT (admin-restricted in production, but on testnet anyone can call a test mint function).
- Retire demo (test retirement burns the test NFT).

**Future testnet additions** (Phase 1+):
- Vault lending demo, fractionalization demo, etc. Each new mainnet primitive should land on testnet first.

### 6.3 Build-time isolation
- Separate Cloudflare Pages project (`ccm-testnet`).
- Wagmi config: `chains: [baseSepolia]`, no `base`.
- `addresses.testnet.ts` only.
- Build env: `VITE_NETWORK=testnet`, `VITE_CHAIN_ID=84532`.

### 6.4 Visual identity
- Theme: dark mode + amber `#f59e0b` accent (distinct from main moss).
- Watermark: `TESTNET` diagonal repeating background, ~6% opacity.
- Top banner: yellow/amber "⚠ Testnet — tokens have no real value" — sticky, dismissible per session but reappears on chain mismatch.
- Footer disclaimer: longer-form explanation.

---

## 7. Migration scenarios (when does CCMMigration get used)

| Scenario | Trigger | Migration needed |
|---|---|---|
| **Audit clean** | External audit returns 0 critical/high, only Lows | No. v1 stays as is. |
| **Audit minor changes** | Medium findings need cosmetic fixes (events, naming) | Likely no. Apply to v2 design without forcing migration. |
| **Audit critical change** | High/critical bug in business logic (vesting math, mint accounting) | **Yes.** Deploy v2 with fix → grant v2 MINTER_ROLE to CCMMigration → broadcast to investors → migrate window 30 days → close. |
| **Brand/legal change** | Foundation re-domiciles (ADGM → BVI, etc.) | No. Off-chain entity change does not affect contract. |

The migration mechanism remains the same as the czero proven path:

```
1. v2.grantRole(MINTER_ROLE, migration)
2. holder: v1.approve(migration, amount) (or migrateWithPermit)
3. holder: migration.migrate(amount) → v1 burnFrom + v2 mint
4. After 30-day deadline: migration.close() permanently
5. v2.revokeRole(MINTER_ROLE, migration)
```

CCMMigration is deployed at Phase 1 *only if needed*; it is not part of
Phase 0 mainnet bundle.

---

## 8. Implementation order (next concrete steps)

1. **Copy czero/contracts → ccm/contracts with CZM → CCM rename** (mechanical, this is the next task).
2. **Re-run security review** (Slither + manual + 160 tests on the renamed source). Output: `ccm/SECURITY_REVIEW.md` confirming renames did not change behavior.
3. **Copy czero/frontend → ccm/portal with CZM → CCM rename**.
4. **Build ccm/testnet/ from scratch** (using shared components from frontend/portal where possible).
5. **Update ccmnetwork.net**: Open App → Try testnet, optional Phase 0 banner.
6. **Cloudflare Pages: create `ccm-portal` and `ccm-testnet` projects, attach domains**.
7. **Pre-deploy gating list**: Multisig setup, Timelock deploy, KYC integration, bug bounty registration. (Tracked separately in `docs/mainnet-checklist.md`.)
8. **Mainnet deploy CCMToken + CCMVesting** (only after #7 is fully green).
9. **Operational**: SAFT investor onboarding, vesting schedule batch creation, ongoing.
10. **Audit kickoff** in parallel with Phase 0 operations.
11. **Phase 1 conditional**: deploy v2 + CCMMigration if audit requires.

---

## 9. Open items (do not start until resolved)

| Item | Owner | Blocking what |
|---|---|---|
| Multisig signer set (3-of-5) | Founders | All mainnet deploy |
| Foundation legal entity (ADGM Cat 4 expected) | Legal | Mainnet deploy + token issuance compliance |
| KYC vendor selection (Sumsub vs Persona) | Compliance | Portal launch |
| Bug bounty budget reservation | Founders | Mainnet deploy |
| Audit firm selection + scheduling | Founders | Phase 0.5 timeline |
| SAFT template review (UAE + KR + US Reg S) | Legal | Phase 0 fundraise |

These are tracked separately in `docs/mainnet-checklist.md` (TBD) and do
not block the contract/frontend rename work.

---

## 10. Cross-references

- `docs/site-revisions-2026-05.md` — current ccmnetwork.net marketing site state
- `czero/SECURITY_REVIEW.md` — original security review (CZM); to be re-run on CCM
- `czero/DEPLOYMENT.md` — testnet deployment record (Base Sepolia, 2026-05-06)
- `czero/CZM_Token_Design.md` — token mechanics (applies to CCM unchanged)
- `czero/CZM_Business_Model_and_Requirements.md` — business model (applies to CCM unchanged)
- `czero/docs/PROJECT_SUMMARY.md` — investor portal MVP record (basis for ccm/portal)
