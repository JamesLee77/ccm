import { ethers } from "hardhat";

const KYC = "0x9172D6eaF05587b595f4eE894B4C7917Be652E46";
const A1 = "0x1111111111111111111111111111111111111111";
const A2 = "0x2222222222222222222222222222222222222222";
const A3 = "0x3333333333333333333333333333333333333333";

async function main() {
  const reg = await ethers.getContractAt("CCMKYCRegistry", KYC);

  console.log("Re-read state (after RPC settles):");
  console.log("  isKYCed(A1):", await reg.isKYCed(A1));
  console.log("  isKYCed(A2):", await reg.isKYCed(A2));
  console.log("  isKYCed(A3):", await reg.isKYCed(A3));
  console.log("  kycedCount :", (await reg.kycedCount()).toString());

  // Also check via event log
  const filter = reg.filters.KYCStatusChanged();
  const events = await reg.queryFilter(filter, -2000);
  console.log(`\nKYCStatusChanged events: ${events.length}`);
  for (const ev of events) {
    const a = ev.args;
    console.log(`  user: ${a[0]} · kyced: ${a[1]} · ts: ${a[2]} · operator: ${a[3]}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
