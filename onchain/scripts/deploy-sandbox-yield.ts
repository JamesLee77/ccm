/**
 * Deploy CCMSandboxYield (TESTNET ONLY) and grant MINTER_ROLE on the
 * sandbox CCMToken so it can mint yield rewards.
 *
 * SAFETY: refuses Base mainnet at constructor + here.
 *
 * Required env:
 *   CCM_NFT    - sandbox NFT address
 *   CCM_TOKEN  - sandbox CCMToken address
 *
 * Run:
 *   CCM_NFT=<addr> CCM_TOKEN=<addr> \
 *     npx hardhat run scripts/deploy-sandbox-yield.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const NFT = process.env.CCM_NFT;
  const TOKEN = process.env.CCM_TOKEN;
  if (!NFT || !TOKEN) throw new Error("CCM_NFT and CCM_TOKEN required");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453n) throw new Error("REFUSED: mainnet");

  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("NFT     :", NFT);
  console.log("Token   :", TOKEN);

  const Y = await ethers.getContractFactory("CCMSandboxYield");
  const y = await Y.deploy(NFT, TOKEN);
  await y.waitForDeployment();
  const addr = await y.getAddress();
  console.log("\n[1/2] CCMSandboxYield deployed:", addr);

  await new Promise((r) => setTimeout(r, 4000));

  const Token = await ethers.getContractAt("CCMToken", TOKEN);
  const MINTER_ROLE = await Token.MINTER_ROLE();
  console.log("\n[2/2] Granting MINTER_ROLE to yield vault…");
  const tx = await Token.grantRole(MINTER_ROLE, addr);
  await tx.wait();
  console.log("       tx:", tx.hash);

  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr} ${NFT} ${TOKEN}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
