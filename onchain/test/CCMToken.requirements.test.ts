/**
 * Requirements-driven TDD tests for CCMToken.
 *
 * Each test maps to a functional requirement (FR-x.y) from
 * CCM_Business_Model_and_Requirements.md. Written test-first:
 *   1. RED   — write assertion describing required behavior
 *   2. RUN   — execute and observe pass/fail
 *   3. GREEN — if fail, fix contract; if pass, behavior is verified
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { CCMToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CCMToken — Requirements", () => {
  let token: CCMToken;
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCMToken");
    token = await Token.deploy(admin.address);
    await token.mint(alice.address, ethers.parseUnits("1000", 18));
  });

  describe("FR-1.1 ERC-20 standard conformance", () => {
    it("transfer emits Transfer(from, to, amount)", async () => {
      const amt = ethers.parseUnits("100", 18);
      await expect(token.connect(alice).transfer(bob.address, amt))
        .to.emit(token, "Transfer")
        .withArgs(alice.address, bob.address, amt);
    });

    it("approve sets allowance and emits Approval", async () => {
      const amt = ethers.parseUnits("50", 18);
      await expect(token.connect(alice).approve(bob.address, amt))
        .to.emit(token, "Approval")
        .withArgs(alice.address, bob.address, amt);
      expect(await token.allowance(alice.address, bob.address)).to.equal(amt);
    });

    it("transferFrom respects allowance and decreases it", async () => {
      const allow = ethers.parseUnits("100", 18);
      const spend = ethers.parseUnits("60", 18);
      await token.connect(alice).approve(bob.address, allow);
      await token.connect(bob).transferFrom(alice.address, bob.address, spend);
      expect(await token.balanceOf(bob.address)).to.equal(spend);
      expect(await token.allowance(alice.address, bob.address)).to.equal(allow - spend);
    });

    it("transfer beyond balance reverts (ERC20InsufficientBalance)", async () => {
      const overdraw = ethers.parseUnits("99999999", 18);
      await expect(
        token.connect(alice).transfer(bob.address, overdraw)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("transferFrom beyond allowance reverts (ERC20InsufficientAllowance)", async () => {
      await token.connect(alice).approve(bob.address, ethers.parseUnits("10", 18));
      await expect(
        token.connect(bob).transferFrom(alice.address, bob.address, ethers.parseUnits("11", 18))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });

    it("balanceOf reflects mint/burn/transfer", async () => {
      expect(await token.balanceOf(alice.address)).to.equal(ethers.parseUnits("1000", 18));
      await token.connect(alice).burn(ethers.parseUnits("100", 18));
      expect(await token.balanceOf(alice.address)).to.equal(ethers.parseUnits("900", 18));
      await token.connect(alice).transfer(bob.address, ethers.parseUnits("400", 18));
      expect(await token.balanceOf(alice.address)).to.equal(ethers.parseUnits("500", 18));
      expect(await token.balanceOf(bob.address)).to.equal(ethers.parseUnits("400", 18));
    });
  });

  describe("FR-5.3 burn event emission (Transfer to zero)", () => {
    it("burn emits Transfer(holder, 0x0, amount)", async () => {
      const amt = ethers.parseUnits("250", 18);
      await expect(token.connect(alice).burn(amt))
        .to.emit(token, "Transfer")
        .withArgs(alice.address, ethers.ZeroAddress, amt);
    });

    it("burnFrom emits Transfer(holder, 0x0, amount)", async () => {
      const amt = ethers.parseUnits("100", 18);
      await token.connect(alice).approve(bob.address, amt);
      await expect(token.connect(bob).burnFrom(alice.address, amt))
        .to.emit(token, "Transfer")
        .withArgs(alice.address, ethers.ZeroAddress, amt);
    });

    it("totalSupply decreases by burned amount", async () => {
      const before = await token.totalSupply();
      const burn = ethers.parseUnits("123", 18);
      await token.connect(alice).burn(burn);
      expect(await token.totalSupply()).to.equal(before - burn);
    });
  });
});
