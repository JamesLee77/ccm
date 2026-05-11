/**
 * Deploy CCMSandboxNFT (TESTNET ONLY).
 *
 * SAFETY: Refuses Base mainnet (chainId 8453) at both the constructor and
 * here. The mainnet CCM-NFT will be a different contract issued under
 * multi-VVB consensus.
 *
 * Run:
 *   npx hardhat run scripts/deploy-sandbox-nft.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  if (network.chainId === 8453n) {
    throw new Error(
      "REFUSED: CCMSandboxNFT is sandbox-only and must not be deployed to Base mainnet (chainId 8453).",
    );
  }

  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);

  const NFT = await ethers.getContractFactory("CCMSandboxNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  const addr = await nft.getAddress();
  console.log("\nCCMSandboxNFT deployed:", addr);

  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
