/**
 * Provision a fresh Compliance-persona test wallet on Base Sepolia.
 *
 *   1. Operator transfers 0.01 ETH to compliance for gas
 *   2. Operator grants compliance KYC_OPERATOR_ROLE on CCMKYCRegistry
 *   3. Operator grants compliance SCHEDULE_MANAGER_ROLE on CCMVesting
 *   4. Operator does NOT grant any role on CCMToken / CCMTGESale —
 *      this is the segregation we want to test (compliance can't mint
 *      / can't withdraw USDC / can't create rounds).
 *
 * Idempotent: re-running is safe (skips funds + roles already granted).
 */
import { ethers } from "hardhat";

const KYC = "0x9172D6eaF05587b595f4eE894B4C7917Be652E46";
const VESTING = "0x0b04C87D925C35C71Ff736ceCc6A78c8EB28023F";
const FUND_AMOUNT = ethers.parseEther("0.0015");
const MIN_BALANCE = ethers.parseEther("0.001");

async function main() {
  const operator = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  const compliance = new ethers.Wallet(process.env.COMPLIANCE_PRIVATE_KEY!, ethers.provider);

  console.log("Operator   :", operator.address);
  console.log("Compliance :", compliance.address);

  // ── Step 1: gas funding ──────────────────────────────────────────
  const balBefore = await ethers.provider.getBalance(compliance.address);
  console.log(`\n[1] Compliance ETH balance: ${ethers.formatEther(balBefore)}`);
  if (balBefore < MIN_BALANCE) {
    console.log(`    Sending ${ethers.formatEther(FUND_AMOUNT)} ETH from operator…`);
    const tx = await operator.sendTransaction({ to: compliance.address, value: FUND_AMOUNT });
    await tx.wait();
    const balAfter = await ethers.provider.getBalance(compliance.address);
    console.log(`    funded → ${ethers.formatEther(balAfter)} ETH (tx ${tx.hash})`);
  } else {
    console.log("    sufficient balance, skipping fund");
  }

  // ── Step 2: KYC_OPERATOR_ROLE on CCMKYCRegistry ──────────────────
  // CCMKYCRegistry's DEFAULT_ADMIN_ROLE is held by the 48h Timelock,
  // not the operator — so granting KYC_OPERATOR_ROLE requires going
  // through Timelock.schedule() + waiting + Timelock.execute().
  // Out of scope for this provisioning script. We only verify what
  // happens to a wallet WITHOUT the role — the on-chain revert is
  // the segregation we want to demonstrate.
  const kyc = await ethers.getContractAt("CCMKYCRegistry", KYC);
  const KYC_OPERATOR_ROLE = await kyc.KYC_OPERATOR_ROLE();
  const hasKyc = await kyc.hasRole(KYC_OPERATOR_ROLE, compliance.address);
  console.log(`\n[2] KYC_OPERATOR_ROLE: ${hasKyc ? "already granted" : "skipped (admin=Timelock, 48h delay)"}`);

  // ── Step 3: SCHEDULE_MANAGER_ROLE on CCMVesting ──────────────────
  const vesting = await ethers.getContractAt("CCMVesting", VESTING);
  const SCHEDULE_MANAGER_ROLE = await vesting.SCHEDULE_MANAGER_ROLE();
  const hasVest = await vesting.hasRole(SCHEDULE_MANAGER_ROLE, compliance.address);
  console.log(`\n[3] SCHEDULE_MANAGER_ROLE: ${hasVest ? "already granted" : "granting…"}`);
  if (!hasVest) {
    const tx = await vesting.connect(operator).grantRole(SCHEDULE_MANAGER_ROLE, compliance.address);
    await tx.wait();
    console.log(`    granted (tx ${tx.hash})`);
  }

  // ── Verification ──────────────────────────────────────────────────
  console.log("\n━━━ Final state ━━━");
  console.log("Compliance wallet      :", compliance.address);
  console.log("ETH balance            :", ethers.formatEther(await ethers.provider.getBalance(compliance.address)));
  console.log("KYC_OPERATOR_ROLE      :", await kyc.hasRole(KYC_OPERATOR_ROLE, compliance.address));
  console.log("SCHEDULE_MANAGER_ROLE  :", await vesting.hasRole(SCHEDULE_MANAGER_ROLE, compliance.address));

  // Confirm Treasury-scoped roles are NOT granted (segregation)
  const tokenAddr = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD";
  const token = await ethers.getContractAt("CCMToken", tokenAddr);
  const MINTER_ROLE = await token.MINTER_ROLE();
  console.log("\n— segregation check —");
  console.log("Token MINTER_ROLE      :", await token.hasRole(MINTER_ROLE, compliance.address), "(expect false)");

  console.log("\n✅ compliance wallet ready");
  console.log("   Connect this wallet to https://admin-testnet.ccmnetwork.net,");
  console.log("   click the persona badge → \"Compliance\", and verify");
  console.log("   that only Vesting + KYC tabs appear.");
}

main().catch((e) => { console.error(e); process.exit(1); });
