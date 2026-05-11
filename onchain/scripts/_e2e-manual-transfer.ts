/**
 * E2E data verification for manual_transfer feature:
 *   - SIWE sign-in to portal-api as admin (Authorization-header path)
 *   - POST /api/me/audit with action=manual_transfer + notes
 *   - Send real on-chain CCM.transfer
 *   - PATCH the audit row with tx_hash + status=confirmed
 *   - GET /api/me/audit and verify notes round-tripped intact
 *
 * Drives every layer the new feature touches: HTTPS to worker, SIWE
 * verification, D1 row insert/update with notes, on-chain transfer.
 */
import { ethers } from "hardhat";

const API = "https://ccm-portal-api.misterylee.workers.dev";
const ADMIN_ORIGIN = "https://admin-testnet.ccmnetwork.net";
const SALE_CHAIN_ID = 84532;
const CCM_TOKEN = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD";
// Send a tiny amount (1 CCM) to a deterministic test address
const RECIPIENT = "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead";
const AMOUNT_CCM = 1n;
const NOTES = "Wire transfer USD 0.15 from TestCo LLC · ref WIRE-E2E-2026-05-10 · SAFT signed 2026-05-09 · audit-test row";

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

async function main() {
  const operator = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  console.log("Operator:", operator.address);

  let token: string;
  let auditId: number;
  let txHash: `0x${string}`;

  // ────────────────────────────────────────────────────────────
  await step("[1] SIWE sign-in (admin app, Sepolia)", async () => {
    // Get nonce + message
    const r1 = await api("/api/auth/nonce", {
      method: "POST",
      headers: { "content-type": "application/json", origin: ADMIN_ORIGIN },
      body: JSON.stringify({
        address: operator.address,
        app: "admin",
        chainId: SALE_CHAIN_ID,
      }),
    });
    if (r1.status !== 200) throw new Error(`nonce failed: ${r1.status} ${JSON.stringify(r1.body)}`);
    const message: string = r1.body.message;
    console.log("  nonce:", r1.body.nonce);
    console.log("  message domain:", message.split("\n")[0].split(" ")[0]);

    // Sign EIP-191 (personal_sign) — same path the wallet uses
    const signature = await operator.signMessage(message);
    console.log("  signature:", signature.slice(0, 10) + "…" + signature.slice(-8));

    // Verify
    const r2 = await api("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json", origin: ADMIN_ORIGIN },
      body: JSON.stringify({ message, signature }),
    });
    if (r2.status !== 200) throw new Error(`verify failed: ${r2.status} ${JSON.stringify(r2.body)}`);
    token = r2.body.token;
    const exp = new Date(r2.body.exp * 1000).toISOString();
    console.log("  ✅ session active · address:", r2.body.address, "· exp:", exp);
    console.log("  token:", token.slice(0, 12) + "…" + token.slice(-8), `(${token.length} chars)`);
  });

  // ────────────────────────────────────────────────────────────
  await step("[2] POST /api/me/audit (action=manual_transfer, status=pending, with notes)", async () => {
    const r = await api("/api/me/audit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token!}`,
        origin: ADMIN_ORIGIN,
      },
      body: JSON.stringify({
        chain_id: SALE_CHAIN_ID,
        action: "manual_transfer",
        target_contract: CCM_TOKEN,
        target_address: RECIPIENT,
        amount_wei: (AMOUNT_CCM * 10n ** 18n).toString(),
        status: "pending",
        notes: NOTES,
      }),
    });
    if (r.status !== 200) throw new Error(`audit POST failed: ${r.status} ${JSON.stringify(r.body)}`);
    auditId = r.body.id;
    console.log("  ✅ audit row id:", auditId, "· wallet:", r.body.wallet, "· status:", r.body.status);
  });

  // ────────────────────────────────────────────────────────────
  await step("[3] Send real on-chain CCM.transfer", async () => {
    const ccm = await ethers.getContractAt("CCMToken", CCM_TOKEN);
    const before = await ccm.balanceOf(RECIPIENT);
    const opBefore = await ccm.balanceOf(operator.address);
    console.log("  recipient before:", before.toString());
    console.log("  operator  before:", opBefore.toString());

    const tx = await ccm.connect(operator).transfer(RECIPIENT, AMOUNT_CCM * 10n ** 18n);
    txHash = tx.hash as `0x${string}`;
    console.log("  tx:", txHash);
    await tx.wait();
    await sleep(3000);

    const after = await ccm.balanceOf(RECIPIENT);
    const opAfter = await ccm.balanceOf(operator.address);
    console.log("  recipient after :", after.toString(), `(Δ +${(after - before).toString()})`);
    console.log("  operator  after :", opAfter.toString(), `(Δ -${(opBefore - opAfter).toString()})`);
    if (after - before !== AMOUNT_CCM * 10n ** 18n) {
      throw new Error("on-chain transfer amount mismatch");
    }
    console.log("  ✅ on-chain transfer confirmed");
  });

  // ────────────────────────────────────────────────────────────
  await step("[4] PATCH audit row with tx_hash + status=submitted", async () => {
    const r = await api(`/api/me/audit/${auditId!}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token!}`,
        origin: ADMIN_ORIGIN,
      },
      body: JSON.stringify({ tx_hash: txHash!, status: "submitted" }),
    });
    if (r.status !== 200) throw new Error(`patch submitted failed: ${r.status} ${JSON.stringify(r.body)}`);
    console.log("  ✅ patched submitted");
  });

  // ────────────────────────────────────────────────────────────
  await step("[5] PATCH audit row to status=confirmed (simulating UI's post-receipt PATCH)", async () => {
    const r = await api(`/api/me/audit/${auditId!}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token!}`,
        origin: ADMIN_ORIGIN,
      },
      body: JSON.stringify({ status: "confirmed" }),
    });
    if (r.status !== 200) throw new Error(`patch confirmed failed: ${r.status} ${JSON.stringify(r.body)}`);
    console.log("  ✅ patched confirmed");
  });

  // ────────────────────────────────────────────────────────────
  await step("[6] GET /api/me/audit and verify the notes round-tripped intact", async () => {
    const r = await api(`/api/me/audit?limit=10`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token!}`,
        origin: ADMIN_ORIGIN,
      },
    });
    if (r.status !== 200) throw new Error(`GET audit failed: ${r.status}`);
    const rows: any[] = r.body.rows || [];
    const ourRow = rows.find((row) => row.id === auditId);
    if (!ourRow) throw new Error("audit row not found in GET");
    console.log("  ✅ row found");
    console.log("    id            :", ourRow.id);
    console.log("    wallet        :", ourRow.wallet);
    console.log("    chain_id      :", ourRow.chain_id);
    console.log("    action        :", ourRow.action);
    console.log("    target_contract:", ourRow.target_contract);
    console.log("    target_address :", ourRow.target_address);
    console.log("    amount_wei    :", ourRow.amount_wei);
    console.log("    tx_hash       :", ourRow.tx_hash);
    console.log("    status        :", ourRow.status);
    console.log("    notes         :", JSON.stringify(ourRow.notes));
    console.log("    created_at    :", new Date(ourRow.created_at * 1000).toISOString());
    console.log("    updated_at    :", new Date(ourRow.updated_at * 1000).toISOString());

    // Invariants
    const expected = {
      action: "manual_transfer",
      target_contract: CCM_TOKEN.toLowerCase(),
      target_address: RECIPIENT.toLowerCase(),
      amount_wei: (AMOUNT_CCM * 10n ** 18n).toString(),
      tx_hash: txHash!.toLowerCase(),
      status: "confirmed",
      notes: NOTES,
      chain_id: SALE_CHAIN_ID,
      wallet: operator.address.toLowerCase(),
    };
    for (const [k, v] of Object.entries(expected)) {
      const got = (ourRow as any)[k];
      const match = String(got).toLowerCase() === String(v).toLowerCase();
      console.log(`    ${k.padEnd(15)} ${match ? "✓" : "✗ MISMATCH"}` + (match ? "" : ` got=${got} want=${v}`));
      if (!match) throw new Error(`field ${k} mismatch`);
    }
    console.log("\n  ✅ ALL FIELDS ROUND-TRIPPED INTACT");
  });

  // ────────────────────────────────────────────────────────────
  await step("[7] Cross-check: ownership enforcement (other wallet PATCH must 404)", async () => {
    // Sign in as bob and try to PATCH operator's row
    const bob = new ethers.Wallet(process.env.BOB_PRIVATE_KEY!, ethers.provider);
    const r1 = await api("/api/auth/nonce", {
      method: "POST",
      headers: { "content-type": "application/json", origin: ADMIN_ORIGIN },
      body: JSON.stringify({ address: bob.address, app: "admin", chainId: SALE_CHAIN_ID }),
    });
    const sig = await bob.signMessage(r1.body.message);
    const r2 = await api("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json", origin: ADMIN_ORIGIN },
      body: JSON.stringify({ message: r1.body.message, signature: sig }),
    });
    const bobToken = r2.body.token;
    const r3 = await api(`/api/me/audit/${auditId!}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${bobToken}`,
        origin: ADMIN_ORIGIN,
      },
      body: JSON.stringify({ status: "failed", error_msg: "evil hijack attempt" }),
    });
    console.log("  bob's PATCH attempt status:", r3.status, "·", JSON.stringify(r3.body));
    if (r3.status !== 404) throw new Error("expected 404 (cross-wallet write rejected)");
    console.log("  ✅ cross-wallet PATCH rejected (404)");
  });

  console.log("\n━━━ ✅ ALL DATA INVARIANTS VERIFIED ━━━");
  console.log(`\n  audit row id      : ${auditId!}`);
  console.log(`  on-chain tx       : ${txHash!}`);
  console.log(`  BaseScan tx       : https://sepolia.basescan.org/tx/${txHash!}`);
  console.log(`  notes preserved   : ${NOTES.length} chars exactly`);
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });
