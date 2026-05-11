import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { CCMTimelock, CCMToken } from "../typechain-types";

const FORTY_EIGHT_H = 48 * 60 * 60;
const PROPOSER_ROLE = ethers.id("PROPOSER_ROLE");
const EXECUTOR_ROLE = ethers.id("EXECUTOR_ROLE");
const CANCELLER_ROLE = ethers.id("CANCELLER_ROLE");
const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
const PAUSER_ROLE = ethers.id("PAUSER_ROLE");
const MINTER_ROLE = ethers.id("MINTER_ROLE");

const SHORT_DELAY = 60; // 60s — only valid on local chain (chainId 31337)

describe("CCMTimelock", () => {
  let timelock: CCMTimelock;
  let token: CCMToken;
  let admin: any, multisig: any, alice: any, attacker: any;

  beforeEach(async () => {
    [admin, multisig, alice, attacker] = await ethers.getSigners();

    const TL = await ethers.getContractFactory("CCMTimelock");
    timelock = (await TL.deploy(
      SHORT_DELAY,
      [multisig.address], // proposers
      [multisig.address], // executors
      admin.address, // initial admin (we'll renounce later in one test)
    )) as unknown as CCMTimelock;

    const Token = await ethers.getContractFactory("CCMToken");
    token = (await Token.deploy(admin.address)) as unknown as CCMToken;
  });

  describe("constructor", () => {
    it("MIN_DELAY is 48h", async () => {
      expect(await timelock.MIN_DELAY()).to.equal(FORTY_EIGHT_H);
    });

    it("VERSION is 1.0.0", async () => {
      expect(await timelock.VERSION()).to.equal("1.0.0");
    });

    it("local chain (31337) accepts short delays for unit testing", async () => {
      const TL = await ethers.getContractFactory("CCMTimelock");
      // 1 second on local — should not revert
      const tl = await TL.deploy(1, [multisig.address], [multisig.address], admin.address);
      await tl.waitForDeployment();
      expect(await tl.getMinDelay()).to.equal(1);
    });

    it("proposer/executor roles wired correctly", async () => {
      expect(await timelock.hasRole(PROPOSER_ROLE, multisig.address)).to.equal(true);
      expect(await timelock.hasRole(EXECUTOR_ROLE, multisig.address)).to.equal(true);
      expect(await timelock.hasRole(CANCELLER_ROLE, multisig.address)).to.equal(true);
      expect(await timelock.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);
    });

    it("non-proposer cannot schedule", async () => {
      const callData = token.interface.encodeFunctionData("grantRole", [
        MINTER_ROLE,
        attacker.address,
      ]);
      await expect(
        timelock
          .connect(attacker)
          .schedule(
            await token.getAddress(),
            0,
            callData,
            ethers.ZeroHash,
            ethers.ZeroHash,
            SHORT_DELAY,
          ),
      ).to.be.reverted; // AccessControl: missing PROPOSER_ROLE
    });
  });

  describe("schedule + execute (local short delay)", () => {
    it("queued grantRole executes after delay; immediate execute fails", async () => {
      // Hand off: grant DEFAULT_ADMIN_ROLE on Token to timelock
      await token.grantRole(DEFAULT_ADMIN_ROLE, await timelock.getAddress());

      // Deployer renounces admin → only timelock controls Token from here
      await token.renounceRole(DEFAULT_ADMIN_ROLE, admin.address);
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(false);
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, await timelock.getAddress())).to.equal(true);

      // Direct EOA grantRole now reverts
      await expect(token.connect(admin).grantRole(MINTER_ROLE, alice.address)).to.be.reverted;
      await expect(token.connect(attacker).grantRole(MINTER_ROLE, alice.address)).to.be.reverted;

      // Multisig schedules: grant MINTER_ROLE to alice
      const callData = token.interface.encodeFunctionData("grantRole", [
        MINTER_ROLE,
        alice.address,
      ]);
      const target = await token.getAddress();
      const value = 0n;
      const predecessor = ethers.ZeroHash;
      const salt = ethers.id("grant:minter:alice:#1");

      await expect(
        timelock
          .connect(multisig)
          .schedule(target, value, callData, predecessor, salt, SHORT_DELAY),
      ).to.emit(timelock, "CallScheduled");

      // Cannot execute before delay elapses
      await expect(
        timelock.connect(multisig).execute(target, value, callData, predecessor, salt),
      ).to.be.reverted; // TimelockUnexpectedOperationState

      // Wait 60s + 1s buffer
      await time.increase(SHORT_DELAY + 1);

      // Execute now succeeds; alice gets MINTER_ROLE
      await expect(
        timelock.connect(multisig).execute(target, value, callData, predecessor, salt),
      ).to.emit(timelock, "CallExecuted");
      expect(await token.hasRole(MINTER_ROLE, alice.address)).to.equal(true);
    });

    it("re-execution of same operation reverts (id is consumed)", async () => {
      await token.grantRole(DEFAULT_ADMIN_ROLE, await timelock.getAddress());
      const callData = token.interface.encodeFunctionData("grantRole", [
        MINTER_ROLE,
        alice.address,
      ]);
      const target = await token.getAddress();
      const salt = ethers.id("once");
      await timelock
        .connect(multisig)
        .schedule(target, 0, callData, ethers.ZeroHash, salt, SHORT_DELAY);
      await time.increase(SHORT_DELAY + 1);
      await timelock.connect(multisig).execute(target, 0, callData, ethers.ZeroHash, salt);
      await expect(
        timelock.connect(multisig).execute(target, 0, callData, ethers.ZeroHash, salt),
      ).to.be.reverted;
    });

    it("cancel removes a queued operation before it can execute", async () => {
      const callData = token.interface.encodeFunctionData("pause", []);
      await token.grantRole(PAUSER_ROLE, await timelock.getAddress());
      const target = await token.getAddress();
      const salt = ethers.id("cancel-me");
      await timelock
        .connect(multisig)
        .schedule(target, 0, callData, ethers.ZeroHash, salt, SHORT_DELAY);
      const id = await timelock.hashOperation(
        target,
        0,
        callData,
        ethers.ZeroHash,
        salt,
      );
      expect(await timelock.isOperationPending(id)).to.equal(true);

      await timelock.connect(multisig).cancel(id);
      expect(await timelock.isOperationPending(id)).to.equal(false);

      await time.increase(SHORT_DELAY + 1);
      await expect(
        timelock.connect(multisig).execute(target, 0, callData, ethers.ZeroHash, salt),
      ).to.be.reverted;
    });

    it("non-executor cannot execute (when executor role is restricted)", async () => {
      const callData = token.interface.encodeFunctionData("grantRole", [
        MINTER_ROLE,
        alice.address,
      ]);
      await token.grantRole(DEFAULT_ADMIN_ROLE, await timelock.getAddress());
      const target = await token.getAddress();
      const salt = ethers.id("attacker-tries");
      await timelock
        .connect(multisig)
        .schedule(target, 0, callData, ethers.ZeroHash, salt, SHORT_DELAY);
      await time.increase(SHORT_DELAY + 1);
      // attacker is not an executor
      await expect(
        timelock.connect(attacker).execute(target, 0, callData, ethers.ZeroHash, salt),
      ).to.be.reverted;
    });
  });

  describe("admin handoff lifecycle (CCMToken)", () => {
    it("end-to-end: deployer renounces, only timelock can pause/unpause via schedule", async () => {
      // 1. Grant pauser + admin to timelock
      await token.grantRole(PAUSER_ROLE, await timelock.getAddress());
      await token.grantRole(DEFAULT_ADMIN_ROLE, await timelock.getAddress());
      // 2. Deployer renounces both roles
      await token.renounceRole(PAUSER_ROLE, admin.address);
      await token.renounceRole(DEFAULT_ADMIN_ROLE, admin.address);

      // Deployer can no longer pause directly
      await expect(token.connect(admin).pause()).to.be.reverted;

      // Multisig schedules pause via timelock
      const data = token.interface.encodeFunctionData("pause", []);
      const target = await token.getAddress();
      const salt = ethers.id("emergency-pause");
      await timelock
        .connect(multisig)
        .schedule(target, 0, data, ethers.ZeroHash, salt, SHORT_DELAY);
      await time.increase(SHORT_DELAY + 1);
      await timelock.connect(multisig).execute(target, 0, data, ethers.ZeroHash, salt);

      expect(await token.paused()).to.equal(true);
    });
  });

  describe("getMinDelay can only be raised via timelock itself", () => {
    it("non-timelock-self-call cannot updateDelay", async () => {
      // updateDelay is the OZ-builtin admin function; only callable by the timelock itself
      await expect(timelock.connect(multisig).updateDelay(7 * 24 * 3600)).to.be.reverted;
    });

    it("can be updated via a timelocked operation calling itself", async () => {
      const newDelay = 7 * 24 * 3600;
      const data = timelock.interface.encodeFunctionData("updateDelay", [newDelay]);
      const target = await timelock.getAddress();
      const salt = ethers.id("raise-delay");
      await timelock
        .connect(multisig)
        .schedule(target, 0, data, ethers.ZeroHash, salt, SHORT_DELAY);
      await time.increase(SHORT_DELAY + 1);
      await timelock.connect(multisig).execute(target, 0, data, ethers.ZeroHash, salt);
      expect(await timelock.getMinDelay()).to.equal(newDelay);
    });
  });
});
