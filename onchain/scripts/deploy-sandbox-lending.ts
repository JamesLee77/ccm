/**
 * Deploy CCMSandboxUSDC + CCMSandboxLending (TESTNET ONLY).
 *
 * Two contracts:
 *  1. CCMSandboxUSDC — public-claim test USDC (1000 / 24h cooldown)
 *  2. CCMSandboxLending — wired to NFT + USDC, hard-coded grade params
 *
 * The deployer optionally pre-funds the lending pool by claiming USDC
 * and transferring it in.
 *
 * SAFETY: refuses Base mainnet at constructor + here.
 *
 * Required env:
 *   CCM_NFT  - sandbox CCMSandboxNFT address
 *
 * Run:
 *   CCM_NFT=<addr> npx hardhat run scripts/deploy-sandbox-lending.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const NFT = process.env.CCM_NFT;
  if (!NFT) throw new Error("CCM_NFT env required");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453n) {
    throw new Error("REFUSED: sandbox lending must not be deployed to Base mainnet.");
  }
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("NFT     :", NFT);

  // 1. Deploy USDC
  const USDC = await ethers.getContractFactory("CCMSandboxUSDC");
  const usdc = await USDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  console.log("\n[1/3] CCMSandboxUSDC deployed:", usdcAddr);

  await new Promise((r) => setTimeout(r, 3000));

  // 2. Deploy Lending
  const Lending = await ethers.getContractFactory("CCMSandboxLending");
  const lending = await Lending.deploy(NFT, usdcAddr);
  await lending.waitForDeployment();
  const lendingAddr = await lending.getAddress();
  console.log("\n[2/3] CCMSandboxLending deployed:", lendingAddr);

  await new Promise((r) => setTimeout(r, 3000));

  // 3. Pre-fund the lending pool: deployer claims USDC and seeds.
  console.log("\n[3/3] Seeding lending pool with 1000 test USDC…");
  const claimTx = await usdc.claim();
  await claimTx.wait();
  await new Promise((r) => setTimeout(r, 3000));
  const seedTx = await usdc.transfer(lendingAddr, 1000n * 10n ** 6n);
  await seedTx.wait();
  console.log("       seed tx:", seedTx.hash);

  console.log("\nDeploy complete:");
  console.log("  USDC    :", usdcAddr);
  console.log("  Lending :", lendingAddr);
  console.log("  NFT     :", NFT);
  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${usdcAddr}`);
  console.log(`  npx hardhat verify --network baseSepolia ${lendingAddr} ${NFT} ${usdcAddr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
