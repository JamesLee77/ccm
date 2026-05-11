/**
 * E2E test: Alice releases her vested portion of schedule #2.
 * Equivalent to clicking "Release X CCM" in the UI as Alice.
 */
import { ethers } from "hardhat";
import { Wallet } from "ethers";

const TOKEN = "0x5b4319dB4b2949E921400D850838508BB8a510CE";
const VEST  = "0xa73d068Bf89F303C009E19d05Fbe40f47eeE1d79";
const ALICE_PRIVATE_KEY = process.env.ALICE_PRIVATE_KEY;
if (!ALICE_PRIVATE_KEY) throw new Error("ALICE_PRIVATE_KEY missing in .env");
const ALICE_SCHEDULE_ID = 2n;

const fmt = (n: bigint) => ethers.formatUnits(n, 18);

async function main() {
  const provider = ethers.provider;
  const alice = new Wallet(ALICE_PRIVATE_KEY, provider);
  console.log("Alice:", alice.address);

  const token = await ethers.getContractAt("CCMToken", TOKEN, alice);
  const vesting = await ethers.getContractAt("CCMVesting", VEST, alice);

  const sBefore = await vesting.schedules(ALICE_SCHEDULE_ID);
  const releasableBefore = await vesting.releasable(ALICE_SCHEDULE_ID);
  const aliceBalBefore = await token.balanceOf(alice.address);
  const aliceEthBefore = await provider.getBalance(alice.address);

  console.log("\n=== BEFORE ===");
  console.log(`  Schedule #${ALICE_SCHEDULE_ID}`);
  console.log(`    totalAmount : ${fmt(sBefore.totalAmount)} CCM`);
  console.log(`    released    : ${fmt(sBefore.released)} CCM`);
  console.log(`    releasable  : ${fmt(releasableBefore)} CCM`);
  const cliffEnd = Number(sBefore.startTime + sBefore.cliffDuration);
  const fullyVested = Number(sBefore.startTime + sBefore.vestingDuration);
  console.log(`    cliff ends  : ${new Date(cliffEnd * 1000).toLocaleTimeString()}`);
  console.log(`    fully vested: ${new Date(fullyVested * 1000).toLocaleTimeString()}`);
  console.log(`    now         : ${new Date().toLocaleTimeString()}`);
  console.log(`  Alice CCM     : ${fmt(aliceBalBefore)}`);
  console.log(`  Alice ETH     : ${ethers.formatEther(aliceEthBefore)}`);

  if (releasableBefore === 0n) {
    console.log("\n⚠ Nothing to release yet (cliff not passed or already drained).");
    return;
  }

  console.log("\n=== Calling release ===");
  const tx = await vesting.release(ALICE_SCHEDULE_ID, { gasLimit: 200_000 });
  const receipt = await tx.wait();
  console.log(`  tx: ${tx.hash}`);
  console.log(`  status: ${receipt?.status}`);
  console.log(`  gas used: ${receipt?.gasUsed.toString()}`);

  await new Promise((r) => setTimeout(r, 4000));

  const sAfter = await vesting.schedules(ALICE_SCHEDULE_ID);
  const aliceBalAfter = await token.balanceOf(alice.address);
  const aliceEthAfter = await provider.getBalance(alice.address);

  console.log("\n=== AFTER ===");
  console.log(`  Schedule #${ALICE_SCHEDULE_ID}`);
  console.log(`    released    : ${fmt(sAfter.released)} CCM (was ${fmt(sBefore.released)})`);
  console.log(`  Alice CCM     : ${fmt(aliceBalAfter)} (gained ${fmt(aliceBalAfter - aliceBalBefore)})`);
  console.log(`  Alice ETH     : ${ethers.formatEther(aliceEthAfter)} (spent ${ethers.formatEther(aliceEthBefore - aliceEthAfter)})`);

  console.log("\n✅ Release complete. Refresh /vesting in MetaMask (Alice account):");
  console.log("   - 'Released' field should show updated total");
  console.log("   - 'Releasable now' should drop (or grow again as time passes)");
  console.log("   - Alice CCM balance in MetaMask: refresh wallet to see");
  console.log("   - Dashboard 'Total CCM' card reflects the new balance");
}

main().catch((e) => { console.error(e); process.exit(1); });
