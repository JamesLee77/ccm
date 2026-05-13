# E2E testing — data layer + browser layer

**Date**: 2026-05-10
**Status**: Implemented; CI workflow drafted, secrets pending
**Test wallet**: Compliance operator on Base Sepolia (`COMPLIANCE_*` in `onchain/.env`)

This document covers the two-layer e2e test architecture, the testnet
test-wallet escape hatch that powers browser automation without
MetaMask, and the integrated runner.

Companion doc: `operator-console-access.md` — the persona model these
tests verify.

---

## 1. Two layers, two purposes

| Layer | Tool | What it asserts | When to run |
|---|---|---|---|
| **Data layer** | hardhat scripts (`onchain/scripts/_e2e-*.ts`) | Direct contract calls + portal-api JSON: SIWE round-trips, audit log writes, on-chain state transitions, role enforcement (revert checks). Bypasses the UI entirely. | After contract changes, after portal-api changes, before any deploy |
| **Browser layer** | Playwright (`admin/e2e/*.spec.ts`) | The UI behaves correctly: persona NAV filter, route guard, write CTA gating, SIWE sign-in via test wallet, full Vesting create flow with real tx. | After admin UI changes, after wagmi/RainbowKit upgrades, before any admin deploy |

The browser layer **complements** rather than replaces the data layer.
Data-layer tests run in 30–60 seconds and don't need a browser; browser
tests catch UI/integration bugs the data layer can't see.

---

## 2. Data-layer suites (`onchain/scripts/_e2e-*.ts`)

Each script is a hardhat run target executed against `baseSepolia`.

| Suite | File | What it covers |
|---|---|---|
| KYC | `_e2e-kyc-flow.ts` | Operator approves alice, batch-approves bob+carol, revokes alice. Bob (no role) attempt → revert. Audit log roundtrip with notes. |
| Vesting | `_e2e-vesting-flow.ts` | createSchedule (carol), cliff wait, partial release, fully-vested release, revocable schedule + bob unauthorized revoke + operator revokes. |
| Compliance segregation | `_e2e-compliance-persona.ts` | Compliance wallet has SCHEDULE_MANAGER_ROLE only; succeeds on `createSchedule`, reverts on Token mint, TGESale createRound, KYC setKYCed. |
| Timelock | `_e2e-timelock-flow.ts` | Operator schedules an op, role enforcement on cancel/execute, Cancel via fresh nonce. |
| Manual transfer | `_e2e-manual-transfer.ts` | Off-chain payment investor: SIWE → POST audit pending → CCM.transfer → PATCH submitted/confirmed → cross-wallet PATCH ownership rejected. |

Run one:

```bash
cd onchain
npx hardhat run scripts/_e2e-kyc-flow.ts --network baseSepolia
```

Run all:

```bash
./scripts/e2e-all.sh                           # Phase 1 + Phase 2
SKIP_BROWSER=1 ./scripts/e2e-all.sh           # only data layer
SKIP_BROWSER=1 ONCHAIN_SUITES="kyc vesting" \
  ./scripts/e2e-all.sh                        # subset
```

Required env (sourced from `onchain/.env`):

```
PRIVATE_KEY            # operator (deployer, super_admin)
ALICE_PRIVATE_KEY      # KYC subject
BOB_PRIVATE_KEY        # role-enforcement negative test
CAROL_PRIVATE_KEY      # vesting beneficiary
COMPLIANCE_PRIVATE_KEY # phase-2 test wallet (also used by browser layer)
```

---

## 3. Browser-layer suite (`admin/e2e/*.spec.ts`)

| Spec | Tests | Cost | Notes |
|---|---|---|---|
| `persona.spec.ts` | 9 | free | wallet activation, 4-tier NAV, route guard, read-only CTA gating |
| `siwe.spec.ts` | 1 | free | test wallet personal_sign → portal-api `/api/auth/verify` |
| `kyc-and-roles.spec.ts` | 4 | free | KYC page RBAC gating, treasury-persona × no-role negative test |
| `vesting-flow.spec.ts` | 1 | ~0.00001 ETH | full UI create-schedule flow with real on-chain tx |

Run:

```bash
cd admin
PLAYWRIGHT_TEST_KEY="$COMPLIANCE_PRIVATE_KEY" \
PLAYWRIGHT_TEST_ADDR="$COMPLIANCE_ADDRESS" \
PLAYWRIGHT_BENEFICIARY="$CAROL_ADDRESS" \
npm run test:e2e
```

Headed mode (debug):

```bash
npm run test:e2e:headed
```

Different base URL (e.g. local dev or pages.dev preview):

```bash
TEST_BASE_URL=http://localhost:5173 npm run test:e2e
```

### DNS workaround for KT (Korea Telecom)

The KT DNS server (`168.126.63.1`) returns `NXDOMAIN` for fresh
`*.ccmnetwork.net` subdomains. `playwright.config.ts` injects
`--host-resolver-rules` into Chromium so DNS resolution within the
browser bypasses the system resolver. Default mapping points all CCM
hostnames at `104.21.49.13` (a stable Cloudflare IP). Override via
`PLAYWRIGHT_HOST_RULES` env if Cloudflare ever changes IPs.

---

## 4. The test wallet — `/e2e` route

The browser e2e flow needs to drive a real wagmi-powered SPA without
MetaMask popups. Solution: a wagmi connector backed by viem's
`privateKeyToAccount`, gated to testnet builds.

### Architecture

```
admin/src/e2e/
├── testConnector.ts    # wagmi v2 createConnector backed by viem account
├── E2eAutoConnect.tsx  # mount once → if connector present, auto-connect
admin/src/pages/
└── E2eSetup.tsx        # /e2e — paste private key OR ?key= URL param
admin/functions/api/
└── me.ts               # CF Access email → SPA (mainnet identity source)
admin/src/lib/
├── personas.ts         # 4-tier model + email map + DEV_PERSONA_KEY
├── usePersona.ts       # hook: fetches /api/me, returns {persona, email, …}
└── wagmi.ts            # if e2eKey in sessionStorage → minimal createConfig
                        # with only the test connector. Otherwise normal
                        # RainbowKit getDefaultConfig.
```

### Activation flows

**Manual (developer)**: visit `/e2e` → paste a private key → click Activate
→ page reloads with the test connector active → SPA auto-connects.

**Automated (Playwright)**: `page.goto('/e2e?key=0x…')` → page saves the
key to sessionStorage and redirects to `/` → `E2eAutoConnect`
immediately calls `wagmi.connect({ connector: testConnector })` → SPA
ready for interaction.

The test connector handles `personal_sign`, `eth_signTypedData_v4`, and
`eth_sendTransaction` locally using the embedded account. All other RPC
methods proxy to the configured Base Sepolia RPC.

### Safety

- `IS_MAINNET` build-time guard removes the `/e2e` route entirely from
  the mainnet bundle (`admin/src/App.tsx:{!IS_MAINNET && <Route…>}`).
- The connector itself throws on construction if `IS_MAINNET` (defense
  in depth — the route shouldn't even import it on mainnet, but a
  copy-paste mistake would still error rather than silently work).
- The clay 🧪 E2E badge in the header makes the mode visually obvious
  whenever the test connector is the active wagmi connector.
- Keys are stored in `sessionStorage` (dies when the tab closes), not
  `localStorage`.

### Generating a test wallet

```bash
node -e "const {Wallet}=require('ethers'); const w=Wallet.createRandom();
  console.log('ADDRESS:', w.address);
  console.log('PRIVATE_KEY:', w.privateKey);"
```

Then provision it on testnet (fund + grant roles):

```bash
cd onchain
# Save keys to .env first
npx hardhat run scripts/_setup-compliance-wallet.ts --network baseSepolia
```

The setup script funds the wallet with 0.0015 ETH from the operator and
grants `SCHEDULE_MANAGER_ROLE` on Vesting. KYC role requires going
through the 48h Timelock (out of scope for one-time setup).

---

## 5. Integrated runner — `scripts/e2e-all.sh`

Single command that runs both phases sequentially, sources env vars
from `onchain/.env`, and prints a summary.

| Env var | Effect |
|---|---|
| `SKIP_ONCHAIN=1` | Skip Phase 1 (hardhat) |
| `SKIP_BROWSER=1` | Skip Phase 2 (Playwright) |
| `ONCHAIN_SUITES="kyc vesting"` | Phase 1 subset (default: `kyc vesting compliance manual-transfer`) |

Exit code is non-zero if any suite fails. Used both locally and as the
foundation for the `.github/workflows/e2e.yml` workflow.

---

## 6. Recorded baseline (2026-05-10)

| Suite | Tests | Time | Result |
|---|---|---|---|
| Data: kyc | 7 steps | ~50s | ✅ |
| Data: vesting | 10 steps | ~120s | ✅ |
| Data: compliance | 5 steps | ~30s | ✅ |
| Data: timelock | (unchanged) | ~60s | ✅ |
| Browser: persona | 9 | ~37s | ✅ |
| Browser: siwe | 1 | ~9s | ✅ |
| Browser: kyc-and-roles | 4 | ~16s | ✅ |
| Browser: vesting-flow | 1 (real tx) | ~10s | ✅ |
| **Total (full run)** | — | ~6 min | ✅ |

Re-running this is a one-line check: `./scripts/e2e-all.sh`.

---

## 7. CI integration (deferred)

A workflow exists at `.github/workflows/e2e.yml` covering both phases
on `workflow_dispatch` and on push to `main` (path-filtered). Pending:
populate repository secrets in GitHub:

- `PRIVATE_KEY`, `ALICE_PRIVATE_KEY`, `BOB_PRIVATE_KEY`,
  `CAROL_PRIVATE_KEY`, `COMPLIANCE_PRIVATE_KEY`
- `ALICE_ADDRESS`, `BOB_ADDRESS`, `CAROL_ADDRESS`, `COMPLIANCE_ADDRESS`
- `BASE_SEPOLIA_RPC_URL` (use a paid RPC; public Base Sepolia gets
  rate-limited under CI load)

The workflow uses a `concurrency: e2e-baseSepolia` group so two parallel
runs don't contend on nonces. On failure, Playwright traces are
uploaded as artifacts (7-day retention).
