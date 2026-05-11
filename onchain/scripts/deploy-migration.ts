/**
 * Deploy CCMMigration (Phase 2: v1 → v2 token swap).
 *
 * Use case:
 *   - Source code changed (Node/Mining hooks added → new token contract needed)
 *   - Pre-sale holders need to migrate to v2
 *   - Optional bonus to incentivize timely migration
 *
 * Required env:
 *   V1_TOKEN       - existing CCMToken address (Phase 1)
 *   V2_TOKEN       - new CCMTokenV2 address (must already be deployed)
 *   ADMIN_ADDRESS  - admin / multisig
 *   BONUS_BPS      - migration bonus in basis points (0 = 1:1, 500 = 1.05x). Default: 0.
 *   DEADLINE_DAYS  - migration window in days. Default: 90.
 *
 * Post-deploy:
 *   1. Grant MINTER_ROLE on v2 to the migration contract:
 *        v2.grantRole(MINTER_ROLE, migration)
 *   2. Announce migration to v1 holders.
 *   3. v1 holders call v1.approve(migration, amount), then migration.migrate(amount).
 *
 * Run:
 *   V1_TOKEN=0x... V2_TOKEN=0x... ADMIN_ADDRESS=0x... \
 *     npx hardhat run scripts/deploy-migration.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const V1 = process.env.V1_TOKEN;
  const V2 = process.env.V2_TOKEN;
  const ADMIN = process.env.ADMIN_ADDRESS;
  const BONUS = BigInt(process.env.BONUS_BPS ?? "0");
  const DAYS = Number(process.env.DEADLINE_DAYS ?? "90");

  if (!V1 || !V2 || !ADMIN || V1 === ethers.ZeroAddress || V2 === ethers.ZeroAddress) {
    throw new Error("V1_TOKEN, V2_TOKEN, ADMIN_ADDRESS env vars required");
  }
  if (BONUS > 5000n) throw new Error("BONUS_BPS must be <= 5000 (50%)");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const block = await ethers.provider.getBlock("latest");
  const deadline = (block?.timestamp ?? Math.floor(Date.now() / 1000)) + DAYS * 24 * 60 * 60;

  console.log("=".repeat(60));
  console.log("Deploying CCMMigration (Phase 2)");
  console.log("  Network :", network.name, "(chainId:", network.chainId.toString() + ")");
  console.log("  Deployer:", deployer.address);
  console.log("  v1 Token:", V1);
  console.log("  v2 Token:", V2);
  console.log("  Admin   :", ADMIN);
  console.log("  Bonus   :", BONUS.toString(), "bps", BONUS === 0n ? "(1:1)" : `(${(Number(BONUS)/100).toFixed(2)}% bonus)`);
  console.log("  Deadline:", new Date(deadline * 1000).toISOString(), `(${DAYS} days)`);
  console.log("=".repeat(60));

  const Mig = await ethers.getContractFactory("CCMMigration");
  const migration = await Mig.deploy(V1, V2, BONUS, deadline, ADMIN);
  await migration.waitForDeployment();
  const migAddr = await migration.getAddress();

  console.log("\nCCMMigration deployed:", migAddr);
  console.log("\n" + "=".repeat(60));
  console.log("CRITICAL NEXT STEPS");
  console.log("=".repeat(60));
  console.log(`1. Grant MINTER_ROLE on v2 to migration contract:`);
  console.log(`   v2 = await ethers.getContractAt("CCMToken", "${V2}")`);
  console.log(`   await v2.grantRole(await v2.MINTER_ROLE(), "${migAddr}")`);
  console.log();
  console.log(`2. (Optional) Revoke MINTER_ROLE from admin EOA after migration completes.`);
  console.log();
  console.log(`3. Verify on explorer:`);
  const net = network.name === "unknown" ? "baseSepolia" : network.name;
  console.log(`   npx hardhat verify --network ${net} ${migAddr} ${V1} ${V2} ${BONUS} ${deadline} ${ADMIN}`);
  console.log();
  console.log(`4. Holders migrate:`);
  console.log(`   v1.approve("${migAddr}", amount)`);
  console.log(`   migration.migrate(amount)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
