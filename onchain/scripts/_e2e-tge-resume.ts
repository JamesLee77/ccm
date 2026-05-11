/**
 * Continuation of _e2e-tge-flow.ts after the approve tx has already gone
 * through but purchase failed on a nonce race. Picks up at step 5 (purchase)
 * for round 1 where bob is whitelisted with 150 USDC allowance.
 */
import { ethers } from "hardhat";

const SALE = "0x487eb25aBE20C85d55695eBD0eA2275C5bdD1745";
const CCM_TOKEN = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD";
const USDC_TOKEN = "0x87D1726B81095257A9ed70Aa1e67AA740bE485B6";
const ROUND_ID = 1n;
const PURCHASE_CCM = 1000n;
const PRICE_USDC = 150_000n;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fmtUSDC = (raw: bigint) => (Number(raw) / 1e6).toLocaleString();
const fmtCCM = (raw: bigint) => (raw / 10n ** 14n).toLocaleString() + "e-4 CCM";

async function main() {
  const operator = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  const bob = new ethers.Wallet(process.env.BOB_PRIVATE_KEY!, ethers.provider);
  console.log("Operator:", operator.address);
  console.log("Bob     :", bob.address);

  const sale = await ethers.getContractAt("CCMTGESale", SALE);
  const ccm = await ethers.getContractAt("CCMToken", CCM_TOKEN);
  const usdc = await ethers.getContractAt("CCMSandboxUSDC", USDC_TOKEN);

  const purchaseAmt = PURCHASE_CCM * 10n ** 18n;
  const usdcRequired = (purchaseAmt * PRICE_USDC) / 10n ** 18n;

  // ── Step 5: purchase
  console.log("\n━━━ [5] Bob purchases (with explicit nonce) ━━━");
  const allowance = await usdc.allowance(bob.address, SALE);
  console.log("  allowance:", fmtUSDC(allowance), "USDC");
  if (allowance < usdcRequired) {
    console.log("  insufficient allowance — re-approving…");
    const txA = await usdc.connect(bob).approve(SALE, usdcRequired);
    await txA.wait();
    await sleep(8000);
  }

  // Fresh nonce read from chain to avoid cache drift
  const nonce = await ethers.provider.getTransactionCount(bob.address, "latest");
  console.log("  bob nonce (chain):", nonce);

  const aliceUsdcBefore = await usdc.balanceOf(bob.address);
  const saleUsdcBefore = await usdc.balanceOf(SALE);

  const tx = await sale.connect(bob).purchase(ROUND_ID, purchaseAmt, { nonce });
  console.log("  purchase tx:", tx.hash);
  await tx.wait();
  await sleep(3000);

  const bobUsdc = await usdc.balanceOf(bob.address);
  const saleUsdc = await usdc.balanceOf(SALE);
  console.log("  bob USDC :", fmtUSDC(aliceUsdcBefore), "→", fmtUSDC(bobUsdc),
    `(Δ -${fmtUSDC(aliceUsdcBefore - bobUsdc)})`);
  console.log("  sale USDC:", fmtUSDC(saleUsdcBefore), "→", fmtUSDC(saleUsdc),
    `(Δ +${fmtUSDC(saleUsdc - saleUsdcBefore)})`);

  const alloc = await sale.allocations(ROUND_ID, bob.address);
  console.log("  allocation.totalAllocated:", fmtCCM(alloc.totalAllocated));
  console.log("  allocation.startTime     :", new Date(Number(alloc.startTime) * 1000).toISOString());
  console.log("  allocation.cliffSeconds  :", alloc.cliffSeconds.toString());
  console.log("  allocation.vestSeconds   :", alloc.vestSeconds.toString());

  if (alloc.totalAllocated !== purchaseAmt) throw new Error("allocation mismatch");

  // ── Step 6: claimable=0 during cliff
  console.log("\n━━━ [6] Verify claimable=0 during cliff ━━━");
  const claimable0 = await sale.claimable(ROUND_ID, bob.address);
  console.log("  claimable:", claimable0.toString());
  if (claimable0 !== 0n) throw new Error("expected 0 during cliff");
  console.log("  ✅");

  // ── Step 7: wait cliff (60s)
  console.log("\n━━━ [7] Wait 65s for cliff ━━━");
  await sleep(65 * 1000);
  const claimable1 = await sale.claimable(ROUND_ID, bob.address);
  console.log("  ✅ claimable post-cliff:", fmtCCM(claimable1));
  if (claimable1 === 0n) throw new Error("expected > 0 post-cliff");

  // ── Step 8: claim portion
  console.log("\n━━━ [8] Bob claims first vested portion ━━━");
  const ccmBefore = await ccm.balanceOf(bob.address);
  const cl = await sale.connect(bob).claim(ROUND_ID);
  console.log("  claim tx:", cl.hash);
  await cl.wait();
  await sleep(3000);
  const ccmAfter = await ccm.balanceOf(bob.address);
  console.log("  bob CCM:", fmtCCM(ccmBefore), "→", fmtCCM(ccmAfter),
    `(Δ +${fmtCCM(ccmAfter - ccmBefore)})`);
  const alloc2 = await sale.allocations(ROUND_ID, bob.address);
  console.log("  allocation.claimed:", fmtCCM(alloc2.claimed));

  // ── Step 9: wait until fully vested + claim remainder
  console.log("\n━━━ [9] Wait until fully vested + claim remainder ━━━");
  const r = await sale.getRound(ROUND_ID);
  const fullyVestedAt = r.startTime + r.vestSeconds;
  const wait = Number(fullyVestedAt - BigInt(Math.floor(Date.now() / 1000))) + 5;
  if (wait > 0) {
    console.log(`  sleeping ${wait}s for full vest…`);
    await sleep(wait * 1000);
  }
  const cl2 = await sale.claimable(ROUND_ID, bob.address);
  console.log("  claimable (remainder):", fmtCCM(cl2));
  if (cl2 > 0n) {
    const tx2 = await sale.connect(bob).claim(ROUND_ID);
    console.log("  final claim tx:", tx2.hash);
    await tx2.wait();
    await sleep(3000);
  }
  const alloc3 = await sale.allocations(ROUND_ID, bob.address);
  console.log("  total allocated:", fmtCCM(alloc3.totalAllocated));
  console.log("  total claimed  :", fmtCCM(alloc3.claimed));
  if (alloc3.claimed !== alloc3.totalAllocated) throw new Error("not fully claimed");
  console.log("  ✅ fully claimed");

  // ── Step 10: operator withdraws
  console.log("\n━━━ [10] Operator withdraws raised USDC ━━━");
  const saleUsdcNow = await usdc.balanceOf(SALE);
  const opUsdcBefore = await usdc.balanceOf(operator.address);
  console.log("  sale USDC      :", fmtUSDC(saleUsdcNow));
  console.log("  operator USDC  :", fmtUSDC(opUsdcBefore));
  if (saleUsdcNow > 0n) {
    const tx = await sale.connect(operator).withdrawUSDC(operator.address, saleUsdcNow);
    console.log("  withdraw tx:", tx.hash);
    await tx.wait();
    await sleep(3000);
    const opAfter = await usdc.balanceOf(operator.address);
    const saleAfter = await usdc.balanceOf(SALE);
    console.log("  ✅ sale USDC :", fmtUSDC(saleAfter));
    console.log("  ✅ operator  :", fmtUSDC(opAfter), `(Δ +${fmtUSDC(opAfter - opUsdcBefore)})`);
  }

  console.log("\n━━━ ✅ E2E COMPLETE ━━━");
}
main().catch((e) => { console.error(e); process.exit(1); });
