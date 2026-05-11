import { ethers } from "hardhat";

async function main() {
  const wallets = [
    { name: "operator", key: "PRIVATE_KEY" },
    { name: "alice   ", key: "ALICE_PRIVATE_KEY" },
    { name: "bob     ", key: "BOB_PRIVATE_KEY" },
    { name: "carol   ", key: "CAROL_PRIVATE_KEY" },
  ];

  const usdc = await ethers.getContractAt(
    "CCMSandboxUSDC",
    "0x87D1726B81095257A9ed70Aa1e67AA740bE485B6",
  );
  const ccm = await ethers.getContractAt(
    "CCMToken",
    "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD",
  );

  for (const w of wallets) {
    const wallet = new ethers.Wallet(process.env[w.key]!, ethers.provider);
    const eth = await ethers.provider.getBalance(wallet.address);
    const usdcBal = await usdc.balanceOf(wallet.address);
    const ccmBal = await ccm.balanceOf(wallet.address);
    console.log(
      `${w.name} ${wallet.address}` +
      `  ETH: ${ethers.formatEther(eth).slice(0, 8)}` +
      `  USDC: ${(Number(usdcBal) / 1e6).toFixed(2)}` +
      `  CCM: ${ethers.formatUnits(ccmBal, 18).slice(0, 12)}`,
    );
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
