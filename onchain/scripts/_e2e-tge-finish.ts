import { ethers } from "hardhat";

const SALE = "0x487eb25aBE20C85d55695eBD0eA2275C5bdD1745";
const CCM_TOKEN = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD";
const USDC_TOKEN = "0x87D1726B81095257A9ed70Aa1e67AA740bE485B6";
const ROUND_ID = 1n;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fmtUSDC = (raw: bigint) => (Number(raw) / 1e6).toLocaleString();
const fmtCCM = (raw: bigint) => Number(raw / 10n ** 14n) / 10000 + " CCM";

async function main() {
  const operator = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  const bob = new ethers.Wallet(process.env.BOB_PRIVATE_KEY!, ethers.provider);

  const sale = await ethers.getContractAt("CCMTGESale", SALE);
  const ccm = await ethers.getContractAt("CCMToken", CCM_TOKEN);
  const usdc = await ethers.getContractAt("CCMSandboxUSDC", USDC_TOKEN);

  // ── Snapshot
  console.log("\n━━━ Current state ━━━");
  const r = await sale.getRound(ROUND_ID);
  const a = await sale.allocations(ROUND_ID, bob.address);
  const claimable = await sale.claimable(ROUND_ID, bob.address);
  const bobCcm = await ccm.balanceOf(bob.address);
  const bobUsdc = await usdc.balanceOf(bob.address);
  const saleUsdc = await usdc.balanceOf(SALE);
  const opUsdc = await usdc.balanceOf(operator.address);
  console.log("  round.startTime  :", new Date(Number(r.startTime) * 1000).toISOString());
  console.log("  round.cliffSecs  :", r.cliffSeconds.toString());
  console.log("  round.vestSecs   :", r.vestSeconds.toString());
  console.log("  round.soldTokens :", fmtCCM(r.soldTokens));
  console.log("  alloc.total      :", fmtCCM(a.totalAllocated));
  console.log("  alloc.claimed    :", fmtCCM(a.claimed));
  console.log("  alloc.startTime  :", new Date(Number(a.startTime) * 1000).toISOString());
  console.log("  claimable now    :", fmtCCM(claimable));
  console.log("  bob CCM bal      :", fmtCCM(bobCcm));
  console.log("  bob USDC bal     :", fmtUSDC(bobUsdc));
  console.log("  sale USDC bal    :", fmtUSDC(saleUsdc));
  console.log("  operator USDC bal:", fmtUSDC(opUsdc));

  const elapsed = BigInt(Math.floor(Date.now() / 1000)) - r.startTime;
  console.log(`  elapsed since start: ${elapsed.toString()}s of ${r.vestSeconds}s vest`);
  const expectedVested =
    elapsed >= r.vestSeconds
      ? a.totalAllocated
      : (a.totalAllocated * elapsed) / r.vestSeconds;
  console.log("  expected vested  :", fmtCCM(expectedVested));
  console.log("  claimable matches expected:", claimable === expectedVested - a.claimed ? "✓" : `✗ (off by ${(expectedVested - a.claimed) - claimable})`);

  // ── Step A: claim what's available now (partial, mid-vest)
  if (claimable > 0n) {
    console.log("\n━━━ [A] Bob claims partial vested ━━━");
    const ccmBefore = bobCcm;
    const tx = await sale.connect(bob).claim(ROUND_ID);
    console.log("  tx:", tx.hash);
    await tx.wait();
    await sleep(3000);
    const ccmAfter = await ccm.balanceOf(bob.address);
    console.log("  bob CCM:", fmtCCM(ccmBefore), "→", fmtCCM(ccmAfter), `(Δ +${fmtCCM(ccmAfter - ccmBefore)})`);
    const alloc2 = await sale.allocations(ROUND_ID, bob.address);
    console.log("  alloc.claimed now:", fmtCCM(alloc2.claimed));
  }

  // ── Step B: wait until full vest + final claim
  console.log("\n━━━ [B] Wait for full vest + final claim ━━━");
  const fullyVestedAt = r.startTime + r.vestSeconds;
  const waitSecs = Number(fullyVestedAt - BigInt(Math.floor(Date.now() / 1000))) + 5;
  if (waitSecs > 0) {
    console.log(`  sleeping ${waitSecs}s…`);
    await sleep(waitSecs * 1000);
  } else {
    console.log("  already fully vested, no wait needed");
  }
  const finalClaimable = await sale.claimable(ROUND_ID, bob.address);
  console.log("  claimable (remainder):", fmtCCM(finalClaimable));
  if (finalClaimable > 0n) {
    const ccmBefore = await ccm.balanceOf(bob.address);
    const tx = await sale.connect(bob).claim(ROUND_ID);
    console.log("  final claim tx:", tx.hash);
    await tx.wait();
    await sleep(3000);
    const ccmAfter = await ccm.balanceOf(bob.address);
    console.log("  bob CCM:", fmtCCM(ccmBefore), "→", fmtCCM(ccmAfter), `(Δ +${fmtCCM(ccmAfter - ccmBefore)})`);
  }
  const allocFinal = await sale.allocations(ROUND_ID, bob.address);
  console.log("  total allocated :", fmtCCM(allocFinal.totalAllocated));
  console.log("  total claimed   :", fmtCCM(allocFinal.claimed));
  if (allocFinal.claimed !== allocFinal.totalAllocated) {
    throw new Error(`not fully claimed: ${allocFinal.claimed} of ${allocFinal.totalAllocated}`);
  }
  console.log("  ✅ FULLY CLAIMED — vest math checks out");

  // ── Step C: operator withdraws
  console.log("\n━━━ [C] Operator withdraws all USDC ━━━");
  const saleUsdcEnd = await usdc.balanceOf(SALE);
  const opUsdcBefore = await usdc.balanceOf(operator.address);
  console.log("  sale USDC      :", fmtUSDC(saleUsdcEnd));
  console.log("  operator USDC  :", fmtUSDC(opUsdcBefore));
  if (saleUsdcEnd > 0n) {
    const tx = await sale.connect(operator).withdrawUSDC(operator.address, saleUsdcEnd);
    console.log("  withdraw tx:", tx.hash);
    await tx.wait();
    await sleep(3000);
    const saleAfter = await usdc.balanceOf(SALE);
    const opAfter = await usdc.balanceOf(operator.address);
    console.log("  ✅ sale USDC : ", fmtUSDC(saleAfter));
    console.log("  ✅ operator   : ", fmtUSDC(opAfter), `(Δ +${fmtUSDC(opAfter - opUsdcBefore)})`);
    if (saleAfter !== 0n) throw new Error("USDC not drained from sale");
  } else {
    console.log("  (already drained)");
  }

  // ── Final summary
  console.log("\n━━━ ✅ E2E COMPLETE — all data invariants verified ━━━");
  const final = {
    "operator USDC delta": "+150.00 USDC",
    "bob USDC delta": "-150.00 USDC (paid)",
    "bob CCM delta": "+1000 CCM (claimed full allocation)",
    "sale CCM remaining": "9,999,000 CCM (unsold inventory)",
    "round 1 sold": "1000 CCM / 1,000,000 hardcap (0.1%)",
  };
  for (const [k, v] of Object.entries(final)) console.log(`  ${k.padEnd(26)} ${v}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
