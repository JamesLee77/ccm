/**
 * One-off: deploy CCMVesting with an already-deployed CCMToken address.
 * Used when deploy-presale.ts crashes after deploying the token (RPC race).
 *
 * Required env:
 *   ADMIN_ADDRESS  - admin / multisig address
 *   CCM_TOKEN      - already-deployed CCMToken address
 *
 * Run:
 *   CCM_TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
 *     npx hardhat run scripts/_deploy-vesting-only.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const ADMIN = process.env.ADMIN_ADDRESS;
  const TOKEN = process.env.CCM_TOKEN;
  if (!ADMIN || !TOKEN) throw new Error("ADMIN_ADDRESS and CCM_TOKEN env required");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Admin   :", ADMIN);
  console.log("Token   :", TOKEN);

  const Vesting = await ethers.getContractFactory("CCMVesting");
  const vesting = await Vesting.deploy(TOKEN, ADMIN);
  await vesting.waitForDeployment();
  const addr = await vesting.getAddress();
  console.log("\nCCMVesting deployed:", addr);
  console.log("\nVerify:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr} ${TOKEN} ${ADMIN}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
