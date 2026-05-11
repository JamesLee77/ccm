import { ethers } from "hardhat";
const SALE = "0x487eb25aBE20C85d55695eBD0eA2275C5bdD1745";
const CCM_TOKEN = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD";

async function main() {
  const token = await ethers.getContractAt("CCMToken", CCM_TOKEN);
  const bal = await token.balanceOf(SALE);
  console.log(`Sale CCM balance: ${ethers.formatUnits(bal, 18)} CCM (raw: ${bal})`);
  const ts = await token.totalSupply();
  console.log(`Token totalSupply: ${ethers.formatUnits(ts, 18)} CCM`);
}
main().catch((e) => { console.error(e); process.exit(1); });
