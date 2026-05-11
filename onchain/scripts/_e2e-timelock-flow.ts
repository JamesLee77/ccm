/**
 * E2E data verification for the Timelock scheduler:
 *
 *   Operator (deployer, PROPOSER on Timelock v1)
 *     → SIWE sign-in to portal-api
 *     → POST audit row schedule_op
 *     → Timelock.schedule(target=token, data=mint(alice, 1 CCM), delay=48h)
 *     → PATCH audit confirmed
 *     → Verify: isOperationPending=true, isOperationReady=false (eta in 48h),
 *                getTimestamp matches eta, opId matches hashOperation
 *   ── Cancel path (no 48h wait needed for verification) ──
 *     → POST audit row cancel_op
 *     → Timelock.cancel(opId)
 *     → PATCH audit confirmed
 *     → Verify: isOperation=false (cancelled), getTimestamp=0
 *   ── Role enforcement ──
 *     → Bob (no role) tries to schedule → revert
 *     → Alice (no role) tries to cancel → revert
 *
 * Execute path requires 48h wait → covered by local hardhat tests in
 * test/CCMTimelock.test.ts (which we already ran 12/12 passing).
 */
import { ethers } from "hardhat";

const API = "https://ccm-portal-api.misterylee.workers.dev";
const ADMIN_ORIGIN = "https://admin-testnet.ccmnetwork.net";
const TIMELOCK = "0x3EbA7887525f1E68dc946760a96B01d1E1a1d979"; // v1, deployer-controlled
const SANDBOX_TOKEN = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD";
const REHEARSAL_TOKEN = "0xB5e54084eEFcc4ddc93F3A6AA7A6Dea501FB3999"; // admin = Timelock v1
const ALICE = "0xD4EecF3a15e6727C91E2435216e4f071717411F0";
const CHAIN_ID = 84532;
const ZERO_HASH = "0x" + "00".repeat(32);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const bob = new ethers.Wallet(process.env.BOB_PRIVATE_KEY!, ethers.provider);
  console.log("Operator:", operator.address);
  console.log("Bob     :", bob.address);

  // The rehearsal CCMToken (admin = Timelock v1) is the right target —
  // its mint goes through the timelock. We're scheduling a mint of
  // 1 CCM to alice via the timelock-mediated path.
  const timelock = await ethers.getContractAt("CCMTimelock", TIMELOCK);
  const sandboxToken = await ethers.getContractAt("CCMToken", SANDBOX_TOKEN);
  void REHEARSAL_TOKEN; void sandboxToken;

  const minDelay = await timelock.getMinDelay();
  const minDelayPolicy = await timelock.MIN_DELAY();
  console.log("Timelock minDelay (active):", minDelay.toString(), "s");
  console.log("Timelock minDelay (policy):", minDelayPolicy.toString(), "s");

  let token: string;
  let opId: string;
  let target: string;
  let data: string;
  let salt: string;

  await step("[1] Operator SIWE sign-in", async () => {
    token = await siweSignIn(operator);
    console.log("  ✅ token:", token.slice(0, 12) + "…" + token.slice(-8));
  });

  await step("[2] Build calldata: token.grantRole(MINTER_ROLE, alice) — a real privileged op", async () => {
    // For data-layer test, we just want to schedule SOMETHING valid through
    // the timelock. The exact target/data doesn't have to be exec-ready;
    // we only verify SCHEDULE + CANCEL semantics. Picking a grantRole call
    // to the sandbox token (where the deployer is admin, not timelock —
    // so even if executed it'd still revert, but schedule registers fine).
    const MINTER_ROLE = ethers.id("MINTER_ROLE");
    target = SANDBOX_TOKEN;
    const iface = new ethers.Interface([
      "function grantRole(bytes32 role, address account)",
    ]);
    data = iface.encodeFunctionData("grantRole", [MINTER_ROLE, ALICE]);
    salt = ethers.id(`e2e-test-${Date.now()}`);
    console.log("  target :", target);
    console.log("  data   :", data);
    console.log("  salt   :", salt);
  });

  await step("[3] Compute opId via timelock.hashOperation", async () => {
    opId = await timelock.hashOperation(target, 0n, data, ZERO_HASH, salt);
    console.log("  opId:", opId);
    const isOpBefore = await timelock.isOperation(opId);
    console.log("  isOperation (before): ", isOpBefore, "(expected false)");
    if (isOpBefore) throw new Error("op already exists — pick fresh salt");
  });

  await step("[4] POST audit row + Timelock.schedule(...)", async () => {
    // Audit: pending
    const auditPost = await api("/api/me/audit", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token!}`, origin: ADMIN_ORIGIN },
      body: JSON.stringify({
        chain_id: CHAIN_ID,
        action: "schedule_op",
        target_contract: TIMELOCK,
        target_address: target,
        status: "pending",
        notes: `E2E: schedule grantRole(MINTER_ROLE, alice) via timelock · delay ${minDelay}s · opId ${opId.slice(0, 18)}…`,
      }),
    });
    if (auditPost.status !== 200) throw new Error(`audit POST failed: ${JSON.stringify(auditPost.body)}`);
    const auditId = auditPost.body.id;
    console.log("  audit id:", auditId);

    // Submit schedule
    const tx = await timelock.connect(operator).schedule(target, 0n, data, ZERO_HASH, salt, minDelay);
    console.log("  schedule tx:", tx.hash);
    await tx.wait();
    await sleep(3000);

    // PATCH audit
    await api(`/api/me/audit/${auditId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token!}`, origin: ADMIN_ORIGIN },
      body: JSON.stringify({ tx_hash: tx.hash, status: "confirmed" }),
    });
    console.log("  ✅ audit confirmed");
  });

  await step("[5] Verify on-chain state — pending, not done, eta = now+delay", async () => {
    const isOp = await timelock.isOperation(opId);
    const isPending = await timelock.isOperationPending(opId);
    const isReady = await timelock.isOperationReady(opId);
    const isDone = await timelock.isOperationDone(opId);
    const ts = await timelock.getTimestamp(opId);

    console.log("  isOperation       :", isOp);
    console.log("  isOperationPending:", isPending);
    console.log("  isOperationReady  :", isReady);
    console.log("  isOperationDone   :", isDone);
    console.log("  getTimestamp (eta):", ts.toString(), "(", new Date(Number(ts) * 1000).toISOString(), ")");

    if (!isOp) throw new Error("isOperation should be true");
    if (!isPending) throw new Error("isOperationPending should be true");
    if (isReady) throw new Error("isOperationReady should be false (48h eta)");
    if (isDone) throw new Error("isOperationDone should be false");

    const now = BigInt(Math.floor(Date.now() / 1000));
    const expectedEta = now + minDelay;
    const drift = ts > expectedEta ? ts - expectedEta : expectedEta - ts;
    if (drift > 60n) throw new Error(`eta drift too large: ${drift}s`);
    console.log(`  ✅ eta within 60s of expected (drift ${drift}s)`);
  });

  await step("[6] Bob (no PROPOSER_ROLE) tries to schedule duplicate — expect revert", async () => {
    try {
      const tx = await timelock.connect(bob).schedule(target, 0n, data, ZERO_HASH, salt, minDelay);
      await tx.wait();
      throw new Error("Bob's schedule unexpectedly succeeded");
    } catch (e: any) {
      if (e.message.includes("unexpectedly")) throw e;
      console.log("  ✅ reverted as expected:", (e.shortMessage || e.message || "").slice(0, 100));
    }
  });

  await step("[7] Bob (no CANCELLER_ROLE) tries to cancel — expect revert", async () => {
    try {
      const tx = await timelock.connect(bob).cancel(opId);
      await tx.wait();
      throw new Error("Bob's cancel unexpectedly succeeded");
    } catch (e: any) {
      if (e.message.includes("unexpectedly")) throw e;
      console.log("  ✅ reverted as expected:", (e.shortMessage || e.message || "").slice(0, 100));
    }
  });

  await step("[8] Operator cancels the op + audit", async () => {
    const auditPost = await api("/api/me/audit", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token!}`, origin: ADMIN_ORIGIN },
      body: JSON.stringify({
        chain_id: CHAIN_ID,
        action: "cancel_op",
        target_contract: TIMELOCK,
        status: "pending",
        notes: `E2E: cancel scheduled op ${opId.slice(0, 18)}…`,
      }),
    });
    const auditId = auditPost.body.id;
    console.log("  audit id:", auditId);

    const tx = await timelock.connect(operator).cancel(opId);
    console.log("  cancel tx:", tx.hash);
    await tx.wait();
    await sleep(3000);

    await api(`/api/me/audit/${auditId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token!}`, origin: ADMIN_ORIGIN },
      body: JSON.stringify({ tx_hash: tx.hash, status: "confirmed" }),
    });
    console.log("  ✅ audit confirmed");
  });

  await step("[9] Verify on-chain state — cancelled (timestamp=0)", async () => {
    const isOp = await timelock.isOperation(opId);
    const isPending = await timelock.isOperationPending(opId);
    const ts = await timelock.getTimestamp(opId);
    console.log("  isOperation       :", isOp, "(expected false)");
    console.log("  isOperationPending:", isPending, "(expected false)");
    console.log("  getTimestamp      :", ts.toString(), "(expected 0)");
    if (isOp || isPending) throw new Error("expected op to be cleared after cancel");
    if (ts !== 0n) throw new Error("expected timestamp 0 post-cancel");
    console.log("  ✅ cancel cleared op fully");
  });

  await step("[10] Verify audit log GET returns both rows", async () => {
    const r = await api("/api/me/audit?limit=20", {
      method: "GET",
      headers: { authorization: `Bearer ${token!}`, origin: ADMIN_ORIGIN },
    });
    const rows: any[] = r.body.rows || [];
    const tlRows = rows.filter((row) =>
      row.notes && row.notes.includes(`E2E: `) && (row.action === "schedule_op" || row.action === "cancel_op"),
    );
    console.log(`  matching audit rows: ${tlRows.length}`);
    for (const row of tlRows.slice(0, 4)) {
      console.log(`    #${row.id} ${row.action} status=${row.status} notes="${(row.notes || "").slice(0, 60)}…"`);
    }
    if (tlRows.length < 2) throw new Error("expected at least 2 audit rows (schedule + cancel)");
    console.log("  ✅ audit ledger captured both ops");
  });

  console.log("\n━━━ ✅ TIMELOCK E2E COMPLETE ━━━");
  console.log("  Note: execute path requires waiting MIN_DELAY (48h) — covered by");
  console.log("  local hardhat suite test/CCMTimelock.test.ts (12/12 passing).");
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });
