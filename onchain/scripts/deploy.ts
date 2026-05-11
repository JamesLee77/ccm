/**
 * CCM Smart Contract Deployment Script (Hardhat)
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network base-sepolia
 *   npx hardhat run scripts/deploy.ts --network base-mainnet
 *
 * Required env:
 *   ADMIN_ADDRESS         : multisig or owner EOA
 *   USDC_ADDRESS          : Base USDC address
 *   PRICE_ORACLE_ADDRESS  : project price oracle (Chainlink or custom)
 */
import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  const ADMIN  = process.env.ADMIN_ADDRESS!;
  const USDC   = process.env.USDC_ADDRESS!;
  const ORACLE = process.env.PRICE_ORACLE_ADDRESS!;

  console.log("Deploying CCM token system...");
  console.log("  Admin :", ADMIN);
  console.log("  USDC  :", USDC);
  console.log("  Oracle:", ORACLE);

  // ---------- 1. Deploy CCMToken ----------
  const Token = await ethers.getContractFactory("CCMToken");
  const token = await Token.deploy(ADMIN);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("\n[1/4] CCMToken deployed:", tokenAddr);

  // Mint 5B to admin (one-shot)
  const totalSupply = parseUnits("5000000000", 18);
  await (await token.mint(ADMIN, totalSupply)).wait();
  console.log("       Minted 5,000,000,000 CCM to admin");

  // ---------- 2. Deploy CCMVesting ----------
  const Vesting = await ethers.getContractFactory("CCMVesting");
  const vesting = await Vesting.deploy(tokenAddr, ADMIN);
  await vesting.waitForDeployment();
  const vestAddr = await vesting.getAddress();
  console.log("\n[2/4] CCMVesting deployed:", vestAddr);

  // Transfer Foundation/Partners/etc tokens to vesting contract
  // Then create schedules (admin will do this off-line)

  // ---------- 3. Deploy CCMStaking ----------
  const P0_TGE = parseUnits("0.15", 18);                    // $0.15
  const POOL_INIT = parseUnits("200000000", 18);            // 200M
  const Staking = await ethers.getContractFactory("CCMStaking");
  const staking = await Staking.deploy(tokenAddr, ORACLE, P0_TGE, POOL_INIT, ADMIN);
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log("\n[3/4] CCMStaking deployed:", stakingAddr);

  // Transfer 200M reward pool to staking contract
  await (await token.transfer(stakingAddr, POOL_INIT)).wait();
  console.log("       Funded staking pool with 200M CCM");

  // ---------- 4. Deploy CCMTGESale ----------
  const TGE = await ethers.getContractFactory("CCMTGESale");
  const tge = await TGE.deploy(tokenAddr, USDC, ADMIN);
  await tge.waitForDeployment();
  const tgeAddr = await tge.getAddress();
  console.log("\n[4/4] CCMTGESale deployed:", tgeAddr);

  // Create Seed round @ $0.15
  const SEED_TOKENS = parseUnits("70000000", 18);           // 70M
  const SEED_PRICE  = parseUnits("0.15", 6);                // 0.15 USDC (6d)
  const SEED_CLIFF  = 365 * 24 * 60 * 60;                   // 12 months
  const SEED_VEST   = 36 * 30 * 24 * 60 * 60;               // 36 months total
  const now = Math.floor(Date.now() / 1000);
  await (await tge.createRound(
    "Seed",
    SEED_PRICE,
    SEED_TOKENS,
    SEED_CLIFF,
    SEED_VEST,
    now,
    now + 60 * 24 * 60 * 60      // 60-day window
  )).wait();
  console.log("       Created Seed round (70M @ $0.15)");

  // Create Series A round @ $0.20
  const SA_TOKENS = parseUnits("130000000", 18);            // 130M
  const SA_PRICE  = parseUnits("0.20", 6);                  // 0.20 USDC
  const SA_CLIFF  = 180 * 24 * 60 * 60;                     // 6 months
  const SA_VEST   = 18 * 30 * 24 * 60 * 60;                 // 18 months total
  await (await tge.createRound(
    "Series A",
    SA_PRICE,
    SA_TOKENS,
    SA_CLIFF,
    SA_VEST,
    now + 30 * 24 * 60 * 60,     // start 30 days later
    now + 120 * 24 * 60 * 60     // 90-day window
  )).wait();
  console.log("       Created Series A round (130M @ $0.20)");

  // Transfer 200M (70M + 130M) to TGE contract for sale
  await (await token.transfer(tgeAddr, SEED_TOKENS + SA_TOKENS)).wait();
  console.log("       Funded TGE contract with 200M CCM");

  // ---------- Summary ----------
  console.log("\n========== DEPLOYMENT COMPLETE ==========");
  console.log("CCMToken    :", tokenAddr);
  console.log("CCMVesting  :", vestAddr);
  console.log("CCMStaking  :", stakingAddr);
  console.log("CCMTGESale  :", tgeAddr);
  console.log("\nNext steps:");
  console.log("  1. Setup Vesting schedules for Foundation/Partners/Marketing");
  console.log("  2. Add KYC-approved investors to the TGE and Staking whitelists");
  console.log("  3. Verify all 4 contracts on BaseScan");
  console.log("  4. Setup multisig timelock for admin role");
}

main().catch((e) => { console.error(e); process.exit(1); });
