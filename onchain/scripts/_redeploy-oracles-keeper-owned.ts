/**
 * Re-deploy the 4 sandbox MockPriceOracles + CCMSandboxMedianAggregator
 * with the carbon-oracle keeper wallet as the owner of each oracle so the
 * Worker cron can call setPrice() and emit a continuous PriceUpdated
 * history.
 *
 * Also tops the keeper up to 0.01 ETH from the deployer if its balance
 * is too low to cover the deploys + ~1 month of cron updates.
 *
 *   npx hardhat run --network baseSepolia scripts/_redeploy-oracles-keeper-owned.ts
 */
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const RPC = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";
const DEPLOYER_KEY = process.env.TESTNET_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
if (!DEPLOYER_KEY) throw new Error("TESTNET_PRIVATE_KEY or PRIVATE_KEY required");

const KEEPER_FILE = path.resolve(__dirname, "..", "..", ".carbon-oracle-keeper.json");
const ART_ORACLE = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "artifacts", "contracts", "mocks", "MockPriceOracle.sol", "MockPriceOracle.json"), "utf8"),
);
const ART_AGG = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "artifacts", "contracts", "sandbox", "CCMSandboxMedianAggregator.sol", "CCMSandboxMedianAggregator.json"), "utf8"),
);

// Initial prices match the previous deployment so the median stays near
// $0.20 immediately after the redeploy.
const INITIAL_PRICES = [
  ethers.parseUnits("0.20", 18),  // Oracle-A
  ethers.parseUnits("0.21", 18),  // Oracle-B
  ethers.parseUnits("0.19", 18),  // Oracle-C
  ethers.parseUnits("0.20", 18),  // Oracle-D (primary)
];

const KEEPER_TARGET = ethers.parseEther("0.005");

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const deployer = new ethers.Wallet(DEPLOYER_KEY!, provider);
  const keeperJson = JSON.parse(fs.readFileSync(KEEPER_FILE, "utf8"));
  const keeper = new ethers.Wallet(keeperJson.privateKey, provider);

  const network = await provider.getNetwork();
  if (network.chainId !== 84532n) throw new Error("must be Base Sepolia");
  console.log("Deployer:", deployer.address);
  console.log("Keeper  :", keeper.address);

  const keeperBal = await provider.getBalance(keeper.address);
  console.log("Keeper balance:", ethers.formatEther(keeperBal), "ETH");
  if (keeperBal < KEEPER_TARGET) {
    const topup = KEEPER_TARGET - keeperBal;
    console.log("Topping up keeper with", ethers.formatEther(topup), "ETH");
    const tx = await deployer.sendTransaction({ to: keeper.address, value: topup });
    await tx.wait(1);
    const newBal = await provider.getBalance(keeper.address);
    console.log("Keeper balance (post-topup):", ethers.formatEther(newBal), "ETH");
  }

  const OracleFactory = new ethers.ContractFactory(ART_ORACLE.abi, ART_ORACLE.bytecode, keeper);
  const oracles: string[] = [];
  for (let i = 0; i < 4; i++) {
    const label = ["A", "B", "C", "D (primary)"][i];
    const contract = await OracleFactory.deploy(INITIAL_PRICES[i]);
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    oracles.push(addr);
    console.log(`Oracle-${label}:`, addr, "initial $" + ethers.formatUnits(INITIAL_PRICES[i], 18));
  }

  const AggFactory = new ethers.ContractFactory(ART_AGG.abi, ART_AGG.bytecode, keeper);
  const agg = await AggFactory.deploy(oracles[0], oracles[1], oracles[2], oracles[3]);
  await agg.waitForDeployment();
  const aggAddr = await agg.getAddress();
  console.log("MedianAggregator:", aggAddr);

  // Sanity-check the aggregator reads each source.
  const aggContract = new ethers.Contract(aggAddr, ART_AGG.abi, provider);
  const median = await aggContract.getPrice();
  console.log("Initial median:", "$" + ethers.formatUnits(median, 18));

  console.log("\n---\nUpdate testnet/src/lib/contracts.ts:");
  console.log(`  oracleA:          "${oracles[0]}",`);
  console.log(`  oracleB:          "${oracles[1]}",`);
  console.log(`  oracleC:          "${oracles[2]}",`);
  console.log(`  mockPriceOracle:  "${oracles[3]}",  // Oracle-D primary`);
  console.log(`  medianAggregator: "${aggAddr}",`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
