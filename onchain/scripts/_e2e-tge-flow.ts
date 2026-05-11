/**
 * End-to-end data verification for the TGE Sale flow.
 *
 * Drives the full presale lifecycle from .env private keys (no UI):
 *   Operator (deployer)
 *     → createRound (cliff 60s, vest 240s for fast verification)
 *     → setWhitelist(roundId, alice, true)
 *   Alice (investor)
 *     → USDC.claim() (faucet, if needed)
 *     → USDC.approve(sale, usdcRequired)
 *     → sale.purchase(roundId, ccmAmount)
 *     → wait cliff
 *     → sale.claim(roundId)
 *   Operator
 *     → withdrawUSDC(operator, usdcRaised)
 *
 * Each step prints before/after state so the data trace is self-evident.
 * RPC stale-read mitigations: short sleeps + retries on key reads.
 */
import { ethers } from "hardhat";

const SALE = "0x487eb25aBE20C85d55695eBD0eA2275C5bdD1745";
const CCM_TOKEN = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD";
const USDC_TOKEN = "0x87D1726B81095257A9ed70Aa1e67AA740bE485B6";

const ROUND_NAME = "Seed-e2e";
const PRICE_USDC = 150_000n;       // 0.15 USDC per CCM (6 decimals)
const HARDCAP_CCM = 1_000_000n * 10n ** 18n; // 1M CCM
const CLIFF_SECS = 60n;
const VEST_SECS = 240n;            // 4 min (cliff + linear)
const PURCHASE_CCM = 1_000n;       // alice buys 1000 CCM

function nowSec(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function fmtUSDC(raw: bigint): string {
  return (Number(raw) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 });
}
function fmtCCM(raw: bigint): string {
  return (raw / 10n ** 14n).toLocaleString() + "e-4 CCM";
}

async function step(title: string, fn: () => Promise<void>) {
  console.log(`\n━━━ ${title}`);
  await fn();
}

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log("Chain:", network.chainId.toString(), network.name);
  if (network.chainId !== 84532n) throw new Error("testnet only");

  const operator = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  const investorKey =
    process.env.INVESTOR_KEY === "alice" ? process.env.ALICE_PRIVATE_KEY! :
    process.env.INVESTOR_KEY === "bob"   ? process.env.BOB_PRIVATE_KEY!   :
    process.env.INVESTOR_KEY === "carol" ? process.env.CAROL_PRIVATE_KEY! :
    process.env.BOB_PRIVATE_KEY!; // default
  const investorName = process.env.INVESTOR_KEY ?? "bob";
  const alice = new ethers.Wallet(investorKey, ethers.provider);

  console.log("Operator   :", operator.address);
  console.log(`Investor (${investorName}):`, alice.address);

  const sale = await ethers.getContractAt("CCMTGESale", SALE);
  const ccm = await ethers.getContractAt("CCMToken", CCM_TOKEN);
  const usdc = await ethers.getContractAt("CCMSandboxUSDC", USDC_TOKEN);

  let roundId: bigint;
  let purchaseAmt: bigint;
  let usdcRequired: bigint;

  // ────────────────────────────────────────────────────────────
  await step("[1] Operator creates round", async () => {
    const before = await sale.getRoundCount();
    const startTime = nowSec() + 5n;
    const endTime = startTime + 3600n;
    console.log("  before · roundCount:", before.toString());
    console.log("  params · price:", PRICE_USDC, "USDC/CCM (6d)");
    console.log("  params · hardcap:", HARDCAP_CCM / 10n ** 18n, "CCM");
    console.log("  params · cliff:", CLIFF_SECS, "s · vest:", VEST_SECS, "s");
    console.log("  params · start:", new Date(Number(startTime) * 1000).toISOString());

    const tx = await sale.connect(operator).createRound(
      ROUND_NAME, PRICE_USDC, HARDCAP_CCM, CLIFF_SECS, VEST_SECS, startTime, endTime,
    );
    console.log("  tx:", tx.hash);
    await tx.wait();
    await sleep(3000);

    const after = await sale.getRoundCount();
    roundId = after - 1n;
    const r = await sale.getRound(roundId);
    console.log("  ✅ roundCount now:", after.toString(), "· id:", roundId.toString());
    console.log("    name:", r.name);
    console.log("    priceUsdc:", r.priceUsdc.toString());
    console.log("    hardCap:", (r.hardCapTokens / 10n ** 18n).toString(), "CCM");
    console.log("    active:", r.active);
    console.log("    startTime:", new Date(Number(r.startTime) * 1000).toISOString());
  });

  // ────────────────────────────────────────────────────────────
  await step(`[2] Operator whitelists alice for round ${roundId!.toString()}`, async () => {
    const before = await sale.whitelist(roundId!, alice.address);
    console.log("  before · whitelist:", before);
    const tx = await sale.connect(operator).setWhitelist(roundId!, alice.address, true);
    console.log("  tx:", tx.hash);
    await tx.wait();
    await sleep(3000);
    const after = await sale.whitelist(roundId!, alice.address);
    console.log("  ✅ after · whitelist:", after);
    if (!after) throw new Error("whitelist did not persist");
  });

  // ────────────────────────────────────────────────────────────
  await step("[3] Alice claims USDC from faucet (if cooldown allows)", async () => {
    const cooldown = await usdc.cooldownRemaining(alice.address);
    let aliceUsdcBefore = await usdc.balanceOf(alice.address);
    console.log("  alice USDC (before):", fmtUSDC(aliceUsdcBefore));
    console.log("  cooldown remaining :", cooldown.toString(), "s");

    if (cooldown === 0n) {
      const tx = await usdc.connect(alice).claim();
      console.log("  faucet tx:", tx.hash);
      await tx.wait();
      await sleep(3000);
    } else {
      console.log("  skipping faucet — already claimed within last 24h");
    }
    const aliceUsdc = await usdc.balanceOf(alice.address);
    console.log("  ✅ alice USDC :", fmtUSDC(aliceUsdc));
    if (aliceUsdc < PRICE_USDC * PURCHASE_CCM) {
      throw new Error(`alice has ${fmtUSDC(aliceUsdc)} USDC, needs at least ${fmtUSDC(PRICE_USDC * PURCHASE_CCM)} for purchase`);
    }
  });

  // ────────────────────────────────────────────────────────────
  await step("[4] Wait for round start", async () => {
    const r = await sale.getRound(roundId!);
    const wait = Number(r.startTime - nowSec()) + 1;
    if (wait > 0) {
      console.log(`  waiting ${wait}s for round start…`);
      await sleep(wait * 1000);
    }
    console.log("  ✅ round is open");
  });

  // ────────────────────────────────────────────────────────────
  await step("[5] Alice approves USDC then purchases", async () => {
    purchaseAmt = PURCHASE_CCM * 10n ** 18n;
    usdcRequired = (purchaseAmt * PRICE_USDC) / 10n ** 18n;
    console.log("  buy:", PURCHASE_CCM, "CCM · pay:", fmtUSDC(usdcRequired), "USDC");

    const allowanceBefore = await usdc.allowance(alice.address, SALE);
    console.log("  allowance before :", fmtUSDC(allowanceBefore));

    const txA = await usdc.connect(alice).approve(SALE, usdcRequired);
    console.log("  approve tx       :", txA.hash);
    await txA.wait();
    await sleep(2000);

    const allowanceAfter = await usdc.allowance(alice.address, SALE);
    console.log("  ✅ allowance     :", fmtUSDC(allowanceAfter));

    const aliceUsdcBefore = await usdc.balanceOf(alice.address);
    const saleUsdcBefore = await usdc.balanceOf(SALE);

    const txB = await sale.connect(alice).purchase(roundId!, purchaseAmt);
    console.log("  purchase tx      :", txB.hash);
    await txB.wait();
    await sleep(3000);

    const aliceUsdc = await usdc.balanceOf(alice.address);
    const saleUsdc = await usdc.balanceOf(SALE);
    console.log("  alice USDC: ", fmtUSDC(aliceUsdcBefore), "→", fmtUSDC(aliceUsdc),
      `(Δ -${fmtUSDC(aliceUsdcBefore - aliceUsdc)})`);
    console.log("  sale USDC : ", fmtUSDC(saleUsdcBefore), "→", fmtUSDC(saleUsdc),
      `(Δ +${fmtUSDC(saleUsdc - saleUsdcBefore)})`);

    const alloc = await sale.allocations(roundId!, alice.address);
    console.log("  allocation:");
    console.log("    totalAllocated:", alloc.totalAllocated.toString(), "(", fmtCCM(alloc.totalAllocated), ")");
    console.log("    claimed       :", alloc.claimed.toString());
    console.log("    startTime     :", new Date(Number(alloc.startTime) * 1000).toISOString());
    console.log("    cliff/vest    :", alloc.cliffSeconds.toString(), "/", alloc.vestSeconds.toString(), "s");

    if (alloc.totalAllocated !== purchaseAmt) throw new Error("allocation mismatch");
    if (saleUsdc - saleUsdcBefore !== usdcRequired) throw new Error("USDC routing mismatch");

    const r = await sale.getRound(roundId!);
    console.log("  round.soldTokens:", r.soldTokens.toString(), "(", fmtCCM(r.soldTokens), ")");
    if (r.soldTokens !== purchaseAmt) throw new Error("soldTokens not updated");
  });

  // ────────────────────────────────────────────────────────────
  await step("[6] Verify claimable=0 during cliff", async () => {
    const claimable = await sale.claimable(roundId!, alice.address);
    console.log("  claimable now:", claimable.toString());
    if (claimable !== 0n) throw new Error("expected 0 during cliff");
    console.log("  ✅ cliff enforcement OK");
  });

  // ────────────────────────────────────────────────────────────
  await step(`[7] Wait for cliff (${CLIFF_SECS}s) + buffer`, async () => {
    const wait = Number(CLIFF_SECS) + 5;
    console.log(`  sleeping ${wait}s…`);
    await sleep(wait * 1000);
    const claimable = await sale.claimable(roundId!, alice.address);
    console.log("  ✅ claimable post-cliff:", claimable.toString(), "(", fmtCCM(claimable), ")");
    if (claimable === 0n) throw new Error("expected > 0 post-cliff");
  });

  // ────────────────────────────────────────────────────────────
  await step("[8] Alice claims first vested portion", async () => {
    const aliceCcmBefore = await ccm.balanceOf(alice.address);
    const claimableBefore = await sale.claimable(roundId!, alice.address);
    console.log("  alice CCM (before):", fmtCCM(aliceCcmBefore));
    console.log("  claimable          :", fmtCCM(claimableBefore));

    const tx = await sale.connect(alice).claim(roundId!);
    console.log("  claim tx:", tx.hash);
    await tx.wait();
    await sleep(3000);

    const aliceCcm = await ccm.balanceOf(alice.address);
    console.log("  alice CCM (after) :", fmtCCM(aliceCcm),
      `(Δ +${fmtCCM(aliceCcm - aliceCcmBefore)})`);

    const alloc = await sale.allocations(roundId!, alice.address);
    console.log("  allocation.claimed:", fmtCCM(alloc.claimed));
    if (alloc.claimed === 0n) throw new Error("claimed not updated");
  });

  // ────────────────────────────────────────────────────────────
  await step(`[9] Wait until fully vested (${VEST_SECS}s total) + claim remainder`, async () => {
    const r = await sale.getRound(roundId!);
    const fullyVestedAt = r.startTime + r.vestSeconds;
    const wait = Number(fullyVestedAt - nowSec()) + 5;
    if (wait > 0) {
      console.log(`  sleeping ${wait}s for full vest…`);
      await sleep(wait * 1000);
    }
    const claimable = await sale.claimable(roundId!, alice.address);
    console.log("  claimable (remainder):", fmtCCM(claimable));
    if (claimable > 0n) {
      const tx = await sale.connect(alice).claim(roundId!);
      console.log("  final claim tx:", tx.hash);
      await tx.wait();
      await sleep(3000);
    }
    const alloc = await sale.allocations(roundId!, alice.address);
    console.log("  total allocated:", fmtCCM(alloc.totalAllocated));
    console.log("  total claimed  :", fmtCCM(alloc.claimed));
    if (alloc.claimed !== alloc.totalAllocated) {
      throw new Error("not fully claimed");
    }
    console.log("  ✅ alice fully claimed entire allocation");
  });

  // ────────────────────────────────────────────────────────────
  await step("[10] Operator withdraws raised USDC", async () => {
    const saleUsdc = await usdc.balanceOf(SALE);
    const opUsdcBefore = await usdc.balanceOf(operator.address);
    console.log("  sale USDC          :", fmtUSDC(saleUsdc));
    console.log("  operator USDC (b)  :", fmtUSDC(opUsdcBefore));

    if (saleUsdc === 0n) {
      console.log("  (nothing to withdraw — skip)");
      return;
    }

    const tx = await sale.connect(operator).withdrawUSDC(operator.address, saleUsdc);
    console.log("  withdraw tx:", tx.hash);
    await tx.wait();
    await sleep(3000);

    const saleUsdcAfter = await usdc.balanceOf(SALE);
    const opUsdcAfter = await usdc.balanceOf(operator.address);
    console.log("  sale USDC          :", fmtUSDC(saleUsdcAfter));
    console.log("  operator USDC (a)  :", fmtUSDC(opUsdcAfter),
      `(Δ +${fmtUSDC(opUsdcAfter - opUsdcBefore)})`);
    if (saleUsdcAfter !== 0n) throw new Error("sale USDC not drained");
  });

  console.log("\n━━━ ✅ E2E COMPLETE — all data invariants verified ━━━");
  console.log(`\nView on BaseScan:`);
  console.log(`  Sale     : https://sepolia.basescan.org/address/${SALE}#readContract`);
  console.log(`  Round id : ${roundId!.toString()}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
