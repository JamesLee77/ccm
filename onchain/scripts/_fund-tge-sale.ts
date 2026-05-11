/**
 * Fund the testnet rehearsal CCMTGESale with CCM tokens so rounds can
 * actually be purchased + claimed end-to-end. Mints from the sandbox
 * CCMToken (deployer holds MINTER_ROLE).
 */
import { ethers } from "hardhat";

const SALE = "0x487eb25aBE20C85d55695eBD0eA2275C5bdD1745";
const CCM_TOKEN = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD";
const AMOUNT_CCM = 10_000_000n; // 10M whole CCM

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453n) throw new Error("REFUSED: testnet-only script");
  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);

  const token = await ethers.getContractAt("CCMToken", CCM_TOKEN);
  const amtAtoms = AMOUNT_CCM * 10n ** 18n;
  console.log(`\nMinting ${AMOUNT_CCM.toLocaleString()} CCM (${amtAtoms} atoms) to sale ${SALE}…`);
  const tx = await token.mint(SALE, amtAtoms);
  console.log("  tx:", tx.hash);
  await tx.wait();

  // Verify
  const bal = await token.balanceOf(SALE);
  console.log(`\n✅ Sale CCM balance: ${(bal / 10n ** 18n).toString()} CCM`);
}

main().catch((e) => { console.error(e); process.exit(1); });
