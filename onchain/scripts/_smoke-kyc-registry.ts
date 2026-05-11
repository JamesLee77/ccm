import { ethers } from "hardhat";

const KYC = "0x9172D6eaF05587b595f4eE894B4C7917Be652E46";
const TIMELOCK = "0x3EbA7887525f1E68dc946760a96B01d1E1a1d979";

// Three deterministic dummy addresses for the smoke approval
const A1 = "0x1111111111111111111111111111111111111111";
const A2 = "0x2222222222222222222222222222222222222222";
const A3 = "0x3333333333333333333333333333333333333333";

async function main() {
  const [deployer] = await ethers.getSigners();
  const reg = await ethers.getContractAt("CCMKYCRegistry", KYC);

  const KYC_OPERATOR_ROLE = await reg.KYC_OPERATOR_ROLE();
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

  console.log("VERSION:", await reg.VERSION());
  console.log("\nRoles before any ops:");
  console.log("  hasRole(ADMIN, deployer)   :", await reg.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
  console.log("  hasRole(ADMIN, timelock)   :", await reg.hasRole(DEFAULT_ADMIN_ROLE, TIMELOCK));
  console.log("  hasRole(OPERATOR, deployer):", await reg.hasRole(KYC_OPERATOR_ROLE, deployer.address));

  console.log("\n[1/3] Operator (deployer) approves batch of 3 wallets…");
  const tx = await reg.setKYCedBatchUniform([A1, A2, A3], true);
  const rcpt = await tx.wait();
  console.log("  tx :", tx.hash, "block:", rcpt?.blockNumber);

  console.log("\n[2/3] Verify state:");
  console.log("  isKYCed(A1):", await reg.isKYCed(A1));
  console.log("  isKYCed(A2):", await reg.isKYCed(A2));
  console.log("  isKYCed(A3):", await reg.isKYCed(A3));
  console.log("  kycedCount :", (await reg.kycedCount()).toString());

  console.log("\n[3/3] Sanity: admin role is gated by timelock, not deployer");
  // Deployer tries to grant OPERATOR to themselves (already has it, but the
  // call itself is the check — they shouldn't be able to act as admin).
  try {
    const tx2 = await reg.grantRole(KYC_OPERATOR_ROLE, A1);
    await tx2.wait();
    console.log("  ❌ FAILED: deployer was able to grant role! tx:", tx2.hash);
  } catch (e: any) {
    const msg = (e.shortMessage || e.message || "").slice(0, 160);
    console.log("  ✓ deployer cannot grant role (admin is the timelock):", msg);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
