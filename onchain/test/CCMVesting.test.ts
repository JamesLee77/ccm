import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { CCMToken, CCMVesting } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const ONE_YEAR = 365 * 24 * 60 * 60;
const TOTAL = ethers.parseUnits("1000", 18);

describe("CCMVesting", () => {
  let token: CCMToken;
  let vesting: CCMVesting;
  let admin: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, user, other] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCMToken");
    token = await Token.deploy(admin.address);
    const Vesting = await ethers.getContractFactory("CCMVesting");
    vesting = await Vesting.deploy(await token.getAddress(), admin.address);
    // fund vesting contract
    await token.mint(await vesting.getAddress(), ethers.parseUnits("1000000", 18));
  });

  async function makeSchedule(opts?: {
    cliff?: number;
    duration?: number;
    revocable?: boolean;
    amount?: bigint;
    beneficiary?: HardhatEthersSigner;
  }) {
    const cliff = opts?.cliff ?? ONE_YEAR;
    const duration = opts?.duration ?? 4 * ONE_YEAR;
    const revocable = opts?.revocable ?? true;
    const amount = opts?.amount ?? TOTAL;
    const beneficiary = opts?.beneficiary ?? user;
    const start = await time.latest();
    await vesting.createSchedule(beneficiary.address, amount, start, cliff, duration, revocable);
    return { id: 0, start, cliff, duration, amount };
  }

  describe("createSchedule", () => {
    it("emits ScheduleCreated and stores schedule", async () => {
      const start = await time.latest();
      await expect(
        vesting.createSchedule(user.address, TOTAL, start, ONE_YEAR, 4 * ONE_YEAR, true)
      )
        .to.emit(vesting, "ScheduleCreated")
        .withArgs(0, user.address, TOTAL, start, ONE_YEAR, 4 * ONE_YEAR);

      const s = await vesting.schedules(0);
      expect(s.beneficiary).to.equal(user.address);
      expect(s.totalAmount).to.equal(TOTAL);
      expect(s.released).to.equal(0n);
    });

    it("reverts on bad params", async () => {
      const start = await time.latest();
      await expect(
        vesting.createSchedule(ethers.ZeroAddress, TOTAL, start, 0, 100, false)
      ).to.be.revertedWith("Vesting: beneficiary zero");
      await expect(
        vesting.createSchedule(user.address, 0, start, 0, 100, false)
      ).to.be.revertedWith("Vesting: amount zero");
      await expect(
        vesting.createSchedule(user.address, TOTAL, start, 0, 0, false)
      ).to.be.revertedWith("Vesting: duration zero");
      await expect(
        vesting.createSchedule(user.address, TOTAL, start, 200, 100, false)
      ).to.be.revertedWith("Vesting: cliff > duration");
    });

    it("non-manager cannot create", async () => {
      const start = await time.latest();
      await expect(
        vesting.connect(user).createSchedule(user.address, TOTAL, start, 0, 100, false)
      ).to.be.revertedWithCustomError(vesting, "AccessControlUnauthorizedAccount");
    });
  });

  describe("cliff and linear vesting", () => {
    it("releasable = 0 before cliff", async () => {
      await makeSchedule();
      expect(await vesting.releasable(0)).to.equal(0n);
      await time.increase(ONE_YEAR - 100);
      expect(await vesting.releasable(0)).to.equal(0n);
    });

    it("releasable proportional to time after cliff", async () => {
      const { duration } = await makeSchedule();
      // Move to ~50% of vesting period
      await time.increase(duration / 2);
      const expected = TOTAL / 2n;
      const got = await vesting.releasable(0);
      // tolerate +/- 0.1% drift from block-time granularity
      const tol = expected / 1000n;
      expect(got).to.be.closeTo(expected, tol);
    });

    it("releasable = totalAmount after duration", async () => {
      const { duration } = await makeSchedule();
      await time.increase(duration + 1);
      expect(await vesting.releasable(0)).to.equal(TOTAL);
    });

    it("release transfers tokens and updates released", async () => {
      const { duration } = await makeSchedule();
      await time.increase(duration / 2);
      const before = await token.balanceOf(user.address);
      await vesting.connect(user).release(0);
      const after = await token.balanceOf(user.address);
      expect(after - before).to.be.gt(0n);
      const s = await vesting.schedules(0);
      expect(s.released).to.equal(after - before);
    });

    it("non-beneficiary cannot release", async () => {
      await makeSchedule();
      await time.increase(2 * ONE_YEAR);
      await expect(vesting.connect(other).release(0)).to.be.revertedWith("Vesting: not beneficiary");
    });

    it("release with nothing reverts", async () => {
      await makeSchedule();
      await expect(vesting.connect(user).release(0)).to.be.revertedWith("Vesting: nothing to release");
    });
  });

  describe("releaseAll", () => {
    it("releases all schedules of caller", async () => {
      const start = await time.latest();
      await vesting.createSchedule(user.address, TOTAL, start, 0, ONE_YEAR, false);
      await vesting.createSchedule(user.address, TOTAL, start, 0, ONE_YEAR, false);
      await time.increase(ONE_YEAR + 1);
      await vesting.connect(user).releaseAll();
      expect(await token.balanceOf(user.address)).to.equal(TOTAL * 2n);
    });

    it("reverts when nothing to release", async () => {
      await makeSchedule();
      await expect(vesting.connect(user).releaseAll()).to.be.revertedWith("Vesting: nothing to release");
    });
  });

  describe("revoke", () => {
    it("vested portion paid to beneficiary, remainder back to admin", async () => {
      const { duration } = await makeSchedule({ revocable: true });
      await time.increase(duration / 4); // 25% vested
      const beforeAdmin = await token.balanceOf(admin.address);
      await vesting.revoke(0);
      const afterAdmin = await token.balanceOf(admin.address);
      const userBal = await token.balanceOf(user.address);

      // user receives ~25%
      expect(userBal).to.be.closeTo(TOTAL / 4n, TOTAL / 100n);
      // admin receives the remainder so user + admin == TOTAL
      expect(userBal + (afterAdmin - beforeAdmin)).to.equal(TOTAL);

      const s = await vesting.schedules(0);
      expect(s.revoked).to.equal(true);
    });

    it("non-revocable schedule cannot be revoked", async () => {
      await makeSchedule({ revocable: false });
      await expect(vesting.revoke(0)).to.be.revertedWith("Vesting: not revocable");
    });

    it("cannot revoke twice", async () => {
      await makeSchedule({ revocable: true });
      await vesting.revoke(0);
      await expect(vesting.revoke(0)).to.be.revertedWith("Vesting: already revoked");
    });

    it("after revoke, releasable = 0", async () => {
      const { duration } = await makeSchedule({ revocable: true });
      await time.increase(duration / 2);
      await vesting.revoke(0);
      expect(await vesting.releasable(0)).to.equal(0n);
    });

    it("non-manager cannot revoke", async () => {
      await makeSchedule({ revocable: true });
      await expect(
        vesting.connect(user).revoke(0)
      ).to.be.revertedWithCustomError(vesting, "AccessControlUnauthorizedAccount");
    });
  });

  describe("getScheduleCount", () => {
    it("returns count", async () => {
      expect(await vesting.getScheduleCount()).to.equal(0n);
      await makeSchedule();
      expect(await vesting.getScheduleCount()).to.equal(1n);
    });
  });
});
