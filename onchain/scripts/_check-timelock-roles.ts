import { ethers } from "hardhat";
const TIMELOCK = "0x3EbA7887525f1E68dc946760a96B01d1E1a1d979";

async function main() {
  const tl = await ethers.getContractAt("CCMTimelock", TIMELOCK);
  const operator = "0xB722843587DA96bdFb5638Bb0AbC8FC56a9dfa1D";
  const PROPOSER = await tl.PROPOSER_ROLE();
  const EXECUTOR = await tl.EXECUTOR_ROLE();
  const CANCELLER = await tl.CANCELLER_ROLE();
  console.log("PROPOSER_ROLE :", PROPOSER);
  console.log("EXECUTOR_ROLE :", EXECUTOR);
  console.log("CANCELLER_ROLE:", CANCELLER);
  console.log("operator hasProposer  :", await tl.hasRole(PROPOSER, operator));
  console.log("operator hasExecutor  :", await tl.hasRole(EXECUTOR, operator));
  console.log("operator hasCanceller :", await tl.hasRole(CANCELLER, operator));
}
main().catch((e) => { console.error(e); process.exit(1); });
