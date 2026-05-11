/**
 * E2E test setup for M1-3 (cron emails). Mints 30 CCM v1 to vesting contract,
 * then creates 3 schedules for Alice — one for each notification kind:
 *   - cliff_7d: cliffEnd at now + 7 days
 *   - cliff_1d: cliffEnd at now + 1 day
 *   - claim_ready: small ongoing vest (releasable > 0 within seconds)
 */
import { ethers } from "hardhat";

const TOKEN = "0x5b4319dB4b2949E921400D850838508BB8a510CE";
const VEST  = "0xa73d068Bf89F303C009E19d05Fbe40f47eeE1d79";
const ALICE = "0xD4EecF3a15e6727C91E2435216e4f071717411F0";

const DAY = 86_400;
const PER_AMOUNT = ethers.parseUnits("10", 18);

interface Scenario {
  kind: "cliff_7d" | "cliff_1d" | "claim_ready";
  cliffSec: number;
  durationSec: number;
}

const SCENARIOS: Scenario[] = [
  { kind: "cliff_7d",    cliffSec: 7 * DAY, durationSec: 14 * DAY },
  { kind: "cliff_1d",    cliffSec: 1 * DAY, durationSec: 2 * DAY },
  { kind: "claim_ready", cliffSec: 0,       durationSec: 3600 },
];

async function main() {
  const [admin] = await ethers.getSigners();
  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const vesting = await ethers.getContractAt("CCMVesting", VEST);

  console.log("Admin:", admin.address);
  console.log("v1 supply before:", ethers.formatUnits(await token.totalSupply(), 18));

  const totalMint = PER_AMOUNT * BigInt(SCENARIOS.length);
  console.log(`\n=== Minting ${ethers.formatUnits(totalMint, 18)} v1 CCM to vesting ===`);
  const mintTx = await token.mint(VEST, totalMint, { gasLimit: 200_000 });
  console.log(`  tx: ${mintTx.hash}`);
  await mintTx.wait();
  await new Promise((r) => setTimeout(r, 3000));

  const start = Math.floor(Date.now() / 1000);
  const baseId = await vesting.getScheduleCount();
  console.log(`\n=== Creating 3 schedules for Alice (baseline id=${baseId}) ===`);

  for (let i = 0; i < SCENARIOS.length; i++) {
    const s = SCENARIOS[i];
    const tx = await vesting.createSchedule(
      ALICE,
      PER_AMOUNT,
      start,
      s.cliffSec,
      s.durationSec,
      false,
      { gasLimit: 300_000 },
    );
    const r = await tx.wait();
    const id = baseId + BigInt(i);
    const cliffEnd = new Date((start + s.cliffSec) * 1000);
    console.log(`  #${id}  ${s.kind.padEnd(13)} cliffEnd=${cliffEnd.toISOString()}  tx=${tx.hash.slice(0,10)}…  status=${r?.status}`);
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log("\n=== Expected cron behavior ===");
  console.log("  First trigger : 3 emails sent (cliff_7d, cliff_1d, claim_ready)");
  console.log("  Second trigger: 0 emails (dedupe via sent_notifications)");
  console.log("\n=== Manual cron trigger (Cloudflare dashboard) ===");
  console.log("  Workers & Pages → ccm-portal-api → Triggers → 'Send Cron Trigger'");
  console.log("  https://dash.cloudflare.com/?to=/:account/workers/services/view/ccm-portal-api");
}

main().catch((e) => { console.error(e); process.exit(1); });
