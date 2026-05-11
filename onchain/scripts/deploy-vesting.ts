/**
 * Deploy CCMVesting.
 *
 * Required env:
 *   CCM   - CCMToken address (token to lock)
 *   ADMIN - DEFAULT_ADMIN_ROLE + SCHEDULE_MANAGER_ROLE recipient
 *           (deployer EOA on testnet rehearsal, multisig on mainnet)
 *
 * Run:
 *   CCM=<a> ADMIN=<b> \
 *     npx hardhat run scripts/deploy-vesting.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const CCM = process.env.CCM;
  const ADMIN = process.env.ADMIN;
  if (!CCM || !ADMIN) throw new Error("CCM, ADMIN required");
  if (!ethers.isAddress(CCM)) throw new Error(`CCM invalid: ${CCM}`);
  if (!ethers.isAddress(ADMIN)) throw new Error(`ADMIN invalid: ${ADMIN}`);

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("CCM     :", CCM);
  console.log("Admin   :", ADMIN);

  const Vesting = await ethers.getContractFactory("CCMVesting");
  const v = await Vesting.deploy(CCM, ADMIN);
  await v.waitForDeployment();
  const addr = await v.getAddress();
  console.log("\nCCMVesting deployed:", addr);

  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr} ${CCM} ${ADMIN}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
