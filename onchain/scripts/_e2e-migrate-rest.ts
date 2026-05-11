/**
 * E2E test: migrate remaining v1 holders (Admin, Bob, Carol) → v2.
 * After this runs, v1 supply should be 0 and v2 supply = 3800.
 */
import { ethers } from "hardhat";
import { Wallet, MaxUint256 } from "ethers";

const V1  = "0x5b4319dB4b2949E921400D850838508BB8a510CE";
const V2  = "0xC51AC33D23f7cCff7ddF83b751C52AF8ff50057c";
const MIG = "0x1a3Fb22873fF0778069c7708A40E1CEA48Bb660c";

const fmt = (n: bigint) => ethers.formatUnits(n, 18);

interface Holder {
  name: string;
  signer: Wallet;
}

async function migrateOne(h: Holder): Promise<{ migrated: bigint; gasWei: bigint }> {
  const v1  = await ethers.getContractAt("CCMToken", V1, h.signer);
  const mig = await ethers.getContractAt("CCMMigration", MIG, h.signer);

  const bal = await v1.balanceOf(h.signer.address);
  if (bal === 0n) {
    console.log(`  ⚠ ${h.name}: 0 v1, skipping`);
    return { migrated: 0n, gasWei: 0n };
  }

  const allow = await v1.allowance(h.signer.address, MIG);
  let gasUsed = 0n;
  let gasPrice = 0n;

  if (allow < bal) {
    const tx = await v1.approve(MIG, MaxUint256, { gasLimit: 100_000 });
    const r = await tx.wait();
    console.log(`  ${h.name} approve: ${tx.hash} (${r?.gasUsed} gas)`);
    gasUsed += r?.gasUsed ?? 0n;
    gasPrice = r?.gasPrice ?? 0n;
    await new Promise((r) => setTimeout(r, 3000));
  }

  const tx2 = await mig.migrate(bal, { gasLimit: 300_000 });
  const r2 = await tx2.wait();
  console.log(`  ${h.name} migrate: ${tx2.hash} (${r2?.gasUsed} gas, ${fmt(bal)} CCM)`);
  gasUsed += r2?.gasUsed ?? 0n;
  if (gasPrice === 0n) gasPrice = r2?.gasPrice ?? 0n;
  await new Promise((r) => setTimeout(r, 3000));

  return { migrated: bal, gasWei: gasUsed * gasPrice };
}

async function main() {
  const provider = ethers.provider;
  const [admin] = await ethers.getSigners();
  const bobKey = process.env.BOB_PRIVATE_KEY;
  const carolKey = process.env.CAROL_PRIVATE_KEY;
  if (!bobKey) throw new Error("BOB_PRIVATE_KEY missing in .env");
  if (!carolKey) throw new Error("CAROL_PRIVATE_KEY missing in .env");
  const bob   = new Wallet(bobKey, provider);
  const carol = new Wallet(carolKey, provider);

  const v1  = await ethers.getContractAt("CCMToken", V1);
  const v2  = await ethers.getContractAt("CCMToken", V2);
  const mig = await ethers.getContractAt("CCMMigration", MIG);

  console.log("Admin:", admin.address);
  console.log("Bob  :", bob.address);
  console.log("Carol:", carol.address);

  const v1SupplyBefore = await v1.totalSupply();
  const v2SupplyBefore = await v2.totalSupply();
  const totalMigBefore = await mig.totalMigrated();

  console.log("\n=== BEFORE ===");
  console.log(`  v1 supply      : ${fmt(v1SupplyBefore)}`);
  console.log(`  v2 supply      : ${fmt(v2SupplyBefore)}`);
  console.log(`  total migrated : ${fmt(totalMigBefore)}`);
  console.log(`  Admin v1: ${fmt(await v1.balanceOf(admin.address))}, v2: ${fmt(await v2.balanceOf(admin.address))}`);
  console.log(`  Bob   v1: ${fmt(await v1.balanceOf(bob.address))}, v2: ${fmt(await v2.balanceOf(bob.address))}`);
  console.log(`  Carol v1: ${fmt(await v1.balanceOf(carol.address))}, v2: ${fmt(await v2.balanceOf(carol.address))}`);

  console.log("\n=== Migrating ===");
  const adminRes = await migrateOne({ name: "Admin", signer: admin as any });
  const bobRes   = await migrateOne({ name: "Bob",   signer: bob });
  const carolRes = await migrateOne({ name: "Carol", signer: carol });

  const v1SupplyAfter = await v1.totalSupply();
  const v2SupplyAfter = await v2.totalSupply();
  const totalMigAfter = await mig.totalMigrated();

  console.log("\n=== AFTER ===");
  console.log(`  v1 supply      : ${fmt(v1SupplyAfter)} (burned ${fmt(v1SupplyBefore - v1SupplyAfter)})`);
  console.log(`  v2 supply      : ${fmt(v2SupplyAfter)} (minted ${fmt(v2SupplyAfter - v2SupplyBefore)})`);
  console.log(`  total migrated : ${fmt(totalMigAfter)}`);
  console.log(`  Admin v1: ${fmt(await v1.balanceOf(admin.address))}, v2: ${fmt(await v2.balanceOf(admin.address))}`);
  console.log(`  Bob   v1: ${fmt(await v1.balanceOf(bob.address))}, v2: ${fmt(await v2.balanceOf(bob.address))}`);
  console.log(`  Carol v1: ${fmt(await v1.balanceOf(carol.address))}, v2: ${fmt(await v2.balanceOf(carol.address))}`);

  const totalMigratedNow = adminRes.migrated + bobRes.migrated + carolRes.migrated;
  console.log(`\n  This run migrated: ${fmt(totalMigratedNow)} CCM`);
  console.log(`  Total gas spent  : ${ethers.formatEther(adminRes.gasWei + bobRes.gasWei + carolRes.gasWei)} ETH`);
  console.log("\n✅ Done. Refresh /migrate in each MetaMask account to see v2 balances.");
}

main().catch((e) => { console.error(e); process.exit(1); });
