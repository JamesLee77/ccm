/**
 * E2E test: revoke Carol's schedule (#4) and report before/after balances.
 */
import { ethers } from "hardhat";

const TOKEN = "0x5b4319dB4b2949E921400D850838508BB8a510CE";
const VEST  = "0xa73d068Bf89F303C009E19d05Fbe40f47eeE1d79";
const ADMIN = "0xB722843587DA96bdFb5638Bb0AbC8FC56a9dfa1D";
const CAROL = "0xAF2f45364657d9A9e40b80489Ed15baDC4dc098D";
const CAROL_SCHEDULE_ID = 4n;

const fmt = (n: bigint) => ethers.formatUnits(n, 18);

async function main() {
  const [admin] = await ethers.getSigners();
  console.log("Admin:", admin.address);

  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const vesting = await ethers.getContractAt("CCMVesting", VEST);

  const s = await vesting.schedules(CAROL_SCHEDULE_ID);
  const releasable = await vesting.releasable(CAROL_SCHEDULE_ID);

  console.log("\n=== BEFORE ===");
  console.log(`  Schedule #${CAROL_SCHEDULE_ID}`);
  console.log(`    beneficiary : ${s.beneficiary}`);
  console.log(`    totalAmount : ${fmt(s.totalAmount)} CCM`);
  console.log(`    released    : ${fmt(s.released)} CCM`);
  console.log(`    releasable  : ${fmt(releasable)} CCM`);
  console.log(`    revoked     : ${s.revoked}`);
  console.log(`    revocable   : ${s.revocable}`);
  console.log(`  Carol balance : ${fmt(await token.balanceOf(CAROL))} CCM`);
  console.log(`  Admin balance : ${fmt(await token.balanceOf(ADMIN))} CCM`);

  if (s.revoked) {
    console.log("\n⚠ Already revoked. Nothing to do.");
    return;
  }

  console.log("\n=== Revoking ===");
  const tx = await vesting.revoke(CAROL_SCHEDULE_ID, { gasLimit: 300_000 });
  const receipt = await tx.wait();
  console.log(`  tx: ${tx.hash}`);
  console.log(`  status: ${receipt?.status}`);

  await new Promise((r) => setTimeout(r, 4000));

  const sAfter = await vesting.schedules(CAROL_SCHEDULE_ID);
  console.log("\n=== AFTER ===");
  console.log(`  Schedule #${CAROL_SCHEDULE_ID}`);
  console.log(`    released    : ${fmt(sAfter.released)} CCM`);
  console.log(`    revoked     : ${sAfter.revoked}`);
  console.log(`  Carol balance : ${fmt(await token.balanceOf(CAROL))} CCM (should = vested portion at revoke time)`);
  console.log(`  Admin balance : ${fmt(await token.balanceOf(ADMIN))} CCM (should = previous + remainder)`);

  console.log("\n✅ Revoke complete. Have Carol refresh /vesting in MetaMask:");
  console.log("   - Schedule #4 should still appear but with 'revoked' badge");
  console.log("   - releasable shows 0");
  console.log("   - Carol's CCM token balance increased by the vested portion paid out");
}

main().catch((e) => { console.error(e); process.exit(1); });
