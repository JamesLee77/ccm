/**
 * E2E test setup: fund 3 test wallets with tiny ETH for gas, then create
 * 3 differentiated vesting schedules (alice/bob/carol) for the user to
 * walk through in their browser.
 */
import { ethers } from "hardhat";

const TOKEN = "0x5b4319dB4b2949E921400D850838508BB8a510CE";
const VEST  = "0xa73d068Bf89F303C009E19d05Fbe40f47eeE1d79";

const ALICE = "0xD4EecF3a15e6727C91E2435216e4f071717411F0";
const BOB   = "0x953e7c875e0636171a3c223148183c4a8b604e5B";
const CAROL = "0xAF2f45364657d9A9e40b80489Ed15baDC4dc098D";

// Fund each test wallet with enough ETH for ~5 release transactions
const FUND_PER_WALLET = ethers.parseUnits("0.000005", 18);

interface Scenario {
  name: string;
  beneficiary: string;
  amount: bigint;
  cliffSec: number;
  durationSec: number;
  revocable: boolean;
}

const SCENARIOS: Scenario[] = [
  {
    name: "Alice (Strategic — quick claim)",
    beneficiary: ALICE,
    amount: ethers.parseUnits("1000", 18),
    cliffSec: 30,
    durationSec: 300,           // 5 min total
    revocable: false,
  },
  {
    name: "Bob (Series A — long cliff)",
    beneficiary: BOB,
    amount: ethers.parseUnits("2000", 18),
    cliffSec: 5 * 60,           // 5 min cliff (UI shows "still locked")
    durationSec: 30 * 60,       // 30 min total
    revocable: false,
  },
  {
    name: "Carol (Public — revoke target)",
    beneficiary: CAROL,
    amount: ethers.parseUnits("300", 18),
    cliffSec: 0,
    durationSec: 90,            // 1.5 min — fast revoke window
    revocable: true,
  },
];

async function main() {
  const [admin] = await ethers.getSigners();
  console.log("Admin:", admin.address);
  const adminBal = await ethers.provider.getBalance(admin.address);
  console.log("Admin ETH:", ethers.formatEther(adminBal));
  console.log("");

  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const vesting = await ethers.getContractAt("CCMVesting", VEST);

  // 1. Fund each test wallet
  console.log("=== Funding test wallets ===");
  for (const addr of [ALICE, BOB, CAROL]) {
    const tx = await admin.sendTransaction({
      to: addr,
      value: FUND_PER_WALLET,
      gasLimit: 30_000,
    });
    const r = await tx.wait();
    console.log(`  ${addr}  funded ${ethers.formatEther(FUND_PER_WALLET)} ETH (tx ${tx.hash.slice(0,10)}…, status ${r?.status})`);
    await new Promise((r) => setTimeout(r, 2500));
  }

  // 2. Mint total to vesting contract
  const totalMint = SCENARIOS.reduce((acc, s) => acc + s.amount, 0n);
  console.log(`\n=== Minting ${ethers.formatUnits(totalMint, 18)} CCM to vesting ===`);
  const mintTx = await token.mint(VEST, totalMint, { gasLimit: 200_000 });
  const mintReceipt = await mintTx.wait();
  console.log(`  tx ${mintTx.hash.slice(0,10)}… status ${mintReceipt?.status}`);
  await new Promise((r) => setTimeout(r, 4000));

  // 3. Create each schedule
  console.log("\n=== Creating schedules ===");
  const start = Math.floor(Date.now() / 1000);
  const baseId = await vesting.getScheduleCount();
  console.log(`  baseline schedule count = ${baseId}`);

  for (let i = 0; i < SCENARIOS.length; i++) {
    const s = SCENARIOS[i];
    const tx = await vesting.createSchedule(
      s.beneficiary,
      s.amount,
      start,
      s.cliffSec,
      s.durationSec,
      s.revocable,
      { gasLimit: 300_000 },
    );
    const r = await tx.wait();
    const id = baseId + BigInt(i);
    const cliffEnd = new Date((start + s.cliffSec) * 1000);
    const fullyVested = new Date((start + s.durationSec) * 1000);
    console.log(`\n  #${id}  ${s.name}`);
    console.log(`        beneficiary: ${s.beneficiary}`);
    console.log(`        amount: ${ethers.formatUnits(s.amount, 18)} CCM`);
    console.log(`        cliff ends: ${cliffEnd.toLocaleTimeString()}`);
    console.log(`        fully vested: ${fullyVested.toLocaleTimeString()}`);
    console.log(`        revocable: ${s.revocable}`);
    console.log(`        tx: ${tx.hash.slice(0,10)}…  status ${r?.status}`);
    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log("\n=== Done ===");
  console.log("Switch to each wallet in MetaMask and refresh /vesting:");
  console.log("  Alice — schedule appears, releasable rises after 30s, click Release");
  console.log("  Bob   — schedule appears, releasable=0 for 5min (locked state UI)");
  console.log("  Carol — releasable rises immediately; admin will revoke shortly");
}

main().catch((e) => { console.error(e); process.exit(1); });
