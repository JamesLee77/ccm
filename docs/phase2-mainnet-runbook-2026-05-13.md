# CCM Phase 2 — Mainnet Governance Handoff Runbook

**Date**: 2026-05-13  
**Author**: james.lee@finenex.net  
**Status**: Rehearsed and ready — DO NOT execute until Safe 3-of-5 is funded and all signers are verified  
**Network**: Base mainnet (chainId 8453)  
**Spec reference**: `docs/superpowers/specs/2026-05-12-ccm-phase2-timelock-migration-design.md`

---

## Rehearsal evidence

This runbook is backed by three successful rehearsal runs, all on Base Sepolia (chainId 84532):

| Rehearsal | Date | Result |
|---|---|---|
| Round 1 (commit `6c1fa26`) | 2026-05-12 | End-to-end pass; surfaced `tx.wait(1)` RPC stale-state race — documented |
| Round 2 (commit `593038f`) | 2026-05-12 | Clean pass, 14/14 assertions ✓ after `tx.wait(2)` fix |
| Round 3 (this session) | 2026-05-13 | Clean pass, 14/14 assertions ✓ (full sequence, fresh contracts) |
| Forked-mainnet dry-run | 2026-05-13 | `_dry-run-phase2.ts` clean, all 13 inline checks ✓ + idempotency check ✓ |

**Round 3 Sepolia contracts (reference)**:

| Contract | Address |
|---|---|
| CCMToken (round 3 rehearsal) | `0x992afdB2476aAc1ED7Ff300C165a5109fFFE7187` |
| CCMVesting (round 3 rehearsal) | `0xA9dEfa82D94173e6beD71104b439FdA8d5752a66` |
| CCMTimelock (round 3 rehearsal) | `0x5225a67B81003B972005436EeA587B4147f86789` |
| Treasury (rehearsal, throwaway) | `0x7a27FBd9a533F72a057B91314e30a35bAE36EB19` |

**Round 3 tx hashes** (Base Sepolia):

| Step | Action | Tx hash |
|---|---|---|
| Mint 10 CCM | mint-treasury-phase1.ts | `0x250fc387af077f514445c9edd02dd0b676d4fabae35b67213eda607dcbfc716f` |
| Token: grant ADMIN → Timelock | transfer-admin-to-timelock.ts | `0x5560477120a64ad8316f5a62d0d0d0078c3b03ccf9ae4bf2b014f449829b3ee2` |
| Token: grant MINTER → Timelock | transfer-admin-to-timelock.ts | `0xd2abc87a3b46d46ae2a51ac1f92618155c711cb98a3444bf280164e7718c9d27` |
| Token: grant PAUSER → Timelock | transfer-admin-to-timelock.ts | `0x5d298fcaaddf448a8087b5574948853581282a7d6bfd5310d9f45c8e31df0d73` |
| Token: renounce PAUSER (deployer) | transfer-admin-to-timelock.ts | `0xc2f2b5953cabcbd3936c05aea1697104a0447b67ac8342aee79ff38ef8e752e5` |
| Token: renounce MINTER (deployer) | transfer-admin-to-timelock.ts | `0xeb348b2b3240b7bb6930ae923d851516c9542591b0d33d920823bf4bb75abb03` |
| Token: renounce ADMIN (deployer) | transfer-admin-to-timelock.ts | `0x5e195857cb3c80ee87e1076934d231eb2a2015ec1c6b97056d7435963d7955f8` |
| Vesting: grant ADMIN → Timelock | transfer-vesting-admin-to-timelock.ts | `0x104992b543978c4ccf352d0bf18a8ddaafef3b8e1e90812e3d6611a71072fcb8` |
| Vesting: grant SCHEDULE_MANAGER → Timelock | transfer-vesting-admin-to-timelock.ts | `0x92b7d69df738ebe9973589f94774daa1011b26f1f4a9b375402c6b444b14811f` |
| Vesting: renounce SCHEDULE_MANAGER (deployer) | transfer-vesting-admin-to-timelock.ts | `0x8de80b484889dfcb5b8f0e84fb1656501900d9a99ada1dd247fbf3f076e767a0` |
| Vesting: renounce ADMIN (deployer) | transfer-vesting-admin-to-timelock.ts | `0xe033e9a5c554999b259865e208812edadb5b86773fb10d25ba43328f66f01c63` |

---

## Phase 1 mainnet contract addresses

These are the contracts being migrated. DO NOT confuse with rehearsal addresses.

| Contract | Address |
|---|---|
| CCMToken (mainnet) | `0x398b2eB83C59890a01418b8D661e9A36a7c9d23d` |
| CCMVesting (mainnet) | `0x019B68683a8c31f4A8295215D8Da7f8Ec95582dc` |
| Deployer EOA (current admin) | `0xfcb1B5B833700E08714275E0DC321c534690E842` |

---

## Pre-flight checklist

Complete every item before issuing any mainnet transaction. A missed item can result in permanent loss of admin control.

### Environment

- [ ] `MAINNET_PRIVATE_KEY` is set to the deployer EOA private key (MetaMask or HW wallet export)
- [ ] `BASE_MAINNET_RPC` is set to a paid RPC endpoint (Alchemy or Infura). **Do not use the public `mainnet.base.org` endpoint** — stale-state risk under load
- [ ] `BASESCAN_API_KEY` is set (needed for contract verification in Step 3)
- [ ] Verify no `PRIVATE_KEY` in shell that shadows `MAINNET_PRIVATE_KEY` (run `env | grep PRIVATE`)

All env vars are read from `/Users/hyunsuklee/Developer/ccm/.env`. Hardhat config maps `MAINNET_PRIVATE_KEY` → `base` network accounts.

### Balances

- [ ] Deployer EOA (`0xfcb1B5B833700E08714275E0DC321c534690E842`) has at least **0.01 ETH on Base** for gas. The handoff is ~10 transactions; at 2026-05-13 Base gas rates, budget 0.005–0.01 ETH total.
- [ ] Governance Safe (to be deployed in Step 1) has at least **0.002 ETH on Base** to pay future Safe transaction fees

### Hardware wallet

- [ ] Hardware wallet (Ledger / Trezor) is connected and unlocked with the deployer EOA account visible in MetaMask
- [ ] Test a small outbound transaction (or sign a message) on Base mainnet to confirm the HW wallet is responsive before running any script

### Governance Safe

Before running Step 2 (Timelock deploy):

- [ ] Governance Safe is deployed at safe.global with exactly **5 owners** and **threshold 3** (3-of-5)
- [ ] All 5 owners have confirmed their wallet addresses on a test Safe transaction (sign a no-op message, confirm the event on each device)
- [ ] Safe address is recorded as `GOV_SAFE` in `.env`
- [ ] At least 3 of 5 Safe owners are available and responsive for the duration of the handoff session

### Script state

- [ ] `onchain/` dependencies are installed: `cd onchain && npm ci`
- [ ] Contracts compile clean: `npx hardhat compile --force`
- [ ] Unit tests pass: `npx hardhat test` (all tests pass before touching mainnet)

---

## Exact command sequence

Work from `cd /path/to/ccm/onchain` for all commands.

For each command, the variables `TOKEN_MAINNET`, `VESTING_MAINNET`, `TIMELOCK`, and `GOV_SAFE` refer to mainnet values recorded below as they are deployed. Fill them in as you go.

### Step 1: Deploy Governance Safe 3-of-5

**Do this via the Safe UI — not a script.**

1. Go to [safe.global](https://app.safe.global)
2. Create new Safe → Network: Base → Owners: add all 5 addresses → Threshold: 3
3. Deploy the Safe (this costs gas from the deployer or any funded address)
4. Record the Safe address:

```
GOV_SAFE=0x<safe_address>     # fill this in
```

Add to `/path/to/ccm/.env`:
```
GOV_SAFE=0x<safe_address>
```

**Stop point**: Do not proceed until the Safe is deployed and all 5 owners can sign a test transaction.

---

### Step 2: Deploy CCMTimelock

**Env required**: `MAINNET_PRIVATE_KEY`, `BASE_MAINNET_RPC`, `GOV_SAFE`

```bash
PROPOSERS=$GOV_SAFE \
EXECUTORS=$GOV_SAFE \
ADMIN=0x0000000000000000000000000000000000000000 \
MIN_DELAY=172800 \
  npx hardhat run scripts/deploy-timelock.ts --network base
```

**Expected output**:
```
Network  : base chainId 8453
Deployer : 0xfcb1B5B833700E08714275E0DC321c534690E842
Proposers: [ '<GOV_SAFE>' ]
Executors: [ '<GOV_SAFE>' ]
Admin    : 0x0000000000000000000000000000000000000000
minDelay : 172800 s (= 48.00 h )

CCMTimelock deployed: 0x<timelock_address>
```

Record:
```
TIMELOCK=0x<timelock_address>   # fill this in
```

Add to `.env`:
```
TIMELOCK=0x<timelock_address>
```

**Operator sign required**: The deployer EOA signs and submits this deploy tx via MetaMask / HW wallet.

---

### Step 3: Verify CCMTimelock on BaseScan

```bash
npx hardhat verify --network base $TIMELOCK $MIN_DELAY "[$GOV_SAFE]" "[$GOV_SAFE]" 0x0000000000000000000000000000000000000000
```

Or use the exact command printed at the end of Step 2's output. This is optional for the handoff to work but is strongly recommended so the public can inspect constructor arguments.

---

### Step 4: Token role handoff (6 transactions)

**Env required**: `MAINNET_PRIVATE_KEY`, `BASE_MAINNET_RPC`

```bash
TOKEN=0x398b2eB83C59890a01418b8D661e9A36a7c9d23d \
TIMELOCK=$TIMELOCK \
  npx hardhat run scripts/transfer-admin-to-timelock.ts --network base
```

**What this does** (in order):
1. `grantRole(DEFAULT_ADMIN_ROLE, Timelock)` — tx 1
2. `grantRole(MINTER_ROLE, Timelock)` — tx 2
3. `grantRole(PAUSER_ROLE, Timelock)` — tx 3
4. `renounceRole(PAUSER_ROLE, deployer)` — tx 4
5. `renounceRole(MINTER_ROLE, deployer)` — tx 5
6. `renounceRole(DEFAULT_ADMIN_ROLE, deployer)` — tx 6

**Operator sign required**: Each tx is signed by the deployer EOA via HW wallet. The script sends them sequentially and waits 2 confirmations between each.

**Critical**: After tx 6, the deployer permanently loses DEFAULT_ADMIN_ROLE on CCMToken. There is no recovery path. If Timelock is misconfigured (wrong proposer), the token is bricked. Verify `TIMELOCK` and `GOV_SAFE` before proceeding.

**Expected final output**:
```
Final role state:
  DEFAULT_ADMIN_ROLE   deployer=false  timelock=true
  MINTER_ROLE          deployer=false  timelock=true
  PAUSER_ROLE          deployer=false  timelock=true

6 tx(s) sent: 0x..., 0x..., 0x..., 0x..., 0x..., 0x...
```

---

### Step 5: Vesting role handoff (4 transactions)

**Env required**: `MAINNET_PRIVATE_KEY`, `BASE_MAINNET_RPC`

```bash
VESTING=0x019B68683a8c31f4A8295215D8Da7f8Ec95582dc \
TIMELOCK=$TIMELOCK \
  npx hardhat run scripts/transfer-vesting-admin-to-timelock.ts --network base
```

**What this does** (in order):
1. `grantRole(DEFAULT_ADMIN_ROLE, Timelock)` — tx 1
2. `grantRole(SCHEDULE_MANAGER_ROLE, Timelock)` — tx 2
3. `renounceRole(SCHEDULE_MANAGER_ROLE, deployer)` — tx 3
4. `renounceRole(DEFAULT_ADMIN_ROLE, deployer)` — tx 4

**Operator sign required**: Each tx signed by deployer EOA. After tx 4, deployer permanently loses all authority on CCMVesting.

**Expected final output**:
```
Final role state:
  DEFAULT_ADMIN_ROLE        deployer=false  timelock=true
  SCHEDULE_MANAGER_ROLE     deployer=false  timelock=true

4 tx(s) sent: 0x..., 0x..., 0x..., 0x...
```

---

### Step 6: Final verification (read-only, no transactions)

**Env required**: `BASE_MAINNET_RPC` only (read-only; no `MAINNET_PRIVATE_KEY` needed)

```bash
TOKEN=0x398b2eB83C59890a01418b8D661e9A36a7c9d23d \
VESTING=0x019B68683a8c31f4A8295215D8Da7f8Ec95582dc \
TIMELOCK=$TIMELOCK \
DEPLOYER=0xfcb1B5B833700E08714275E0DC321c534690E842 \
GOV_SAFE=$GOV_SAFE \
  npx hardhat run scripts/verify-phase2-handoff.ts --network base
```

**Expected output** (all 14 assertions must be ✓):
```
Phase 2 handoff verification:
  Token   : 0x398b2eB83C59890a01418b8D661e9A36a7c9d23d
  Vesting : 0x019B68683a8c31f4A8295215D8Da7f8Ec95582dc
  Timelock: 0x<timelock>
  Deployer: 0xfcb1B5B833700E08714275E0DC321c534690E842
  GovSafe : 0x<govSafe>

✓ Token.hasRole(ADMIN, deployer) = false
✓ Token.hasRole(MINTER, deployer) = false
✓ Token.hasRole(PAUSER, deployer) = false
✓ Token.hasRole(ADMIN, timelock) = true
✓ Token.hasRole(MINTER, timelock) = true
✓ Token.hasRole(PAUSER, timelock) = true
✓ Vesting.hasRole(ADMIN, deployer) = false
✓ Vesting.hasRole(SCHEDULE_MANAGER, deployer) = false
✓ Vesting.hasRole(ADMIN, timelock) = true
✓ Vesting.hasRole(SCHEDULE_MANAGER, timelock) = true
✓ Timelock.hasRole(PROPOSER, govSafe) = true
✓ Timelock.hasRole(EXECUTOR, govSafe) = true
✓ Timelock.hasRole(TIMELOCK_ADMIN, deployer) = false
✓ Timelock.getMinDelay() = 172800

✓ All Phase 2 handoff checks passed
```

**If any assertion fails**: STOP. Do not attempt remediation without understanding the exact state. The verifier output tells you which role is in the wrong state. Since the handoff scripts are idempotent, you can re-run the relevant script to correct a partial failure (as long as the deployer still holds `DEFAULT_ADMIN_ROLE` on the affected contract). If the deployer has already renounced `DEFAULT_ADMIN_ROLE`, recovery requires a Timelock-scheduled `grantRole`, which requires the Safe to be functional.

---

### Step 7: Update DEPLOYMENT.md

Add a "Phase 2 — Mainnet (Base, executed YYYY-MM-DD)" section to `onchain/DEPLOYMENT.md` with:
- Governance Safe address + safe.global link
- CCMTimelock address + BaseScan verify link
- All 10 handoff tx hashes (6 Token + 4 Vesting)
- Before/after role table
- Link to this runbook

---

## Timelock delay and post-execute flow

The Timelock enforces a **48-hour (172800 second) mandatory delay** on all operations. This is enforced on-chain by `CCMTimelock.sol` for chainId 8453 and 84532 — it cannot be shortened after deployment.

**Future mint flow (post-Phase 2)**:

1. Generate calldata with the mint helper:
```bash
TOKEN=0x398b2eB83C59890a01418b8D661e9A36a7c9d23d \
TIMELOCK=$TIMELOCK \
TREASURY=0x<treasury> \
AMOUNT_CCM=<amount> \
SALT_LABEL=ccm-mainnet-mint-<n> \
  npx hardhat run scripts/schedule-mint-via-timelock.ts --network base
```

2. Paste the STEP 1 (`schedule`) calldata into Safe Wallet → New Transaction → Contract Interaction → target: Timelock. Collect 3-of-5 signatures and submit.

3. Wait 48 hours. The pending operation is publicly visible on BaseScan.

4. Paste the STEP 2 (`execute`) calldata into Safe Wallet → New Transaction → Contract Interaction → target: Timelock. Collect 3-of-5 signatures and submit.

**Cancellation**: Any Safe owner can cancel a pending operation during the 48h window by having the Safe call `Timelock.cancel(operationId)`. Cancellation itself requires 3-of-5 signatures (single rogue owner cannot cancel alone).

---

## Stop points requiring operator action

The following steps require the operator to physically approve transactions on the hardware wallet. Plan for ~30 minutes of availability per step.

| Step | Action | HW wallet required |
|---|---|---|
| Step 1 | Deploy Safe (via safe.global UI) | Whichever wallet funds the deployment gas |
| Step 2 | Deploy CCMTimelock | Deployer EOA MetaMask + HW wallet |
| Step 4, tx 1–3 | Grant ADMIN/MINTER/PAUSER to Timelock on CCMToken | Deployer EOA MetaMask + HW wallet |
| Step 4, tx 4 | Renounce PAUSER on deployer | Deployer EOA MetaMask + HW wallet |
| Step 4, tx 5 | Renounce MINTER on deployer | Deployer EOA MetaMask + HW wallet |
| **Step 4, tx 6** | **Renounce DEFAULT_ADMIN on deployer (IRREVERSIBLE)** | Deployer EOA MetaMask + HW wallet |
| Step 5, tx 1–2 | Grant ADMIN/SCHEDULE_MANAGER to Timelock on CCMVesting | Deployer EOA MetaMask + HW wallet |
| Step 5, tx 3 | Renounce SCHEDULE_MANAGER on deployer | Deployer EOA MetaMask + HW wallet |
| **Step 5, tx 4** | **Renounce DEFAULT_ADMIN on deployer (IRREVERSIBLE)** | Deployer EOA MetaMask + HW wallet |

---

## IRREVERSIBLE POINT WARNING

**Once `DEFAULT_ADMIN_ROLE` is renounced by the deployer EOA on CCMToken (Step 4, tx 6), the deployer permanently loses all administrative authority over the token. There is no recovery path.**

Specifically:
- The deployer can never again call `grantRole`, `revokeRole`, or `renounceRole` on CCMToken as an admin
- The deployer can never call `mint`, `pause`, or `unpause` on CCMToken
- If the Governance Safe is lost (e.g., all 5 HW wallets destroyed), the protocol is permanently ungovernable on its current contracts
- If the Timelock was deployed with an incorrect `proposer` address, the protocol is bricked

**From this point forward, Timelock is the sole admin path. All privileged operations require 3-of-5 Safe signatures + 48-hour delay.**

The same applies for CCMVesting after Step 5, tx 4.

---

## Rollback considerations

**Before renouncing DEFAULT_ADMIN_ROLE** (before Step 4 tx 6 / Step 5 tx 4):

If anything looks wrong during the grant phase, the deployer can simply not proceed with the renounce phase. The scripts are idempotent and will skip already-completed grants on re-run. The grants can be reversed by calling `revokeRole` on the respective contract (since the deployer still holds `DEFAULT_ADMIN_ROLE`).

**After renouncing DEFAULT_ADMIN_ROLE**:

There is no rollback. The only forward path is through the Timelock:
1. Safe schedules `Token.grantRole(DEFAULT_ADMIN_ROLE, <new_admin>)` via Timelock
2. Wait 48 hours
3. Safe executes the scheduled operation

This requires the Safe to be functional with ≥ 3 responsive owners.

---

## RPC recommendation

Use a paid RPC for mainnet operations (Alchemy, Infura, or Coinbase's paid CDP tier). The public `mainnet.base.org` endpoint has known stale-state latency under load. Round 1 of the Sepolia rehearsal surfaced exactly this issue — `tx.wait(2)` was added to every state-mutation call to mitigate, but a paid RPC with lower stale-state risk is still strongly recommended for irreversible mainnet operations.

Set in `.env`:
```
BASE_MAINNET_RPC=https://base-mainnet.g.alchemy.com/v2/<key>
```

---

## Hardhat config note (dry-run only)

The hardhat.config.ts was updated on 2026-05-13 to add `mining: { auto: true, interval: 1000 }` to the `hardhat` network. This is required for `_dry-run-phase2.ts` to resolve `tx.wait(2)` correctly (without interval mining, the forked local node never mines the 2nd confirmation block). This setting has no effect on `baseSepolia` or `base` network runs.

---

## Emergency contacts

If Phase 2 execution encounters an unexpected state during the handoff:

1. **Stop immediately** — do not send the next transaction
2. Run the verifier read-only to capture exact state: `verify-phase2-handoff.ts`
3. If deployer still holds `DEFAULT_ADMIN_ROLE`, the situation is recoverable
4. Reach out to all 5 Safe owners to ensure they are available before resuming

---

*Runbook generated 2026-05-13. Based on Round 3 Sepolia rehearsal (clean, 14/14 ✓) and forked-mainnet dry-run (clean, all checks ✓).*
