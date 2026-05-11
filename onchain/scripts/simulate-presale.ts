/**
 * Pre-sale simulation on Base Sepolia testnet.
 *
 * Demonstrates the full pre-sale onboarding + claim + revoke flow:
 *   1. Generate a fake investor wallet (alice)
 *   2. Admin funds alice with tiny ETH for gas
 *   3. Admin mints CCM tokens to the Vesting contract
 *   4. Admin creates a vesting schedule for alice (cliff=0, duration=300s)
 *   5. Wait for partial vesting
 *   6. Alice calls release() to claim vested portion
 *   7. (Optional) Admin revokes schedule, paying alice the additional vested
 *      portion at revoke time and refunding the remainder back to admin.
 *
 * Run:
 *   CCM_TOKEN_ADDRESS=0x... CCM_VESTING_ADDRESS=0x... \
 *     npx hardhat run scripts/simulate-presale.ts --network baseSepolia
 *
 * Required env (in addition to default deployment env):
 *   CCM_TOKEN_ADDRESS    - deployed CCMToken
 *   CCM_VESTING_ADDRESS  - deployed CCMVesting
 *   ALICE_PRIVATE_KEY    - (optional) reuse a specific alice key for repro;
 *                          if absent, a fresh random key is generated
 */
import { ethers } from "hardhat";
import { Wallet, formatEther, formatUnits, parseUnits } from "ethers";

const TOTAL = parseUnits("1000", 18);   // 1000 CCM allocated to alice
const CLIFF = 0;                         // no cliff (instant vest start)
const DURATION = 300;                    // 300s = 5 minutes total vesting
const FUND_ETH = parseUnits("0.00002", 18); // ETH airdropped to alice for gas
const WAIT_SECONDS = 60;                 // wait 1 minute → ~20% vested

// hardhat-ethers caches state aggressively on testnets; explicit gas limits +
// post-tx propagation sleeps make the script robust to RPC lag.
const TX_GAS = 500_000;
const POST_TX_DELAY_MS = 4_000;

function fmt(amount: bigint, dec = 18): string {
  return formatUnits(amount, dec);
}
async function sleep(ms: number) { await new Promise(r => setTimeout(r, ms)); }

async function main() {
  const TOKEN = process.env.CCM_TOKEN_ADDRESS!;
  const VEST = process.env.CCM_VESTING_ADDRESS!;
  if (!TOKEN || !VEST) throw new Error("CCM_TOKEN_ADDRESS + CCM_VESTING_ADDRESS required");

  const [admin] = await ethers.getSigners();
  const provider = ethers.provider;

  const alice = process.env.ALICE_PRIVATE_KEY
    ? new Wallet(process.env.ALICE_PRIVATE_KEY, provider)
    : Wallet.createRandom().connect(provider);

  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const vesting = await ethers.getContractAt("CCMVesting", VEST);

  console.log("=".repeat(64));
  console.log("Pre-sale simulation");
  console.log("  Network :", (await provider.getNetwork()).name);
  console.log("  Token   :", TOKEN);
  console.log("  Vesting :", VEST);
  console.log("  Admin   :", admin.address);
  console.log("  Alice   :", alice.address);
  if (!process.env.ALICE_PRIVATE_KEY) {
    console.log("  ⚠ Alice key (save for replay):", alice.privateKey);
  }
  console.log("=".repeat(64));

  const adminEthBefore = await provider.getBalance(admin.address);
  console.log("\nAdmin ETH balance:", formatEther(adminEthBefore));

  // ---------- Step 1: fund alice with gas ----------
  console.log("\n[1] Fund alice with", formatEther(FUND_ETH), "ETH for gas...");
  const tx1 = await admin.sendTransaction({ to: alice.address, value: FUND_ETH, gasLimit: 30_000 });
  await tx1.wait();
  await sleep(POST_TX_DELAY_MS);
  console.log("    tx:", tx1.hash);
  console.log("    alice ETH:", formatEther(await provider.getBalance(alice.address)));

  // ---------- Step 2: mint CCM to Vesting contract ----------
  console.log("\n[2] Admin mints", fmt(TOTAL), "CCM to Vesting contract...");
  const tx2 = await token.connect(admin).mint(VEST, TOTAL, { gasLimit: TX_GAS });
  await tx2.wait();
  await sleep(POST_TX_DELAY_MS);
  console.log("    tx:", tx2.hash);
  console.log("    Vesting CCM bal:", fmt(await token.balanceOf(VEST)));

  // ---------- Step 3: create schedule for alice ----------
  const startTime = Math.floor(Date.now() / 1000);
  console.log("\n[3] Admin creates vesting schedule for alice");
  console.log("    cliff:", CLIFF, "s | duration:", DURATION, "s | revocable: true");
  const tx3 = await vesting.connect(admin).createSchedule(
    alice.address, TOTAL, startTime, CLIFF, DURATION, true,
    { gasLimit: TX_GAS }
  );
  await tx3.wait();
  await sleep(POST_TX_DELAY_MS);
  console.log("    tx:", tx3.hash);
  const scheduleId = (await vesting.getScheduleCount()) - 1n;
  console.log("    schedule id:", scheduleId.toString());

  // ---------- Step 4: wait, then check releasable ----------
  console.log("\n[4] Waiting", WAIT_SECONDS, "s for partial vesting...");
  await sleep(WAIT_SECONDS * 1000);
  const releasable1 = await vesting.releasable(scheduleId);
  const expectedPct = (WAIT_SECONDS * 100) / DURATION;
  console.log("    releasable:", fmt(releasable1), "CCM (~" + expectedPct + "% expected)");

  // ---------- Step 5: alice calls release() ----------
  console.log("\n[5] Alice calls release()...");
  const aliceCcmBefore = await token.balanceOf(alice.address);
  const tx5 = await vesting.connect(alice).release(scheduleId, { gasLimit: TX_GAS });
  await tx5.wait();
  await sleep(POST_TX_DELAY_MS);
  console.log("    tx:", tx5.hash);
  const aliceCcmAfter = await token.balanceOf(alice.address);
  const released = aliceCcmAfter - aliceCcmBefore;
  console.log("    alice received:", fmt(released), "CCM");

  // ---------- Step 6: schedule state after release ----------
  const s = await vesting.schedules(scheduleId);
  console.log("\n[6] Schedule state after release:");
  console.log("    totalAmount    :", fmt(s.totalAmount));
  console.log("    released       :", fmt(s.released));
  console.log("    revoked        :", s.revoked);

  // ---------- Step 7: admin revokes schedule ----------
  console.log("\n[7] Admin revokes schedule (vested portion → alice, remainder → admin)...");
  const adminCcmBefore = await token.balanceOf(admin.address);
  const aliceCcmBefore7 = await token.balanceOf(alice.address);
  const tx7 = await vesting.connect(admin).revoke(scheduleId, { gasLimit: TX_GAS });
  await tx7.wait();
  await sleep(POST_TX_DELAY_MS);
  console.log("    tx:", tx7.hash);
  const adminCcmAfter = await token.balanceOf(admin.address);
  const aliceCcmAfter7 = await token.balanceOf(alice.address);
  console.log("    alice additionally got:", fmt(aliceCcmAfter7 - aliceCcmBefore7), "CCM");
  console.log("    admin refunded         :", fmt(adminCcmAfter - adminCcmBefore), "CCM");

  // ---------- Final state ----------
  console.log("\n" + "=".repeat(64));
  console.log("FINAL STATE");
  console.log("=".repeat(64));
  console.log("  Total minted (CCM)          :", fmt(TOTAL));
  console.log("  Alice final CCM             :", fmt(await token.balanceOf(alice.address)));
  console.log("  Admin final CCM (refund)    :", fmt(await token.balanceOf(admin.address)));
  console.log("  Vesting contract CCM bal    :", fmt(await token.balanceOf(VEST)));
  console.log("  CCM totalSupply             :", fmt(await token.totalSupply()));
  console.log("  Admin ETH spent (gas+fund)  :", formatEther(adminEthBefore - await provider.getBalance(admin.address)));

  console.log("\n✅ Pre-sale simulation complete");
}

main().catch((e) => { console.error(e); process.exit(1); });
