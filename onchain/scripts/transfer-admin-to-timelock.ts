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
