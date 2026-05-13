# Session handoff — end of 2026-05-12 / 13

End-of-session state snapshot so a new Claude Code session can pick up
without re-reading the full chat history.

## What was done in this session

**Phase 1 mainnet deploy (2026-05-12 11:00–14:00 KST):**

- Onchain workspace imported into the monorepo (`onchain/`, commit `2857715`)
- Phase 1 spec + plan (`docs/superpowers/specs/2026-05-11-...`, `plans/...`)
- New mint script with 6 safety guards (commit `1202fbf` post code review)
- Hardhat-fork dry-run + Sepolia rehearsal (rounds 1 + 2; tx.wait(2) fix at `593038f`)
- Slither rerun on CCMToken + CCMVesting, 0 medium+/high findings
- BaseScan API key, CDP RPC, MAINNET_PRIVATE_KEY env all wired
- Mainnet deploy (block 45,891,153, commit `a419c99`):
  - CCMToken `0x398b2eB83C59890a01418b8D661e9A36a7c9d23d` (verified)
  - CCMVesting `0x019B68683a8c31f4A8295215D8Da7f8Ec95582dc` (verified)
  - 10M CCM minted to deployer EOA `0xfcb1B5B833700E08714275E0DC321c534690E842`
- DEPLOYMENT.md Phase 1 section populated

**Phase 2 scripts (rehearsed, not executed):**

- `transfer-admin-to-timelock.ts` extended to handle MINTER_ROLE (commit `8d54637`)
- `transfer-vesting-admin-to-timelock.ts` (commit `89eacf9`)
- `verify-phase2-handoff.ts` (14 assertions, `a626efb`)
- `_dry-run-phase2.ts` (forked-mainnet end-to-end, `5dfa90d`)
- `schedule-mint-via-timelock.ts` (Safe Wallet calldata builder, `6c1fa26`)
- Full Phase 1 + Phase 2 round 2 Sepolia rehearsal: clean pass, all 14 assertions ✓

**Token metadata / external registrations:**

- Token logo (256×256 single-c, 200×200 variant, full wordmark) at `frontend/public/`
- Brand guideline JSX (`docs/design/brand/*`) palette aligned with `frontend/src/index.css`
- Coinbase Token Hub EAS attestation submitted on Base mainnet:
  - First: `0x0b59cc6d…1952` (GitHub raw URLs)
  - Latest: `0x422305e6…7a1b` (ccmnetwork.net URLs) — indexer picks this
- Uniswap default-token-list issue: user submitted via pre-filled URL
- CoinGecko submission: drafted at `docs/coingecko-submission.md`, holding for DEX liquidity

**Site deploys (Cloudflare Pages + Workers):**

- ccmnetwork.net (marketing, `ccm-site`)
- portal.ccmnetwork.net (`ccm-portal`, VITE_ENV=mainnet, wired to live contracts)
- admin.ccmnetwork.net (`ccm-admin`, behind Cloudflare Access)
- testnet.ccmnetwork.net (`ccm-testnet`, mirror of marketing)
- portal-testnet.ccmnetwork.net (`ccm-portal-testnet`, VITE_ENV=testnet, sandbox contracts)
- admin-testnet.ccmnetwork.net (`ccm-admin-testnet`, sandbox)
- ccm-portal-api.misterylee.workers.dev (Worker; D1 + cron + 3 secrets)

**Repo housekeeping:**

- Root `.gitignore` hardened (`.env`, `.wrangler/`, root lockfile, sensitive design assets)
- `onchain/`, `portal/`, `admin/`, `portal-api/`, `testnet/`, `frontend/src/` all committed
- 40+ commits, working tree clean, origin/main synced

## What's not done

1. **DEX liquidity** — required for CoinGecko/CMC acceptance and real secondary trading
2. **Social media** (X/Twitter at minimum) — CoinGecko signal + general visibility
3. **Phase 2 governance migration** (HW wallet → Safe → Timelock) — scripts ready
4. **Mainnet contracts beyond Token+Vesting**: KYC Registry, TGE Sale, Staking, Migration
5. **`RESEND_FROM`** — switch from `onboarding@resend.dev` to `noreply@ccmnetwork.net` after Resend domain verify
6. **Gitignored design asset review** — `docs/design/ccm.zip`, `docs/design/design_handoff_ccm_network/` (Korean legal drafts)

## Key facts to know in a new session

- **`frontend/src/index.css` is the BI source of truth** (moss `#2dbf63`, paper `#f5f3ec`, ink `#0c0f10`). Don't reintroduce the older deep-forest `#3d5a3a`.
- **`MAINNET_PRIVATE_KEY` namespace** in env separates testnet (`PRIVATE_KEY`) from mainnet keys.
- **Env file** is at the repo root: `/Users/hyunsuklee/Developer/ccm/.env`. Hardhat reads it via the `path.resolve(__dirname, "..", ".env")` override in `onchain/hardhat.config.ts`.
- **Deployer EOA = Treasury EOA = `0xfcb1B5B833700E08714275E0DC321c534690E842`**. Single MetaMask key holds all roles + the 10M. HW wallet migration is the Phase 2 plan.
- **CDP RPC URL and ADMIN_BEARER_TOKEN were exposed in chat during deploy.** Both should be rotated when operations stabilize.
- **Cloudflare wrangler needs `CLOUDFLARE_ACCOUNT_ID=e82458744ebc655e58fe5194e6fb93fd`** because the user has two CF accounts and wrangler can't disambiguate in non-interactive mode.

## Pointers

- Specs / plans: `docs/superpowers/{specs,plans}/`
- Deploy record: `onchain/DEPLOYMENT.md`
- Coinbase / Uniswap / CoinGecko drafts: `docs/coingecko-submission.md`, `docs/uniswap-token-list-issue.md`
- Phase 2 scripts: `onchain/scripts/transfer-*-to-timelock.ts`, `verify-phase2-handoff.ts`, `_dry-run-phase2.ts`, `schedule-mint-via-timelock.ts`
- Token-hub attestation submitter: `onchain/scripts/submit-token-hub-attestation.ts`
- Sepolia rehearsal commits: `593038f` (tx.wait(2) fix), `fe7910a` (record), `8d54637` … `6c1fa26` (Phase 2 scripts)
- Mainnet deploy commit: `a419c99`
