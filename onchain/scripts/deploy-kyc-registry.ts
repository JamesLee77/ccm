/**
 * Deploy CCMKYCRegistry. Suitable for both Base Sepolia rehearsal and
 * mainnet. Constructor takes:
 *   - admin    : the address that holds DEFAULT_ADMIN_ROLE (= manages
 *                operators). On mainnet, this should be the Timelock so
 *                role grants pass through 48h delay + multisig.
 *   - operator : the address that holds KYC_OPERATOR_ROLE (= flips per-
 *                user status). On mainnet, this should be the Safe
 *                directly (operational, no timelock for daily approvals).
 *
 * Required env:
 *   ADMIN     - DEFAULT_ADMIN_ROLE holder (timelock address on mainnet)
 *   OPERATOR  - KYC_OPERATOR_ROLE holder (safe address on mainnet)
 *
 * Run:
 *   ADMIN=<a> OPERATOR=<b> \
 *     npx hardhat run scripts/deploy-kyc-registry.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const ADMIN = process.env.ADMIN;
  const OPERATOR = process.env.OPERATOR;
  if (!ADMIN || !OPERATOR) throw new Error("ADMIN and OPERATOR required");
  if (!ethers.isAddress(ADMIN)) throw new Error(`ADMIN invalid: ${ADMIN}`);
  if (!ethers.isAddress(OPERATOR)) throw new Error(`OPERATOR invalid: ${OPERATOR}`);

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Admin   :", ADMIN);
  console.log("Operator:", OPERATOR);

  const F = await ethers.getContractFactory("CCMKYCRegistry");
  const r = await F.deploy(ADMIN, OPERATOR);
  await r.waitForDeployment();
  const addr = await r.getAddress();
  console.log("\nCCMKYCRegistry deployed:", addr);

  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr} ${ADMIN} ${OPERATOR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
