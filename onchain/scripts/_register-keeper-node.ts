/**
 * Register the Carbon Oracle keeper wallet as a second CCMine node on the
 * Base Sepolia sandbox NodeRegistry. The keeper already pushes carbon
 * price hourly and (after KN2) will also auto-mint NFTs hourly, so its
 * dual role as a "node operator" is accurate.
 *
 * One-off script — run once after the keeper has Sepolia ETH.
 *
 *   npx hardhat run --network baseSepolia scripts/_register-keeper-node.ts
 */
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const RPC = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";
const NODE_REGISTRY = "0xE9AD5DC60a799Cc037824f2B030E641f4d460136";
const KEEPER_FILE = path.resolve(__dirname, "..", "..", ".carbon-oracle-keeper.json");

const LABEL = "ccm-keeper-bot-01";
const ENDPOINT = "https://ccm-portal-api.misterylee.workers.dev";

const REGISTRY_ABI = [
  "function register(string label, string endpoint) returns (uint256)",
  "function count() view returns (uint256)",
  "function nodeOf(address) view returns (tuple(address owner, string label, string endpoint, uint64 registeredAt, bool active))",
  "event NodeRegistered(address indexed owner, uint256 indexed nodeId, string label, string endpoint)",
  "event NodeUpdated(address indexed owner, uint256 indexed nodeId, string label, string endpoint)",
];

async function main() {
  if (!fs.existsSync(KEEPER_FILE)) {
    throw new Error(`Keeper file missing: ${KEEPER_FILE}`);
  }
  const keeperJson = JSON.parse(fs.readFileSync(KEEPER_FILE, "utf8"));
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(keeperJson.privateKey, provider);
  const network = await provider.getNetwork();
  if (network.chainId !== 84532n) {
    throw new Error(`Wrong chain ${network.chainId}, expected 84532`);
  }

  const balance = await provider.getBalance(wallet.address);
  console.log("Keeper:", wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  if (balance < ethers.parseEther("0.0001")) {
    throw new Error("Keeper has < 0.0001 ETH — fund it first");
  }

  const registry = new ethers.Contract(NODE_REGISTRY, REGISTRY_ABI, wallet);

  const before = await registry.count();
  console.log("Active nodes (before):", before.toString());

  const existing = await registry.nodeOf(wallet.address);
  if (existing.active) {
    console.log("Already registered as:", existing.label);
    console.log("Endpoint:", existing.endpoint);
    console.log("Nothing to do — exiting.");
    return;
  }

  console.log("Registering as", LABEL, "→", ENDPOINT);
  const tx = await registry.register(LABEL, ENDPOINT);
  console.log("Tx submitted:", tx.hash);
  const receipt = await tx.wait(2);
  console.log("Confirmed in block", receipt?.blockNumber);

  const after = await registry.count();
  console.log("Active nodes (after):", after.toString());

  const me = await registry.nodeOf(wallet.address);
  console.log("Registered:", { label: me.label, endpoint: me.endpoint, active: me.active });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
