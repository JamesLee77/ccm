/**
 * Tests for CCMMigration: v1 → v2 token swap with optional bonus.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { CCMToken, CCMMigration } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const ONE_DAY = 24 * 60 * 60;

describe("CCMMigration", () => {
  let v1: CCMToken;
  let v2: CCMToken;
  let migration: CCMMigration;
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  const ALLOC = ethers.parseUnits("1000", 18);
  let deadline: number;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();
    // Two CCMToken instances simulate v1 and v2
    const Token = await ethers.getContractFactory("CCMToken");
    v1 = await Token.deploy(admin.address);
    v2 = await Token.deploy(admin.address);

    // Mint v1 to alice (simulating pre-sale)
    await v1.mint(alice.address, ALLOC);
    await v1.mint(bob.address, ALLOC);

    deadline = (await time.latest()) + 90 * ONE_DAY;
    const Mig = await ethers.getContractFactory("CCMMigration");
    migration = await Mig.deploy(
      await v1.getAddress(),
      await v2.getAddress(),
      0, // 1:1
      deadline,
      admin.address
    );
    // Migration must hold v2 MINTER_ROLE
    const MINTER = await v2.MINTER_ROLE();
    await v2.grantRole(MINTER, await migration.getAddress());
  });

  describe("constructor", () => {
    it("rejects zero addresses", async () => {
      const Mig = await ethers.getContractFactory("CCMMigration");
      await expect(
        Mig.deploy(ethers.ZeroAddress, await v2.getAddress(), 0, deadline, admin.address)
      ).to.be.revertedWith("Migration: zero");
      await expect(
        Mig.deploy(await v1.getAddress(), ethers.ZeroAddress, 0, deadline, admin.address)
      ).to.be.revertedWith("Migration: zero");
      await expect(
        Mig.deploy(await v1.getAddress(), await v2.getAddress(), 0, deadline, ethers.ZeroAddress)
      ).to.be.revertedWith("Migration: zero");
    });

    it("rejects bonus > 50%", async () => {
      const Mig = await ethers.getContractFactory("CCMMigration");
      await expect(
        Mig.deploy(await v1.getAddress(), await v2.getAddress(), 5001, deadline, admin.address)
      ).to.be.revertedWith("Migration: bonus too high");
    });

    it("rejects past deadline", async () => {
      const Mig = await ethers.getContractFactory("CCMMigration");
      const past = (await time.latest()) - 1;
      await expect(
        Mig.deploy(await v1.getAddress(), await v2.getAddress(), 0, past, admin.address)
      ).to.be.revertedWith("Migration: deadline past");
    });
  });

  describe("migrate (1:1)", () => {
    beforeEach(async () => {
      await v1.connect(alice).approve(await migration.getAddress(), ethers.MaxUint256);
    });

    it("burns v1 and mints v2 1:1", async () => {
      const amt = ethers.parseUnits("100", 18);
      const v1Total0 = await v1.totalSupply();
      const v2Total0 = await v2.totalSupply();

      await expect(migration.connect(alice).migrate(amt))
        .to.emit(migration, "Migrated").withArgs(alice.address, amt, amt);

      expect(await v1.balanceOf(alice.address)).to.equal(ALLOC - amt);
      expect(await v2.balanceOf(alice.address)).to.equal(amt);
      expect(await v1.totalSupply()).to.equal(v1Total0 - amt);
      expect(await v2.totalSupply()).to.equal(v2Total0 + amt);
      expect(await migration.totalMigrated()).to.equal(amt);
      expect(await migration.migratedBy(alice.address)).to.equal(amt);
    });

    it("rejects zero amount", async () => {
      await expect(migration.connect(alice).migrate(0)).to.be.revertedWith("Migration: zero amount");
    });

    it("rejects without v1 allowance", async () => {
      await expect(
        migration.connect(bob).migrate(ethers.parseUnits("10", 18))
      ).to.be.revertedWithCustomError(v1, "ERC20InsufficientAllowance");
    });

    it("rejects when paused", async () => {
      await migration.setPaused(true);
      await expect(
        migration.connect(alice).migrate(ethers.parseUnits("1", 18))
      ).to.be.revertedWith("Migration: not active");
    });

    it("rejects when closed", async () => {
      await migration.close();
      await expect(
        migration.connect(alice).migrate(ethers.parseUnits("1", 18))
      ).to.be.revertedWith("Migration: not active");
    });

    it("rejects after deadline", async () => {
      await time.increase(91 * ONE_DAY);
      await expect(
        migration.connect(alice).migrate(ethers.parseUnits("1", 18))
      ).to.be.revertedWith("Migration: expired");
    });
  });

  describe("migrate with bonus", () => {
    it("applies 5% bonus when bonusBps = 500", async () => {
      // deploy fresh migration with 5% bonus
      const Mig = await ethers.getContractFactory("CCMMigration");
      const bonusMig = await Mig.deploy(
        await v1.getAddress(), await v2.getAddress(), 500, deadline, admin.address
      );
      const MINTER = await v2.MINTER_ROLE();
      await v2.grantRole(MINTER, await bonusMig.getAddress());

      await v1.connect(alice).approve(await bonusMig.getAddress(), ethers.MaxUint256);
      const amt = ethers.parseUnits("100", 18);
      await bonusMig.connect(alice).migrate(amt);
      // got 105 v2 for 100 v1
      expect(await v2.balanceOf(alice.address)).to.equal(ethers.parseUnits("105", 18));
    });
  });

  describe("migrateWithPermit (gasless approve)", () => {
    it("permits and migrates in one tx", async () => {
      const amt = ethers.parseUnits("100", 18);
      const block = await ethers.provider.getBlock("latest");
      const permitDeadline = (block?.timestamp ?? 0) + 3600;
      const nonce = await v1.nonces(alice.address);

      const domain = {
        name: "CCM Network Token",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await v1.getAddress(),
      };
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };
      const message = {
        owner: alice.address,
        spender: await migration.getAddress(),
        value: amt,
        nonce,
        deadline: permitDeadline,
      };
      const sig = await alice.signTypedData(domain, types, message);
      const { v, r, s } = ethers.Signature.from(sig);

      await migration.connect(alice).migrateWithPermit(amt, amt, permitDeadline, v, r, s);
      expect(await v2.balanceOf(alice.address)).to.equal(amt);
    });
  });

  describe("admin", () => {
    it("setPaused toggles", async () => {
      await migration.setPaused(true);
      expect(await migration.paused()).to.equal(true);
      await migration.setPaused(false);
      expect(await migration.paused()).to.equal(false);
    });

    it("close is permanent", async () => {
      await migration.close();
      expect(await migration.closed()).to.equal(true);
      // No way to reopen
    });

    it("setBonus changes bonus, capped at 50%", async () => {
      await migration.setBonus(1000); // 10%
      expect(await migration.bonusBps()).to.equal(1000n);
      await expect(migration.setBonus(5001)).to.be.revertedWith("Migration: bonus too high");
    });

    it("setDeadline extends; rejects past", async () => {
      const newDeadline = (await time.latest()) + 180 * ONE_DAY;
      await migration.setDeadline(newDeadline);
      expect(await migration.deadline()).to.equal(newDeadline);
      await expect(
        migration.setDeadline((await time.latest()) - 1)
      ).to.be.revertedWith("Migration: deadline past");
    });

    it("non-admin cannot manage", async () => {
      await expect(
        migration.connect(alice).setPaused(true)
      ).to.be.revertedWithCustomError(migration, "AccessControlUnauthorizedAccount");
      await expect(
        migration.connect(alice).close()
      ).to.be.revertedWithCustomError(migration, "AccessControlUnauthorizedAccount");
      await expect(
        migration.connect(alice).setBonus(0)
      ).to.be.revertedWithCustomError(migration, "AccessControlUnauthorizedAccount");
    });

    it("recoverERC20 sends mistakenly-sent tokens", async () => {
      const Mock = await ethers.getContractFactory("MockUSDC");
      const usdc = await Mock.deploy();
      await usdc.mint(await migration.getAddress(), 12345n);
      await migration.recoverERC20(await usdc.getAddress(), bob.address, 12345n);
      expect(await usdc.balanceOf(bob.address)).to.equal(12345n);
    });
  });

  describe("integration: small-holder migration scenario", () => {
    it("3 holders migrate sequentially, totals match", async () => {
      // mint v1 to a 3rd holder
      const carol = (await ethers.getSigners())[3];
      await v1.mint(carol.address, ALLOC);

      for (const u of [alice, bob, carol]) {
        await v1.connect(u).approve(await migration.getAddress(), ethers.MaxUint256);
        await migration.connect(u).migrate(ALLOC);
      }
      expect(await migration.totalMigrated()).to.equal(ALLOC * 3n);
      expect(await v2.totalSupply()).to.equal(ALLOC * 3n);
      expect(await v1.balanceOf(alice.address)).to.equal(0n);
      expect(await v1.balanceOf(bob.address)).to.equal(0n);
      expect(await v1.balanceOf(carol.address)).to.equal(0n);
    });
  });
});
