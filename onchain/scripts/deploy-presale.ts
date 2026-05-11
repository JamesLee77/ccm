/**
 * Deploy CCMToken + CCMVesting (Phase 1: pre-sale with on-chain lockup).
 *
 * Use case:
 *   - Strategic / Series A pre-sale with lockup commitment
 *   - Each investor gets a vesting schedule with cliff + linear vest
 *   - On-chain enforcement of lockup (no manual trust required)
 *
 * Required env:
 *   ADMIN_ADDRESS  - admin / multisig address (gets DEFAULT_ADMIN_ROLE on both)
 *
 * Run:
 *   npx hardhat run scripts/deploy-presale.ts --network baseSepolia
 *   npx hardhat run scripts/deploy-presale.ts --network base
 *
 * After deploy:
 *   For each pre-sale buyer:
 *     1. Admin mints tokens to vesting contract:
 *          token.mint(vestingAddr, totalAmount)
 *     2. Admin creates schedule for buyer:
 *          vesting.createSchedule(buyer, amount, start, cliff, duration, revocable)
 *     OR use createScheduleBatch for efficiency (single tx).
 */
import { ethers } from "hardhat";

async function main() {
  const ADMIN = process.env.ADMIN_ADDRESS;
  if (!ADMIN || ADMIN === ethers.ZeroAddress) {
    throw new Error("ADMIN_ADDRESS env var is required");
  }

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("=".repeat(60));
  console.log("Deploying CCMToken + CCMVesting (Phase 1: pre-sale)");
  console.log("  Network :", network.name, "(chainId:", network.chainId.toString() + ")");
  console.log("  Deployer:", deployer.address);
  console.log("  Admin   :", ADMIN);
  console.log("=".repeat(60));

  // 1. CCMToken
  const Token = await ethers.getContractFactory("CCMToken");
  const token = await Token.deploy(ADMIN);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("\n[1/2] CCMToken deployed:", tokenAddr);
  console.log("       Version:", await token.VERSION());

  // 2. CCMVesting
  const Vesting = await ethers.getContractFactory("CCMVesting");
  const vesting = await Vesting.deploy(tokenAddr, ADMIN);
  await vesting.waitForDeployment();
  const vestAddr = await vesting.getAddress();
  console.log("\n[2/2] CCMVesting deployed:", vestAddr);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("CCMToken  :", tokenAddr);
  console.log("CCMVesting:", vestAddr);
  console.log();
  console.log("Pre-sale workflow:");
  console.log("  1. Investor pays USDC off-chain → admin records receipt");
  console.log(`  2. token.mint("${vestAddr}", totalAmount) — fund the vesting contract`);
  console.log("  3. vesting.createSchedule(investor, amount, start, cliff, duration, true)");
  console.log("     - revocable=true allows admin to redirect tokens for v2 migration");
  console.log("  4. Investor calls vesting.release(id) after cliff to claim vested portion");
  console.log();
  console.log("Verify on explorer:");
  const net = network.name === "unknown" ? "baseSepolia" : network.name;
  console.log(`  npx hardhat verify --network ${net} ${tokenAddr} ${ADMIN}`);
  console.log(`  npx hardhat verify --network ${net} ${vestAddr} ${tokenAddr} ${ADMIN}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
