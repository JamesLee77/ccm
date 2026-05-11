import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { CCMToken, CCMTGESale, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const ONE_DAY = 24 * 60 * 60;
const ONE_YEAR = 365 * ONE_DAY;
const HARDCAP = ethers.parseUnits("70000000", 18); // 70M Seed
const PRICE = ethers.parseUnits("0.15", 6); // 0.15 USDC

describe("CCMTGESale", () => {
  let token: CCMToken;
  let usdc: MockUSDC;
  let tge: CCMTGESale;
  let admin: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, buyer, other] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCMToken");
    token = await Token.deploy(admin.address);
    const USDC = await ethers.getContractFactory("MockUSDC");
    usdc = await USDC.deploy();
    const TGE = await ethers.getContractFactory("CCMTGESale");
    tge = await TGE.deploy(await token.getAddress(), await usdc.getAddress(), admin.address);
    // fund TGE with CCM
    await token.mint(await tge.getAddress(), HARDCAP);
    // give buyer USDC
    await usdc.mint(buyer.address, ethers.parseUnits("10000000", 6));
  });

  async function makeRound(opts?: {
    cliff?: number;
    vest?: number;
    startOffset?: number;
    duration?: number;
    hardcap?: bigint;
  }) {
    const now = await time.latest();
    const start = now + (opts?.startOffset ?? 0);
    const end = start + (opts?.duration ?? 60 * ONE_DAY);
    const cliff = opts?.cliff ?? ONE_YEAR;
    const vest = opts?.vest ?? 3 * ONE_YEAR;
    const hardcap = opts?.hardcap ?? HARDCAP;
    await tge.createRound("Seed", PRICE, hardcap, cliff, vest, start, end);
    return { id: 0, start, end, cliff, vest };
  }

  describe("createRound", () => {
    it("emits and stores", async () => {
      const now = await time.latest();
      await expect(
        tge.createRound("Seed", PRICE, HARDCAP, ONE_YEAR, 3 * ONE_YEAR, now, now + 60 * ONE_DAY)
      ).to.emit(tge, "RoundCreated").withArgs(0, "Seed", PRICE, HARDCAP);

      const r = await tge.getRound(0);
      expect(r.priceUsdc).to.equal(PRICE);
      expect(r.hardCapTokens).to.equal(HARDCAP);
      expect(r.active).to.equal(true);
    });

    it("rejects bad params", async () => {
      const now = await time.latest();
      await expect(
        tge.createRound("X", 0, HARDCAP, 0, ONE_YEAR, now, now + 100)
      ).to.be.revertedWith("TGE: price zero");
      await expect(
        tge.createRound("X", PRICE, 0, 0, ONE_YEAR, now, now + 100)
      ).to.be.revertedWith("TGE: hardcap zero");
      await expect(
        tge.createRound("X", PRICE, HARDCAP, ONE_YEAR + 1, ONE_YEAR, now, now + 100)
      ).to.be.revertedWith("TGE: vest < cliff");
      await expect(
        tge.createRound("X", PRICE, HARDCAP, 0, ONE_YEAR, now + 100, now + 50)
      ).to.be.revertedWith("TGE: end < start");
    });

    it("non-admin cannot create", async () => {
      const now = await time.latest();
      await expect(
        tge.connect(buyer).createRound("X", PRICE, HARDCAP, 0, ONE_YEAR, now, now + 100)
      ).to.be.revertedWithCustomError(tge, "AccessControlUnauthorizedAccount");
    });
  });

  describe("whitelist", () => {
    beforeEach(async () => { await makeRound(); });

    it("setWhitelist toggles", async () => {
      await tge.setWhitelist(0, buyer.address, true);
      expect(await tge.whitelist(0, buyer.address)).to.equal(true);
    });

    it("setWhitelistBatch", async () => {
      await tge.setWhitelistBatch(0, [buyer.address, other.address], true);
      expect(await tge.whitelist(0, buyer.address)).to.equal(true);
      expect(await tge.whitelist(0, other.address)).to.equal(true);
    });

    it("non-admin cannot whitelist", async () => {
      await expect(
        tge.connect(buyer).setWhitelist(0, buyer.address, true)
      ).to.be.revertedWithCustomError(tge, "AccessControlUnauthorizedAccount");
    });
  });

  describe("purchase", () => {
    beforeEach(async () => {
      await makeRound();
      await tge.setWhitelist(0, buyer.address, true);
      await usdc.connect(buyer).approve(await tge.getAddress(), ethers.MaxUint256);
    });

    it("purchase succeeds, USDC charged correctly", async () => {
      const amt = ethers.parseUnits("100", 18); // 100 CCM
      // expected USDC = 100 * 0.15 = 15 USDC = 15_000_000 (6d)
      const expectedUsdc = 15_000_000n;
      const usdcBefore = await usdc.balanceOf(buyer.address);
      await expect(tge.connect(buyer).purchase(0, amt))
        .to.emit(tge, "Purchased")
        .withArgs(0, buyer.address, amt, expectedUsdc);
      const usdcAfter = await usdc.balanceOf(buyer.address);
      expect(usdcBefore - usdcAfter).to.equal(expectedUsdc);

      const r = await tge.getRound(0);
      expect(r.soldTokens).to.equal(amt);

      const a = await tge.allocations(0, buyer.address);
      expect(a.totalAllocated).to.equal(amt);
    });

    it("non-whitelisted reverts", async () => {
      await expect(
        tge.connect(other).purchase(0, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("TGE: not whitelisted");
    });

    it("zero amount reverts", async () => {
      await expect(tge.connect(buyer).purchase(0, 0)).to.be.revertedWith("TGE: zero amount");
    });

    it("hardcap exceeded reverts", async () => {
      await expect(
        tge.connect(buyer).purchase(0, HARDCAP + 1n)
      ).to.be.revertedWith("TGE: hardcap exceeded");
    });

    it("after closeRound, purchase reverts", async () => {
      await tge.closeRound(0);
      await expect(
        tge.connect(buyer).purchase(0, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("TGE: round closed");
    });

    it("before startTime reverts", async () => {
      // create new round in the future
      const now = await time.latest();
      await tge.createRound("Future", PRICE, HARDCAP, 0, ONE_YEAR, now + ONE_DAY, now + 30 * ONE_DAY);
      await tge.setWhitelist(1, buyer.address, true);
      await expect(
        tge.connect(buyer).purchase(1, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("TGE: not started");
    });

    it("after endTime reverts", async () => {
      await time.increase(61 * ONE_DAY);
      await expect(
        tge.connect(buyer).purchase(0, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("TGE: ended");
    });

    it("multiple purchases accumulate", async () => {
      const amt = ethers.parseUnits("100", 18);
      await tge.connect(buyer).purchase(0, amt);
      await tge.connect(buyer).purchase(0, amt);
      const a = await tge.allocations(0, buyer.address);
      expect(a.totalAllocated).to.equal(amt * 2n);
    });
  });

  describe("claim (cliff + linear vest)", () => {
    let r: { start: number; cliff: number; vest: number };
    beforeEach(async () => {
      r = await makeRound({ cliff: ONE_YEAR, vest: 3 * ONE_YEAR });
      await tge.setWhitelist(0, buyer.address, true);
      await usdc.connect(buyer).approve(await tge.getAddress(), ethers.MaxUint256);
      await tge.connect(buyer).purchase(0, ethers.parseUnits("3000", 18));
    });

    it("claimable = 0 before cliff", async () => {
      expect(await tge.claimable(0, buyer.address)).to.equal(0n);
      await time.increase(r.cliff - 100);
      expect(await tge.claimable(0, buyer.address)).to.equal(0n);
    });

    it("claim reverts if nothing claimable", async () => {
      await expect(tge.connect(buyer).claim(0)).to.be.revertedWith("TGE: nothing claimable");
    });

    it("claimable proportional to time after cliff", async () => {
      // Move to ~50% of vest
      await time.increase(Math.floor(r.vest / 2));
      const expected = ethers.parseUnits("1500", 18);
      const got = await tge.claimable(0, buyer.address);
      const tol = expected / 100n;
      expect(got).to.be.closeTo(expected, tol);
    });

    it("claim transfers tokens and updates allocation", async () => {
      await time.increase(r.vest + 1);
      const before = await token.balanceOf(buyer.address);
      await tge.connect(buyer).claim(0);
      const after = await token.balanceOf(buyer.address);
      expect(after - before).to.equal(ethers.parseUnits("3000", 18));
      const a = await tge.allocations(0, buyer.address);
      expect(a.claimed).to.equal(ethers.parseUnits("3000", 18));
    });
  });

  describe("withdrawUSDC", () => {
    beforeEach(async () => {
      await makeRound();
      await tge.setWhitelist(0, buyer.address, true);
      await usdc.connect(buyer).approve(await tge.getAddress(), ethers.MaxUint256);
      await tge.connect(buyer).purchase(0, ethers.parseUnits("100", 18));
    });

    it("admin withdraws raised USDC", async () => {
      const before = await usdc.balanceOf(other.address);
      await tge.withdrawUSDC(other.address, 15_000_000n);
      const after = await usdc.balanceOf(other.address);
      expect(after - before).to.equal(15_000_000n);
    });

    it("zero address rejected", async () => {
      await expect(tge.withdrawUSDC(ethers.ZeroAddress, 1n)).to.be.revertedWith("TGE: to zero");
    });

    it("non-admin cannot withdraw", async () => {
      await expect(
        tge.connect(buyer).withdrawUSDC(buyer.address, 1n)
      ).to.be.revertedWithCustomError(tge, "AccessControlUnauthorizedAccount");
    });
  });

  describe("getRoundCount", () => {
    it("returns count", async () => {
      expect(await tge.getRoundCount()).to.equal(0n);
      await makeRound();
      expect(await tge.getRoundCount()).to.equal(1n);
    });
  });
});
