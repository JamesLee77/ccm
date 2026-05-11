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
  // Fail fast on bad input — callers from unit tests don't go through main()'s
  // env-var parsing so this function has to defend itself.
  if (!ethers.isAddress(vestingAddr)) throw new Error(`runVestingHandoff: vestingAddr invalid: ${vestingAddr}`);
  if (!ethers.isAddress(timelockAddr)) throw new Error(`runVestingHandoff: timelockAddr invalid: ${timelockAddr}`);
  if (vestingAddr === ethers.ZeroAddress) throw new Error("runVestingHandoff: vestingAddr must not be zero");
  if (timelockAddr === ethers.ZeroAddress) throw new Error("runVestingHandoff: timelockAddr must not be zero");

  const vesting = await ethers.getContractAt("CCMVesting", vestingAddr, signer);
  const signerAddr = await signer.getAddress();

  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const SCHEDULE_MANAGER_ROLE = await vesting.SCHEDULE_MANAGER_ROLE();

  // roleEntries[0] MUST be DEFAULT_ADMIN_ROLE so reverse() renounces admin LAST.
  const roleEntries: { name: string; hash: string }[] = [
    { name: "DEFAULT_ADMIN_ROLE", hash: DEFAULT_ADMIN_ROLE },
    { name: "SCHEDULE_MANAGER_ROLE", hash: SCHEDULE_MANAGER_ROLE },
  ];
  if (roleEntries[0].hash !== DEFAULT_ADMIN_ROLE) {
    throw new Error(
      "BUG: roleEntries[0] must be DEFAULT_ADMIN_ROLE so reverse() renounces it last",
    );
  }

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
  if (VESTING === ethers.ZeroAddress) {
    throw new Error("VESTING must not be the zero address");
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

// Only run if this script is invoked directly (not imported)
if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
