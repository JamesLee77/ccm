/**
 * Deploy CCMSandboxInsurance (TESTNET ONLY) and seed it with USDC.
 *
 * SAFETY: refuses Base mainnet at constructor + here.
 *
 * Required env:
 *   CCM_NFT   - sandbox NFT
 *   CCM_USDC  - sandbox USDC
 *
 * Run:
 *   CCM_NFT=<addr> CCM_USDC=<addr> \
 *     npx hardhat run scripts/deploy-sandbox-insurance.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const NFT = process.env.CCM_NFT;
  const USDC = process.env.CCM_USDC;
  if (!NFT || !USDC) throw new Error("CCM_NFT and CCM_USDC required");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453n) throw new Error("REFUSED: mainnet");

  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("NFT     :", NFT);
  console.log("USDC    :", USDC);

  const Insurance = await ethers.getContractFactory("CCMSandboxInsurance");
  const v = await Insurance.deploy(NFT, USDC);
  await v.waitForDeployment();
  const addr = await v.getAddress();
  console.log("\n[1/2] CCMSandboxInsurance deployed:", addr);

  await new Promise((r) => setTimeout(r, 4000));

  // Seed: deployer claims USDC and transfers in
  console.log("\n[2/2] Seeding insurance pool with 1000 test USDC…");
  const usdc = await ethers.getContractAt("CCMSandboxUSDC", USDC);
  let tx;
  try {
    tx = await usdc.claim();
    await tx.wait();
  } catch (e) {
    console.log("       (skip claim — may be on cooldown)");
  }
  const bal = await usdc.balanceOf(deployer.address);
  console.log("       deployer USDC balance:", bal.toString());
  if (bal > 0n) {
    tx = await usdc.transfer(addr, bal);
    await tx.wait();
    console.log("       seeded:", tx.hash);
  } else {
    console.log("       (no USDC to seed; transfer manually later)");
  }

  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr} ${NFT} ${USDC}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
