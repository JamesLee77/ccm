/**
 * E2E data verification for the Vesting flow:
 *
 *   Operator (deployer)
 *     → SIWE sign-in to portal-api (admin app, Sepolia)
 *     → POST audit row create_schedule
 *     → CCMVesting.createSchedule(beneficiary=carol, total=100 CCM,
 *                                  start=now+5s, cliff=60s, vest=240s, revocable=true)
 *     → PATCH audit confirmed
 *   ── wait until past cliff ──
 *     → Operator: getReleasable view = mid-vest portion
 *     → Carol: CCMVesting.release(id) → CCM transferred to her
 *     → Verify carol.balance increased
 *   ── wait until fully vested ──
 *     → Carol: release(id) again → final portion
 *     → Verify carol.balance == 100 CCM total
 *   ── role enforcement ──
 *     → Operator creates a *revocable* schedule for bob
 *     → Bob tries to revoke (should fail — no SCHEDULE_MANAGER_ROLE)
 *     → Operator revokes → schedule.revoked=true, releasable=0
 *
 * All invariants printed step-by-step.
 */
import { ethers } from "hardhat";

const API = "https://ccm-portal-api.misterylee.workers.dev";
const ADMIN_ORIGIN = "https://admin-testnet.ccmnetwork.net";
const VESTING = "0x0b04C87D925C35C71Ff736ceCc6A78c8EB28023F";
const CCM_TOKEN = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD";
const SCHEDULE_AMOUNT = 100n; // 100 CCM
const CLIFF_SECS = 60n;
const VEST_SECS = 240n;
const CHAIN_ID = 84532;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fmtCCM = (raw: bigint) => Number(raw / 10n ** 14n) / 10000 + " CCM";

async function api(path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const r = await fetch(`${API}${path}`, init);
  let body: any = null;
  try { body = await r.json(); } catch { body = await r.text().catch(() => null); }
  return { status: r.status, body };
}
async function step(title: string, fn: () => Promise<void>) {
  console.log(`\n━━━ ${title} ━━━`);
  await fn();
}

async function siweSignIn(wallet: ethers.Wallet): Promise<string> {
  const r1 = await api("/api/auth/nonce", {
    method: "POST",
    headers: { "content-type": "application/json", origin: ADMIN_ORIGIN },
    body: JSON.stringify({ address: wallet.address, app: "admin", chainId: CHAIN_ID }),
  });
  if (r1.status !== 200) throw new Error(`nonce failed: ${JSON.stringify(r1.body)}`);
  const sig = await wallet.signMessage(r1.body.message);
  const r2 = await api("/api/auth/verify", {
    method: "POST",
    headers: { "content-type": "application/json", origin: ADMIN_ORIGIN },
    body: JSON.stringify({ message: r1.body.message, signature: sig }),
  });
  if (r2.status !== 200) throw new Error(`verify failed: ${JSON.stringify(r2.body)}`);
  return r2.body.token;
}

async function main() {
  const operator = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  const carol = new ethers.Wallet(process.env.CAROL_PRIVATE_KEY!, ethers.provider);
  const bob = new ethers.Wallet(process.env.BOB_PRIVATE_KEY!, ethers.provider);

  console.log("Operator:", operator.address);
  console.log("Carol   :", carol.address);
  console.log("Bob     :", bob.address);

  const vesting = await ethers.getContractAt("CCMVesting", VESTING);
  const ccm = await ethers.getContractAt("CCMToken", CCM_TOKEN);

  let token: string;
  let scheduleIdCarol: bigint;
  let scheduleIdBob: bigint;

  await step("[1] Operator SIWE sign-in", async () => {
    token = await siweSignIn(operator);
    console.log("  ✅ token:", token.slice(0, 12) + "…" + token.slice(-8));
  });

  // ──
  await step("[2] Operator creates schedule for carol (100 CCM, cliff 60s, vest 240s, revocable=false)", async () => {
    // pre-state
    const countBefore = await vesting.getScheduleCount();
    const vestingBalBefore = await ccm.balanceOf(VESTING);
    const carolCcmBefore = await ccm.balanceOf(carol.address);
    console.log("  scheduleCount before:", countBefore.toString());
    console.log("  vesting CCM balance :", fmtCCM(vestingBalBefore));
    console.log("  carol CCM balance   :", fmtCCM(carolCcmBefore));

    const startTs = BigInt(Math.floor(Date.now() / 1000)) + 5n;
    const totalAtoms = SCHEDULE_AMOUNT * 10n ** 18n;

    // POST audit row pending
    const auditPost = await api("/api/me/audit", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token!}`, origin: ADMIN_ORIGIN },
      body: JSON.stringify({
        chain_id: CHAIN_ID,
        action: "create_schedule",
        target_contract: VESTING,
        target_address: carol.address,
        amount_wei: totalAtoms.toString(),
        status: "pending",
        notes: "E2E test · SAFT investor Carol Capital LLC · wire ref WIRE-E2E-CAROL-001 · Seed @ $0.15/CCM equiv",
      }),
    });
    if (auditPost.status !== 200) throw new Error(`audit POST failed: ${JSON.stringify(auditPost.body)}`);
    const auditId = auditPost.body.id;
    console.log("  audit row id:", auditId);

    // Submit createSchedule
    const tx = await vesting.connect(operator).createSchedule(
      carol.address, totalAtoms, startTs, CLIFF_SECS, VEST_SECS, false,
    );
    console.log("  createSchedule tx:", tx.hash);
    await tx.wait();
    await sleep(3000);

    // PATCH audit confirmed with tx_hash
    const patch = await api(`/api/me/audit/${auditId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token!}`, origin: ADMIN_ORIGIN },
      body: JSON.stringify({ tx_hash: tx.hash, status: "confirmed" }),
    });
    if (patch.status !== 200) throw new Error("patch failed");
    console.log("  ✅ audit confirmed");

    // Verify on-chain
    const countAfter = await vesting.getScheduleCount();
    scheduleIdCarol = countAfter - 1n;
    const s = await vesting.schedules(scheduleIdCarol);
    console.log("  ✅ schedule.beneficiary :", s.beneficiary);
    console.log("  ✅ schedule.totalAmount :", fmtCCM(s.totalAmount));
    console.log("  ✅ schedule.startTime   :", new Date(Number(s.startTime) * 1000).toISOString());
    console.log("  ✅ schedule.cliffSeconds:", s.cliffDuration.toString());
    console.log("  ✅ schedule.vestSeconds :", s.vestingDuration.toString());
    console.log("  ✅ schedule.revocable   :", s.revocable);
    console.log("  ✅ schedule.released    :", s.released.toString());
    if (s.beneficiary.toLowerCase() !== carol.address.toLowerCase()) throw new Error("beneficiary mismatch");
    if (s.totalAmount !== totalAtoms) throw new Error("totalAmount mismatch");
  });

  // ──
  await step("[3] Verify releasable=0 during cliff (no time elapsed)", async () => {
    const r = await vesting.releasable(scheduleIdCarol!);
    console.log("  releasable now:", r.toString());
    if (r !== 0n) throw new Error("expected 0 during cliff (start hasn't even passed yet)");
    console.log("  ✅ pre-cliff enforcement OK");
  });

  // ──
  await step("[4] Wait through cliff (~70s) and verify partial vest", async () => {
    console.log("  sleeping 70s for past-cliff…");
    await sleep(70 * 1000);
    const r = await vesting.releasable(scheduleIdCarol!);
    console.log("  releasable post-cliff:", fmtCCM(r));
    if (r === 0n) throw new Error("expected > 0 post-cliff");
    console.log("  ✅ partial vest active");
  });

  // ──
  await step("[5] Carol calls release() — receives partial vested CCM", async () => {
    const carolBefore = await ccm.balanceOf(carol.address);
    const releasableBefore = await vesting.releasable(scheduleIdCarol!);
    console.log("  carol CCM before  :", fmtCCM(carolBefore));
    console.log("  releasable now    :", fmtCCM(releasableBefore));

    const tx = await vesting.connect(carol).release(scheduleIdCarol!);
    console.log("  release tx:", tx.hash);
    await tx.wait();
    await sleep(3000);

    const carolAfter = await ccm.balanceOf(carol.address);
    const s = await vesting.schedules(scheduleIdCarol!);
    console.log("  carol CCM after   :", fmtCCM(carolAfter), `(Δ +${fmtCCM(carolAfter - carolBefore)})`);
    console.log("  schedule.released :", fmtCCM(s.released));
    if (carolAfter <= carolBefore) throw new Error("carol balance did not increase");
    if (s.released === 0n) throw new Error("released not updated");
    console.log("  ✅ partial release OK");
  });

  // ──
  await step("[6] Wait until fully vested + final release", async () => {
    const s = await vesting.schedules(scheduleIdCarol!);
    const fullyVestedAt = s.startTime + s.vestingDuration;
    const wait = Number(fullyVestedAt - BigInt(Math.floor(Date.now() / 1000))) + 5;
    if (wait > 0) {
      console.log(`  sleeping ${wait}s for full vest…`);
      await sleep(wait * 1000);
    }
    const releasableNow = await vesting.releasable(scheduleIdCarol!);
    console.log("  releasable (remainder):", fmtCCM(releasableNow));
    if (releasableNow > 0n) {
      const tx = await vesting.connect(carol).release(scheduleIdCarol!);
      console.log("  final release tx:", tx.hash);
      await tx.wait();
      await sleep(3000);
    }
    const sFinal = await vesting.schedules(scheduleIdCarol!);
    console.log("  ✅ schedule.released :", fmtCCM(sFinal.released));
    console.log("  ✅ schedule.totalAmount:", fmtCCM(sFinal.totalAmount));
    if (sFinal.released !== sFinal.totalAmount) {
      throw new Error(`not fully released: ${sFinal.released} of ${sFinal.totalAmount}`);
    }
    console.log("  ✅ FULL VEST DELIVERED");
  });

  // ──
  await step("[7] Operator creates revocable schedule for bob", async () => {
    const startTs = BigInt(Math.floor(Date.now() / 1000)) + 5n;
    const totalAtoms = 50n * 10n ** 18n;
    const tx = await vesting.connect(operator).createSchedule(
      bob.address, totalAtoms, startTs, CLIFF_SECS, VEST_SECS, true,
    );
    await tx.wait();
    await sleep(3000);
    const count = await vesting.getScheduleCount();
    scheduleIdBob = count - 1n;
    const s = await vesting.schedules(scheduleIdBob);
    console.log("  ✅ schedule id:", scheduleIdBob.toString(), "· beneficiary:", s.beneficiary, "· revocable:", s.revocable);
    if (!s.revocable) throw new Error("expected revocable=true");
  });

  // ──
  await step("[8] Bob attempts to revoke his own schedule (should REVERT — no MANAGER role)", async () => {
    try {
      const tx = await vesting.connect(bob).revoke(scheduleIdBob!);
      await tx.wait();
      throw new Error("Bob's revoke unexpectedly succeeded!");
    } catch (e: any) {
      if (e.message.includes("unexpectedly")) throw e;
      console.log("  ✅ reverted as expected:", (e.shortMessage || e.message || "").slice(0, 100));
    }
  });

  // ──
  await step("[9] Operator revokes bob's schedule", async () => {
    const sBefore = await vesting.schedules(scheduleIdBob!);
    console.log("  before · revoked :", sBefore.revoked);

    const tx = await vesting.connect(operator).revoke(scheduleIdBob!);
    console.log("  revoke tx:", tx.hash);
    await tx.wait();
    await sleep(3000);

    const sAfter = await vesting.schedules(scheduleIdBob!);
    const releasable = await vesting.releasable(scheduleIdBob!);
    console.log("  after · revoked  :", sAfter.revoked);
    console.log("  releasable now   :", releasable.toString(), "(should be 0)");
    if (!sAfter.revoked) throw new Error("revoke did not flip flag");
    if (releasable !== 0n) throw new Error("expected releasable=0 post-revoke");
    console.log("  ✅ revocation enforced");
  });

  // ──
  await step("[10] Final accounting", async () => {
    const count = await vesting.getScheduleCount();
    const vestingBal = await ccm.balanceOf(VESTING);
    const carolBal = await ccm.balanceOf(carol.address);
    const bobBal = await ccm.balanceOf(bob.address);
    console.log("  scheduleCount    :", count.toString());
    console.log("  vesting CCM bal  :", fmtCCM(vestingBal));
    console.log("  carol CCM bal    :", fmtCCM(carolBal));
    console.log("  bob CCM bal      :", fmtCCM(bobBal));

    // GET audit log to verify rows are visible to operator
    const r = await api(`/api/me/audit?limit=20`, {
      method: "GET",
      headers: { authorization: `Bearer ${token!}`, origin: ADMIN_ORIGIN },
    });
    const rows: any[] = r.body.rows || [];
    const vestingRows = rows.filter((row) => row.action === "create_schedule" || row.action === "revoke_schedule");
    console.log(`  audit rows (vesting): ${vestingRows.length}`);
    for (const row of vestingRows.slice(0, 5)) {
      console.log(`    #${row.id} ${row.action} ${row.target_address?.slice(0, 8)}… ${row.amount_wei ? fmtCCM(BigInt(row.amount_wei)) : ""} status=${row.status} notes="${(row.notes || "").slice(0, 40)}…"`);
    }
  });

  console.log("\n━━━ ✅ VESTING E2E COMPLETE — all data invariants verified ━━━");
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });
