/**
 * E2E test helper: create a fresh vesting schedule for the admin address itself,
 * with a short cliff so we can release within minutes.
 */
import { ethers } from "hardhat";

const ADMIN = "0xB722843587DA96bdFb5638Bb0AbC8FC56a9dfa1D";
const VEST  = "0xa73d068Bf89F303C009E19d05Fbe40f47eeE1d79";
const AMOUNT = ethers.parseUnits("500", 18);
const CLIFF_SEC = 60;        // 1-minute cliff (so we can test release quickly)
const DURATION_SEC = 600;    // 10-minute total vest

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  const token = await ethers.getContractAt("CCMToken", "0x5b4319dB4b2949E921400D850838508BB8a510CE");
  const vesting = await ethers.getContractAt("CCMVesting", VEST);

  // 1. Mint to vesting contract
  console.log("\nMinting 500 CCM to vesting contract...");
  const mintTx = await token.mint(VEST, AMOUNT, { gasLimit: 200_000 });
  const mintReceipt = await mintTx.wait();
  console.log("  tx:", mintTx.hash, "status:", mintReceipt?.status);

  await new Promise((r) => setTimeout(r, 4000)); // RPC propagation

  // 2. Create schedule for admin
  const start = Math.floor(Date.now() / 1000);
  console.log("\nCreating schedule:");
  console.log("  beneficiary:", ADMIN);
  console.log("  amount     :", ethers.formatUnits(AMOUNT, 18), "CCM");
  console.log("  start      :", new Date(start * 1000).toISOString());
  console.log("  cliff      :", CLIFF_SEC, "s (cliff ends:", new Date((start + CLIFF_SEC) * 1000).toLocaleTimeString(), ")");
  console.log("  duration   :", DURATION_SEC, "s (fully vested:", new Date((start + DURATION_SEC) * 1000).toLocaleTimeString(), ")");
  console.log("  revocable  : true");

  const tx = await vesting.createSchedule(
    ADMIN,
    AMOUNT,
    start,
    CLIFF_SEC,
    DURATION_SEC,
    true,
    { gasLimit: 300_000 },
  );
  const receipt = await tx.wait();
  console.log("  tx:", tx.hash, "status:", receipt?.status);

  await new Promise((r) => setTimeout(r, 4000));

  const count = await vesting.getScheduleCount();
  const newId = count - 1n;
  console.log("\n  schedule id:", newId.toString());
  console.log("\n✅ Schedule created. Refresh /vesting in your browser.");
  console.log(`   Cliff ends in ${CLIFF_SEC}s. Wait at least ${CLIFF_SEC + 30}s before clicking Release.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
