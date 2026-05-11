/**
 * Requirements-driven TDD tests for CCMTGESale.
 * Targets FR-2.1 multi-round, FR-2.5 round vesting auto-setup.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { CCMToken, CCMTGESale, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const ONE_DAY = 24 * 60 * 60;
const ONE_YEAR = 365 * ONE_DAY;

describe("CCMTGESale — Requirements", () => {
  let token: CCMToken;
  let usdc: MockUSDC;
  let tge: CCMTGESale;
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCMToken");
    token = await Token.deploy(admin.address);
    const USDC = await ethers.getContractFactory("MockUSDC");
    usdc = await USDC.deploy();
    const TGE = await ethers.getContractFactory("CCMTGESale");
    tge = await TGE.deploy(await token.getAddress(), await usdc.getAddress(), admin.address);
    // fund TGE with both rounds' tokens (Seed 70M + Series A 130M = 200M)
    await token.mint(await tge.getAddress(), ethers.parseUnits("200000000", 18));
    // give buyers USDC
    await usdc.mint(alice.address, ethers.parseUnits("10000000", 6));
    await usdc.mint(bob.address, ethers.parseUnits("10000000", 6));
    await usdc.connect(alice).approve(await tge.getAddress(), ethers.MaxUint256);
    await usdc.connect(bob).approve(await tge.getAddress(), ethers.MaxUint256);
  });

  describe("FR-2.1 multi-round (Seed + Series A simultaneously)", () => {
    it("two rounds can be created and operated independently", async () => {
      const now = await time.latest();
      // Seed: 70M @ $0.15, 12mo cliff + 36mo vest
      await tge.createRound(
        "Seed",
        ethers.parseUnits("0.15", 6),
        ethers.parseUnits("70000000", 18),
        ONE_YEAR,
        3 * ONE_YEAR,
        now,
        now + 60 * ONE_DAY
      );
      // Series A: 130M @ $0.20, 6mo cliff + 18mo vest
      await tge.createRound(
        "Series A",
        ethers.parseUnits("0.20", 6),
        ethers.parseUnits("130000000", 18),
        180 * ONE_DAY,
        540 * ONE_DAY,
        now,
        now + 90 * ONE_DAY
      );
      expect(await tge.getRoundCount()).to.equal(2n);

      const seed = await tge.getRound(0);
      const seriesA = await tge.getRound(1);
      expect(seed.name).to.equal("Seed");
      expect(seriesA.name).to.equal("Series A");
      expect(seed.priceUsdc).to.not.equal(seriesA.priceUsdc);
      expect(seed.hardCapTokens).to.not.equal(seriesA.hardCapTokens);
    });

    it("buyer can be in both rounds concurrently", async () => {
      const now = await time.latest();
      await tge.createRound("Seed", ethers.parseUnits("0.15", 6), ethers.parseUnits("70000000", 18), ONE_YEAR, 3 * ONE_YEAR, now, now + 60 * ONE_DAY);
      await tge.createRound("SeriesA", ethers.parseUnits("0.20", 6), ethers.parseUnits("130000000", 18), 180 * ONE_DAY, 540 * ONE_DAY, now, now + 90 * ONE_DAY);
      await tge.setWhitelist(0, alice.address, true);
      await tge.setWhitelist(1, alice.address, true);

      await tge.connect(alice).purchase(0, ethers.parseUnits("100", 18));
      await tge.connect(alice).purchase(1, ethers.parseUnits("200", 18));

      const a0 = await tge.allocations(0, alice.address);
      const a1 = await tge.allocations(1, alice.address);
      expect(a0.totalAllocated).to.equal(ethers.parseUnits("100", 18));
      expect(a1.totalAllocated).to.equal(ethers.parseUnits("200", 18));
    });

    it("whitelist of round 0 does NOT grant access to round 1", async () => {
      const now = await time.latest();
      await tge.createRound("Seed", ethers.parseUnits("0.15", 6), ethers.parseUnits("70000000", 18), 0, ONE_YEAR, now, now + 60 * ONE_DAY);
      await tge.createRound("SeriesA", ethers.parseUnits("0.20", 6), ethers.parseUnits("130000000", 18), 0, ONE_YEAR, now, now + 90 * ONE_DAY);
      await tge.setWhitelist(0, alice.address, true); // round 0 only
      await expect(
        tge.connect(alice).purchase(1, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("TGE: not whitelisted");
    });
  });

  describe("FR-2.5 round vesting auto-applied to allocation", () => {
    it("first purchase copies round.cliff/vest/start into allocation", async () => {
      const now = await time.latest();
      const cliff = 180 * ONE_DAY;
      const vest = 540 * ONE_DAY;
      await tge.createRound(
        "X",
        ethers.parseUnits("0.20", 6),
        ethers.parseUnits("1000000", 18),
        cliff,
        vest,
        now,
        now + 60 * ONE_DAY
      );
      await tge.setWhitelist(0, alice.address, true);
      await tge.connect(alice).purchase(0, ethers.parseUnits("100", 18));

      const a = await tge.allocations(0, alice.address);
      expect(a.startTime).to.equal(BigInt(now));
      expect(a.cliffSeconds).to.equal(BigInt(cliff));
      expect(a.vestSeconds).to.equal(BigInt(vest));
    });

    it("second purchase preserves original startTime/cliff/vest (not overwritten)", async () => {
      const now = await time.latest();
      await tge.createRound("X", ethers.parseUnits("0.20", 6), ethers.parseUnits("1000000", 18), ONE_YEAR, 2 * ONE_YEAR, now, now + 60 * ONE_DAY);
      await tge.setWhitelist(0, alice.address, true);
      await tge.connect(alice).purchase(0, ethers.parseUnits("100", 18));
      const first = await tge.allocations(0, alice.address);

      await time.increase(10 * ONE_DAY);
      await tge.connect(alice).purchase(0, ethers.parseUnits("50", 18));
      const second = await tge.allocations(0, alice.address);
      expect(second.startTime).to.equal(first.startTime);
      expect(second.cliffSeconds).to.equal(first.cliffSeconds);
      expect(second.vestSeconds).to.equal(first.vestSeconds);
      expect(second.totalAllocated).to.equal(first.totalAllocated + ethers.parseUnits("50", 18));
    });
  });

  describe("FR-2.7 hardcap edge cases", () => {
    it("purchase exactly to hardcap succeeds; one extra reverts", async () => {
      const now = await time.latest();
      const cap = ethers.parseUnits("1000", 18);
      await tge.createRound("X", ethers.parseUnits("0.20", 6), cap, 0, ONE_YEAR, now, now + 60 * ONE_DAY);
      await tge.setWhitelist(0, alice.address, true);
      await tge.connect(alice).purchase(0, cap);
      const r = await tge.getRound(0);
      expect(r.soldTokens).to.equal(cap);
      await expect(tge.connect(alice).purchase(0, 1n)).to.be.revertedWith("TGE: hardcap exceeded");
    });

    it("two buyers split hardcap correctly", async () => {
      const now = await time.latest();
      const cap = ethers.parseUnits("1000", 18);
      await tge.createRound("X", ethers.parseUnits("0.20", 6), cap, 0, ONE_YEAR, now, now + 60 * ONE_DAY);
      await tge.setWhitelistBatch(0, [alice.address, bob.address], true);
      await tge.connect(alice).purchase(0, ethers.parseUnits("600", 18));
      await tge.connect(bob).purchase(0, ethers.parseUnits("400", 18));
      await expect(tge.connect(alice).purchase(0, 1n)).to.be.revertedWith("TGE: hardcap exceeded");
    });
  });
});
