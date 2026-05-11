/**
 * E2E data verification for the Compliance persona on testnet.
 *
 * Goal: prove the on-chain RBAC segregation matches the UI persona model.
 * Compliance has SCHEDULE_MANAGER_ROLE on Vesting (granted) but NOT
 * MINTER_ROLE on Token, NOT SALE_ADMIN_ROLE on TGE, NOT KYC_OPERATOR_ROLE
 * (gated by Timelock, intentionally not granted for testnet test).
 *
 * The script:
 *   [1] SIWE sign-in as compliance wallet → portal-api accepts
 *   [2] compliance creates a vesting schedule for carol → success
 *   [3] compliance attempts CCMToken.mint → revert
 *   [4] compliance attempts CCMTokenTGESale.createRound → revert
 *   [5] compliance attempts CCMKYCRegistry.setKYCed → revert (no role)
 *
 * Steps 3-5 confirm the on-chain layer rejects the wallet for
 * Treasury-scoped actions even if the UI persona lets the buttons
 * through (which it shouldn't, but defense in depth).
 */
import { ethers } from "hardhat";

const API = "https://ccm-portal-api.misterylee.workers.dev";
const ADMIN_ORIGIN = "https://admin-testnet.ccmnetwork.net";
const CCM_TOKEN = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD";
const CCM_VESTING = "0x0b04C87D925C35C71Ff736ceCc6A78c8EB28023F";
const CCM_KYC = "0x9172D6eaF05587b595f4eE894B4C7917Be652E46";
const CCM_TGE = "0x487eb25aBE20C85d55695eBD0eA2275C5bdD1745";
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

async function expectRevert(label: string, fn: () => Promise<any>) {
  let reverted = false;
  let reason = "";
  try {
    const tx = await fn();
    if (tx?.wait) await tx.wait();
  } catch (e: any) {
    reverted = true;
    reason = e?.shortMessage || e?.message || String(e);
  }
  console.log(`  ${label}: ${reverted ? "✅ reverted" : "❌ DID NOT REVERT"}`);
  if (reason) console.log(`    reason: ${reason.slice(0, 140)}`);
  if (!reverted) throw new Error(`${label} should have reverted`);
}

async function main() {
  const compliance = new ethers.Wallet(process.env.COMPLIANCE_PRIVATE_KEY!, ethers.provider);
  const carol = new ethers.Wallet(process.env.CAROL_PRIVATE_KEY!, ethers.provider);

  console.log("Compliance wallet:", compliance.address);
  console.log("Carol (beneficiary):", carol.address);

  const token = await ethers.getContractAt("CCMToken", CCM_TOKEN);
  const vesting = await ethers.getContractAt("CCMVesting", CCM_VESTING);
  const kyc = await ethers.getContractAt("CCMKYCRegistry", CCM_KYC);
  const tge = await ethers.getContractAt("CCMTGESale", CCM_TGE);

  // ── 1: SIWE
  let token_str: string;
  await step("[1] Compliance SIWE sign-in (portal-api accepts any wallet)", async () => {
    token_str = await siweSignIn(compliance);
    console.log("  ✅ token:", token_str.slice(0, 12) + "…" + token_str.slice(-8));
  });

  // ── 2: Compliance can create a vesting schedule (has role)
  await step("[2] Compliance creates vesting schedule for carol (HAS SCHEDULE_MANAGER_ROLE)", async () => {
    const SCHED = await vesting.SCHEDULE_MANAGER_ROLE();
    const has = await vesting.hasRole(SCHED, compliance.address);
    console.log("  hasRole(SCHEDULE_MANAGER):", has);
    if (!has) throw new Error("compliance must hold SCHEDULE_MANAGER_ROLE");
    const startTs = BigInt(Math.floor(Date.now() / 1000)) + 5n;
    const total = ethers.parseUnits("1", 18); // 1 CCM tiny test
    const tx = await vesting.connect(compliance).createSchedule(
      carol.address, total, startTs, 60n, 240n, false,
    );
    await tx.wait();
    console.log(`  ✅ tx: ${tx.hash}`);
  });

  // ── 3: Compliance CANNOT mint (no MINTER_ROLE)
  await step("[3] Compliance attempts CCMToken.mint → must revert", async () => {
    await expectRevert("mint", () =>
      token.connect(compliance).mint(carol.address, ethers.parseUnits("1", 18)),
    );
  });

  // ── 4: Compliance CANNOT create a TGE round (no SALE_ADMIN_ROLE)
  await step("[4] Compliance attempts CCMTokenTGESale.createRound → must revert", async () => {
    const now = Math.floor(Date.now() / 1000);
    await expectRevert("createRound", () =>
      tge.connect(compliance).createRound(
        "compliance-test",
        ethers.parseUnits("1", 6),       // priceUsdc6
        ethers.parseUnits("100", 18),    // hardCapCcm
        60n,                              // cliffSeconds
        240n,                             // vestSeconds
        BigInt(now + 60),                 // startTime
        BigInt(now + 600),                // endTime
      ),
    );
  });

  // ── 5: Compliance CANNOT setKYCed (KYC_OPERATOR_ROLE not granted on testnet)
  await step("[5] Compliance attempts CCMKYCRegistry.setKYCed → must revert", async () => {
    const KYC_OP = await kyc.KYC_OPERATOR_ROLE();
    const has = await kyc.hasRole(KYC_OP, compliance.address);
    console.log("  hasRole(KYC_OPERATOR):", has, "(expected false on testnet)");
    await expectRevert("setKYCed", () =>
      kyc.connect(compliance).setKYCed(carol.address, true),
    );
  });

  console.log("\n✅ ALL CHECKS PASSED — on-chain RBAC enforces persona segregation");
  console.log("\nManual UI test:");
  console.log("  1. Open https://admin-testnet.ccmnetwork.net");
  console.log("  2. Connect with compliance wallet:", compliance.address);
  console.log("  3. Click the persona badge (top-right), pick \"Compliance\"");
  console.log("  4. Verify NAV shows ONLY Vesting + KYC tabs");
  console.log("  5. Switch to \"Treasury\" — NAV should show Token + Presale + Timelock");
  console.log("  6. Switch to \"Read-only\" — all 5 tabs visible, all CTAs disabled");
}

main().catch((e) => { console.error(e); process.exit(1); });
