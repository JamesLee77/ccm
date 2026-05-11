/**
 * E2E test: Alice migrates 1000 v1 CCM → 1000 v2 CCM via CCMMigration.
 * Mirrors what the /migrate page does in the UI.
 */
import { ethers } from "hardhat";
import { Wallet, MaxUint256 } from "ethers";

const V1   = "0x5b4319dB4b2949E921400D850838508BB8a510CE";
const V2   = "0xC51AC33D23f7cCff7ddF83b751C52AF8ff50057c";
const MIG  = "0x1a3Fb22873fF0778069c7708A40E1CEA48Bb660c";
const ALICE_PRIVATE_KEY = process.env.ALICE_PRIVATE_KEY;
if (!ALICE_PRIVATE_KEY) throw new Error("ALICE_PRIVATE_KEY missing in .env");

const fmt = (n: bigint) => ethers.formatUnits(n, 18);

async function main() {
  const provider = ethers.provider;
  const alice = new Wallet(ALICE_PRIVATE_KEY, provider);
  console.log("Alice:", alice.address);

  const v1 = await ethers.getContractAt("CCMToken", V1, alice);
  const v2 = await ethers.getContractAt("CCMToken", V2, alice);
  const mig = await ethers.getContractAt("CCMMigration", MIG, alice);

  // Snapshot before
  const v1BalBefore = await v1.balanceOf(alice.address);
  const v2BalBefore = await v2.balanceOf(alice.address);
  const v1AllowBefore = await v1.allowance(alice.address, MIG);
  const v1SupplyBefore = await v1.totalSupply();
  const v2SupplyBefore = await v2.totalSupply();
  const totalMigBefore = await mig.totalMigrated();
  const ethBefore = await provider.getBalance(alice.address);

  console.log("\n=== BEFORE ===");
  console.log(`  Alice v1       : ${fmt(v1BalBefore)} CCM`);
  console.log(`  Alice v2       : ${fmt(v2BalBefore)} CCM`);
  console.log(`  Alice→mig allow: ${fmt(v1AllowBefore)} CCM`);
  console.log(`  v1 supply      : ${fmt(v1SupplyBefore)}`);
  console.log(`  v2 supply      : ${fmt(v2SupplyBefore)}`);
  console.log(`  total migrated : ${fmt(totalMigBefore)} CCM`);
  console.log(`  Alice ETH      : ${ethers.formatEther(ethBefore)}`);

  if (v1BalBefore === 0n) {
    console.log("\n⚠ Alice has no v1 to migrate.");
    return;
  }

  const amount = v1BalBefore;

  // Step 1: approve (UI step 1 — clicked Approve in /migrate)
  if (v1AllowBefore < amount) {
    console.log("\n=== Step 1: Approve ===");
    const approveTx = await v1.approve(MIG, MaxUint256, { gasLimit: 100_000 });
    const r1 = await approveTx.wait();
    console.log(`  tx: ${approveTx.hash}`);
    console.log(`  status: ${r1?.status}, gas: ${r1?.gasUsed.toString()}`);
    await new Promise((r) => setTimeout(r, 4000));
  } else {
    console.log("\n  (allowance already sufficient — skipping approve)");
  }

  // Step 2: migrate (UI step 2 — clicked Migrate)
  console.log("\n=== Step 2: Migrate ===");
  const migrateTx = await mig.migrate(amount, { gasLimit: 300_000 });
  const r2 = await migrateTx.wait();
  console.log(`  tx: ${migrateTx.hash}`);
  console.log(`  status: ${r2?.status}, gas: ${r2?.gasUsed.toString()}`);
  await new Promise((r) => setTimeout(r, 4000));

  // Snapshot after
  const v1BalAfter = await v1.balanceOf(alice.address);
  const v2BalAfter = await v2.balanceOf(alice.address);
  const v1SupplyAfter = await v1.totalSupply();
  const v2SupplyAfter = await v2.totalSupply();
  const totalMigAfter = await mig.totalMigrated();
  const migratedByMe = await mig.migratedBy(alice.address);
  const ethAfter = await provider.getBalance(alice.address);

  console.log("\n=== AFTER ===");
  console.log(`  Alice v1       : ${fmt(v1BalAfter)} CCM (was ${fmt(v1BalBefore)})`);
  console.log(`  Alice v2       : ${fmt(v2BalAfter)} CCM (was ${fmt(v2BalBefore)})`);
  console.log(`  v1 supply      : ${fmt(v1SupplyAfter)} (burned ${fmt(v1SupplyBefore - v1SupplyAfter)})`);
  console.log(`  v2 supply      : ${fmt(v2SupplyAfter)} (minted ${fmt(v2SupplyAfter - v2SupplyBefore)})`);
  console.log(`  total migrated : ${fmt(totalMigAfter)}`);
  console.log(`  Alice migrated : ${fmt(migratedByMe)} (cumulative)`);
  console.log(`  Alice ETH      : ${ethers.formatEther(ethAfter)} (spent ${ethers.formatEther(ethBefore - ethAfter)})`);

  console.log("\n✅ Migration complete. In MetaMask (Alice account):");
  console.log("   - Refresh wallet → v1 CCM = 0, v2 CCM = " + fmt(amount));
  console.log("   - Portal /migrate → 'You\\'ve migrated' shows the amount");
}

main().catch((e) => { console.error(e); process.exit(1); });
