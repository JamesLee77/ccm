import { ethers } from "hardhat";
async function main() {
  const [d] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(d.address);
  console.log("Deployer:", d.address);
  console.log("Balance :", ethers.formatEther(bal), "ETH");
}
main().catch((e) => { console.error(e); process.exit(1); });
