/**
 * Deploy CCMSandboxGradeWrapper (TESTNET ONLY).
 *
 * Constructor deploys 4 grade tokens (CCM-A/B/C/D) internally. No
 * post-deploy role grants needed since the wrapper is the immutable
 * minter on each token.
 *
 * SAFETY: refuses Base mainnet at constructor + here.
 *
 * Required env:
 *   CCM_NFT  - sandbox CCMSandboxNFT address
 *
 * Run:
 *   CCM_NFT=<addr> npx hardhat run scripts/deploy-sandbox-grade-wrapper.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const NFT = process.env.CCM_NFT;
  if (!NFT) throw new Error("CCM_NFT env required");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453n) {
    throw new Error("REFUSED: sandbox grade wrapper must not be deployed to Base mainnet.");
  }
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("NFT     :", NFT);

  const Wrapper = await ethers.getContractFactory("CCMSandboxGradeWrapper");
  const wrapper = await Wrapper.deploy(NFT);
  await wrapper.waitForDeployment();
  const addr = await wrapper.getAddress();
  console.log("\n[1/1] CCMSandboxGradeWrapper deployed:", addr);

  // Wait for state to settle, then read grade-token addresses
  await new Promise((r) => setTimeout(r, 4000));
  const tA = await wrapper.tokenOf(0);
  const tB = await wrapper.tokenOf(1);
  const tC = await wrapper.tokenOf(2);
  const tD = await wrapper.tokenOf(3);
  console.log("  CCM-A token:", tA);
  console.log("  CCM-B token:", tB);
  console.log("  CCM-C token:", tC);
  console.log("  CCM-D token:", tD);

  console.log("\nVerify wrapper:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr} ${NFT}`);
  console.log("Verify each grade token (use the CCMGradeToken contract):");
  console.log(`  npx hardhat verify --network baseSepolia ${tA} "CCM Grade A (testnet)" "CCM-A" ${addr}`);
  console.log(`  npx hardhat verify --network baseSepolia ${tB} "CCM Grade B (testnet)" "CCM-B" ${addr}`);
  console.log(`  npx hardhat verify --network baseSepolia ${tC} "CCM Grade C (testnet)" "CCM-C" ${addr}`);
  console.log(`  npx hardhat verify --network baseSepolia ${tD} "CCM Grade D (testnet)" "CCM-D" ${addr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
