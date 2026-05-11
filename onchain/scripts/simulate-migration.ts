/**
 * Migration simulation on Base Sepolia testnet.
 *
 * Demonstrates v1 → v2 swap for both alice (random EOA holder) and admin
 * (deployer who received a refund from a revoked vesting schedule).
 *
 * Required env:
 *   V1_TOKEN, V2_TOKEN, MIGRATION_ADDRESS, ALICE_PRIVATE_KEY
 *
 * Run:
 *   V1_TOKEN=0x... V2_TOKEN=0x... MIGRATION_ADDRESS=0x... ALICE_PRIVATE_KEY=0x... \
 *     npx hardhat run scripts/simulate-migration.ts --network baseSepolia
 */
import { ethers } from "hardhat";
import { Wallet, formatEther, formatUnits } from "ethers";

const TX_GAS = 500_000;
const POST_TX_DELAY_MS = 4_000;

async function sleep(ms: number) { await new Promise(r => setTimeout(r, ms)); }
const fmt = (a: bigint) => formatUnits(a, 18);

async function main() {
  const V1 = process.env.V1_TOKEN!;
  const V2 = process.env.V2_TOKEN!;
  const MIG = process.env.MIGRATION_ADDRESS!;
  const ALICE_KEY = process.env.ALICE_PRIVATE_KEY!;
  if (!V1 || !V2 || !MIG || !ALICE_KEY) {
    throw new Error("V1_TOKEN, V2_TOKEN, MIGRATION_ADDRESS, ALICE_PRIVATE_KEY env vars required");
  }

  const [admin] = await ethers.getSigners();
  const provider = ethers.provider;
  const alice = new Wallet(ALICE_KEY, provider);

  const v1 = await ethers.getContractAt("CCMToken", V1);
  const v2 = await ethers.getContractAt("CCMToken", V2);
  const mig = await ethers.getContractAt("CCMMigration", MIG);

  console.log("=".repeat(64));
  console.log("Migration simulation (v1 → v2)");
  console.log("  v1        :", V1);
  console.log("  v2        :", V2);
  console.log("  migration :", MIG);
  console.log("  admin     :", admin.address);
  console.log("  alice     :", alice.address);
  console.log("=".repeat(64));

  // ---------- Pre-migration state ----------
  console.log("\n[Pre-migration state]");
  const aliceV1Before = await v1.balanceOf(alice.address);
  const adminV1Before = await v1.balanceOf(admin.address);
  console.log("  alice v1 :", fmt(aliceV1Before), "CCM");
  console.log("  admin v1 :", fmt(adminV1Before), "CCM");
  console.log("  v1 supply:", fmt(await v1.totalSupply()));
  console.log("  v2 supply:", fmt(await v2.totalSupply()));

  // ---------- Step 1: alice approves v1 spending ----------
  console.log("\n[1] Alice approves migration to spend her v1...");
  const tx1 = await v1.connect(alice).approve(MIG, aliceV1Before, { gasLimit: 100_000 });
  await tx1.wait();
  await sleep(POST_TX_DELAY_MS);
  console.log("    tx:", tx1.hash);

  // ---------- Step 2: alice migrates ----------
  console.log("\n[2] Alice migrate(", fmt(aliceV1Before), ")...");
  const tx2 = await mig.connect(alice).migrate(aliceV1Before, { gasLimit: TX_GAS });
  await tx2.wait();
  await sleep(POST_TX_DELAY_MS);
  console.log("    tx:", tx2.hash);
  console.log("    alice v1:", fmt(await v1.balanceOf(alice.address)));
  console.log("    alice v2:", fmt(await v2.balanceOf(alice.address)));

  // ---------- Step 3: admin approves v1 spending ----------
  console.log("\n[3] Admin approves migration to spend his v1...");
  const tx3 = await v1.connect(admin).approve(MIG, adminV1Before, { gasLimit: 100_000 });
  await tx3.wait();
  await sleep(POST_TX_DELAY_MS);
  console.log("    tx:", tx3.hash);

  // ---------- Step 4: admin migrates ----------
  console.log("\n[4] Admin migrate(", fmt(adminV1Before), ")...");
  const tx4 = await mig.connect(admin).migrate(adminV1Before, { gasLimit: TX_GAS });
  await tx4.wait();
  await sleep(POST_TX_DELAY_MS);
  console.log("    tx:", tx4.hash);
  console.log("    admin v1:", fmt(await v1.balanceOf(admin.address)));
  console.log("    admin v2:", fmt(await v2.balanceOf(admin.address)));

  // ---------- Final state ----------
  console.log("\n" + "=".repeat(64));
  console.log("FINAL STATE");
  console.log("=".repeat(64));
  console.log("  alice v1 :", fmt(await v1.balanceOf(alice.address)));
  console.log("  alice v2 :", fmt(await v2.balanceOf(alice.address)));
  console.log("  admin v1 :", fmt(await v1.balanceOf(admin.address)));
  console.log("  admin v2 :", fmt(await v2.balanceOf(admin.address)));
  console.log("  v1 supply:", fmt(await v1.totalSupply()), "(burned 1000)");
  console.log("  v2 supply:", fmt(await v2.totalSupply()), "(minted 1000)");
  console.log("  migration totalMigrated:", fmt(await mig.totalMigrated()));

  const adminEth = await provider.getBalance(admin.address);
  const aliceEth = await provider.getBalance(alice.address);
  console.log("\n  admin ETH remaining:", formatEther(adminEth));
  console.log("  alice ETH remaining:", formatEther(aliceEth));

  console.log("\n✅ Migration simulation complete");
}

main().catch((e) => { console.error(e); process.exit(1); });
