/**
 * End-to-end integration tests covering realistic user journeys.
 * Validates that all four contracts work together as designed in
 * CCM_Token_Design.md Section 4 (Architecture diagram).
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import {
  CCMToken, CCMVesting, CCMStaking, CCMTGESale, MockUSDC, MockPriceOracle,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const ONE_DAY = 24 * 60 * 60;
const ONE_YEAR = 365 * ONE_DAY;
const SECONDS_PER_MONTH = 30 * ONE_DAY;
const TOTAL_SUPPLY = ethers.parseUnits("5000000000", 18);
const POOL_INIT = ethers.parseUnits("200000000", 18);
const SEED_HARDCAP = ethers.parseUnits("70000000", 18);
const SEED_PRICE_USDC = ethers.parseUnits("0.15", 6);
const P0_TGE = ethers.parseUnits("0.15", 18);

describe("Integration — full TGE → Vesting → Staking flow", () => {
  let token: CCMToken;
  let vesting: CCMVesting;
  let staking: CCMStaking;
  let tge: CCMTGESale;
  let usdc: MockUSDC;
  let oracle: MockPriceOracle;

  let admin: HardhatEthersSigner;
  let foundationAcc: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, foundationAcc, buyer] = await ethers.getSigners();

    // Deploy core
    const Token = await ethers.getContractFactory("CCMToken");
    token = await Token.deploy(admin.address);
    await token.mint(admin.address, TOTAL_SUPPLY);

    const USDC = await ethers.getContractFactory("MockUSDC");
    usdc = await USDC.deploy();

    const Oracle = await ethers.getContractFactory("MockPriceOracle");
    oracle = await Oracle.deploy(P0_TGE);

    const Vesting = await ethers.getContractFactory("CCMVesting");
    vesting = await Vesting.deploy(await token.getAddress(), admin.address);

    const Staking = await ethers.getContractFactory("CCMStaking");
    staking = await Staking.deploy(
      await token.getAddress(), await oracle.getAddress(),
      P0_TGE, POOL_INIT, admin.address
    );

    const TGE = await ethers.getContractFactory("CCMTGESale");
    tge = await TGE.deploy(await token.getAddress(), await usdc.getAddress(), admin.address);

    // Fund staking & TGE per design
    await token.transfer(await staking.getAddress(), POOL_INIT);
    await token.transfer(await tge.getAddress(), SEED_HARDCAP);
  });

  it("Foundation vesting: schedule creation → cliff wait → linear release", async () => {
    // Allocate 750M to Foundation with 1y cliff + 4y total vest (per BRD §2.2)
    const FOUNDATION_TOTAL = ethers.parseUnits("750000000", 18);
    await token.transfer(await vesting.getAddress(), FOUNDATION_TOTAL);
    const start = await time.latest();
    await vesting.createSchedule(
      foundationAcc.address, FOUNDATION_TOTAL, start, ONE_YEAR, 4 * ONE_YEAR, false
    );

    // Before cliff: nothing
    expect(await vesting.releasable(0)).to.equal(0n);

    // Halfway (2 years): ~50%
    await time.increase(2 * ONE_YEAR);
    const half = await vesting.releasable(0);
    expect(half).to.be.closeTo(FOUNDATION_TOTAL / 2n, FOUNDATION_TOTAL / 100n);

    // Release
    await vesting.connect(foundationAcc).release(0);
    expect(await token.balanceOf(foundationAcc.address)).to.be.gte(half);
  });

  it("End-to-end: buyer wins TGE → cliff → claim → stake → reward → unstake", async () => {
    // 1) Create Seed round
    const now = await time.latest();
    await tge.createRound(
      "Seed", SEED_PRICE_USDC, SEED_HARDCAP,
      ONE_YEAR /*cliff*/, 3 * ONE_YEAR /*total vest*/,
      now, now + 60 * ONE_DAY
    );
    await tge.setWhitelist(0, buyer.address, true);

    // 2) Buyer purchases 1000 CCM with USDC
    await usdc.mint(buyer.address, ethers.parseUnits("1000", 6));
    await usdc.connect(buyer).approve(await tge.getAddress(), ethers.MaxUint256);
    const buyAmt = ethers.parseUnits("1000", 18);
    await tge.connect(buyer).purchase(0, buyAmt);

    // Before cliff, nothing claimable
    expect(await tge.claimable(0, buyer.address)).to.equal(0n);

    // 3) Wait 2 years (after cliff, halfway through vest)
    await time.increase(2 * ONE_YEAR);
    const claimable = await tge.claimable(0, buyer.address);
    expect(claimable).to.be.closeTo(buyAmt * 2n / 3n, buyAmt / 100n);
    await tge.connect(buyer).claim(0);
    const claimed = await token.balanceOf(buyer.address);
    // claim() advances block.timestamp by ~1s, so actual claimed is slightly more than view-snapshot
    expect(claimed).to.be.gte(claimable);
    expect(claimed - claimable).to.be.lt(ethers.parseUnits("1", 18)); // diff < 1 CCM

    // 4) Buyer is staking-eligible → stake the claimed tokens
    await staking.setEligible(buyer.address, true);
    await token.connect(buyer).approve(await staking.getAddress(), claimed);
    await staking.connect(buyer).stake(claimed);
    expect((await staking.users(buyer.address)).staked).to.equal(claimed);

    // 5) Wait one month and claim staking reward
    await time.increase(SECONDS_PER_MONTH);
    const balBeforeReward = await token.balanceOf(buyer.address);
    await staking.connect(buyer).claim();
    const balAfterReward = await token.balanceOf(buyer.address);
    const reward = balAfterReward - balBeforeReward;
    expect(reward).to.be.gt(0n);
    // Approximate: 10% of claimed for 1 month, slightly less due to pool decay
    const expectedRewardCeiling = claimed / 10n;
    expect(reward).to.be.lte(expectedRewardCeiling + (expectedRewardCeiling / 100n));

    // 6) Unstake fully
    await staking.connect(buyer).unstake(claimed);
    expect((await staking.users(buyer.address)).staked).to.equal(0n);
    // Buyer now holds principal + reward
    expect(await token.balanceOf(buyer.address)).to.be.gte(claimed + reward);
  });

  it("Treasury buyback-burn (FR-5.1/2): admin burns CCM, totalSupply drops", async () => {
    const beforeSupply = await token.totalSupply();
    const burnAmt = ethers.parseUnits("1000000", 18); // 1M
    // Admin burns from own holdings (simulates after market buyback)
    await token.connect(admin).burn(burnAmt);
    expect(await token.totalSupply()).to.equal(beforeSupply - burnAmt);
  });

  it("Pause halts all transfers across user actions but admin emergency works", async () => {
    // Setup: user has tokens
    await token.transfer(buyer.address, ethers.parseUnits("100", 18));
    // Pause
    await token.pause();
    // User cannot transfer
    await expect(
      token.connect(buyer).transfer(foundationAcc.address, 1n)
    ).to.be.revertedWithCustomError(token, "EnforcedPause");
    // Even mint should fail (mint goes through _update which is paused)
    await expect(
      token.mint(buyer.address, 1n)
    ).to.be.revertedWithCustomError(token, "EnforcedPause");
    // Unpause restores
    await token.unpause();
    await token.connect(buyer).transfer(foundationAcc.address, 1n);
    expect(await token.balanceOf(foundationAcc.address)).to.equal(1n);
  });
});
