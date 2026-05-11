import { ethers } from "hardhat";

const TIMELOCK = "0x3EbA7887525f1E68dc946760a96B01d1E1a1d979";
const TOKEN = "0xB5e54084eEFcc4ddc93F3A6AA7A6Dea501FB3999";
const ALICE = "0x" + "11".repeat(20);

async function main() {
  const timelock = await ethers.getContractAt("CCMTimelock", TIMELOCK);
  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const MINTER_ROLE = await token.MINTER_ROLE();

  // Pull recent CallScheduled events
  const filter = timelock.filters.CallScheduled();
  const events = await timelock.queryFilter(filter, -2000); // last ~2000 blocks
  console.log(`Found ${events.length} CallScheduled event(s)`);
  for (const ev of events) {
    const a = ev.args;
    console.log("  id:", a[0]);
    console.log("    target:", a[2]);
    console.log("    delay :", a[6].toString(), "s");
    const ts = await timelock.getTimestamp(a[0]);
    const pending = await timelock.isOperationPending(a[0]);
    console.log("    timestamp:", ts.toString(), "· pending:", pending);
    if (ts > 0n) {
      console.log("    ready at:", new Date(Number(ts) * 1000).toISOString());
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
