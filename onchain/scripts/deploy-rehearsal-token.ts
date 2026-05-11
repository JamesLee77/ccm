/**
 * Deploy a fresh CCMToken intended for the mainnet pre-flight rehearsal.
 * This is a *separate* token from the sandbox CCMToken — the sandbox one
 * keeps its EOA admin so primitive deploys can keep granting MINTER_ROLE
 * directly. This rehearsal token will have its admin handed over to the
 * CCMTimelock to prove the mainnet handoff flow end-to-end.
 *
 * Run:
 *   npx hardhat run scripts/deploy-rehearsal-token.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453n) {
    throw new Error("REFUSED: this is a rehearsal script, do not run on mainnet");
  }
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);

  const Token = await ethers.getContractFactory("CCMToken");
  const t = await Token.deploy(deployer.address);
  await t.waitForDeployment();
  const addr = await t.getAddress();
  console.log("\nCCMToken (rehearsal) deployed:", addr);

  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr} ${deployer.address}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
