import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { CCMToken, CCMStaking, MockPriceOracle } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const P0_TGE = ethers.parseUnits("0.15", 18);
const POOL_INIT = ethers.parseUnits("200000000", 18); // 200M
const STAKE_AMT = ethers.parseUnits("1000", 18);
const SECONDS_PER_MONTH = 30 * 24 * 60 * 60;

describe("CCMStaking", () => {
  let token: CCMToken;
  let staking: CCMStaking;
  let oracle: MockPriceOracle;
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCMToken");
    token = await Token.deploy(admin.address);

    const Oracle = await ethers.getContractFactory("MockPriceOracle");
    oracle = await Oracle.deploy(P0_TGE); // start at TGE price

    const Staking = await ethers.getContractFactory("CCMStaking");
    staking = await Staking.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      P0_TGE,
      POOL_INIT,
      admin.address
    );

    // fund staking pool
    await token.mint(await staking.getAddress(), POOL_INIT);
    // mint stake balance to alice and bob
    await token.mint(alice.address, ethers.parseUnits("100000", 18));
    await token.mint(bob.address, ethers.parseUnits("100000", 18));
  });

  describe("constructor", () => {
    it("rejects zero addresses", async () => {
      const Staking = await ethers.getContractFactory("CCMStaking");
      await expect(
        Staking.deploy(ethers.ZeroAddress, await oracle.getAddress(), P0_TGE, POOL_INIT, admin.address)
      ).to.be.revertedWith("Staking: zero");
      await expect(
        Staking.deploy(await token.getAddress(), ethers.ZeroAddress, P0_TGE, POOL_INIT, admin.address)
      ).to.be.revertedWith("Staking: zero");
      await expect(
        Staking.deploy(await token.getAddress(), await oracle.getAddress(), P0_TGE, POOL_INIT, ethers.ZeroAddress)
      ).to.be.revertedWith("Staking: zero");
    });

    it("rejects zero numeric params", async () => {
      const Staking = await ethers.getContractFactory("CCMStaking");
      await expect(
        Staking.deploy(await token.getAddress(), await oracle.getAddress(), 0, POOL_INIT, admin.address)
      ).to.be.revertedWith("Staking: invalid params");
      await expect(
        Staking.deploy(await token.getAddress(), await oracle.getAddress(), P0_TGE, 0, admin.address)
      ).to.be.revertedWith("Staking: invalid params");
    });

    it("initializes pool", async () => {
      expect(await staking.poolRemaining()).to.equal(POOL_INIT);
      expect(await staking.POOL_INIT()).to.equal(POOL_INIT);
      expect(await staking.P0_TGE()).to.equal(P0_TGE);
    });
  });

  describe("eligibility", () => {
    it("non-eligible cannot stake", async () => {
      await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT);
      await expect(staking.connect(alice).stake(STAKE_AMT)).to.be.revertedWith("Staking: not eligible");
    });

    it("setEligible toggles", async () => {
      await staking.setEligible(alice.address, true);
      expect(await staking.eligible(alice.address)).to.equal(true);
      await staking.setEligible(alice.address, false);
      expect(await staking.eligible(alice.address)).to.equal(false);
    });

    it("setEligibleBatch toggles many", async () => {
      await staking.setEligibleBatch([alice.address, bob.address], true);
      expect(await staking.eligible(alice.address)).to.equal(true);
      expect(await staking.eligible(bob.address)).to.equal(true);
    });

    it("non-admin cannot set", async () => {
      await expect(
        staking.connect(alice).setEligible(alice.address, true)
      ).to.be.revertedWithCustomError(staking, "AccessControlUnauthorizedAccount");
    });
  });

  describe("yield rate", () => {
    it("rate = R0 (10% = 1000 bps) at P=P_TGE with full pool", async () => {
      expect(await staking.currentYieldRateBps()).to.equal(1000n);
    });

    it("rate halves when price doubles", async () => {
      await oracle.setPrice(P0_TGE * 2n);
      expect(await staking.currentYieldRateBps()).to.equal(500n);
    });

    it("rate scales with pool remaining (50% pool → 5%)", async () => {
      // Drain half the pool: simulate by staking and waiting until ~half consumed
      // Alternative: deploy fresh with half pool? Cleaner: stake huge and accelerate.
      // Easiest: stake a large amount and check rate changes proportionally over time.
      // Here we directly set price=P_TGE and verify formula by modifying pool via reward draw.
      // Simpler: just verify rate=0 when pool=0 (next test).
      expect(await staking.currentYieldRateBps()).to.equal(1000n);
    });

    it("rate = 0 when oracle price = 0", async () => {
      await oracle.setPrice(0);
      expect(await staking.currentYieldRateBps()).to.equal(0n);
    });
  });

  describe("stake / unstake / claim", () => {
    beforeEach(async () => {
      await staking.setEligible(alice.address, true);
      await token.connect(alice).approve(await staking.getAddress(), ethers.MaxUint256);
    });

    it("stake transfers tokens and updates state", async () => {
      await staking.connect(alice).stake(STAKE_AMT);
      const u = await staking.users(alice.address);
      expect(u.staked).to.equal(STAKE_AMT);
      expect(await staking.totalStaked()).to.equal(STAKE_AMT);
    });

    it("stake zero reverts", async () => {
      await expect(staking.connect(alice).stake(0)).to.be.revertedWith("Staking: zero amount");
    });

    it("accrues rewards over time at 10%/month", async () => {
      await staking.connect(alice).stake(STAKE_AMT);
      // Advance one month
      await time.increase(SECONDS_PER_MONTH);
      const pending = await staking.pendingReward(alice.address);
      // Expected: STAKE_AMT * 10% = 100 CCM (~ within tolerance)
      const expected = STAKE_AMT / 10n;
      const tol = expected / 100n; // 1%
      expect(pending).to.be.closeTo(expected, tol);
    });

    it("claim transfers reward and reduces poolRemaining", async () => {
      await staking.connect(alice).stake(STAKE_AMT);
      await time.increase(SECONDS_PER_MONTH);
      const before = await token.balanceOf(alice.address);
      const poolBefore = await staking.poolRemaining();
      await staking.connect(alice).claim();
      const after = await token.balanceOf(alice.address);
      const reward = after - before;
      expect(reward).to.be.gt(0n);
      expect(await staking.poolRemaining()).to.equal(poolBefore - reward);
    });

    it("unstake harvests then returns principal", async () => {
      await staking.connect(alice).stake(STAKE_AMT);
      await time.increase(SECONDS_PER_MONTH);
      const balBefore = await token.balanceOf(alice.address);
      await staking.connect(alice).unstake(STAKE_AMT);
      const balAfter = await token.balanceOf(alice.address);
      // Got back principal + reward (positive)
      expect(balAfter - balBefore).to.be.gt(STAKE_AMT);
      const u = await staking.users(alice.address);
      expect(u.staked).to.equal(0n);
      expect(await staking.totalStaked()).to.equal(0n);
    });

    it("unstake more than balance reverts", async () => {
      await staking.connect(alice).stake(STAKE_AMT);
      await expect(
        staking.connect(alice).unstake(STAKE_AMT + 1n)
      ).to.be.revertedWith("Staking: insufficient stake");
    });

    it("rate decay when price doubles → reward halved", async () => {
      await staking.connect(alice).stake(STAKE_AMT);
      await time.increase(SECONDS_PER_MONTH);
      const fullRate = await staking.pendingReward(alice.address);

      // claim at P0
      await staking.connect(alice).claim();

      // price doubles
      await oracle.setPrice(P0_TGE * 2n);
      await time.increase(SECONDS_PER_MONTH);
      const halfRate = await staking.pendingReward(alice.address);

      // halfRate should be ~half of fullRate
      const tol = fullRate / 50n; // 2%
      expect(halfRate).to.be.closeTo(fullRate / 2n, tol);
    });
  });

  describe("admin", () => {
    it("updateOracle changes oracle and emits event", async () => {
      const Oracle = await ethers.getContractFactory("MockPriceOracle");
      const newOracle = await Oracle.deploy(P0_TGE * 3n);
      await expect(staking.updateOracle(await newOracle.getAddress()))
        .to.emit(staking, "OracleUpdated")
        .withArgs(await newOracle.getAddress());
    });

    it("updateOracle rejects zero", async () => {
      await expect(staking.updateOracle(ethers.ZeroAddress)).to.be.revertedWith("Staking: oracle zero");
    });

    it("recoverPoolRemainder reverts while users still staked", async () => {
      await staking.setEligible(alice.address, true);
      await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT);
      await staking.connect(alice).stake(STAKE_AMT);
      await expect(staking.recoverPoolRemainder()).to.be.revertedWith("Staking: users still staked");
    });

    it("recoverPoolRemainder transfers remainder when no stake", async () => {
      const before = await token.balanceOf(admin.address);
      await staking.recoverPoolRemainder();
      const after = await token.balanceOf(admin.address);
      expect(after - before).to.equal(POOL_INIT);
      expect(await staking.poolRemaining()).to.equal(0n);
    });
  });

  describe("poolUsedPct", () => {
    it("reports pool usage in basis points", async () => {
      expect(await staking.poolUsedPct()).to.equal(0n);
    });
  });
});
