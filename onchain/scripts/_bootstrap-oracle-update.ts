/**
 * One-off: seed the OraclePriceHistory timeline by triggering the first
 * round of setPrice() walks on the 4 keeper-owned oracles right away.
 * Mirrors portal-api/src/oracleUpdate.ts (±2%, clamped $0.15-$0.25).
 */
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const RPC = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";
const KEEPER_FILE = path.resolve(__dirname, "..", "..", ".carbon-oracle-keeper.json");
const ORACLES = [
  "0xE1Cb2811C7B34D581a918343E7bB52fb6925D84e", // A
  "0x3F7F998e8d0AeC3087A9E2A9703B006088972b73", // B
  "0x5ec883B4b5c1D12e638533f2EF496f550A4e8cC0", // C
  "0xBc6f5B6365b56d6284c0E3C467EEf37120b0192d", // D (primary)
];

const ABI = [
  "function getPrice() view returns (uint256)",
  "function setPrice(uint256) external",
];

const MIN = ethers.parseUnits("0.15", 18);
const MAX = ethers.parseUnits("0.25", 18);
const DELTA_BPS = 200n;

function nextPrice(cur: bigint): bigint {
  const delta = BigInt(Math.floor(Math.random() * Number(DELTA_BPS * 2n + 1n))) - DELTA_BPS;
  let n = cur + (cur * delta) / 10000n;
  if (n < MIN) n = MIN;
  if (n > MAX) n = MAX;
  return n;
}

async function main() {
  const keeper = JSON.parse(fs.readFileSync(KEEPER_FILE, "utf8"));
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(keeper.privateKey, provider);
  const net = await provider.getNetwork();
  if (net.chainId !== 84532n) throw new Error("not Sepolia");
  console.log("Keeper:", wallet.address);

  for (const [i, addr] of ORACLES.entries()) {
    const label = ["A", "B", "C", "D"][i];
    const c = new ethers.Contract(addr, ABI, wallet);
    const cur = await c.getPrice();
    const nxt = nextPrice(cur);
    const tx = await c.setPrice(nxt);
    await tx.wait(1);
    console.log(
      `Oracle-${label} @ ${addr}: $${ethers.formatUnits(cur, 18)} -> $${ethers.formatUnits(nxt, 18)} tx ${tx.hash}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
