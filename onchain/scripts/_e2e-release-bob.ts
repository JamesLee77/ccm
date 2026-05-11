/**
 * E2E test: Bob releases his vested portion of schedule #3.
 */
import { ethers } from "hardhat";
import { Wallet } from "ethers";

const TOKEN = "0x5b4319dB4b2949E921400D850838508BB8a510CE";
const VEST  = "0xa73d068Bf89F303C009E19d05Fbe40f47eeE1d79";
const BOB_PRIVATE_KEY = process.env.BOB_PRIVATE_KEY;
if (!BOB_PRIVATE_KEY) throw new Error("BOB_PRIVATE_KEY missing in .env");
const BOB_SCHEDULE_ID = 3n;

const fmt = (n: bigint) => ethers.formatUnits(n, 18);

async function main() {
  const provider = ethers.provider;
  const bob = new Wallet(BOB_PRIVATE_KEY, provider);
  console.log("Bob:", bob.address);

  const token = await ethers.getContractAt("CCMToken", TOKEN, bob);
  const vesting = await ethers.getContractAt("CCMVesting", VEST, bob);

  const sBefore = await vesting.schedules(BOB_SCHEDULE_ID);
  const releasableBefore = await vesting.releasable(BOB_SCHEDULE_ID);
  const balBefore = await token.balanceOf(bob.address);
  const ethBefore = await provider.getBalance(bob.address);

  console.log("\n=== BEFORE ===");
  console.log(`  Schedule #${BOB_SCHEDULE_ID}`);
  console.log(`    totalAmount : ${fmt(sBefore.totalAmount)} CCM`);
  console.log(`    released    : ${fmt(sBefore.released)} CCM`);
  console.log(`    releasable  : ${fmt(releasableBefore)} CCM`);
  const cliffEnd = Number(sBefore.startTime + sBefore.cliffDuration);
  const fullyVested = Number(sBefore.startTime + sBefore.vestingDuration);
  console.log(`    cliff ends  : ${new Date(cliffEnd * 1000).toLocaleTimeString()}`);
  console.log(`    fully vested: ${new Date(fullyVested * 1000).toLocaleTimeString()}`);
  console.log(`  Bob CCM       : ${fmt(balBefore)}`);
  console.log(`  Bob ETH       : ${ethers.formatEther(ethBefore)}`);

  if (releasableBefore === 0n) {
    console.log("\n⚠ Nothing to release.");
    return;
  }

  console.log("\n=== Calling release ===");
  const tx = await vesting.release(BOB_SCHEDULE_ID, { gasLimit: 200_000 });
  const receipt = await tx.wait();
  console.log(`  tx: ${tx.hash}`);
  console.log(`  status: ${receipt?.status}`);
  console.log(`  gas used: ${receipt?.gasUsed.toString()}`);

  await new Promise((r) => setTimeout(r, 4000));

  const sAfter = await vesting.schedules(BOB_SCHEDULE_ID);
  const balAfter = await token.balanceOf(bob.address);
  const ethAfter = await provider.getBalance(bob.address);

  console.log("\n=== AFTER ===");
  console.log(`  released   : ${fmt(sAfter.released)} CCM`);
  console.log(`  Bob CCM    : ${fmt(balAfter)} (gained ${fmt(balAfter - balBefore)})`);
  console.log(`  Bob ETH    : ${ethers.formatEther(ethAfter)} (spent ${ethers.formatEther(ethBefore - ethAfter)})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
