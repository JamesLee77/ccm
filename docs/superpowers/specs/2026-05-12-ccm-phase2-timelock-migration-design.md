# CCM Phase 2 — Safe + Timelock Migration Design Spec

**Date**: 2026-05-12
**Status**: Draft for review
**Owner**: james.lee@finenex.net
**Network**: Base mainnet (chainId 8453)
**Scope**: Migrate CCMToken and CCMVesting admin from the deployer EOA to a Gnosis Safe 3-of-5 governance multisig routed through a 48-hour CCMTimelock. Prepare scripts in advance; execute on mainnet after Phase 1 is live and the Safe is funded.

**Predecessor**: `docs/superpowers/specs/2026-05-11-ccm-mainnet-deploy-design.md` (Phase 1, EOA admin)

---

## 1. Goal

Eliminate the single-key-of-failure that Phase 1 accepts. After Phase 2:
- Deployer EOA holds **zero** roles on any CCM contract.
- All privileged operations (mint, pause, role grant, vesting schedule create) require 3 of 5 Safe owners + a 48-hour Timelock delay.
- A hacker who compromises the deployer EOA cannot mint, pause, or alter governance.
- A KYC-operator who tries to admit a non-compliant address has a 48-hour window in which any other Safe owner can cancel before execution.

## 2. Out of scope

- KYC Registry deployment on mainnet (separate Phase 2.x track).
- CCMTGESale, CCMStaking, CCMMigration mainnet deploys (Phase 3+).
- Emergency-pause acceleration (the 48h delay applies to `pause()` as well; a hot circuit-breaker for true-emergency pause is a Phase 3 concern, called out in §11).
- Treasury custody (Treasury holds 10M CCM from Phase 1; this spec does not touch the Treasury balance). The Phase 1 design chose a Treasury EOA, so before Phase 2 governance handoff the operator should either (a) leave Treasury as EOA and accept its single-key risk separately, or (b) deploy a Treasury Safe and `transfer()` the 10M from the EOA before running Phase 2. Either path is compatible with this spec — Phase 2 only cares about Token/Vesting role membership. See §11 §4.

## 3. End-state architecture

```
Governance Safe (3-of-5)  ──proposer/executor──>  CCMTimelock (48h, self-administered)
                                                       │
                                                       │ DEFAULT_ADMIN_ROLE
                                                       │ MINTER_ROLE
                                                       │ PAUSER_ROLE
                                                       ├──> CCMToken
                                                       │
                                                       │ DEFAULT_ADMIN_ROLE
                                                       │ SCHEDULE_MANAGER_ROLE
                                                       └──> CCMVesting

Treasury (EOA or Safe — Phase 1 chose EOA)  ── ERC-20 transfer ──>  SAFT buyers
Deployer EOA                                ── all roles renounced ──> (no authority)
```

Key separations:
- **Governance Safe** approves protocol-level changes (mint, pause, role membership, vesting schedule creation). Every action passes through Timelock.
- **Treasury Safe** moves 10M CCM to SAFT buyers via plain `transfer()`. No protocol roles. Not affected by Phase 2 migration.
- **Timelock** is self-administered (`admin = address(0)`) — even the Timelock's own role membership can only be changed by scheduling against itself, which already requires Safe + 48h.

## 4. Contracts

| Contract | Source | Phase | Wiring |
|---|---|---|---|
| `CCMToken` | unchanged (already deployed in Phase 1) | Phase 1 | Roles migrated by Phase 2 scripts |
| `CCMVesting` | unchanged (already deployed in Phase 1) | Phase 1 | Roles migrated by Phase 2 scripts |
| `CCMTimelock` | `onchain/contracts/CCMTimelock.sol` (OZ TimelockController + 48h floor) | Phase 2 deploy | `minDelay=172800`, `proposers=[GovSafe]`, `executors=[GovSafe]`, `admin=0x0` |

No Solidity changes. Migration is purely role-transfer + Timelock deployment.

## 5. Scripts (5 deliverables)

| # | Path | Type | Purpose |
|---|---|---|---|
| 1 | `onchain/scripts/transfer-admin-to-timelock.ts` | Modify | Extend to also handle `MINTER_ROLE` (currently handles `DEFAULT_ADMIN_ROLE` + `PAUSER_ROLE` only). Grant ADMIN/MINTER/PAUSER to Timelock; renounce PAUSER → MINTER → ADMIN (admin last). |
| 2 | `onchain/scripts/transfer-vesting-admin-to-timelock.ts` | New | Same pattern for CCMVesting. Roles: `DEFAULT_ADMIN_ROLE` + `SCHEDULE_MANAGER_ROLE`. Renounce SCHEDULE_MANAGER → ADMIN. |
| 3 | `onchain/scripts/verify-phase2-handoff.ts` | New | Read-only: 12+ assertions confirming end-state (deployer roles all false, Timelock has all roles, Timelock proposer/executor is Safe, Timelock minDelay=172800, Timelock self-administered, etc.). |
| 4 | `onchain/scripts/_dry-run-phase2.ts` | New | Forked-mainnet rehearsal of full Phase 1 + Phase 2 end-to-end (deploy Token + Vesting + Timelock, run all 3 handoff scripts, run verify). |
| 5 | `onchain/scripts/schedule-mint-via-timelock.ts` | New | Helper CLI for post-Phase-2 mints: compose `Timelock.schedule(target=Token, data=mint(treasury, amount), ...)` calldata for a Safe owner to paste into Safe Wallet UI. Read-only (does not send tx). |

Common script properties:
- chainId guard: refuses mainnet unless `chainId === 8453n` (or `ALLOW_TESTNET=1` for Sepolia rehearsal).
- Address validation: every env-supplied address checked with `ethers.isAddress`, normalised with `ethers.getAddress` (EIP-55).
- Pre-flight sanity: scripts read the current state and reject if it's inconsistent with the expected starting state (e.g., refusing to renounce if grant didn't take effect).
- Idempotency: scripts can be re-run safely if a tx mined but the script crashed before the next step (e.g., `transfer-admin-to-timelock.ts` skips grants that already succeeded).

## 6. Migration sequence on mainnet

After Phase 1 is operational and Governance Safe is funded. Total: ~5–7 mainnet txs + Safe deploy gas + verify.

```
Step 1: Deploy Governance Safe 3-of-5 via safe.global (offchain UI)
        → record <GovSafe> address

Step 2: Deploy CCMTimelock
        PROPOSERS=<GovSafe> EXECUTORS=<GovSafe> ADMIN=0x0000...0000 MIN_DELAY=172800 \
          npx hardhat run scripts/deploy-timelock.ts --network base
        → record <Timelock> address + tx hash

Step 3: BaseScan verify Timelock
        npx hardhat verify --network base <Timelock> 172800 '[<GovSafe>]' '[<GovSafe>]' 0x0000...0000

Step 4: Token role handoff
        TOKEN=<TOKEN_MAINNET> TIMELOCK=<Timelock> \
          npx hardhat run scripts/transfer-admin-to-timelock.ts --network base
        → 6 txs: grant ADMIN, grant MINTER, grant PAUSER, renounce PAUSER, renounce MINTER, renounce ADMIN

Step 5: Vesting role handoff
        VESTING=<VESTING_MAINNET> TIMELOCK=<Timelock> \
          npx hardhat run scripts/transfer-vesting-admin-to-timelock.ts --network base
        → 4 txs: grant ADMIN, grant SCHEDULE_MANAGER, renounce SCHEDULE_MANAGER, renounce ADMIN

Step 6: Final verification
        TOKEN=<TOKEN_MAINNET> VESTING=<VESTING_MAINNET> TIMELOCK=<Timelock> \
        DEPLOYER=<DEPLOYER_EOA> GOV_SAFE=<GovSafe> \
          npx hardhat run scripts/verify-phase2-handoff.ts --network base
        → all assertions ✓

Step 7: Update DEPLOYMENT.md with Phase 2 section (Timelock address, Safe address, handoff tx hashes, verify link)
```

Renounce order on Token (Step 4 critical detail): PAUSER first, then MINTER, then ADMIN last. Once ADMIN is gone the deployer cannot rescue any other role they still hold. The script enforces this order; manual deviation is rejected.

## 7. Operational consequences

- **Future mints**: Safe 3 owners propose `Timelock.schedule(target=Token, data=mint(treasury, amount), ...)`. After 48h, Safe 3 owners propose `Timelock.execute(...)`. The pending mint is publicly visible on BaseScan during the 48h window. Helper script #5 generates the calldata; Safe Wallet UI handles the multisig signature collection.
- **KYC admit**: When CCMKYCRegistry is deployed on mainnet (separate track), its admin will also be Timelock. A grant to a non-compliant address requires Safe schedule → 48h → Safe execute, and any Safe owner can `Timelock.cancel(operationId)` during the window.
- **Emergency pause**: `pause()` also passes through Timelock. The 48h delay means a true emergency (zero-day exploit) cannot be reactively contained on-chain in Phase 2. This is an explicit trade-off — Phase 3 may introduce a separate fast-circuit-breaker role with a tighter SLA. Until then, response to an exploit is monitoring + economic deterrent (bug bounty) rather than on-chain pause.
- **Vesting schedule creation**: Each Foundation/Partner schedule = Safe + 48h + execute. SAFT buyers who need on-chain vesting see a 48h delay between their KYC clearance and their schedule taking effect.
- **Deployer key compromise after Phase 2**: zero impact on the protocol. The deployer EOA has no roles. The Treasury Safe and Governance Safe are separately controlled.

## 8. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Renounce order wrong (ADMIN renounced before MINTER) → deployer loses ability to renounce MINTER | Low | **Permanent partial admin** — MINTER stuck on deployer forever | Script enforces PAUSER → MINTER → ADMIN order; verify script catches the residue |
| Wrong `<GovSafe>` address passed to Timelock constructor | Low | **Catastrophic** — Timelock has wrong proposer; protocol is bricked until Timelock is replaced (which requires new Token deploy because admin is renounced) | Mandatory dry-run on forked mainnet using the actual Safe address; multi-eye review of Step 2 invocation; BaseScan verify in Step 3 confirms constructor args |
| Timelock deployed with `admin != 0x0` (e.g., deployer placeholder) | Low | **Important** — extra escalation path (anyone with the admin role can grant proposer/executor) | `verify-phase2-handoff.ts` asserts `Timelock.hasRole(TIMELOCK_ADMIN_ROLE, <anyone except Timelock itself>) === false` |
| Safe owner key lost before Step 4 → cannot reach 3-of-5 quorum | Low | **High** — protocol becomes unable to operate; needs costly migration (new Safe + new Timelock + new Token if MINTER is gone) | Hardware wallets for all 5 signers; pre-migration test: each owner signs a no-op message; minimum 3 owners with active keys before any handoff tx |
| Mid-handoff failure leaving deployer with partial roles | Medium | Medium — recoverable; deployer can re-run script | Script is idempotent: skips grants/renounces that already succeeded; verify script tells operator the exact remediation step needed |
| 48h pending mint visible on BaseScan spooks market | Medium | Low–Medium — narrative risk | IR / FAQ explaining "48h pending is governance feature, not unilateral action"; pre-announce planned mints in advance of `schedule` tx |
| Cancel race: malicious Safe owner cancels a legitimate pending mint at 47h59m | Low | Medium — operational disruption, not loss | Safe threshold is 3-of-5; single rogue owner cannot cancel alone (cancel needs proposer-role which is the Safe itself = 3 signatures); requires 3 colluding owners which is failure mode of the whole Safe |
| Bug in extended `transfer-admin-to-timelock.ts` that mishandles MINTER | Medium (new code) | **High** — could leave roles in wrong state | Hardhat unit tests for the script (mock token + mock timelock); forked-mainnet dry-run; Sepolia rehearsal against rehearsal token |

## 9. Testing strategy

1. **Hardhat unit tests** (new) — `onchain/test/Phase2Handoff.test.ts`:
   - Deploy fresh Token + Vesting + Timelock on local Hardhat
   - Run handoff script logic (importable function, not the full script entry point)
   - Assert: deployer roles all false, Timelock all roles, all 6+4 expected events emitted
   - Assert: renounce order is PAUSER → MINTER → ADMIN (Token) and SCHEDULE_MANAGER → ADMIN (Vesting)
   - Negative: refuses to run if deployer doesn't currently hold the expected roles
   - Negative: refuses if Timelock address is not actually a TimelockController (extcodesize / role-namespace check)

2. **Forked-mainnet dry-run** — `_dry-run-phase2.ts`:
   - `hardhat_reset` to fork Base mainnet
   - Run Phase 1 deploy (Token + Vesting + 10M mint)
   - Deploy Timelock with a mocked GovSafe address (e.g., a hardhat signer #1)
   - Run all 3 handoff scripts in sequence
   - Run `verify-phase2-handoff.ts`
   - Assert end-to-end state matches the spec

3. **Sepolia rehearsal** (operator-driven, post-script-completion):
   - Deploy a fresh Sepolia Timelock with the actual mainnet Safe address scheme but a Sepolia Safe instance
   - Run handoff against the existing Sepolia rehearsal token (`0xB5e5…3999`)
   - **Note**: The Sepolia rehearsal token was already handed off to Timelock-v1 in the 2026-05-09 rehearsal. For a fresh Phase 2 rehearsal, deploy a new Sepolia token first via `deploy-token.ts`.

The `verify-phase2-handoff.ts` script doubles as the assertion engine for both unit tests and the live verification.

## 10. Documentation deliverables

- **New section in `onchain/DEPLOYMENT.md`**: "Phase 2 — Mainnet (Base, executed YYYY-MM-DD)" with Safe address, Timelock address + verify link, handoff tx hashes, before/after role table, link to this spec.
- **Update `onchain/DEPLOYMENT.md` Phase 1 section preamble**: change "Phase 2 migration pending" → "Phase 2 executed YYYY-MM-DD, see below".
- **Optional**: short public-facing post explaining the migration to token holders and exchanges.

## 11. Open questions and Phase 3 callouts

1. **Emergency pause SLA**: 48h delay on `pause()` is too slow for a zero-day exploit. Phase 3 should introduce a separate `EMERGENCY_PAUSER_ROLE` granted to a small, fast-acting subset (e.g., 1-of-3 dedicated security multisig) with `unpause()` still requiring full Timelock. This is not in scope for Phase 2 but is the most consequential follow-up. Tracked here so it isn't forgotten.

2. **Safe owner identity finalisation**: who are the 5 governance Safe signers? This is a stakeholder/legal question, not a technical one. Phase 2 cannot execute until it is settled.

3. **Helper script #5 output format** — decided: prints (a) the Timelock target address, (b) the encoded ABI calldata for `Timelock.schedule(target=Token, value=0, data=mint(treasury,amount), predecessor=0x00, salt=keccak256("ccm-mainnet-mint-<n>"), delay=172800)`, and (c) the same for the matching `Timelock.execute(...)` call that the operator runs after 48h. Both as 0x-hex strings the operator pastes into Safe Wallet's "Contract Interaction" → "Custom data" field. Safe Transaction Service direct API submission deferred to Phase 3 if it proves painful.

4. **Treasury Safe migration**: Phase 1 used a Treasury EOA (per `2026-05-11-ccm-mainnet-deploy-design.md` user decision Q1, picking Option B which had Treasury as EOA). Phase 2 spec assumes Treasury is now a Safe. If the user still has Treasury as EOA at the time Phase 2 runs, a separate one-time `Token.transfer(<TreasurySafe>, balance)` from the EOA must happen *before* Phase 2 governance handoff (so the EOA can still sign). This is a Phase 1.5 task, not part of this spec.

5. **Phase 2 timing**: should this run immediately after Phase 1 mint (same day), or after a settle-in period? Trade-off: same-day means investors see a clean governance state up-front; settle-in means more time to detect Phase 1 issues before locking in roles. Recommend: 48–72h settle-in, then Phase 2.
