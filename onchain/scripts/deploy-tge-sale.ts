/**
 * Deploy CCMTGESale.
 *
 * Generic contract — works on Base mainnet (8453) and Base Sepolia (84532).
 * For the testnet rehearsal we point at the sandbox CCMToken + CCMSandboxUSDC.
 * For mainnet, point at the real CCMToken + canonical Base USDC after Phase 0.
 *
 * Required env:
 *   CCM   - CCMToken address (the token being sold)
 *   USDC  - USDC address (payment token; 6 decimals expected)
 *   ADMIN - DEFAULT_ADMIN_ROLE + ADMIN_ROLE recipient (usually deployer for
 *           testnet, multisig for mainnet)
 *
 * Run:
 *   CCM=<a> USDC=<b> ADMIN=<c> \
 *     npx hardhat run scripts/deploy-tge-sale.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const CCM = process.env.CCM;
  const USDC = process.env.USDC;
  const ADMIN = process.env.ADMIN;
  if (!CCM || !USDC || !ADMIN) throw new Error("CCM, USDC, ADMIN required");
  for (const [k, v] of Object.entries({ CCM, USDC, ADMIN })) {
    if (!ethers.isAddress(v)) throw new Error(`${k} invalid: ${v}`);
  }

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("CCM     :", CCM);
  console.log("USDC    :", USDC);
  console.log("Admin   :", ADMIN);

  const Sale = await ethers.getContractFactory("CCMTGESale");
  const s = await Sale.deploy(CCM, USDC, ADMIN);
  await s.waitForDeployment();
  const addr = await s.getAddress();
  console.log("\nCCMTGESale deployed:", addr);

  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr} ${CCM} ${USDC} ${ADMIN}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
