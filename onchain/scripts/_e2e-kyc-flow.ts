/**
 * E2E data verification for the KYC Registry flow:
 *
 *   Operator (deployer, has KYC_OPERATOR_ROLE)
 *     → SIWE sign-in to portal-api (admin app, Sepolia)
 *     → POST audit kyc_set pending
 *     → CCMKYCRegistry.setKYCed(alice, true)
 *     → PATCH audit submitted/confirmed
 *     → Verify isKYCed(alice)=true, kycedAt > 0, kycedCount incremented
 *
 *   Operator
 *     → POST audit kyc_set_batch pending
 *     → setKYCedBatchUniform([bob, carol], true)
 *     → Verify isKYCed(bob)=true, isKYCed(carol)=true, kycedCount += 2
 *
 *   Operator
 *     → POST audit kyc_set pending  (revoke alice)
 *     → setKYCed(alice, false)
 *     → Verify isKYCed(alice)=false, kycedCount decreased
 *
 *   Bob (no KYC_OPERATOR_ROLE)
 *     → setKYCed(bob, false)  → MUST revert with AccessControlUnauthorizedAccount
 *
 *   Audit log roundtrip
 *     → GET /api/me/audit returns the kyc_set/kyc_set_batch rows we wrote
 *     → status=confirmed, tx_hash present
 */
import { ethers } from "hardhat";

const API = "https://ccm-portal-api.misterylee.workers.dev";
const ADMIN_ORIGIN = "https://admin-testnet.ccmnetwork.net";
const KYC = "0x9172D6eaF05587b595f4eE894B4C7917Be652E46";
const CHAIN_ID = 84532;

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

async function postAudit(token: string, body: any): Promise<number> {
  const r = await api("/api/me/audit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      origin: ADMIN_ORIGIN,
    },
    body: JSON.stringify(body),
  });
  if (r.status !== 200) throw new Error(`audit POST failed: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.id;
}

async function patchAudit(token: string, id: number, patch: any) {
  const r = await api(`/api/me/audit/${id}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      origin: ADMIN_ORIGIN,
    },
    body: JSON.stringify(patch),
  });
  if (r.status !== 200) throw new Error(`audit PATCH failed: ${r.status} ${JSON.stringify(r.body)}`);
}

async function getAudit(token: string, limit = 20) {
  const r = await api(`/api/me/audit?limit=${limit}`, {
    headers: { authorization: `Bearer ${token}`, origin: ADMIN_ORIGIN },
  });
  if (r.status !== 200) throw new Error(`audit GET failed: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.rows as any[];
}

async function main() {
  const operator = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  const alice = new ethers.Wallet(process.env.ALICE_PRIVATE_KEY!, ethers.provider);
  const bob = new ethers.Wallet(process.env.BOB_PRIVATE_KEY!, ethers.provider);
  const carol = new ethers.Wallet(process.env.CAROL_PRIVATE_KEY!, ethers.provider);

  console.log("Operator:", operator.address);
  console.log("Alice   :", alice.address);
  console.log("Bob     :", bob.address);
  console.log("Carol   :", carol.address);

  const kyc = await ethers.getContractAt("CCMKYCRegistry", KYC);
  let token: string;
  let auditIds: number[] = [];

  // ──
  await step("[1] Pre-state snapshot", async () => {
    const role = await kyc.KYC_OPERATOR_ROLE();
    const opHas = await kyc.hasRole(role, operator.address);
    const bobHas = await kyc.hasRole(role, bob.address);
    const count = await kyc.kycedCount();
    console.log("  KYC_OPERATOR_ROLE op  :", opHas);
    console.log("  KYC_OPERATOR_ROLE bob :", bobHas);
    console.log("  kycedCount            :", count.toString());
    if (!opHas) throw new Error("operator must hold KYC_OPERATOR_ROLE");
    if (bobHas) throw new Error("bob must NOT hold KYC_OPERATOR_ROLE for revert test");
  });

  // ──
  await step("[2] Operator SIWE sign-in", async () => {
    token = await siweSignIn(operator);
    console.log("  ✅ token:", token.slice(0, 12) + "…" + token.slice(-8));
  });

  // ──
  await step("[3] kyc_set: approve alice (with audit roundtrip)", async () => {
    // Reset alice to known state first if she's already KYCed (idempotent).
    // Add a settle delay so the read after the cleanup tx isn't stale.
    const wasKYCed = await kyc.isKYCed(alice.address);
    if (wasKYCed) {
      console.log("  alice was KYCed already — revoking first to test approve flow cleanly");
      const tx = await kyc.connect(operator).setKYCed(alice.address, false);
      await tx.wait();
      await sleep(4000);
    }
    const countBefore = await kyc.kycedCount();

    const id = await postAudit(token, {
      chain_id: CHAIN_ID,
      action: "kyc_set",
      target_contract: KYC,
      target_address: alice.address,
      status: "pending",
      notes: `setKYCed(${alice.address}, true) · e2e test approve · Sumsub:test-applicant-001`,
    });
    auditIds.push(id);
    console.log("  audit id:", id);

    const tx = await kyc.connect(operator).setKYCed(alice.address, true);
    await patchAudit(token, id, { tx_hash: tx.hash, status: "submitted" });
    const rcpt = await tx.wait();
    if (!rcpt || rcpt.status !== 1) throw new Error("setKYCed reverted");
    await patchAudit(token, id, { status: "confirmed" });
    console.log("  tx:", tx.hash);

    // Base Sepolia public RPC has read-replica lag — settle 4s before re-reading
    await sleep(4000);
    const isOk = await kyc.isKYCed(alice.address);
    const ts = await kyc.kycedAt(alice.address);
    const countAfter = await kyc.kycedCount();
    console.log("  isKYCed(alice)        :", isOk);
    console.log("  kycedAt(alice)        :", ts.toString(), `(${new Date(Number(ts) * 1000).toISOString()})`);
    console.log("  kycedCount delta      :", (countAfter - countBefore).toString());
    if (!isOk) throw new Error("alice not KYCed after approve");
    if (ts === 0n) throw new Error("kycedAt timestamp not set");
    if (countAfter - countBefore !== 1n) throw new Error("kycedCount did not increment by 1");
  });

  // ──
  await step("[4] kyc_set_batch: approve [bob, carol] uniformly", async () => {
    // Reset to known state
    let didReset = false;
    for (const w of [bob, carol]) {
      if (await kyc.isKYCed(w.address)) {
        const tx = await kyc.connect(operator).setKYCed(w.address, false);
        await tx.wait();
        didReset = true;
      }
    }
    if (didReset) await sleep(4000);
    const countBefore = await kyc.kycedCount();

    const id = await postAudit(token, {
      chain_id: CHAIN_ID,
      action: "kyc_set_batch",
      target_contract: KYC,
      status: "pending",
      notes: `setKYCedBatchUniform([bob, carol], true) · e2e batch test · 2 addrs`,
    });
    auditIds.push(id);
    console.log("  audit id:", id);

    const tx = await kyc.connect(operator).setKYCedBatchUniform([bob.address, carol.address], true);
    await patchAudit(token, id, { tx_hash: tx.hash, status: "submitted" });
    const rcpt = await tx.wait();
    if (!rcpt || rcpt.status !== 1) throw new Error("batch reverted");
    await patchAudit(token, id, { status: "confirmed" });
    console.log("  tx:", tx.hash);

    await sleep(4000);
    const okB = await kyc.isKYCed(bob.address);
    const okC = await kyc.isKYCed(carol.address);
    const countAfter = await kyc.kycedCount();
    console.log("  isKYCed(bob)          :", okB);
    console.log("  isKYCed(carol)        :", okC);
    console.log("  kycedCount delta      :", (countAfter - countBefore).toString());
    if (!okB || !okC) throw new Error("batch did not flip both addrs");
    if (countAfter - countBefore !== 2n) throw new Error("kycedCount did not increase by 2");
  });

  // ──
  await step("[5] kyc_set: revoke alice (count should decrement)", async () => {
    const countBefore = await kyc.kycedCount();
    const id = await postAudit(token, {
      chain_id: CHAIN_ID,
      action: "kyc_set",
      target_contract: KYC,
      target_address: alice.address,
      status: "pending",
      notes: `setKYCed(${alice.address}, false) · e2e revoke · jurisdiction US-block`,
    });
    auditIds.push(id);
    const tx = await kyc.connect(operator).setKYCed(alice.address, false);
    await patchAudit(token, id, { tx_hash: tx.hash, status: "submitted" });
    await tx.wait();
    await patchAudit(token, id, { status: "confirmed" });

    await sleep(4000);
    const isOk = await kyc.isKYCed(alice.address);
    const countAfter = await kyc.kycedCount();
    console.log("  isKYCed(alice) after  :", isOk);
    console.log("  kycedCount delta      :", (countAfter - countBefore).toString());
    if (isOk) throw new Error("alice should be revoked");
    if (countBefore - countAfter !== 1n) throw new Error("kycedCount did not decrease by 1");
  });

  // ──
  await step("[6] Role enforcement: bob (no role) attempts setKYCed → revert", async () => {
    let reverted = false;
    let reason = "";
    try {
      const tx = await kyc.connect(bob).setKYCed(carol.address, false);
      await tx.wait();
    } catch (e: any) {
      reverted = true;
      reason = e?.shortMessage || e?.message || String(e);
    }
    console.log("  reverted:", reverted);
    console.log("  reason  :", reason.slice(0, 140));
    if (!reverted) throw new Error("bob's setKYCed must revert (no KYC_OPERATOR_ROLE)");
  });

  // ──
  await step("[7] Audit log roundtrip — verify our 3 rows", async () => {
    await sleep(800);
    const rows = await getAudit(token, 30);
    const mine = rows.filter((r) => auditIds.includes(r.id));
    console.log("  rows we wrote:", mine.length, "/", auditIds.length);
    for (const r of mine) {
      console.log(
        `  id=${r.id} · ${r.action} · status=${r.status} · tx=${(r.tx_hash || "").slice(0, 10)}…` +
        ` · notes="${(r.notes || "").slice(0, 60)}…"`,
      );
    }
    if (mine.length !== auditIds.length) throw new Error("not all audit rows came back");
    for (const r of mine) {
      if (r.status !== "confirmed") throw new Error(`audit ${r.id} not confirmed: ${r.status}`);
      if (!r.tx_hash) throw new Error(`audit ${r.id} missing tx_hash`);
      if (!r.notes) throw new Error(`audit ${r.id} missing notes`);
    }
    const setRow = mine.find((r) => r.action === "kyc_set" && r.notes.includes("true"));
    const batchRow = mine.find((r) => r.action === "kyc_set_batch");
    const revRow = mine.find((r) => r.action === "kyc_set" && r.notes.includes("false"));
    if (!setRow) throw new Error("approve audit row missing");
    if (!batchRow) throw new Error("batch audit row missing");
    if (!revRow) throw new Error("revoke audit row missing");
  });

  console.log("\n✅ ALL CHECKS PASSED");
}

main().catch((e) => { console.error(e); process.exit(1); });
