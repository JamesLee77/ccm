/**
 * Deploy CCMSandboxVault (TESTNET ONLY) and grant it MINTER_ROLE on
 * the sandbox CCMToken so it can mint test CCM on wrap.
 *
 * SAFETY: refuses Base mainnet at constructor + here.
 *
 * Required env:
 *   CCM_TOKEN  - sandbox CCMToken address
 *   CCM_NFT    - sandbox CCMSandboxNFT address
 *
 * Run:
 *   CCM_TOKEN=<addr> CCM_NFT=<addr> npx hardhat run scripts/deploy-sandbox-vault.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const TOKEN = process.env.CCM_TOKEN;
  const NFT = process.env.CCM_NFT;
  if (!TOKEN || !NFT) throw new Error("CCM_TOKEN and CCM_NFT env required");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453n) {
    throw new Error("REFUSED: sandbox vault must not be deployed to Base mainnet.");
  }
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Token   :", TOKEN);
  console.log("NFT     :", NFT);

  const Vault = await ethers.getContractFactory("CCMSandboxVault");
  const vault = await Vault.deploy(NFT, TOKEN);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("\n[1/2] CCMSandboxVault deployed:", vaultAddr);

  // Wait for state to settle (Base Sepolia caching)
  await new Promise((r) => setTimeout(r, 4000));

  const Token = await ethers.getContractAt("CCMToken", TOKEN);
  const MINTER_ROLE = await Token.MINTER_ROLE();
  console.log("\n[2/2] Granting MINTER_ROLE to vault…");
  const tx = await Token.grantRole(MINTER_ROLE, vaultAddr);
  await tx.wait();
  console.log("       tx:", tx.hash);

  console.log("\nDeploy complete.");
  console.log("  Vault: ", vaultAddr);
  console.log("  Token: ", TOKEN);
  console.log("  NFT  : ", NFT);
  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${vaultAddr} ${NFT} ${TOKEN}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
