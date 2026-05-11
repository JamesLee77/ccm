/**
 * E2E test: Admin releases vested portion of schedule #1.
 */
import { ethers } from "hardhat";

const TOKEN = "0x5b4319dB4b2949E921400D850838508BB8a510CE";
const VEST  = "0xa73d068Bf89F303C009E19d05Fbe40f47eeE1d79";
const ADMIN_SCHEDULE_ID = 1n;

const fmt = (n: bigint) => ethers.formatUnits(n, 18);

async function main() {
  const [admin] = await ethers.getSigners();
  console.log("Admin:", admin.address);

  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const vesting = await ethers.getContractAt("CCMVesting", VEST);

  const sBefore = await vesting.schedules(ADMIN_SCHEDULE_ID);
  const releasableBefore = await vesting.releasable(ADMIN_SCHEDULE_ID);
  const balBefore = await token.balanceOf(admin.address);
  const ethBefore = await ethers.provider.getBalance(admin.address);

  console.log("\n=== BEFORE ===");
  console.log(`  Schedule #${ADMIN_SCHEDULE_ID}`);
  console.log(`    beneficiary : ${sBefore.beneficiary}`);
  console.log(`    totalAmount : ${fmt(sBefore.totalAmount)} CCM`);
  console.log(`    released    : ${fmt(sBefore.released)} CCM`);
  console.log(`    releasable  : ${fmt(releasableBefore)} CCM`);
  console.log(`  Admin CCM     : ${fmt(balBefore)}`);
  console.log(`  Admin ETH     : ${ethers.formatEther(ethBefore)}`);

  if (releasableBefore === 0n) {
    console.log("\n⚠ Nothing to release.");
    return;
  }

  console.log("\n=== Calling release ===");
  const tx = await vesting.release(ADMIN_SCHEDULE_ID, { gasLimit: 200_000 });
  const receipt = await tx.wait();
  console.log(`  tx: ${tx.hash}`);
  console.log(`  status: ${receipt?.status}`);
  console.log(`  gas used: ${receipt?.gasUsed.toString()}`);

  await new Promise((r) => setTimeout(r, 4000));

  const sAfter = await vesting.schedules(ADMIN_SCHEDULE_ID);
  const balAfter = await token.balanceOf(admin.address);
  const ethAfter = await ethers.provider.getBalance(admin.address);

  console.log("\n=== AFTER ===");
  console.log(`  released   : ${fmt(sAfter.released)} CCM`);
  console.log(`  Admin CCM  : ${fmt(balAfter)} (gained ${fmt(balAfter - balBefore)})`);
  console.log(`  Admin ETH  : ${ethers.formatEther(ethAfter)} (spent ${ethers.formatEther(ethBefore - ethAfter)})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
