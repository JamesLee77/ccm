/**
 * Deploy CCMToken alone (Phase 1: token-only).
 *
 * Use case:
 *   - Pre-sale via off-chain SAFT (no on-chain lockup needed)
 *   - Token contract verification / branding
 *   - Marketing visibility before full TGE
 *
 * Required env:
 *   ADMIN_ADDRESS  - admin / multisig address
 *
 * Run:
 *   npx hardhat run scripts/deploy-token.ts --network baseSepolia
 *   npx hardhat run scripts/deploy-token.ts --network base
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
  console.log("Deploying CCMToken (Phase 1: token only)");
  console.log("  Network :", network.name, "(chainId:", network.chainId.toString() + ")");
  console.log("  Deployer:", deployer.address);
  console.log("  Admin   :", ADMIN);
  console.log("=".repeat(60));

  const Token = await ethers.getContractFactory("CCMToken");
  const token = await Token.deploy(ADMIN);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();

  console.log("\nCCMToken deployed:", tokenAddr);
  console.log("  Version :", await token.VERSION());
  console.log("  Cap     :", ethers.formatUnits(await token.cap(), 18), "CCM");
  console.log("  Supply  :", ethers.formatUnits(await token.totalSupply(), 18), "CCM (initial = 0)");
  console.log("  Admin   :", ADMIN, "(holds DEFAULT_ADMIN/MINTER/PAUSER roles)");

  console.log("\nNext steps:");
  console.log(`  1. Verify on BaseScan: npx hardhat verify --network ${network.name === "unknown" ? "baseSepolia" : network.name} ${tokenAddr} ${ADMIN}`);
  console.log("  2. Transfer admin role to multisig (mainnet only)");
  console.log("  3. Mint to pre-sale buyers as KYC clears (admin uses .mint(buyer, amount))");
  console.log("  4. (Optional) Deploy CCMVesting for on-chain lockup");
}

main().catch((e) => { console.error(e); process.exit(1); });
