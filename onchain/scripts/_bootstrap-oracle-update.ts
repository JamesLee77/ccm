/**
 * One-off: seed the OraclePriceHistory timeline by triggering setPrice()
 * walks on the 4 keeper-owned oracles right away. Mirrors
 * portal-api/src/oracleUpdate.ts (per-index profile + mean reversion).
 *
 * Set ITER=N to run multiple ticks in a row (default 1). Useful for
 * fast-forwarding the prices toward their anchors so the 4 chart lines
 * visibly separate without waiting hours of cron ticks.
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

// Must mirror PROFILES in portal-api/src/oracleUpdate.ts (same index order).
type Profile = { label: string; anchor: bigint; volBps: number; dragBps: number };
const PROFILES: Profile[] = [
  { label: "A", anchor: ethers.parseUnits("0.18", 18), volBps: 200, dragBps: 2000 },
  { label: "B", anchor: ethers.parseUnits("0.22", 18), volBps: 300, dragBps: 2000 },
  { label: "C", anchor: ethers.parseUnits("0.20", 18), volBps: 400, dragBps: 2000 },
  { label: "D", anchor: ethers.parseUnits("0.20", 18), volBps: 150, dragBps: 2000 },
];

function nextPrice(cur: bigint, p: Profile): bigint {
  const drag = ((p.anchor - cur) * BigInt(p.dragBps)) / 10000n;
  const zBps = BigInt(Math.floor(Math.random() * 20001) - 10000);
  const noise = (cur * BigInt(p.volBps) * zBps) / 100_000_000n;
  let n = cur + drag + noise;
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
  const iterations = Math.max(1, Number(process.env.ITER ?? "1"));
  console.log("Keeper:", wallet.address, "· iterations:", iterations);

  const contracts = ORACLES.map((addr) => new ethers.Contract(addr, ABI, wallet));

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let iter = 0; iter < iterations; iter++) {
    console.log(`\n=== Iteration ${iter + 1}/${iterations} ===`);
    for (const [i, c] of contracts.entries()) {
      const profile = PROFILES[i] ?? PROFILES[PROFILES.length - 1];
      const cur = await c.getPrice();
      const nxt = nextPrice(cur, profile);
      const tx = await c.setPrice(nxt);
      await tx.wait(1);
      console.log(
        `Oracle-${profile.label} @ ${ORACLES[i]}: $${ethers.formatUnits(cur, 18)} -> $${ethers.formatUnits(nxt, 18)} tx ${tx.hash}`,
      );
      await sleep(1500);
    }
    if (iter + 1 < iterations) await sleep(3000);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
