import { ethers } from "hardhat";
async function main() {
  const [s] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  const bal = await ethers.provider.getBalance(s.address);
  const feeData = await ethers.provider.getFeeData();
  console.log("network               :", net.name, "chainId", net.chainId.toString());
  console.log("signer (from key)     :", s.address);
  console.log("MAINNET_ADMIN_ADDRESS :", process.env.MAINNET_ADMIN_ADDRESS);
  console.log("balance               :", ethers.formatEther(bal), "ETH");
  console.log("gas price             :", feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "n/a");
  if (net.chainId !== 8453n) throw new Error("not on Base mainnet");
  if (s.address.toLowerCase() !== (process.env.MAINNET_ADMIN_ADDRESS || "").toLowerCase()) {
    throw new Error(`signer ${s.address} != MAINNET_ADMIN_ADDRESS ${process.env.MAINNET_ADMIN_ADDRESS}`);
  }
  console.log("\n✓ signer derived from MAINNET_PRIVATE_KEY matches MAINNET_ADMIN_ADDRESS");
}
main().catch((e) => { console.error(e); process.exit(1); });
