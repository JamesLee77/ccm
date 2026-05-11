/**
 * Deploy CCMSandboxFractionalizer (TESTNET ONLY).
 *
 * Fraction tokens are created lazily on first `fractionalize(id, …)` call,
 * so this deploy creates only the vault.
 *
 * SAFETY: refuses Base mainnet at constructor + here.
 *
 * Required env:
 *   CCM_NFT  - sandbox CCMSandboxNFT address
 *
 * Run:
 *   CCM_NFT=<addr> npx hardhat run scripts/deploy-sandbox-fractionalizer.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const NFT = process.env.CCM_NFT;
  if (!NFT) throw new Error("CCM_NFT env required");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453n) {
    throw new Error("REFUSED: sandbox fractionalizer must not be deployed to Base mainnet.");
  }
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("NFT     :", NFT);

  const Frac = await ethers.getContractFactory("CCMSandboxFractionalizer");
  const f = await Frac.deploy(NFT);
  await f.waitForDeployment();
  const addr = await f.getAddress();
  console.log("\nCCMSandboxFractionalizer deployed:", addr);

  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr} ${NFT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
