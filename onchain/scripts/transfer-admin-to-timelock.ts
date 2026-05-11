/**
 * Transfer DEFAULT_ADMIN_ROLE + PAUSER_ROLE on a CCMToken from the deployer
 * EOA to the CCMTimelock, then renounce them on the deployer.
 *
 * After this script: the deployer has zero privileged roles on the token.
 * Every subsequent admin action (grantRole, revokeRole, pause, unpause) must
 * be scheduled through the timelock + multisig and execute only after the
 * 48h delay (or whatever delay the timelock was configured with).
 *
 * Required env:
 *   TOKEN     - CCMToken address
 *   TIMELOCK  - CCMTimelock address
 *
 * Optional env:
 *   SKIP_RENOUNCE  - if "1", grants to the timelock but skips deployer renounce.
 *                    Useful for staged rollouts (grant first, observe, renounce later).
 *
 * Run:
 *   TOKEN=<a> TIMELOCK=<b> \
 *     npx hardhat run scripts/transfer-admin-to-timelock.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const TOKEN = process.env.TOKEN;
  const TIMELOCK = process.env.TIMELOCK;
  if (!TOKEN || !TIMELOCK) throw new Error("TOKEN and TIMELOCK required");
  if (!ethers.isAddress(TOKEN)) throw new Error("TOKEN invalid");
  if (!ethers.isAddress(TIMELOCK)) throw new Error("TIMELOCK invalid");
  const skipRenounce = process.env.SKIP_RENOUNCE === "1";

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Token   :", TOKEN);
  console.log("Timelock:", TIMELOCK);
  console.log("Skip renounce:", skipRenounce);

  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const PAUSER_ROLE = await token.PAUSER_ROLE();

  // Sanity: deployer must currently hold both roles
  const hasAdmin = await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  const hasPauser = await token.hasRole(PAUSER_ROLE, deployer.address);
  if (!hasAdmin) throw new Error("Deployer does not hold DEFAULT_ADMIN_ROLE");
  if (!hasPauser) console.warn("Deployer does not hold PAUSER_ROLE — skipping that side");

  // 1. Grant DEFAULT_ADMIN_ROLE to timelock
  console.log("\n[1/4] Granting DEFAULT_ADMIN_ROLE → timelock…");
  let tx = await token.grantRole(DEFAULT_ADMIN_ROLE, TIMELOCK);
  await tx.wait();
  console.log("       tx:", tx.hash);

  // 2. Grant PAUSER_ROLE to timelock (if deployer holds it)
  if (hasPauser) {
    console.log("\n[2/4] Granting PAUSER_ROLE → timelock…");
    tx = await token.grantRole(PAUSER_ROLE, TIMELOCK);
    await tx.wait();
    console.log("       tx:", tx.hash);
  } else {
    console.log("\n[2/4] PAUSER_ROLE: skipped (deployer doesn't have it).");
  }

  if (skipRenounce) {
    console.log("\nSKIP_RENOUNCE=1 → leaving deployer roles intact for staged rollout.");
    return;
  }

  // 3. Deployer renounces PAUSER_ROLE
  if (hasPauser) {
    console.log("\n[3/4] Renouncing PAUSER_ROLE on deployer…");
    tx = await token.renounceRole(PAUSER_ROLE, deployer.address);
    await tx.wait();
    console.log("       tx:", tx.hash);
  } else {
    console.log("\n[3/4] PAUSER_ROLE renounce: skipped.");
  }

  // 4. Deployer renounces DEFAULT_ADMIN_ROLE last (after this, no take-backs)
  console.log("\n[4/4] Renouncing DEFAULT_ADMIN_ROLE on deployer…");
  tx = await token.renounceRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await tx.wait();
  console.log("       tx:", tx.hash);

  // Verify
  console.log("\nFinal state:");
  console.log("  deployer DEFAULT_ADMIN_ROLE:", await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
  console.log("  deployer PAUSER_ROLE       :", await token.hasRole(PAUSER_ROLE, deployer.address));
  console.log("  timelock DEFAULT_ADMIN_ROLE:", await token.hasRole(DEFAULT_ADMIN_ROLE, TIMELOCK));
  console.log("  timelock PAUSER_ROLE       :", await token.hasRole(PAUSER_ROLE, TIMELOCK));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
