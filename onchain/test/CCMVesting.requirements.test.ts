/**
 * Requirements-driven TDD tests for CCMVesting.
 * Targets uncovered branches and FR-3.x edge cases.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { CCMToken, CCMVesting } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const ONE_YEAR = 365 * 24 * 60 * 60;
const TOTAL = ethers.parseUnits("1000", 18);

describe("CCMVesting — Requirements", () => {
  let token: CCMToken;
  let vesting: CCMVesting;
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCMToken");
    token = await Token.deploy(admin.address);
    const Vesting = await ethers.getContractFactory("CCMVesting");
    vesting = await Vesting.deploy(await token.getAddress(), admin.address);
    await token.mint(await vesting.getAddress(), ethers.parseUnits("1000000", 18));
  });

  describe("FR-3.1 cliff exact-boundary semantics", () => {
    it("releasable = 0 at exactly start + cliff - 1", async () => {
      const start = await time.latest();
      await vesting.createSchedule(alice.address, TOTAL, start, ONE_YEAR, 4 * ONE_YEAR, false);
      // move to one second before cliff ends
      await time.increaseTo(start + ONE_YEAR - 1);
      expect(await vesting.releasable(0)).to.equal(0n);
    });

    it("releasable > 0 immediately after start + cliff", async () => {
      const start = await time.latest();
      await vesting.createSchedule(alice.address, TOTAL, start, ONE_YEAR, 4 * ONE_YEAR, false);
      await time.increaseTo(start + ONE_YEAR + 1);
      expect(await vesting.releasable(0)).to.be.gt(0n);
    });
  });

  describe("FR-3.5 revoke aftermath (uncovered branches)", () => {
    it("releasable = 0 after revoke even when previously vested", async () => {
      const start = await time.latest();
      await vesting.createSchedule(alice.address, TOTAL, start, 0, ONE_YEAR, true);
      await time.increase(ONE_YEAR / 2);
      const beforeRevoke = await vesting.releasable(0);
      expect(beforeRevoke).to.be.gt(0n); // sanity: was vesting
      await vesting.revoke(0);
      expect(await vesting.releasable(0)).to.equal(0n); // revoked branch
    });

    it("revoke before any vesting (cliff not reached) returns full amount to admin", async () => {
      const start = await time.latest();
      await vesting.createSchedule(alice.address, TOTAL, start, ONE_YEAR, 4 * ONE_YEAR, true);
      const adminBefore = await token.balanceOf(admin.address);
      await vesting.revoke(0); // immediately, no vesting yet
      const adminAfter = await token.balanceOf(admin.address);
      expect(adminAfter - adminBefore).to.equal(TOTAL);
      expect(await token.balanceOf(alice.address)).to.equal(0n);
    });

    it("revoke after full vesting pays everything to beneficiary, nothing to admin", async () => {
      const start = await time.latest();
      await vesting.createSchedule(alice.address, TOTAL, start, 0, ONE_YEAR, true);
      await time.increase(ONE_YEAR + 1);
      const adminBefore = await token.balanceOf(admin.address);
      await vesting.revoke(0);
      expect(await token.balanceOf(alice.address)).to.equal(TOTAL);
      expect(await token.balanceOf(admin.address)).to.equal(adminBefore); // no remainder
    });
  });

  describe("FR-3.4 releaseAll multi-schedule edge cases", () => {
    it("releaseAll with one matured + one unmatured releases only matured", async () => {
      const start = await time.latest();
      // Schedule A: 0 cliff, 1y vest — matures at +1y
      await vesting.createSchedule(alice.address, TOTAL, start, 0, ONE_YEAR, false);
      // Schedule B: 2y cliff — still locked at +1y
      await vesting.createSchedule(alice.address, TOTAL, start, 2 * ONE_YEAR, 3 * ONE_YEAR, false);

      await time.increase(ONE_YEAR + 100);
      await vesting.connect(alice).releaseAll();
      // got back schedule A only
      const bal = await token.balanceOf(alice.address);
      expect(bal).to.equal(TOTAL);
      // schedule B still locked
      expect(await vesting.releasable(1)).to.equal(0n);
    });
  });

  describe("FR-3.2 scheduleIdsOf tracking", () => {
    it("multiple schedules for same beneficiary all listed", async () => {
      const start = await time.latest();
      await vesting.createSchedule(alice.address, TOTAL, start, 0, ONE_YEAR, false);
      await vesting.createSchedule(alice.address, TOTAL, start, 0, ONE_YEAR, false);
      await vesting.createSchedule(alice.address, TOTAL, start, 0, ONE_YEAR, false);
      expect(await vesting.scheduleIdsOf(alice.address, 0)).to.equal(0n);
      expect(await vesting.scheduleIdsOf(alice.address, 1)).to.equal(1n);
      expect(await vesting.scheduleIdsOf(alice.address, 2)).to.equal(2n);
      expect(await vesting.getScheduleCount()).to.equal(3n);
    });
  });

  describe("createScheduleBatch", () => {
    it("creates N schedules in one call with consistent params", async () => {
      const start = await time.latest();
      const beneficiaries = [alice.address, bob.address];
      const amounts = [ethers.parseUnits("100", 18), ethers.parseUnits("200", 18)];
      const ids = await vesting.createScheduleBatch.staticCall(
        beneficiaries, amounts, start, 0, ONE_YEAR, false
      );
      expect(ids[0]).to.equal(0n);
      expect(ids[1]).to.equal(1n);

      await vesting.createScheduleBatch(beneficiaries, amounts, start, 0, ONE_YEAR, false);
      expect(await vesting.getScheduleCount()).to.equal(2n);
      const s0 = await vesting.schedules(0);
      const s1 = await vesting.schedules(1);
      expect(s0.beneficiary).to.equal(alice.address);
      expect(s0.totalAmount).to.equal(amounts[0]);
      expect(s1.beneficiary).to.equal(bob.address);
      expect(s1.totalAmount).to.equal(amounts[1]);
    });

    it("rejects empty batch", async () => {
      const start = await time.latest();
      await expect(
        vesting.createScheduleBatch([], [], start, 0, ONE_YEAR, false)
      ).to.be.revertedWith("Vesting: empty batch");
    });

    it("rejects length mismatch", async () => {
      const start = await time.latest();
      await expect(
        vesting.createScheduleBatch([alice.address], [TOTAL, TOTAL], start, 0, ONE_YEAR, false)
      ).to.be.revertedWith("Vesting: length mismatch");
    });

    it("rejects bad params (cliff > duration)", async () => {
      const start = await time.latest();
      await expect(
        vesting.createScheduleBatch([alice.address], [TOTAL], start, ONE_YEAR + 1, ONE_YEAR, false)
      ).to.be.revertedWith("Vesting: cliff > duration");
    });

    it("rejects zero beneficiary or zero amount inside batch", async () => {
      const start = await time.latest();
      await expect(
        vesting.createScheduleBatch(
          [alice.address, ethers.ZeroAddress], [TOTAL, TOTAL], start, 0, ONE_YEAR, false
        )
      ).to.be.revertedWith("Vesting: beneficiary zero");
      await expect(
        vesting.createScheduleBatch(
          [alice.address, bob.address], [TOTAL, 0], start, 0, ONE_YEAR, false
        )
      ).to.be.revertedWith("Vesting: amount zero");
    });

    it("non-manager cannot call", async () => {
      const start = await time.latest();
      await expect(
        vesting.connect(alice).createScheduleBatch([bob.address], [TOTAL], start, 0, ONE_YEAR, false)
      ).to.be.revertedWithCustomError(vesting, "AccessControlUnauthorizedAccount");
    });
  });
});
