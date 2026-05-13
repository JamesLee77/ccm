/**
 * Deploy testnet network-viz infrastructure on Base Sepolia:
 *   - 3 additional MockPriceOracle instances (Oracle-A, B, C)
 *   - CCMSandboxMedianAggregator wiring those 3 + the existing primary oracle
 *   - CCMSandboxNodeRegistry
 *
 * Then pre-seed:
 *   - Oracle prices: A=0.20, B=0.21, C=0.19 (existing primary D=0.20 untouched)
 *   - Register 5 demo nodes from the deployer EOA (one register call per slot
 *     would only register 1; the script uses 5 different signers via getSigners
 *     when available, or falls back to 1 self-registration if only the deployer
 *     is configured. For Sepolia the script accepts an optional DEMO_NODES env
 *     to override the count.)
 *
 * Required env:
 *   PRIMARY_ORACLE  - existing MockPriceOracle address from T2 deploy
 *                     default: 0x467b5f3Deb6750866ae2D5e05705A9Edae13b30e
 *
 * Optional env:
 *   DEMO_NODES      - integer 0-5; how many self-registered demo nodes to
 *                     seed from the deployer (defaults to 1 — the deployer
 *                     itself; operator can register more from other wallets
 *                     after the page is live).
 *
 * Run:
 *   npx hardhat run scripts/deploy-network-viz.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const PRIMARY = process.env.PRIMARY_ORACLE ?? "0x467b5f3Deb6750866ae2D5e05705A9Edae13b30e";
  if (!ethers.isAddress(PRIMARY)) {
    throw new Error(`PRIMARY_ORACLE invalid: ${PRIMARY}`);
  }
  const PRIMARY_ADDR = ethers.getAddress(PRIMARY);

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 84532n) {
    throw new Error(`Refusing to run: chainId is ${network.chainId} (expected 84532 = Base Sepolia)`);
  }

  console.log("=".repeat(70));
  console.log("Testnet network-viz deploy");
  console.log("  Network        :", network.name, "chainId", network.chainId.toString());
  console.log("  Deployer       :", deployer.address);
  console.log("  Primary oracle :", PRIMARY_ADDR, "(unchanged)");
  console.log("=".repeat(70));

  const P0 = 200000000000000000n; // 0.20 USD in 1e18
  const PRICE_A = P0;
  const PRICE_B = 210000000000000000n; // 0.21
  const PRICE_C = 190000000000000000n; // 0.19

  // 1. Deploy 3 additional oracles
  console.log("\n[1/4] Deploying 3 oracles…");
  const Oracle = await ethers.getContractFactory("MockPriceOracle");
  const oA = await Oracle.deploy(PRICE_A); await oA.waitForDeployment();
  const oB = await Oracle.deploy(PRICE_B); await oB.waitForDeployment();
  const oC = await Oracle.deploy(PRICE_C); await oC.waitForDeployment();
  const oAAddr = await oA.getAddress();
  const oBAddr = await oB.getAddress();
  const oCAddr = await oC.getAddress();
  console.log("       Oracle-A:", oAAddr, "@ 0.20");
  console.log("       Oracle-B:", oBAddr, "@ 0.21");
  console.log("       Oracle-C:", oCAddr, "@ 0.19");

  // 2. Deploy aggregator (Oracle-A, B, C + existing primary as D)
  console.log("\n[2/4] Deploying MedianAggregator…");
  const Agg = await ethers.getContractFactory("CCMSandboxMedianAggregator");
  const agg = await Agg.deploy(oAAddr, oBAddr, oCAddr, PRIMARY_ADDR);
  await agg.waitForDeployment();
  const aggAddr = await agg.getAddress();
  const aggPrice = await agg.getPrice();
  console.log("       MedianAggregator:", aggAddr);
  console.log("       median(0.20, 0.21, 0.19, 0.20):", ethers.formatUnits(aggPrice, 18), "USD");

  // 3. Deploy NodeRegistry
  console.log("\n[3/4] Deploying NodeRegistry…");
  const Reg = await ethers.getContractFactory("CCMSandboxNodeRegistry");
  const reg = await Reg.deploy();
  await reg.waitForDeployment();
  const regAddr = await reg.getAddress();
  console.log("       NodeRegistry:", regAddr);

  // 4. Pre-seed: register N demo nodes from the deployer
  const demoCount = Math.max(0, Math.min(5, parseInt(process.env.DEMO_NODES ?? "1", 10)));
  console.log(`\n[4/4] Seeding ${demoCount} demo node(s) from deployer EOA…`);
  if (demoCount > 0) {
    // Since one address can only have one registration slot, deployer registers
    // itself once. Operator should register more from additional EOAs after deploy.
    const tx = await reg.register(`ccmine-seed-${deployer.address.slice(2, 6)}`, "https://testnet.ccmnetwork.net");
    const receipt = await tx.wait(2);
    if (!receipt) throw new Error("seed register tx returned null receipt");
    console.log("       deployer registered:", tx.hash);
  }
  const count = await reg.count();
  console.log("       registry count:", count.toString());

  // Verify state
  console.log("\nFinal state:");
  console.log("  Oracle-A         :", oAAddr);
  console.log("  Oracle-B         :", oBAddr);
  console.log("  Oracle-C         :", oCAddr);
  console.log("  MedianAggregator :", aggAddr);
  console.log("  NodeRegistry     :", regAddr);
  console.log("\nVerification commands:");
  console.log(`  npx hardhat verify --network baseSepolia ${oAAddr} ${PRICE_A}`);
  console.log(`  npx hardhat verify --network baseSepolia ${oBAddr} ${PRICE_B}`);
  console.log(`  npx hardhat verify --network baseSepolia ${oCAddr} ${PRICE_C}`);
  console.log(`  npx hardhat verify --network baseSepolia ${aggAddr} ${oAAddr} ${oBAddr} ${oCAddr} ${PRIMARY_ADDR}`);
  console.log(`  npx hardhat verify --network baseSepolia ${regAddr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
