/**
 * Deploy CCMSandboxIndexBasket (TESTNET ONLY).
 *
 * Constructor takes the 4 grade-token addresses (CCM-A/B/C/D from
 * §7.3 grade wrapper) and deploys 3 basket tokens (PRIME/FOREST/TECH).
 *
 * Required env:
 *   GRADE_A, GRADE_B, GRADE_C, GRADE_D — grade-token addresses
 *
 * Run:
 *   GRADE_A=<a> GRADE_B=<b> GRADE_C=<c> GRADE_D=<d> \
 *     npx hardhat run scripts/deploy-sandbox-baskets.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const A = process.env.GRADE_A;
  const B = process.env.GRADE_B;
  const C = process.env.GRADE_C;
  const D = process.env.GRADE_D;
  if (!A || !B || !C || !D) throw new Error("GRADE_A/B/C/D required");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453n) throw new Error("REFUSED: mainnet");
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Grades  :", { A, B, C, D });

  const Basket = await ethers.getContractFactory("CCMSandboxIndexBasket");
  const b = await Basket.deploy([A, B, C, D]);
  await b.waitForDeployment();
  const addr = await b.getAddress();
  console.log("\nCCMSandboxIndexBasket deployed:", addr);

  await new Promise((r) => setTimeout(r, 4000));

  const prime = await b.tokenOf(0);
  const forest = await b.tokenOf(1);
  const tech = await b.tokenOf(2);
  console.log("  CCM-PRIME :", prime);
  console.log("  CCM-FOREST:", forest);
  console.log("  CCM-TECH  :", tech);

  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${addr} '["${A}","${B}","${C}","${D}"]'`);
  console.log(`  npx hardhat verify --network baseSepolia ${prime} "CCM PRIME (testnet)" "CCM-PRIME" ${addr}`);
  console.log(`  npx hardhat verify --network baseSepolia ${forest} "CCM FOREST (testnet)" "CCM-FOREST" ${addr}`);
  console.log(`  npx hardhat verify --network baseSepolia ${tech} "CCM TECH (testnet)" "CCM-TECH" ${addr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
