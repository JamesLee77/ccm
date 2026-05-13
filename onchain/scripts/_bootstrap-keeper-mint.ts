/**
 * One-off: trigger the first keeper-bot NFT mint immediately so the
 * MiningTimeline shows an entry without waiting for the hourly cron.
 *
 * Mirrors portal-api/src/sandboxMint.ts (random grade A-C, vintage 2026,
 * tonnage 50–200, fresh projectId). Skips silently if cooldown is active.
 */
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const RPC = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";
const NFT_ADDR = "0x9a7c5581460C69347D71733050e080869f6A3b9E";
const KEEPER_FILE = path.resolve(__dirname, "..", "..", ".carbon-oracle-keeper.json");

const NFT_ABI = [
  "function mint(uint8 grade, uint16 vintage, uint256 tonnage, bytes32 projectId) returns (uint256)",
  "function cooldownRemaining(address) view returns (uint256)",
  "event Minted(address indexed to, uint256 indexed id, uint8 grade, uint16 vintage, uint256 tonnage, bytes32 projectId)",
];

function pickGrade(): number {
  const r = Math.random();
  if (r < 0.4) return 0;
  if (r < 0.8) return 1;
  return 2;
}

function pickTonnage(): bigint {
  return BigInt(50 + Math.floor(Math.random() * 151));
}

async function main() {
  const keeper = JSON.parse(fs.readFileSync(KEEPER_FILE, "utf8"));
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(keeper.privateKey, provider);
  const net = await provider.getNetwork();
  if (net.chainId !== 84532n) throw new Error("not Sepolia");
  console.log("Keeper:", wallet.address);

  const nft = new ethers.Contract(NFT_ADDR, NFT_ABI, wallet);
  const cooldown = await nft.cooldownRemaining(wallet.address);
  if (cooldown > 0n) {
    console.log(`Cooldown active: ${cooldown.toString()}s — skip`);
    return;
  }

  const grade = pickGrade();
  const tonnage = pickTonnage();
  const seed = `ccm-keeper-bot-01:${Date.now()}:${Math.floor(Math.random() * 1e9)}`;
  const projectId = ethers.keccak256(ethers.toUtf8Bytes(seed));
  const gradeLabel = ["A", "B", "C", "D"][grade];

  console.log(`Minting grade=${gradeLabel} vintage=2026 tonnage=${tonnage.toString()}t`);
  const tx = await nft.mint(grade, 2026, tonnage, projectId);
  console.log("Tx:", tx.hash);
  const receipt = await tx.wait(2);
  console.log("Confirmed in block", receipt?.blockNumber);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
