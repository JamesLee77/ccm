/**
 * Targeted tests for previously-uncovered branches identified via
 * solidity-coverage lcov analysis. Each test references the file:line
 * of the branch it is exercising.
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
const P0_TGE = ethers.parseUnits("0.15", 18);
const POOL = ethers.parseUnits("200000000", 18);

describe("Branch coverage — uncovered paths", () => {
  let admin: HardhatEthersSigner, alice: HardhatEthersSigner, bob: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();
  });

  // ============================================================
  //  CCMToken
  // ============================================================
  describe("CCMToken", () => {
    let token: CCMToken;
    beforeEach(async () => {
      token = await (await ethers.getContractFactory("CCMToken")).deploy(admin.address);
    });

    // CCMToken.sol:61 — non-PAUSER cannot unpause (was only tested for pause)
    it("non-PAUSER cannot unpause", async () => {
      await token.pause();
      await expect(token.connect(alice).unpause()).to.be.revertedWithCustomError(
        token, "AccessControlUnauthorizedAccount"
      );
    });
  });

  // ============================================================
  //  CCMVesting
  // ============================================================
  describe("CCMVesting", () => {
    let token: CCMToken, vesting: CCMVesting;

    beforeEach(async () => {
      token = await (await ethers.getContractFactory("CCMToken")).deploy(admin.address);
    });

    // CCMVesting.sol:51 — constructor admin = 0 path of compound zero check
    it("constructor reverts on admin = 0 (compound check second branch)", async () => {
      const V = await ethers.getContractFactory("CCMVesting");
      await expect(
        V.deploy(await token.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("Vesting: zero addr");
    });

    it("constructor reverts on ccm = 0", async () => {
      const V = await ethers.getContractFactory("CCMVesting");
      await expect(
        V.deploy(ethers.ZeroAddress, admin.address)
      ).to.be.revertedWith("Vesting: zero addr");
    });

    // CCMVesting.sol:120 — releaseAll skips schedules where releasable = 0
    // (hits `if (amt > 0)` false branch). We use a future-cliff schedule + a
    // matured schedule to guarantee the revoked schedule contributes 0 here.
    it("releaseAll skips schedules with releasable = 0 silently", async () => {
      vesting = await (await ethers.getContractFactory("CCMVesting"))
        .deploy(await token.getAddress(), admin.address);
      await token.mint(await vesting.getAddress(), ethers.parseUnits("10000", 18));
      const start = await time.latest();
      // Schedule A: cliff = 100 years from start → releasable = 0 throughout test
      await vesting.createSchedule(alice.address, ethers.parseUnits("100", 18), start, 100 * ONE_YEAR, 100 * ONE_YEAR, false);
      // Schedule B: matures in 1 year
      await vesting.createSchedule(alice.address, ethers.parseUnits("200", 18), start, 0, ONE_YEAR, false);
      await time.increase(ONE_YEAR + 1);
      await vesting.connect(alice).releaseAll();
      // alice gets only schedule B (200), schedule A skipped via false branch
      expect(await token.balanceOf(alice.address)).to.equal(ethers.parseUnits("200", 18));
    });
  });

  // ============================================================
  //  CCMStaking
  // ============================================================
  describe("CCMStaking", () => {
    let token: CCMToken, staking: CCMStaking, oracle: MockPriceOracle;

    beforeEach(async () => {
      token = await (await ethers.getContractFactory("CCMToken")).deploy(admin.address);
      oracle = await (await ethers.getContractFactory("MockPriceOracle")).deploy(P0_TGE);
      staking = await (await ethers.getContractFactory("CCMStaking"))
        .deploy(await token.getAddress(), await oracle.getAddress(), P0_TGE, POOL, admin.address);
      await token.mint(await staking.getAddress(), POOL);
    });

    // CCMStaking.sol:128 — pendingReward returns 0 for user with staked = 0
    it("pendingReward returns 0 for user who has never staked", async () => {
      expect(await staking.pendingReward(alice.address)).to.equal(0n);
    });

    // CCMStaking.sol:130 — elapsed = 0 path (immediately after stake)
    it("pendingReward returns 0 immediately after stake (elapsed = 0)", async () => {
      await token.mint(alice.address, ethers.parseUnits("100", 18));
      await token.connect(alice).approve(await staking.getAddress(), ethers.MaxUint256);
      await staking.setEligible(alice.address, true);
      // disable auto-mining so stake and pendingReward query happen at the same block
      await ethers.provider.send("evm_setAutomine", [false]);
      await staking.connect(alice).stake(ethers.parseUnits("100", 18));
      await ethers.provider.send("evm_mine", []);
      // restore automining
      await ethers.provider.send("evm_setAutomine", [true]);
      // The `elapsed = block.timestamp - u.lastUpdate` will be 0 in same block
      expect(await staking.pendingReward(alice.address)).to.equal(0n);
    });

    // CCMStaking.sol:175 — unstake(0) reverts (zero amount branch)
    it("unstake(0) reverts with zero amount", async () => {
      await staking.setEligible(alice.address, true);
      await token.mint(alice.address, ethers.parseUnits("100", 18));
      await token.connect(alice).approve(await staking.getAddress(), ethers.MaxUint256);
      await staking.connect(alice).stake(ethers.parseUnits("100", 18));
      await expect(staking.connect(alice).unstake(0)).to.be.revertedWith("Staking: zero amount");
    });

    // CCMStaking.sol:92 — setEligibleBatch with empty array (loop never enters)
    it("setEligibleBatch with empty array succeeds (no-op)", async () => {
      await expect(staking.setEligibleBatch([], true)).not.to.be.reverted;
    });

    // CCMStaking.sol:185 — claim is a noop when no stake exists (u.staked == 0 branch in _harvest)
    it("claim() with no stake is a noop (no RewardClaimed event)", async () => {
      const tx = await staking.connect(alice).claim();
      await expect(tx).not.to.emit(staking, "RewardClaimed");
    });

    // CCMStaking.sol:92 — setEligibleBatch onlyRole negative
    it("non-admin cannot setEligibleBatch", async () => {
      await expect(
        staking.connect(alice).setEligibleBatch([bob.address], true)
      ).to.be.revertedWithCustomError(staking, "AccessControlUnauthorizedAccount");
    });

    // CCMStaking.sol:200 — recoverPoolRemainder onlyRole negative
    it("non-admin cannot recoverPoolRemainder", async () => {
      await expect(
        staking.connect(alice).recoverPoolRemainder()
      ).to.be.revertedWithCustomError(staking, "AccessControlUnauthorizedAccount");
    });

    // CCMStaking.sol:193 — updateOracle onlyRole negative
    it("non-admin cannot updateOracle", async () => {
      await expect(
        staking.connect(alice).updateOracle(await oracle.getAddress())
      ).to.be.revertedWithCustomError(staking, "AccessControlUnauthorizedAccount");
    });

    // CCMStaking.sol:158/172/185 — nonReentrant negative path via malicious ERC20
    it("nonReentrant blocks reentry via malicious token (stake → callback → stake)", async () => {
      const RT = await ethers.getContractFactory("ReentrantToken");
      const rt = await RT.deploy();
      // Deploy staking using the malicious token
      const reOracle = await (await ethers.getContractFactory("MockPriceOracle")).deploy(P0_TGE);
      const reStaking = await (await ethers.getContractFactory("CCMStaking")).deploy(
        await rt.getAddress(),
        await reOracle.getAddress(),
        P0_TGE,
        ethers.parseUnits("1000", 18),
        admin.address
      );
      // fund pool, fund alice, set eligible
      await rt.mint(await reStaking.getAddress(), ethers.parseUnits("1000", 18));
      await rt.mint(alice.address, ethers.parseUnits("1000", 18));
      await rt.connect(alice).approve(await reStaking.getAddress(), ethers.MaxUint256);
      await reStaking.setEligible(alice.address, true);
      // Arm the attack: token re-enters stake() on each transferFrom
      await rt.setTarget(await reStaking.getAddress());
      await rt.setAttack(true, 0); // mode 0 = re-stake
      // First stake triggers transferFrom → callback → second stake → blocked
      await expect(
        reStaking.connect(alice).stake(ethers.parseUnits("100", 18))
      ).to.be.revertedWithCustomError(reStaking, "ReentrancyGuardReentrantCall");
    });

    // CCMStaking.sol:146 — _harvest reward = 0 path (stake exists but pool drained)
    it("_harvest with stake but empty pool emits no RewardClaimed", async () => {
      // small pool, large stake
      const tinyOracle = await (await ethers.getContractFactory("MockPriceOracle")).deploy(P0_TGE);
      const tinyStaking = await (await ethers.getContractFactory("CCMStaking")).deploy(
        await token.getAddress(),
        await tinyOracle.getAddress(),
        P0_TGE,
        ethers.parseUnits("10", 18), // tiny pool
        admin.address
      );
      await token.mint(await tinyStaking.getAddress(), ethers.parseUnits("10", 18));
      await token.mint(alice.address, ethers.parseUnits("1000", 18));
      await token.connect(alice).approve(await tinyStaking.getAddress(), ethers.MaxUint256);
      await tinyStaking.setEligible(alice.address, true);
      await tinyStaking.connect(alice).stake(ethers.parseUnits("1000", 18));
      await time.increase(30 * ONE_DAY);
      // First claim drains pool entirely
      await tinyStaking.connect(alice).claim();
      expect(await tinyStaking.poolRemaining()).to.equal(0n);
      // Second claim: stake exists, time passes, but reward == 0 (pool empty)
      await time.increase(30 * ONE_DAY);
      const tx = await tinyStaking.connect(alice).claim();
      // hits the `if (reward > 0)` false branch — no RewardClaimed event
      await expect(tx).not.to.emit(tinyStaking, "RewardClaimed");
    });
  });

  // ============================================================
  //  CCMTGESale
  // ============================================================
  describe("CCMTGESale", () => {
    let token: CCMToken, usdc: MockUSDC, tge: CCMTGESale;

    beforeEach(async () => {
      token = await (await ethers.getContractFactory("CCMToken")).deploy(admin.address);
      usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
      tge = await (await ethers.getContractFactory("CCMTGESale"))
        .deploy(await token.getAddress(), await usdc.getAddress(), admin.address);
      await token.mint(await tge.getAddress(), ethers.parseUnits("1000000", 18));
    });

    // CCMTGESale.sol:67 — constructor zero checks (each component)
    it("constructor reverts on usdc = 0", async () => {
      const T = await ethers.getContractFactory("CCMTGESale");
      await expect(
        T.deploy(await token.getAddress(), ethers.ZeroAddress, admin.address)
      ).to.be.revertedWith("TGE: zero");
    });
    it("constructor reverts on ccm = 0", async () => {
      const T = await ethers.getContractFactory("CCMTGESale");
      await expect(
        T.deploy(ethers.ZeroAddress, await usdc.getAddress(), admin.address)
      ).to.be.revertedWith("TGE: zero");
    });
    it("constructor reverts on admin = 0", async () => {
      const T = await ethers.getContractFactory("CCMTGESale");
      await expect(
        T.deploy(await token.getAddress(), await usdc.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("TGE: zero");
    });

    // CCMTGESale.sol:110 — closeRound on already closed round
    it("closeRound twice reverts on second call", async () => {
      const now = await time.latest();
      await tge.createRound(
        "X", ethers.parseUnits("0.20", 6), ethers.parseUnits("1000", 18),
        0, ONE_YEAR, now, now + 60 * ONE_DAY
      );
      await tge.closeRound(0);
      await expect(tge.closeRound(0)).to.be.revertedWith("TGE: already closed");
    });

    // CCMTGESale.sol:122 — setWhitelistBatch with empty array
    it("setWhitelistBatch with empty array succeeds (no-op)", async () => {
      const now = await time.latest();
      await tge.createRound(
        "X", ethers.parseUnits("0.20", 6), ethers.parseUnits("1000", 18),
        0, ONE_YEAR, now, now + 60 * ONE_DAY
      );
      await expect(tge.setWhitelistBatch(0, [], true)).not.to.be.reverted;
    });

    // CCMTGESale.sol:150 — purchase with extremely small ccmAmount → usdcAmount rounds to 0
    it("purchase rounding: tiny ccmAmount that rounds USDC to 0 reverts", async () => {
      const now = await time.latest();
      await tge.createRound(
        "X",
        ethers.parseUnits("0.15", 6),  // 150_000 (6d)
        ethers.parseUnits("1000", 18),
        0, ONE_YEAR, now, now + 60 * ONE_DAY
      );
      await tge.setWhitelist(0, alice.address, true);
      await usdc.mint(alice.address, 1_000_000n);
      await usdc.connect(alice).approve(await tge.getAddress(), ethers.MaxUint256);
      // ccmAmount such that (ccmAmount * 150_000) / 1e18 = 0
      // need ccmAmount * 150_000 < 1e18 → ccmAmount < 1e18 / 150_000 ≈ 6.66e12
      const tiny = 1_000_000n; // 1e6 wei * 150_000 = 1.5e11, well under 1e18 → result = 0
      await expect(tge.connect(alice).purchase(0, tiny)).to.be.revertedWith("TGE: usdc zero");
    });

    // CCMTGESale.sol:173 — claimable returns 0 for user with no allocation
    it("claimable returns 0 for user who never purchased", async () => {
      const now = await time.latest();
      await tge.createRound(
        "X", ethers.parseUnits("0.20", 6), ethers.parseUnits("1000", 18),
        0, ONE_YEAR, now, now + 60 * ONE_DAY
      );
      expect(await tge.claimable(0, alice.address)).to.equal(0n);
    });

    // CCMTGESale.sol:110 — closeRound onlyRole negative path
    it("non-admin cannot closeRound", async () => {
      const now = await time.latest();
      await tge.createRound(
        "X", ethers.parseUnits("0.20", 6), ethers.parseUnits("1000", 18),
        0, ONE_YEAR, now, now + 60 * ONE_DAY
      );
      await expect(
        tge.connect(alice).closeRound(0)
      ).to.be.revertedWithCustomError(tge, "AccessControlUnauthorizedAccount");
    });

    // CCMTGESale.sol:122 — setWhitelistBatch onlyRole negative path
    it("non-admin cannot setWhitelistBatch", async () => {
      const now = await time.latest();
      await tge.createRound(
        "X", ethers.parseUnits("0.20", 6), ethers.parseUnits("1000", 18),
        0, ONE_YEAR, now, now + 60 * ONE_DAY
      );
      await expect(
        tge.connect(alice).setWhitelistBatch(0, [bob.address], true)
      ).to.be.revertedWithCustomError(tge, "AccessControlUnauthorizedAccount");
    });
  });
});
