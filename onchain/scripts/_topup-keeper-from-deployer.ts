/**
 * Top up the carbon-oracle keeper wallet from the deployer EOA on Base
 * Sepolia. Transfers (deployer_balance − DEPLOYER_RESERVE) so a working
 * float stays behind for ad-hoc sandbox ops.
 *
 *   npx hardhat run --network baseSepolia scripts/_topup-keeper-from-deployer.ts
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
const DEPLOYER_RESERVE = ethers.parseEther("0.001"); // gas float left on deployer
const GAS_BUFFER = ethers.parseEther("0.0001");      // safety margin on top of estimated send gas

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const deployer = new ethers.Wallet(DEPLOYER_KEY!, provider);
  const keeperJson = JSON.parse(fs.readFileSync(KEEPER_FILE, "utf8"));
  const keeperAddr = keeperJson.address as string;

  const net = await provider.getNetwork();
  if (net.chainId !== 84532n) throw new Error("must be Base Sepolia");

  const deployerBalBefore = await provider.getBalance(deployer.address);
  const keeperBalBefore = await provider.getBalance(keeperAddr);
  console.log("Deployer:", deployer.address, "→", ethers.formatEther(deployerBalBefore), "ETH");
  console.log("Keeper  :", keeperAddr, "→", ethers.formatEther(keeperBalBefore), "ETH");

  if (deployerBalBefore <= DEPLOYER_RESERVE + GAS_BUFFER) {
    throw new Error(
      `Deployer balance ${ethers.formatEther(deployerBalBefore)} ETH ≤ reserve ${ethers.formatEther(DEPLOYER_RESERVE)} + gas buffer ${ethers.formatEther(GAS_BUFFER)}. Fund deployer first via Coinbase Sepolia faucet.`,
    );
  }

  const transferValue = deployerBalBefore - DEPLOYER_RESERVE - GAS_BUFFER;
  console.log("Transferring:", ethers.formatEther(transferValue), "ETH");

  const tx = await deployer.sendTransaction({ to: keeperAddr, value: transferValue });
  console.log("Tx:", tx.hash);
  const receipt = await tx.wait(1);
  console.log("Confirmed in block", receipt?.blockNumber);

  const deployerBalAfter = await provider.getBalance(deployer.address);
  const keeperBalAfter = await provider.getBalance(keeperAddr);
  console.log("\nAfter:");
  console.log("Deployer:", ethers.formatEther(deployerBalAfter), "ETH");
  console.log("Keeper  :", ethers.formatEther(keeperBalAfter), "ETH");
  // Rough runway estimate: ~0.0012 ETH/day at */30 cron × 4 oracle + 1 mint
  const days = Number(ethers.formatEther(keeperBalAfter)) / 0.0012;
  console.log(`Runway (≈0.0012 ETH/day): ~${days.toFixed(1)} days`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
