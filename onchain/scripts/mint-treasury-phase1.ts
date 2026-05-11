/**
 * Mint a parameterized amount of CCM to a treasury address.
 *
 * Phase 1 only: assumes deployer EOA still holds MINTER_ROLE (no Timelock yet).
 * For Phase 2+ this becomes a Safe → Timelock scheduled call (use a different script).
 *
 * Required env:
 *   CCM_TOKEN          - already-deployed CCMToken address
 *   TREASURY_ADDRESS   - recipient (a Treasury EOA, separate from deployer)
 *
 * Optional env:
 *   AMOUNT_CCM         - amount in whole CCM (default: 10000000)
 *   ALLOW_TESTNET      - set to "1" to permit chainId other than 8453 (Sepolia rehearsal only)
 *
 * Run on mainnet:
 *   CCM_TOKEN=0x... TREASURY_ADDRESS=0x... \
 *     npx hardhat run scripts/mint-treasury-phase1.ts --network base
 *
 * Run on Sepolia rehearsal (with override + small amount):
 *   CCM_TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
 *   TREASURY_ADDRESS=0x... AMOUNT_CCM=10 ALLOW_TESTNET=1 \
 *     npx hardhat run scripts/mint-treasury-phase1.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const TOKEN = process.env.CCM_TOKEN;
  const TREASURY_RAW = process.env.TREASURY_ADDRESS;
  const ALLOW_TESTNET = process.env.ALLOW_TESTNET === "1";

  let AMOUNT_CCM: bigint;
  try {
    AMOUNT_CCM = BigInt(process.env.AMOUNT_CCM ?? "10000000");
  } catch {
    throw new Error(`AMOUNT_CCM is not a valid integer: "${process.env.AMOUNT_CCM}"`);
  }
  if (AMOUNT_CCM <= 0n) {
    throw new Error(`AMOUNT_CCM must be > 0 (got ${AMOUNT_CCM})`);
  }

  if (!TOKEN || !ethers.isAddress(TOKEN)) {
    throw new Error("CCM_TOKEN env var (valid address) required");
  }
  if (!TREASURY_RAW || !ethers.isAddress(TREASURY_RAW)) {
    throw new Error("TREASURY_ADDRESS env var (valid address) required");
  }
  const TREASURY = ethers.getAddress(TREASURY_RAW); // EIP-55 normalisation
  if (TREASURY === ethers.ZeroAddress) {
    throw new Error("TREASURY_ADDRESS must not be the zero address");
  }

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 8453n && !ALLOW_TESTNET) {
    throw new Error(
      `Refusing to run: chainId is ${network.chainId} (expected 8453 = Base mainnet). ` +
      `Set ALLOW_TESTNET=1 to override (Sepolia rehearsal only).`
    );
  }

  const [deployer] = await ethers.getSigners();
  const token = await ethers.getContractAt("CCMToken", TOKEN);

  const MINTER_ROLE = await token.MINTER_ROLE();
  const hasMinter = await token.hasRole(MINTER_ROLE, deployer.address);
  if (!hasMinter) {
    throw new Error(`Deployer ${deployer.address} does not hold MINTER_ROLE on ${TOKEN}`);
  }

  const amountWei = AMOUNT_CCM * 10n ** 18n;
  const supplyBefore = await token.totalSupply();
  const cap = await token.cap();
  if (supplyBefore + amountWei > cap) {
    throw new Error(
      `Mint would exceed cap: supply ${supplyBefore} + amount ${amountWei} > cap ${cap}`
    );
  }

  console.log("=".repeat(70));
  console.log("MINT TREASURY (Phase 1)");
  console.log("  Network             :", network.name, "chainId", network.chainId.toString());
  console.log("  Token               :", TOKEN);
  console.log("  Deployer            :", deployer.address);
  console.log("  Treasury            :", TREASURY);
  console.log("  Amount              :", AMOUNT_CCM.toString(), "CCM");
  console.log("  Amount wei          :", amountWei.toString());
  console.log("  Supply now          :", ethers.formatUnits(supplyBefore, 18), "CCM");
  console.log("  Cap                 :", ethers.formatUnits(cap, 18), "CCM");
  console.log("  Cap left after mint :", ethers.formatUnits(cap - supplyBefore - amountWei, 18), "CCM");
  console.log("=".repeat(70));
  console.log("Sending in 10 seconds. Ctrl-C to abort.");
  await new Promise((r) => setTimeout(r, 10_000));

  const tx = await token.mint(TREASURY, amountWei);
  console.log("\nMint tx:", tx.hash);
  // Wait 2 confirmations so the RPC has time to re-index before we read state.
  const receipt = await tx.wait(2);
  if (!receipt) {
    throw new Error("tx.wait() returned null — receipt not confirmed; aborting before post-mint asserts");
  }
  console.log("Mined in block", receipt.blockNumber);

  const supplyAfter = await token.totalSupply();
  const treasuryBal = await token.balanceOf(TREASURY);
  console.log("\nPost-mint state:");
  console.log("  Treasury balance:", ethers.formatUnits(treasuryBal, 18), "CCM");
  console.log("  Total supply    :", ethers.formatUnits(supplyAfter, 18), "CCM");

  if (treasuryBal < amountWei) {
    throw new Error(`Treasury balance ${treasuryBal} < amount ${amountWei}`);
  }
  if (supplyAfter !== supplyBefore + amountWei) {
    throw new Error(`Supply diff mismatch: ${supplyAfter - supplyBefore} != ${amountWei}`);
  }

  console.log("\n✓ Success");
}

main().catch((e) => { console.error(e); process.exit(1); });
