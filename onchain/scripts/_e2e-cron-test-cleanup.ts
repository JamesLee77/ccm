/**
 * Best-effort cleanup of M1-3 cron test schedules (#5/#6/#7).
 * They were created revocable=false, so admin cannot revoke.
 * Alice releases whatever has vested so far; remainder keeps vesting naturally.
 */
import { ethers } from "hardhat";
import { Wallet } from "ethers";

const TOKEN = "0x5b4319dB4b2949E921400D850838508BB8a510CE";
const VEST  = "0xa73d068Bf89F303C009E19d05Fbe40f47eeE1d79";
const ALICE_PRIVATE_KEY = process.env.ALICE_PRIVATE_KEY;
if (!ALICE_PRIVATE_KEY) throw new Error("ALICE_PRIVATE_KEY missing in .env");

const SCHEDULE_IDS = [5n, 6n, 7n] as const;

const fmt = (n: bigint) => ethers.formatUnits(n, 18);

async function main() {
  const provider = ethers.provider;
  const alice = new Wallet(ALICE_PRIVATE_KEY!, provider);
  const vesting = await ethers.getContractAt("CCMVesting", VEST, alice);
  const token   = await ethers.getContractAt("CCMToken", TOKEN, alice);

  console.log("Alice:", alice.address);
  console.log("Alice v1 before:", fmt(await token.balanceOf(alice.address)));

  for (const id of SCHEDULE_IDS) {
    const s = await vesting.schedules(id);
    const releasable = await vesting.releasable(id);
    const cliffEnd = Number(s.startTime + s.cliffDuration);
    console.log(`\nSchedule #${id}`);
    console.log(`  total / released / releasable: ${fmt(s.totalAmount)} / ${fmt(s.released)} / ${fmt(releasable)}`);
    console.log(`  cliff ends: ${new Date(cliffEnd * 1000).toISOString()}`);

    if (releasable === 0n) {
      console.log(`  → skip (nothing to release)`);
      continue;
    }

    const tx = await vesting.release(id, { gasLimit: 200_000 });
    const r = await tx.wait();
    console.log(`  → released ${fmt(releasable)} CCM (tx ${tx.hash.slice(0,10)}…, status ${r?.status})`);
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log("\nAlice v1 after:", fmt(await token.balanceOf(alice.address)));
  console.log("\nNote: schedules are non-revocable. Locked v1 will continue vesting per schedule.");
}

main().catch((e) => { console.error(e); process.exit(1); });
