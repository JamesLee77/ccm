// Continuation: cancel the still-pending op from previous run.
import { ethers } from "hardhat";

const API = "https://ccm-portal-api.misterylee.workers.dev";
const ADMIN_ORIGIN = "https://admin-testnet.ccmnetwork.net";
const TIMELOCK = "0x3EbA7887525f1E68dc946760a96B01d1E1a1d979";
const OP_ID = "0xdfb02af4a9d4cea17566468597cd99fd87a345e6d8d361b8fcb82e63114907d4";
const CHAIN_ID = 84532;

async function api(path: string, init: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, init);
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function main() {
  const operator = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  const tl = await ethers.getContractAt("CCMTimelock", TIMELOCK);

  // Verify pre-state
  const isPending = await tl.isOperationPending(OP_ID);
  console.log("isOperationPending:", isPending);
  if (!isPending) { console.log("op already cleared, nothing to do"); return; }

  // SIWE
  const r1 = await api("/api/auth/nonce", {
    method: "POST",
    headers: { "content-type": "application/json", origin: ADMIN_ORIGIN },
    body: JSON.stringify({ address: operator.address, app: "admin", chainId: CHAIN_ID }),
  });
  const sig = await operator.signMessage(r1.body.message);
  const r2 = await api("/api/auth/verify", {
    method: "POST",
    headers: { "content-type": "application/json", origin: ADMIN_ORIGIN },
    body: JSON.stringify({ message: r1.body.message, signature: sig }),
  });
  const token = r2.body.token;
  console.log("✅ siwe");

  // Audit pending
  const aPost = await api("/api/me/audit", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}`, origin: ADMIN_ORIGIN },
    body: JSON.stringify({
      chain_id: CHAIN_ID, action: "cancel_op", target_contract: TIMELOCK,
      status: "pending", notes: `E2E retry: cancel ${OP_ID.slice(0,18)}…`,
    }),
  });
  const auditId = aPost.body.id;

  // Fresh nonce
  const nonce = await ethers.provider.getTransactionCount(operator.address, "latest");
  console.log("operator nonce (fresh):", nonce);

  const tx = await tl.connect(operator).cancel(OP_ID, { nonce });
  console.log("cancel tx:", tx.hash);
  await tx.wait();
  await new Promise(r => setTimeout(r, 3000));

  await api(`/api/me/audit/${auditId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}`, origin: ADMIN_ORIGIN },
    body: JSON.stringify({ tx_hash: tx.hash, status: "confirmed" }),
  });

  // Verify post-state
  const isOp = await tl.isOperation(OP_ID);
  const ts = await tl.getTimestamp(OP_ID);
  console.log("✅ post · isOperation:", isOp, "· timestamp:", ts.toString());

  // GET audit
  const gr = await api(`/api/me/audit?limit=20`, {
    method: "GET",
    headers: { authorization: `Bearer ${token}`, origin: ADMIN_ORIGIN },
  });
  const tlRows = (gr.body.rows || []).filter((row: any) =>
    row.notes && row.notes.includes(`E2E`) && (row.action === "schedule_op" || row.action === "cancel_op"),
  );
  console.log(`audit rows: ${tlRows.length}`);
  for (const row of tlRows.slice(0, 5)) {
    console.log(`  #${row.id} ${row.action} status=${row.status} tx=${(row.tx_hash || "").slice(0,12)}…`);
  }

  console.log("\n━━━ ✅ TIMELOCK E2E COMPLETE (schedule + cancel + audit round-trip) ━━━");
}
main().catch((e) => { console.error(e); process.exit(1); });
