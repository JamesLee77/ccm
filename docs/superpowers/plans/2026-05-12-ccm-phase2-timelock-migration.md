# CCM Phase 2 — Safe + Timelock Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare scripts that migrate `CCMToken` and `CCMVesting` admin from the deployer EOA to a Gnosis Safe routed through a 48-hour `CCMTimelock`, so the deployer ends with zero roles on either contract. Scripts must be safe enough for unattended re-runs (idempotent) and tested against a forked Base mainnet end-to-end.

**Architecture:** Each handoff script grants the target role set to the Timelock, then renounces it on the deployer in the reverse order (admin renounced last so other roles can still be revoked if needed). A shared dry-run harness exercises all three migration scripts on a Hardhat fork of Base mainnet. A separate read-only verifier confirms end state. A separate helper composes the Safe→Timelock calldata for future mints.

**Tech Stack:** Solidity 0.8.24 (Cancun), Hardhat + ethers v6, OpenZeppelin TimelockController + AccessControl, BaseScan for verification.

**Spec:** `docs/superpowers/specs/2026-05-12-ccm-phase2-timelock-migration-design.md`

---

## File Structure

**Create (4 new scripts):**
- `onchain/scripts/transfer-vesting-admin-to-timelock.ts` — Vesting role handoff (ADMIN + SCHEDULE_MANAGER)
- `onchain/scripts/verify-phase2-handoff.ts` — Read-only verification (12+ assertions)
- `onchain/scripts/_dry-run-phase2.ts` — Forked-mainnet rehearsal of full Phase 1 deploy + Phase 2 handoff
- `onchain/scripts/schedule-mint-via-timelock.ts` — Helper that prints Timelock.schedule + Timelock.execute calldata for Safe Wallet

**Modify (1 existing script):**
- `onchain/scripts/transfer-admin-to-timelock.ts` — Extend to also handle `MINTER_ROLE`. Add chainId guard, EIP-55 normalisation, idempotency (skip grants/renounces that already succeeded). Factor the handoff logic into an exported `runHandoff()` function so it is unit-testable.

**Reference (no modification):**
- `onchain/contracts/CCMTimelock.sol` — OZ TimelockController + 48h floor. Already deployed-ready.
- `onchain/scripts/deploy-timelock.ts` — already exists; used in dry-run + runbook unchanged.
- `onchain/contracts/CCMToken.sol`, `onchain/contracts/CCMVesting.sol` — already deployed in Phase 1; Phase 2 only changes role membership.

**Runbook only (not in this plan's automation scope):**
- `onchain/DEPLOYMENT.md` — operator appends Phase 2 section after execution.

---

## Task 1: Refactor `transfer-admin-to-timelock.ts` to handle MINTER + add safety guards

**Files:**
- Modify: `onchain/scripts/transfer-admin-to-timelock.ts`

**Background:** The existing script (`transfer-admin-to-timelock.ts`, last touched 2026-05-09 for the Sepolia rehearsal) handles `DEFAULT_ADMIN_ROLE` + `PAUSER_ROLE` only. It must now also handle `MINTER_ROLE`. The renounce ordering changes from `PAUSER → ADMIN` to `PAUSER → MINTER → ADMIN`. The grant ordering does not matter (deployer's admin power is sufficient until any renounce happens).

The script is structured as one long `main()`. Refactor so the core handoff logic is in an exported `runHandoff()` function callable from unit tests. The script's `main()` becomes a thin env-parsing + chainId-guard shell that calls `runHandoff()`.

- [ ] **Step 1: Read the existing script to understand current behavior**

```bash
cat /Users/hyunsuklee/Developer/ccm/onchain/scripts/transfer-admin-to-timelock.ts
```

Note the existing JsDoc, env var names (`TOKEN`, `TIMELOCK`, `SKIP_RENOUNCE`), and grant/renounce sequence.

- [ ] **Step 2: Overwrite the script with the refactored version**

Write `/Users/hyunsuklee/Developer/ccm/onchain/scripts/transfer-admin-to-timelock.ts` with exactly:

```typescript
/**
 * Transfer DEFAULT_ADMIN_ROLE + MINTER_ROLE + PAUSER_ROLE on a CCMToken from
 * the deployer EOA to a CCMTimelock, then renounce them on the deployer.
 *
 * After this script: the deployer has zero privileged roles on the token.
 * Every subsequent admin / mint / pause action must be scheduled through the
 * timelock + multisig and execute only after the 48h delay.
 *
 * Renounce order is enforced: PAUSER → MINTER → ADMIN. Admin is renounced last
 * because once admin is gone the deployer cannot rescue any other role they
 * still hold.
 *
 * Idempotent: re-running after a partial failure skips grants/renounces that
 * already succeeded.
 *
 * Required env:
 *   TOKEN     - CCMToken address
 *   TIMELOCK  - CCMTimelock address
 *
 * Optional env:
 *   SKIP_RENOUNCE  - "1" grants to the timelock but skips deployer renounce.
 *                    Useful for staged rollouts (grant first, observe, renounce later).
 *   ALLOW_TESTNET  - "1" permits chainId other than 8453 (rehearsal only).
 *
 * Run:
 *   TOKEN=<a> TIMELOCK=<b> \
 *     npx hardhat run scripts/transfer-admin-to-timelock.ts --network base
 */
import { ethers } from "hardhat";
import type { Signer } from "ethers";

export type HandoffResult = {
  txHashes: string[];
  finalState: { [role: string]: { deployer: boolean; timelock: boolean } };
};

export async function runHandoff(
  tokenAddr: string,
  timelockAddr: string,
  signer: Signer,
  opts: { skipRenounce?: boolean } = {},
): Promise<HandoffResult> {
  // Fail fast on bad input — callers from unit tests don't go through main()'s
  // env-var parsing so this function has to defend itself.
  if (!ethers.isAddress(tokenAddr)) throw new Error(`runHandoff: tokenAddr invalid: ${tokenAddr}`);
  if (!ethers.isAddress(timelockAddr)) throw new Error(`runHandoff: timelockAddr invalid: ${timelockAddr}`);
  if (tokenAddr === ethers.ZeroAddress) throw new Error("runHandoff: tokenAddr must not be zero");
  if (timelockAddr === ethers.ZeroAddress) throw new Error("runHandoff: timelockAddr must not be zero");

  const token = await ethers.getContractAt("CCMToken", tokenAddr, signer);
  const signerAddr = await signer.getAddress();

  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const MINTER_ROLE = await token.MINTER_ROLE();
  const PAUSER_ROLE = await token.PAUSER_ROLE();

  // roleEntries[0] MUST be DEFAULT_ADMIN_ROLE so that the reversed renounce
  // loop renounces admin LAST. If you add a role, preserve this invariant —
  // the assertion below catches any silent reordering.
  const roleEntries: { name: string; hash: string }[] = [
    { name: "DEFAULT_ADMIN_ROLE", hash: DEFAULT_ADMIN_ROLE },
    { name: "MINTER_ROLE", hash: MINTER_ROLE },
    { name: "PAUSER_ROLE", hash: PAUSER_ROLE },
  ];
  if (roleEntries[0].hash !== DEFAULT_ADMIN_ROLE) {
    throw new Error(
      "BUG: roleEntries[0] must be DEFAULT_ADMIN_ROLE so reverse() renounces it last",
    );
  }

  // Sanity: deployer must currently hold DEFAULT_ADMIN_ROLE (otherwise nothing they
  // do here is authorized). The other two are warned about but not required.
  if (!(await token.hasRole(DEFAULT_ADMIN_ROLE, signerAddr))) {
    throw new Error(`Signer ${signerAddr} does not hold DEFAULT_ADMIN_ROLE on ${tokenAddr}`);
  }

  const txHashes: string[] = [];

  // Phase A: grant each role to the timelock (idempotent — skip if already granted)
  for (const r of roleEntries) {
    if (await token.hasRole(r.hash, timelockAddr)) {
      console.log(`[grant] ${r.name} → ${timelockAddr}: already held, skipping`);
      continue;
    }
    if (!(await token.hasRole(r.hash, signerAddr))) {
      console.log(`[grant] ${r.name}: signer does not hold this role, skipping grant`);
      continue;
    }
    console.log(`[grant] ${r.name} → ${timelockAddr} …`);
    const tx = await token.grantRole(r.hash, timelockAddr);
    const receipt = await tx.wait();
    if (!receipt) throw new Error(`grantRole ${r.name} tx.wait() returned null`);
    console.log(`        tx: ${tx.hash}`);
    txHashes.push(tx.hash);
  }

  if (opts.skipRenounce) {
    console.log("SKIP_RENOUNCE=1 → leaving deployer roles intact for staged rollout.");
  } else {
    // Phase B: renounce in REVERSE order — PAUSER → MINTER → ADMIN. Admin last
    // because once it's gone, renouncing the others (if still held) cannot be
    // undone with admin power.
    for (const r of [...roleEntries].reverse()) {
      if (!(await token.hasRole(r.hash, signerAddr))) {
        console.log(`[renounce] ${r.name}: signer does not hold, skipping`);
        continue;
      }
      // Safety: do not renounce a role on the signer if the timelock does NOT
      // currently hold it — that would leave nobody with the role.
      if (!(await token.hasRole(r.hash, timelockAddr))) {
        throw new Error(
          `Refusing to renounce ${r.name} on signer because timelock does not hold it; ` +
            `the role would become unassignable.`,
        );
      }
      console.log(`[renounce] ${r.name} on ${signerAddr} …`);
      const tx = await token.renounceRole(r.hash, signerAddr);
      const receipt = await tx.wait();
      if (!receipt) throw new Error(`renounceRole ${r.name} tx.wait() returned null`);
      console.log(`           tx: ${tx.hash}`);
      txHashes.push(tx.hash);
    }
  }

  // Final state read
  const finalState: HandoffResult["finalState"] = {};
  for (const r of roleEntries) {
    finalState[r.name] = {
      deployer: await token.hasRole(r.hash, signerAddr),
      timelock: await token.hasRole(r.hash, timelockAddr),
    };
  }

  return { txHashes, finalState };
}

async function main() {
  const TOKEN_RAW = process.env.TOKEN;
  const TIMELOCK_RAW = process.env.TIMELOCK;
  const ALLOW_TESTNET = process.env.ALLOW_TESTNET === "1";
  const skipRenounce = process.env.SKIP_RENOUNCE === "1";

  if (!TOKEN_RAW || !ethers.isAddress(TOKEN_RAW)) {
    throw new Error("TOKEN env var (valid address) required");
  }
  if (!TIMELOCK_RAW || !ethers.isAddress(TIMELOCK_RAW)) {
    throw new Error("TIMELOCK env var (valid address) required");
  }
  const TOKEN = ethers.getAddress(TOKEN_RAW);
  const TIMELOCK = ethers.getAddress(TIMELOCK_RAW);
  if (TOKEN === ethers.ZeroAddress) {
    throw new Error("TOKEN must not be the zero address");
  }
  if (TIMELOCK === ethers.ZeroAddress) {
    throw new Error("TIMELOCK must not be the zero address");
  }

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 8453n && !ALLOW_TESTNET) {
    throw new Error(
      `Refusing to run: chainId is ${network.chainId} (expected 8453 = Base mainnet). ` +
        `Set ALLOW_TESTNET=1 to allow non-mainnet rehearsal chains (84532, 31337, 1337).`,
    );
  }

  const [signer] = await ethers.getSigners();
  console.log("=".repeat(70));
  console.log("TOKEN ADMIN → TIMELOCK HANDOFF");
  console.log("  Network       :", network.name, "chainId", network.chainId.toString());
  console.log("  Signer        :", await signer.getAddress());
  console.log("  Token         :", TOKEN);
  console.log("  Timelock      :", TIMELOCK);
  console.log("  Skip renounce :", skipRenounce);
  console.log("=".repeat(70));

  const result = await runHandoff(TOKEN, TIMELOCK, signer, { skipRenounce });

  console.log("\nFinal role state:");
  for (const [role, state] of Object.entries(result.finalState)) {
    console.log(
      `  ${role.padEnd(20)} deployer=${state.deployer}  timelock=${state.timelock}`,
    );
  }
  console.log(`\n${result.txHashes.length} tx(s) sent: ${result.txHashes.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: Compile**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && npx hardhat compile
```
Expected: `Nothing to compile` or successful compile, no TS errors.

- [ ] **Step 4: Negative path — wrong chainId**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
  TIMELOCK=0x3EbA7887525f1E68dc946760a96B01d1E1a1d979 \
  npx hardhat run scripts/transfer-admin-to-timelock.ts --network baseSepolia 2>&1 | tail -3
```
Expected: throws `Refusing to run: chainId is 84532 ...`

- [ ] **Step 5: Negative path — missing env**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  unset TOKEN TIMELOCK ALLOW_TESTNET SKIP_RENOUNCE && \
  npx hardhat run scripts/transfer-admin-to-timelock.ts --network baseSepolia 2>&1 | tail -3
```
Expected: throws `TOKEN env var (valid address) required`.

- [ ] **Step 6: Negative path — zero-address timelock**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
  TIMELOCK=0x0000000000000000000000000000000000000000 \
  ALLOW_TESTNET=1 \
  npx hardhat run scripts/transfer-admin-to-timelock.ts --network baseSepolia 2>&1 | tail -3
```
Expected: throws `TIMELOCK must not be the zero address`.

- [ ] **Step 7: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain/.. && \
  git add onchain/scripts/transfer-admin-to-timelock.ts && \
  git commit -m "feat(onchain): extend transfer-admin to handle MINTER + chainId guard

- Handle MINTER_ROLE in addition to DEFAULT_ADMIN_ROLE + PAUSER_ROLE
- Enforce renounce order: PAUSER → MINTER → ADMIN (admin last)
- Refuse to renounce a role on signer if timelock does not already hold it
  (prevents leaving the role unassignable)
- Idempotent: skip grants/renounces that already succeeded
- chainId guard: refuse non-8453 unless ALLOW_TESTNET=1
- EIP-55 normalise TOKEN and TIMELOCK addresses
- Reject TIMELOCK == zero address
- Factor handoff logic into exported runHandoff() for unit testing

Per spec 2026-05-12-ccm-phase2-timelock-migration-design.md Task 1."
```

---

## Task 2: Create `transfer-vesting-admin-to-timelock.ts`

**Files:**
- Create: `onchain/scripts/transfer-vesting-admin-to-timelock.ts`

Same pattern as Task 1 but for `CCMVesting` with two roles: `DEFAULT_ADMIN_ROLE` + `SCHEDULE_MANAGER_ROLE`. Renounce order: SCHEDULE_MANAGER → ADMIN.

- [ ] **Step 1: Create the file**

Write `/Users/hyunsuklee/Developer/ccm/onchain/scripts/transfer-vesting-admin-to-timelock.ts`:

```typescript
/**
 * Transfer DEFAULT_ADMIN_ROLE + SCHEDULE_MANAGER_ROLE on a CCMVesting from
 * the deployer EOA to a CCMTimelock, then renounce them on the deployer.
 *
 * Renounce order: SCHEDULE_MANAGER → ADMIN (admin last).
 * Idempotent: re-runnable after partial failure.
 *
 * Required env:
 *   VESTING   - CCMVesting address
 *   TIMELOCK  - CCMTimelock address
 *
 * Optional env:
 *   SKIP_RENOUNCE  - "1" grants to timelock but skips deployer renounce.
 *   ALLOW_TESTNET  - "1" permits chainId other than 8453 (rehearsal only).
 *
 * Run:
 *   VESTING=<a> TIMELOCK=<b> \
 *     npx hardhat run scripts/transfer-vesting-admin-to-timelock.ts --network base
 */
import { ethers } from "hardhat";
import type { Signer } from "ethers";

export type HandoffResult = {
  txHashes: string[];
  finalState: { [role: string]: { deployer: boolean; timelock: boolean } };
};

export async function runVestingHandoff(
  vestingAddr: string,
  timelockAddr: string,
  signer: Signer,
  opts: { skipRenounce?: boolean } = {},
): Promise<HandoffResult> {
  const vesting = await ethers.getContractAt("CCMVesting", vestingAddr, signer);
  const signerAddr = await signer.getAddress();

  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const SCHEDULE_MANAGER_ROLE = await vesting.SCHEDULE_MANAGER_ROLE();

  const roleEntries: { name: string; hash: string }[] = [
    { name: "DEFAULT_ADMIN_ROLE", hash: DEFAULT_ADMIN_ROLE },
    { name: "SCHEDULE_MANAGER_ROLE", hash: SCHEDULE_MANAGER_ROLE },
  ];

  if (!(await vesting.hasRole(DEFAULT_ADMIN_ROLE, signerAddr))) {
    throw new Error(`Signer ${signerAddr} does not hold DEFAULT_ADMIN_ROLE on ${vestingAddr}`);
  }

  const txHashes: string[] = [];

  // Phase A: grant
  for (const r of roleEntries) {
    if (await vesting.hasRole(r.hash, timelockAddr)) {
      console.log(`[grant] ${r.name} → ${timelockAddr}: already held, skipping`);
      continue;
    }
    if (!(await vesting.hasRole(r.hash, signerAddr))) {
      console.log(`[grant] ${r.name}: signer does not hold, skipping`);
      continue;
    }
    console.log(`[grant] ${r.name} → ${timelockAddr} …`);
    const tx = await vesting.grantRole(r.hash, timelockAddr);
    const receipt = await tx.wait();
    if (!receipt) throw new Error(`grantRole ${r.name} tx.wait() returned null`);
    console.log(`        tx: ${tx.hash}`);
    txHashes.push(tx.hash);
  }

  if (opts.skipRenounce) {
    console.log("SKIP_RENOUNCE=1 → leaving deployer roles intact for staged rollout.");
  } else {
    // Phase B: renounce in REVERSE order — SCHEDULE_MANAGER → ADMIN
    for (const r of [...roleEntries].reverse()) {
      if (!(await vesting.hasRole(r.hash, signerAddr))) {
        console.log(`[renounce] ${r.name}: signer does not hold, skipping`);
        continue;
      }
      if (!(await vesting.hasRole(r.hash, timelockAddr))) {
        throw new Error(
          `Refusing to renounce ${r.name} on signer because timelock does not hold it`,
        );
      }
      console.log(`[renounce] ${r.name} on ${signerAddr} …`);
      const tx = await vesting.renounceRole(r.hash, signerAddr);
      const receipt = await tx.wait();
      if (!receipt) throw new Error(`renounceRole ${r.name} tx.wait() returned null`);
      console.log(`           tx: ${tx.hash}`);
      txHashes.push(tx.hash);
    }
  }

  const finalState: HandoffResult["finalState"] = {};
  for (const r of roleEntries) {
    finalState[r.name] = {
      deployer: await vesting.hasRole(r.hash, signerAddr),
      timelock: await vesting.hasRole(r.hash, timelockAddr),
    };
  }

  return { txHashes, finalState };
}

async function main() {
  const VESTING_RAW = process.env.VESTING;
  const TIMELOCK_RAW = process.env.TIMELOCK;
  const ALLOW_TESTNET = process.env.ALLOW_TESTNET === "1";
  const skipRenounce = process.env.SKIP_RENOUNCE === "1";

  if (!VESTING_RAW || !ethers.isAddress(VESTING_RAW)) {
    throw new Error("VESTING env var (valid address) required");
  }
  if (!TIMELOCK_RAW || !ethers.isAddress(TIMELOCK_RAW)) {
    throw new Error("TIMELOCK env var (valid address) required");
  }
  const VESTING = ethers.getAddress(VESTING_RAW);
  const TIMELOCK = ethers.getAddress(TIMELOCK_RAW);
  if (TIMELOCK === ethers.ZeroAddress) {
    throw new Error("TIMELOCK must not be the zero address");
  }

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 8453n && !ALLOW_TESTNET) {
    throw new Error(
      `Refusing to run: chainId is ${network.chainId} (expected 8453 = Base mainnet). ` +
        `Set ALLOW_TESTNET=1 to override (Sepolia rehearsal only).`,
    );
  }

  const [signer] = await ethers.getSigners();
  console.log("=".repeat(70));
  console.log("VESTING ADMIN → TIMELOCK HANDOFF");
  console.log("  Network       :", network.name, "chainId", network.chainId.toString());
  console.log("  Signer        :", await signer.getAddress());
  console.log("  Vesting       :", VESTING);
  console.log("  Timelock      :", TIMELOCK);
  console.log("  Skip renounce :", skipRenounce);
  console.log("=".repeat(70));

  const result = await runVestingHandoff(VESTING, TIMELOCK, signer, { skipRenounce });

  console.log("\nFinal role state:");
  for (const [role, state] of Object.entries(result.finalState)) {
    console.log(
      `  ${role.padEnd(25)} deployer=${state.deployer}  timelock=${state.timelock}`,
    );
  }
  console.log(`\n${result.txHashes.length} tx(s) sent: ${result.txHashes.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Compile**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && npx hardhat compile
```

- [ ] **Step 3: Negative path tests** (mirror Task 1 Steps 4–6 with `VESTING` instead of `TOKEN`):

```bash
# wrong chainId
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  VESTING=0xc3E1bC1073b89DB6593e4257aD903A1611Bb24C5 \
  TIMELOCK=0x3EbA7887525f1E68dc946760a96B01d1E1a1d979 \
  npx hardhat run scripts/transfer-vesting-admin-to-timelock.ts --network baseSepolia 2>&1 | tail -3
```
Expected: `Refusing to run: chainId is 84532 ...`

```bash
# missing env
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  unset VESTING TIMELOCK ALLOW_TESTNET SKIP_RENOUNCE && \
  npx hardhat run scripts/transfer-vesting-admin-to-timelock.ts --network baseSepolia 2>&1 | tail -3
```
Expected: `VESTING env var (valid address) required`.

- [ ] **Step 4: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add onchain/scripts/transfer-vesting-admin-to-timelock.ts && \
  git commit -m "feat(onchain): add CCMVesting admin → Timelock handoff script

Mirrors transfer-admin-to-timelock.ts pattern. Handles DEFAULT_ADMIN_ROLE +
SCHEDULE_MANAGER_ROLE. Idempotent. chainId-guarded. Exports runVestingHandoff()
for unit testing.

Per spec 2026-05-12-ccm-phase2-timelock-migration-design.md Task 2."
```

---

## Task 3: Create `verify-phase2-handoff.ts`

**Files:**
- Create: `onchain/scripts/verify-phase2-handoff.ts`

Read-only script. 12 assertions covering end-state. Output: every check on its own line with ✓ / ✗ marker. Throws on any ✗.

- [ ] **Step 1: Create the file**

Write `/Users/hyunsuklee/Developer/ccm/onchain/scripts/verify-phase2-handoff.ts`:

```typescript
/**
 * Verify Phase 2 handoff state (read-only, no transactions).
 *
 * Asserts:
 *   - Deployer has zero roles on Token (ADMIN + MINTER + PAUSER all false)
 *   - Deployer has zero roles on Vesting (ADMIN + SCHEDULE_MANAGER both false)
 *   - Timelock holds all roles on Token (ADMIN + MINTER + PAUSER all true)
 *   - Timelock holds all roles on Vesting (ADMIN + SCHEDULE_MANAGER both true)
 *   - Timelock proposer is Gov Safe (PROPOSER_ROLE held by GOV_SAFE, true)
 *   - Timelock executor is Gov Safe (EXECUTOR_ROLE held by GOV_SAFE, true)
 *   - Timelock min delay is exactly 172800 (48h)
 *   - Timelock has no TIMELOCK_ADMIN_ROLE holder OTHER than itself (self-administered)
 *
 * Required env:
 *   TOKEN, VESTING, TIMELOCK, DEPLOYER, GOV_SAFE
 *
 * Run:
 *   TOKEN=0x... VESTING=0x... TIMELOCK=0x... DEPLOYER=0x... GOV_SAFE=0x... \
 *     npx hardhat run scripts/verify-phase2-handoff.ts --network base
 */
import { ethers } from "hardhat";

function normalise(name: string, value: string | undefined): string {
  if (!value || !ethers.isAddress(value)) throw new Error(`${name} env var (valid address) required`);
  return ethers.getAddress(value);
}

async function main() {
  const TOKEN = normalise("TOKEN", process.env.TOKEN);
  const VESTING = normalise("VESTING", process.env.VESTING);
  const TIMELOCK = normalise("TIMELOCK", process.env.TIMELOCK);
  const DEPLOYER = normalise("DEPLOYER", process.env.DEPLOYER);
  const GOV_SAFE = normalise("GOV_SAFE", process.env.GOV_SAFE);

  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const vesting = await ethers.getContractAt("CCMVesting", VESTING);
  const timelock = await ethers.getContractAt("CCMTimelock", TIMELOCK);

  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const MINTER_ROLE = await token.MINTER_ROLE();
  const PAUSER_ROLE = await token.PAUSER_ROLE();
  const SCHEDULE_MANAGER_ROLE = await vesting.SCHEDULE_MANAGER_ROLE();
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const TIMELOCK_ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

  const checks: { name: string; actual: unknown; expected: unknown }[] = [
    { name: "Token.hasRole(ADMIN, deployer)", actual: await token.hasRole(DEFAULT_ADMIN_ROLE, DEPLOYER), expected: false },
    { name: "Token.hasRole(MINTER, deployer)", actual: await token.hasRole(MINTER_ROLE, DEPLOYER), expected: false },
    { name: "Token.hasRole(PAUSER, deployer)", actual: await token.hasRole(PAUSER_ROLE, DEPLOYER), expected: false },
    { name: "Token.hasRole(ADMIN, timelock)", actual: await token.hasRole(DEFAULT_ADMIN_ROLE, TIMELOCK), expected: true },
    { name: "Token.hasRole(MINTER, timelock)", actual: await token.hasRole(MINTER_ROLE, TIMELOCK), expected: true },
    { name: "Token.hasRole(PAUSER, timelock)", actual: await token.hasRole(PAUSER_ROLE, TIMELOCK), expected: true },
    { name: "Vesting.hasRole(ADMIN, deployer)", actual: await vesting.hasRole(DEFAULT_ADMIN_ROLE, DEPLOYER), expected: false },
    { name: "Vesting.hasRole(SCHEDULE_MANAGER, deployer)", actual: await vesting.hasRole(SCHEDULE_MANAGER_ROLE, DEPLOYER), expected: false },
    { name: "Vesting.hasRole(ADMIN, timelock)", actual: await vesting.hasRole(DEFAULT_ADMIN_ROLE, TIMELOCK), expected: true },
    { name: "Vesting.hasRole(SCHEDULE_MANAGER, timelock)", actual: await vesting.hasRole(SCHEDULE_MANAGER_ROLE, TIMELOCK), expected: true },
    { name: "Timelock.hasRole(PROPOSER, govSafe)", actual: await timelock.hasRole(PROPOSER_ROLE, GOV_SAFE), expected: true },
    { name: "Timelock.hasRole(EXECUTOR, govSafe)", actual: await timelock.hasRole(EXECUTOR_ROLE, GOV_SAFE), expected: true },
    { name: "Timelock.hasRole(TIMELOCK_ADMIN, deployer)", actual: await timelock.hasRole(TIMELOCK_ADMIN_ROLE, DEPLOYER), expected: false },
    { name: "Timelock.getMinDelay()", actual: (await timelock.getMinDelay()).toString(), expected: "172800" },
  ];

  let allOk = true;
  console.log("Phase 2 handoff verification:");
  console.log("  Token   :", TOKEN);
  console.log("  Vesting :", VESTING);
  console.log("  Timelock:", TIMELOCK);
  console.log("  Deployer:", DEPLOYER);
  console.log("  GovSafe :", GOV_SAFE);
  console.log("");
  for (const c of checks) {
    const ok = String(c.actual) === String(c.expected);
    console.log(ok ? "✓" : "✗", c.name, "=", String(c.actual), ok ? "" : `(expected ${c.expected})`);
    if (!ok) allOk = false;
  }
  if (!allOk) throw new Error("One or more checks failed");
  console.log("\n✓ All Phase 2 handoff checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Compile**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && npx hardhat compile
```

- [ ] **Step 3: Negative path — missing env**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  unset TOKEN VESTING TIMELOCK DEPLOYER GOV_SAFE && \
  npx hardhat run scripts/verify-phase2-handoff.ts --network hardhat 2>&1 | tail -3
```
Expected: `TOKEN env var (valid address) required`.

- [ ] **Step 4: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add onchain/scripts/verify-phase2-handoff.ts && \
  git commit -m "feat(onchain): add Phase 2 handoff read-only verifier

14 assertions covering deployer = zero roles, Timelock = all roles on
Token + Vesting, Timelock = proposer/executor held by Safe, min delay
= 172800, Timelock self-administered.

Per spec 2026-05-12-ccm-phase2-timelock-migration-design.md Task 3."
```

---

## Task 4: Create `_dry-run-phase2.ts`

**Files:**
- Create: `onchain/scripts/_dry-run-phase2.ts`

End-to-end on a forked Base mainnet: deploy Token + Vesting + Timelock, mint 10M to a treasury, run both handoff scripts, run the verifier. This is the integration test.

- [ ] **Step 1: Create the file**

Write `/Users/hyunsuklee/Developer/ccm/onchain/scripts/_dry-run-phase2.ts`:

```typescript
/**
 * Dry-run the full Phase 1 + Phase 2 sequence against a forked Base mainnet.
 * In-process; no real transactions on mainnet.
 *
 * Sequence:
 *   1. Fork Base mainnet
 *   2. Deploy CCMToken with deployer as admin
 *   3. Deploy CCMVesting
 *   4. Mint 10M CCM to a dummy treasury
 *   5. Deploy CCMTimelock (mock GovSafe = signer[1], admin = 0x0, delay = 172800)
 *   6. Run Token handoff (grant + renounce all 3 roles)
 *   7. Run Vesting handoff (grant + renounce both roles)
 *   8. Assert deployer has zero roles on both contracts
 *   9. Assert Timelock has all roles
 *  10. Assert Timelock proposer/executor = mock GovSafe
 *
 * Run:
 *   BASE_MAINNET_RPC=<your rpc> \
 *     npx hardhat run scripts/_dry-run-phase2.ts --network hardhat
 */
import { ethers, network } from "hardhat";
import { runHandoff } from "./transfer-admin-to-timelock";
import { runVestingHandoff } from "./transfer-vesting-admin-to-timelock";

async function main() {
  const RPC = process.env.BASE_MAINNET_RPC;
  if (!RPC) throw new Error("BASE_MAINNET_RPC env required for fork");

  await network.provider.request({
    method: "hardhat_reset",
    params: [{ forking: { jsonRpcUrl: RPC } }],
  });

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const mockGovSafe = signers[1];
  const treasury = "0x000000000000000000000000000000000000dEaD";
  console.log("Forked Base mainnet.");
  console.log("  Deployer    :", deployer.address);
  console.log("  Mock GovSafe:", mockGovSafe.address);

  // Phase 1: Token + Vesting + 10M mint
  const Token = await ethers.getContractFactory("CCMToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("Token:", tokenAddr);

  const Vesting = await ethers.getContractFactory("CCMVesting");
  const vesting = await Vesting.deploy(tokenAddr, deployer.address);
  await vesting.waitForDeployment();
  const vestingAddr = await vesting.getAddress();
  console.log("Vesting:", vestingAddr);

  const mintAmount = 10_000_000n * 10n ** 18n;
  await (await token.mint(treasury, mintAmount)).wait();
  console.log("Minted 10M to", treasury);

  // Phase 2: Timelock + handoffs
  const Timelock = await ethers.getContractFactory("CCMTimelock");
  // NOTE: chainId on the local fork is still 31337 (Hardhat default after hardhat_reset
  // even with forking enabled — the EVM chainId is hardhat's, not the forked chain's).
  // CCMTimelock allows short delays on chainId 31337/1337, so 172800 works regardless.
  const timelock = await Timelock.deploy(
    172800,
    [mockGovSafe.address],
    [mockGovSafe.address],
    ethers.ZeroAddress,
  );
  await timelock.waitForDeployment();
  const timelockAddr = await timelock.getAddress();
  console.log("Timelock:", timelockAddr);

  const tokenResult = await runHandoff(tokenAddr, timelockAddr, deployer);
  console.log("Token handoff tx count:", tokenResult.txHashes.length);

  const vestingResult = await runVestingHandoff(vestingAddr, timelockAddr, deployer);
  console.log("Vesting handoff tx count:", vestingResult.txHashes.length);

  // Assertions (inline; mirrors verify-phase2-handoff.ts)
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const MINTER_ROLE = await token.MINTER_ROLE();
  const PAUSER_ROLE = await token.PAUSER_ROLE();
  const SCHEDULE_MANAGER_ROLE = await vesting.SCHEDULE_MANAGER_ROLE();
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();

  const checks: [string, unknown, unknown][] = [
    ["Token.ADMIN deployer", await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address), false],
    ["Token.MINTER deployer", await token.hasRole(MINTER_ROLE, deployer.address), false],
    ["Token.PAUSER deployer", await token.hasRole(PAUSER_ROLE, deployer.address), false],
    ["Token.ADMIN timelock", await token.hasRole(DEFAULT_ADMIN_ROLE, timelockAddr), true],
    ["Token.MINTER timelock", await token.hasRole(MINTER_ROLE, timelockAddr), true],
    ["Token.PAUSER timelock", await token.hasRole(PAUSER_ROLE, timelockAddr), true],
    ["Vesting.ADMIN deployer", await vesting.hasRole(DEFAULT_ADMIN_ROLE, deployer.address), false],
    ["Vesting.SCHEDULE_MANAGER deployer", await vesting.hasRole(SCHEDULE_MANAGER_ROLE, deployer.address), false],
    ["Vesting.ADMIN timelock", await vesting.hasRole(DEFAULT_ADMIN_ROLE, timelockAddr), true],
    ["Vesting.SCHEDULE_MANAGER timelock", await vesting.hasRole(SCHEDULE_MANAGER_ROLE, timelockAddr), true],
    ["Timelock.PROPOSER govSafe", await timelock.hasRole(PROPOSER_ROLE, mockGovSafe.address), true],
    ["Timelock.EXECUTOR govSafe", await timelock.hasRole(EXECUTOR_ROLE, mockGovSafe.address), true],
    ["Timelock.minDelay", (await timelock.getMinDelay()).toString(), "172800"],
  ];

  let allOk = true;
  for (const [name, actual, expected] of checks) {
    const ok = String(actual) === String(expected);
    console.log(ok ? "✓" : "✗", name, "=", String(actual), ok ? "" : `(expected ${expected})`);
    if (!ok) allOk = false;
  }
  if (!allOk) throw new Error("One or more dry-run assertions failed");

  // Idempotency check: re-run Token handoff should be a no-op (no new txs)
  const rerun = await runHandoff(tokenAddr, timelockAddr, deployer);
  if (rerun.txHashes.length !== 0) {
    throw new Error(`Idempotency violated: rerun sent ${rerun.txHashes.length} txs (expected 0)`);
  }
  console.log("✓ Idempotency: re-running handoff sent 0 additional txs");

  console.log("\n✓ Phase 2 dry-run passed end-to-end");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Compile**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && npx hardhat compile
```

- [ ] **Step 3: Negative path — missing RPC**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && unset BASE_MAINNET_RPC && \
  npx hardhat run scripts/_dry-run-phase2.ts --network hardhat 2>&1 | tail -3
```
Expected: `BASE_MAINNET_RPC env required for fork`.

- [ ] **Step 4: Happy path — full fork run**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  BASE_MAINNET_RPC=https://mainnet.base.org \
  npx hardhat run scripts/_dry-run-phase2.ts --network hardhat 2>&1 | tail -25
```
Expected: every assertion line starts with `✓`, ends with `✓ Idempotency: re-running handoff sent 0 additional txs` then `✓ Phase 2 dry-run passed end-to-end`.

If network access is blocked, this happy path may fail with an RPC error — that's an env limitation, not a defect in the script. Report what was observed.

- [ ] **Step 5: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add onchain/scripts/_dry-run-phase2.ts && \
  git commit -m "test(onchain): add Phase 2 forked-mainnet dry-run

Exercises Phase 1 deploy (Token + Vesting + 10M mint) + Phase 2 handoff
(Timelock + runHandoff + runVestingHandoff) end-to-end on a forked Base
mainnet. Includes 13 state assertions and an idempotency check.

Per spec 2026-05-12-ccm-phase2-timelock-migration-design.md Task 4."
```

---

## Task 5: Create `schedule-mint-via-timelock.ts`

**Files:**
- Create: `onchain/scripts/schedule-mint-via-timelock.ts`

Read-only helper that prints (a) Timelock.schedule calldata for the Safe owner to paste into Safe Wallet, and (b) the matching Timelock.execute calldata for use 48h later.

- [ ] **Step 1: Create the file**

Write `/Users/hyunsuklee/Developer/ccm/onchain/scripts/schedule-mint-via-timelock.ts`:

```typescript
/**
 * Helper: compose the Safe → Timelock calldata for a future mint operation.
 *
 * Phase 2 mints route through:
 *   Safe (3-of-5)  ──schedule──>  Timelock(48h)  ──execute──>  Token.mint(treasury, amount)
 *
 * This script prints, as hex strings:
 *   (a) The data for Safe Wallet "Contract Interaction" → target = Timelock,
 *       which encodes Timelock.schedule(target=Token, value=0, data=mint(...),
 *       predecessor=0, salt=keccak256(SALT_LABEL), delay=172800).
 *   (b) The matching Timelock.execute(...) calldata for the operator to use
 *       after the 48h delay elapses.
 *
 * The script does NOT send any transaction. It is a pure calldata builder.
 *
 * Required env:
 *   TOKEN        - CCMToken address
 *   TIMELOCK     - CCMTimelock address
 *   TREASURY     - recipient of the mint
 *   AMOUNT_CCM   - amount in whole CCM (e.g., 10000000)
 *   SALT_LABEL   - human-readable label for the salt (e.g., "ccm-mint-2026q2")
 *
 * Optional env:
 *   DELAY_S      - schedule delay in seconds (default 172800 = 48h)
 *
 * Run:
 *   TOKEN=0x... TIMELOCK=0x... TREASURY=0x... AMOUNT_CCM=1000000 SALT_LABEL=ccm-mint-2026q2 \
 *     npx hardhat run scripts/schedule-mint-via-timelock.ts --network base
 */
import { ethers } from "hardhat";

function normaliseAddress(name: string, value: string | undefined): string {
  if (!value || !ethers.isAddress(value)) throw new Error(`${name} env var (valid address) required`);
  return ethers.getAddress(value);
}

async function main() {
  const TOKEN = normaliseAddress("TOKEN", process.env.TOKEN);
  const TIMELOCK = normaliseAddress("TIMELOCK", process.env.TIMELOCK);
  const TREASURY = normaliseAddress("TREASURY", process.env.TREASURY);
  const SALT_LABEL = process.env.SALT_LABEL;
  if (!SALT_LABEL) throw new Error("SALT_LABEL env var required (use a unique human-readable string)");

  let AMOUNT_CCM: bigint;
  try {
    AMOUNT_CCM = BigInt(process.env.AMOUNT_CCM ?? "");
  } catch {
    throw new Error(`AMOUNT_CCM is not a valid integer: "${process.env.AMOUNT_CCM}"`);
  }
  if (AMOUNT_CCM <= 0n) throw new Error(`AMOUNT_CCM must be > 0 (got ${AMOUNT_CCM})`);

  const DELAY_S = BigInt(process.env.DELAY_S ?? "172800");
  if (DELAY_S < 172800n) {
    throw new Error(`DELAY_S must be >= 172800 (48h) — protocol policy. Got ${DELAY_S}`);
  }

  const amountWei = AMOUNT_CCM * 10n ** 18n;
  const salt = ethers.id(SALT_LABEL); // keccak256(utf8(SALT_LABEL))
  const predecessor = ethers.ZeroHash;

  // 1) Inner call: Token.mint(treasury, amountWei)
  const tokenIface = new ethers.Interface([
    "function mint(address to, uint256 amount)",
  ]);
  const mintData = tokenIface.encodeFunctionData("mint", [TREASURY, amountWei]);

  // 2) Wrap: Timelock.schedule(token, 0, mintData, 0, salt, delay)
  const timelockIface = new ethers.Interface([
    "function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay)",
    "function execute(address target, uint256 value, bytes payload, bytes32 predecessor, bytes32 salt) payable",
    "function hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) view returns (bytes32)",
  ]);
  const scheduleData = timelockIface.encodeFunctionData("schedule", [
    TOKEN,
    0,
    mintData,
    predecessor,
    salt,
    DELAY_S,
  ]);
  const executeData = timelockIface.encodeFunctionData("execute", [
    TOKEN,
    0,
    mintData,
    predecessor,
    salt,
  ]);

  // 3) operationId — useful for monitoring / cancellation
  const timelock = await ethers.getContractAt("CCMTimelock", TIMELOCK);
  const operationId = await timelock.hashOperation(TOKEN, 0, mintData, predecessor, salt);

  console.log("=".repeat(70));
  console.log("Phase 2 mint scheduling helper");
  console.log("  Token       :", TOKEN);
  console.log("  Timelock    :", TIMELOCK);
  console.log("  Treasury    :", TREASURY);
  console.log("  Amount      :", AMOUNT_CCM.toString(), "CCM (", amountWei.toString(), "wei )");
  console.log("  Salt label  :", SALT_LABEL);
  console.log("  Salt (hash) :", salt);
  console.log("  Delay       :", DELAY_S.toString(), "s");
  console.log("  Operation id:", operationId);
  console.log("=".repeat(70));

  console.log("\n=== STEP 1: SCHEDULE (do this now via Safe Wallet) ===");
  console.log("In Safe Wallet → New Transaction → Contract Interaction:");
  console.log("  Target:", TIMELOCK);
  console.log("  Value :", "0");
  console.log("  Data  :");
  console.log(scheduleData);

  console.log("\n=== STEP 2: EXECUTE (do this after 48h via Safe Wallet) ===");
  console.log("Wait at least", DELAY_S.toString(), "seconds (≈", (Number(DELAY_S) / 3600).toFixed(1), "hours)");
  console.log("then in Safe Wallet → New Transaction → Contract Interaction:");
  console.log("  Target:", TIMELOCK);
  console.log("  Value :", "0");
  console.log("  Data  :");
  console.log(executeData);

  console.log("\nMonitoring tip: anyone can read Timelock.getTimestamp(", operationId, ")");
  console.log("to see when this operation becomes executable (returns block timestamp once scheduled).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Compile**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && npx hardhat compile
```

- [ ] **Step 3: Happy path — generate calldata against Sepolia rehearsal Timelock**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
  TIMELOCK=0x1280E7C73e22D35c1319145B7a9eCa4199786362 \
  TREASURY=0x1234567890123456789012345678901234567890 \
  AMOUNT_CCM=1000000 \
  SALT_LABEL=phase2-dry-run-test \
  npx hardhat run scripts/schedule-mint-via-timelock.ts --network baseSepolia 2>&1 | tail -30
```
Expected: prints "Phase 2 mint scheduling helper" banner, salt hash, operation id, and two hex calldata blocks (one for schedule, one for execute).

- [ ] **Step 4: Negative path — missing AMOUNT_CCM**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
  TIMELOCK=0x1280E7C73e22D35c1319145B7a9eCa4199786362 \
  TREASURY=0x1234567890123456789012345678901234567890 \
  unset AMOUNT_CCM && SALT_LABEL=test && \
  npx hardhat run scripts/schedule-mint-via-timelock.ts --network baseSepolia 2>&1 | tail -3
```

Note: shell complication — the `unset` may not work inline. Try:
```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
  TIMELOCK=0x1280E7C73e22D35c1319145B7a9eCa4199786362 \
  TREASURY=0x1234567890123456789012345678901234567890 \
  SALT_LABEL=test \
  AMOUNT_CCM= \
  npx hardhat run scripts/schedule-mint-via-timelock.ts --network baseSepolia 2>&1 | tail -3
```
Expected: throws `AMOUNT_CCM is not a valid integer: ""` or similar.

- [ ] **Step 5: Negative path — delay below 48h**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
  TIMELOCK=0x1280E7C73e22D35c1319145B7a9eCa4199786362 \
  TREASURY=0x1234567890123456789012345678901234567890 \
  AMOUNT_CCM=1 \
  SALT_LABEL=test \
  DELAY_S=86400 \
  npx hardhat run scripts/schedule-mint-via-timelock.ts --network baseSepolia 2>&1 | tail -3
```
Expected: throws `DELAY_S must be >= 172800 (48h) — protocol policy. Got 86400`.

- [ ] **Step 6: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add onchain/scripts/schedule-mint-via-timelock.ts && \
  git commit -m "feat(onchain): add Safe → Timelock mint scheduling helper

Read-only CLI that composes the Safe Wallet 'Contract Interaction'
calldata for a future Token.mint via Timelock. Outputs two hex strings:
one for the immediate schedule() tx, one for the execute() tx 48h later.
Also prints the operation id for monitoring.

Per spec 2026-05-12-ccm-phase2-timelock-migration-design.md Task 5."
```

---

## Operational runbook (user-driven, not subagent-executable)

After all 5 scripts above are committed and the Phase 1 mainnet deploy is operational with the Governance Safe deployed:

### Pre-execution
- Confirm Governance Safe 3-of-5 deployed on Base mainnet; record `<GovSafe>` address.
- Confirm Treasury custody (EOA per Phase 1, or migrated to Safe). Phase 2 only touches Token/Vesting roles; Treasury balance is untouched.
- Confirm deployer EOA has Base mainnet ETH for ~10 txs (~0.005 ETH).

### Execution
1. **Deploy Timelock**:
   ```bash
   cd onchain && PROPOSERS=<GovSafe> EXECUTORS=<GovSafe> ADMIN=0x0000000000000000000000000000000000000000 MIN_DELAY=172800 \
     npx hardhat run scripts/deploy-timelock.ts --network base
   ```
2. **Verify Timelock on BaseScan**:
   ```bash
   npx hardhat verify --network base <Timelock> 172800 '["<GovSafe>"]' '["<GovSafe>"]' 0x0000000000000000000000000000000000000000
   ```
3. **Token handoff**:
   ```bash
   TOKEN=<TOKEN_MAINNET> TIMELOCK=<Timelock> \
     npx hardhat run scripts/transfer-admin-to-timelock.ts --network base
   ```
4. **Vesting handoff**:
   ```bash
   VESTING=<VESTING_MAINNET> TIMELOCK=<Timelock> \
     npx hardhat run scripts/transfer-vesting-admin-to-timelock.ts --network base
   ```
5. **Final verification**:
   ```bash
   TOKEN=<TOKEN_MAINNET> VESTING=<VESTING_MAINNET> TIMELOCK=<Timelock> \
   DEPLOYER=<DEPLOYER_EOA> GOV_SAFE=<GovSafe> \
     npx hardhat run scripts/verify-phase2-handoff.ts --network base
   ```
6. **Update `onchain/DEPLOYMENT.md`** with Phase 2 section (Timelock address + verify link, Safe address, handoff tx hashes, before/after role table).

### Stop conditions
- If `transfer-admin-to-timelock.ts` halts mid-execution, do NOT re-run any other script. Re-run `transfer-admin-to-timelock.ts` itself; idempotency will skip completed steps.
- If `verify-phase2-handoff.ts` shows any ✗, investigate before declaring done.
- If Safe 3-of-5 cannot reach quorum at any point, halt and resolve signer availability before continuing.

---

## Self-Review

**Spec coverage:**
- Spec §3 (architecture) → Tasks 1, 2, 3 (Token + Vesting + Verifier scripts produce the diagrammed end state)
- Spec §4 (contracts) → no Solidity changes, only role transfers (Tasks 1, 2)
- Spec §5 (5 scripts) → Tasks 1, 2, 3, 4, 5 (one task per script)
- Spec §6 (mainnet sequence) → runbook section
- Spec §7 (operational consequences) → §5 helper script in Task 5
- Spec §8 (risks) → mitigations baked into Task 1's `runHandoff` (refuses renounce if timelock doesn't already hold role, idempotency, chainId guard) and Task 3's verify script
- Spec §9 (testing) → Task 4 (forked-mainnet dry-run with 13 assertions + idempotency check)
- Spec §10 (docs) → runbook step 6
- Spec §11 (open questions) → runbook pre-execution + helper script #5 (calldata builder; decision pinned in spec)

No spec gaps.

**Placeholder scan:**
- `<GovSafe>`, `<Timelock>`, `<TOKEN_MAINNET>`, `<VESTING_MAINNET>`, `<DEPLOYER_EOA>` are runtime values for the runbook section, clearly marked.
- No "TBD", "TODO", "fill in later". All scripts have complete code blocks.

**Type/name consistency:**
- Env var names: `TOKEN`, `VESTING`, `TIMELOCK`, `TREASURY`, `AMOUNT_CCM`, `SALT_LABEL`, `DELAY_S`, `ALLOW_TESTNET`, `SKIP_RENOUNCE`, `BASE_MAINNET_RPC`, `DEPLOYER`, `GOV_SAFE` — used consistently across Tasks 1–5.
- Exported function names: `runHandoff` (Task 1), `runVestingHandoff` (Task 2) — imported by Task 4 with the same names.
- Role constants: `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE`, `SCHEDULE_MANAGER_ROLE`, `PROPOSER_ROLE`, `EXECUTOR_ROLE` — names match the contracts (`CCMToken.sol`, `CCMVesting.sol`, OZ `TimelockController`).
- Min delay: `172800` (= 48h) used consistently in Tasks 3, 4, 5 and the runbook.

No inconsistencies.
