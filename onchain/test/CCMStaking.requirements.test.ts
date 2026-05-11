/**
 * Requirements-driven TDD tests for CCMStaking.
 * Targets uncovered branches: FR-4.4 cap, FR-4.5 pool exhaustion, _harvest paths.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { CCMToken, CCMStaking, MockPriceOracle } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const P0_TGE = ethers.parseUnits("0.15", 18);
const POOL_INIT_BIG = ethers.parseUnits("200000000", 18);
const SECONDS_PER_MONTH = 30 * 24 * 60 * 60;

describe("CCMStaking — Requirements", () => {
  let token: CCMToken;
  let staking: CCMStaking;
  let oracle: MockPriceOracle;
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;

  async function deploy(poolInit: bigint = POOL_INIT_BIG) {
    const Token = await ethers.getContractFactory("CCMToken");
    token = await Token.deploy(admin.address);
    const Oracle = await ethers.getContractFactory("MockPriceOracle");
    oracle = await Oracle.deploy(P0_TGE);
    const Staking = await ethers.getContractFactory("CCMStaking");
    staking = await Staking.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      P0_TGE,
      poolInit,
      admin.address
    );
    await token.mint(await staking.getAddress(), poolInit);
    await token.mint(alice.address, ethers.parseUnits("1000000", 18));
    await token.connect(alice).approve(await staking.getAddress(), ethers.MaxUint256);
    await staking.setEligible(alice.address, true);
  }

  beforeEach(async () => {
    [admin, alice] = await ethers.getSigners();
  });

  describe("FR-4.4 yield rate cap when P < P_TGE", () => {
    it("rate stays at R0 (10%) when price drops below P_TGE", async () => {
      // priceFactor would be > 1, but cap at R0_BPS = 1000
      await deploy();
      await oracle.setPrice(P0_TGE / 2n); // price 0.075 → priceFactor = 2 → uncapped rate = 20%
      const rate = await staking.currentYieldRateBps();
      expect(rate).to.equal(1000n); // capped at 10%
    });
  });

  describe("FR-4.5 pool exhaustion → yield = 0", () => {
    it("returns 0 once poolRemaining hits zero (poolRemaining branch)", async () => {
      // Use tiny pool so we can drain it predictably
      const tinyPool = ethers.parseUnits("100", 18);
      await deploy(tinyPool);
      await staking.connect(alice).stake(ethers.parseUnits("100000", 18));
      // Run pool to zero by waiting long enough that pendingReward >= poolRemaining
      // Then claim — the _harvest will cap at poolRemaining and drain it.
      await time.increase(SECONDS_PER_MONTH * 12); // way more than enough
      await staking.connect(alice).claim();
      expect(await staking.poolRemaining()).to.equal(0n);
      // Now yield rate must be 0
      expect(await staking.currentYieldRateBps()).to.equal(0n);
    });

    it("pendingReward caps at poolRemaining (prevents over-payment)", async () => {
      const tinyPool = ethers.parseUnits("10", 18);
      await deploy(tinyPool);
      await staking.connect(alice).stake(ethers.parseUnits("1000000", 18));
      await time.increase(SECONDS_PER_MONTH * 12);
      const pending = await staking.pendingReward(alice.address);
      // Should be capped at the tiny pool, not theoretical reward
      expect(pending).to.be.lte(tinyPool);
    });
  });

  describe("FR-4.6 _harvest u.staked = 0 path", () => {
    it("first stake sets lastUpdate, no reward (u.staked == 0 branch)", async () => {
      await deploy();
      const tx = await staking.connect(alice).stake(ethers.parseUnits("100", 18));
      // No RewardClaimed event fired on first stake (pendingReward == 0)
      await expect(tx).not.to.emit(staking, "RewardClaimed");
      const u = await staking.users(alice.address);
      expect(u.lastUpdate).to.be.gt(0n);
    });
  });

  describe("FR-4.5 pool factor scaling", () => {
    it("rate scales linearly with poolRemaining/POOL_INIT", async () => {
      // Use larger pool so we can measure half-drain
      const pool = ethers.parseUnits("100", 18);
      await deploy(pool);
      // Confirm full pool → 10% rate
      expect(await staking.currentYieldRateBps()).to.equal(1000n);

      // Drain ~half by staking large amount + time. Then check rate halved.
      await staking.connect(alice).stake(ethers.parseUnits("100000", 18));
      // Move time so pendingReward ≈ 50 (half of pool)
      // pendingReward = staked × rate × elapsed / (BPS × month)
      //              = 100000 × 1000 × elapsed / (10000 × 2592000)
      //              = 100000 × elapsed / 25920000
      // Want pendingReward = 50 → elapsed = 50 × 25920000 / 100000 = 12960 seconds
      await time.increase(12960);
      await staking.connect(alice).claim();
      // pool should be ~50 remaining
      const left = await staking.poolRemaining();
      expect(left).to.be.lte(pool); // basic sanity
      // rate should be approximately (left / pool) × 1000 bps
      const rate = await staking.currentYieldRateBps();
      const expected = (left * 1000n) / pool;
      const tol = 50n; // 0.5% bps slack for time-rounding
      expect(rate).to.be.closeTo(expected, tol);
    });
  });

  describe("FR-4.6 reward never exceeds poolRemaining (state invariant)", () => {
    it("after over-large pendingReward, claim drains pool exactly", async () => {
      const pool = ethers.parseUnits("5", 18);
      await deploy(pool);
      await staking.connect(alice).stake(ethers.parseUnits("1000000", 18));
      await time.increase(SECONDS_PER_MONTH); // pendingReward >> pool
      const before = await token.balanceOf(alice.address);
      await staking.connect(alice).claim();
      const after = await token.balanceOf(alice.address);
      expect(after - before).to.equal(pool); // got exactly the remaining pool
      expect(await staking.poolRemaining()).to.equal(0n);
    });
  });
});
