/**
 * Post-handoff smoke test:
 *   1. Direct EOA grantRole reverts (deployer is no longer admin)
 *   2. Timelock-scheduled grantRole queues + reports correct ETA
 *   3. (We do NOT wait 48h to actually execute — just observe the schedule.)
 */
import { ethers } from "hardhat";

const TOKEN = "0xB5e54084eEFcc4ddc93F3A6AA7A6Dea501FB3999";
const TIMELOCK = "0x3EbA7887525f1E68dc946760a96B01d1E1a1d979";
const ALICE = "0x" + "11".repeat(20); // dummy beneficiary

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const timelock = await ethers.getContractAt("CCMTimelock", TIMELOCK);
  const MINTER_ROLE = await token.MINTER_ROLE();
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

  console.log("\n[A] Direct EOA grantRole should revert:");
  try {
    const tx = await token.grantRole(MINTER_ROLE, ALICE);
    await tx.wait();
    console.log("  ❌ FAILED: tx succeeded! tx:", tx.hash);
  } catch (e: any) {
    const msg = (e.message || "").slice(0, 180);
    console.log("  ✓ reverted as expected:", msg);
  }

  console.log("\n[B] Schedule via Timelock:");
  const data = token.interface.encodeFunctionData("grantRole", [MINTER_ROLE, ALICE]);
  const target = TOKEN;
  const value = 0n;
  const predecessor = ethers.ZeroHash;
  const salt = ethers.id("smoke:" + Date.now());
  const minDelay = await timelock.getMinDelay();
  console.log("  minDelay:", minDelay.toString(), "s (=", Number(minDelay) / 3600, "h)");

  const tx = await timelock.schedule(target, value, data, predecessor, salt, minDelay);
  console.log("  schedule tx:", tx.hash);
  const rcpt = await tx.wait();
  console.log("  mined in block:", rcpt?.blockNumber);

  const opId = await timelock.hashOperation(target, value, data, predecessor, salt);
  console.log("  opId:", opId);
  console.log("  isOperationPending:", await timelock.isOperationPending(opId));
  console.log("  isOperationReady  :", await timelock.isOperationReady(opId));
  const ts = await timelock.getTimestamp(opId);
  const eta = new Date(Number(ts) * 1000).toISOString();
  console.log("  ready at          :", ts.toString(), "(", eta, ")");

  console.log("\n[C] Sanity:");
  console.log("  token.hasRole(ADMIN, deployer):", await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
  console.log("  token.hasRole(ADMIN, timelock):", await token.hasRole(DEFAULT_ADMIN_ROLE, TIMELOCK));
}

main().catch((e) => { console.error(e); process.exit(1); });
