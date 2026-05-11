import { ethers } from "hardhat";
async function main() {
  const usdc = await ethers.getContractAt(
    "CCMSandboxUSDC", "0x87D1726B81095257A9ed70Aa1e67AA740bE485B6",
  );
  for (const [name, key] of [
    ["operator", "PRIVATE_KEY"],
    ["alice   ", "ALICE_PRIVATE_KEY"],
    ["bob     ", "BOB_PRIVATE_KEY"],
    ["carol   ", "CAROL_PRIVATE_KEY"],
  ] as const) {
    const w = new ethers.Wallet(process.env[key]!, ethers.provider);
    const cd = await usdc.cooldownRemaining(w.address);
    const bal = await usdc.balanceOf(w.address);
    console.log(`${name}  cooldown: ${cd.toString().padStart(6)}s  balance: ${(Number(bal) / 1e6).toFixed(2)} USDC`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
