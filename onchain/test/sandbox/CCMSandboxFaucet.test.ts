/**
 * Tests for CCMSandboxFaucet.
 *
 * The faucet has no admin, no pause, and only one user-callable function
 * (`claim()`). The complete behavioral surface is:
 *   - Reverts if token is the zero address
 *   - First claim from a new address mints CLAIM_AMOUNT
 *   - Second claim within COOLDOWN reverts
 *   - Second claim after COOLDOWN succeeds
 *   - Counters and view helpers track state correctly
 *   - Faucet cannot mint without MINTER_ROLE (delegates to CCMToken)
 *   - 5B cap on CCMToken is honored (faucet inherits the cap from the token)
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { CCMToken, CCMSandboxFaucet } from "../../typechain-types";

const CLAIM = 100n * 10n ** 18n;
const COOLDOWN = 24 * 60 * 60; // 1 day
const DEAD = "0x000000000000000000000000000000000000dEaD";

describe("CCMSandboxFaucet", () => {
  let token: CCMToken;
  let faucet: CCMSandboxFaucet;
  let admin: any, alice: any, bob: any;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCMToken");
    token = (await Token.deploy(admin.address)) as unknown as CCMToken;
    await token.waitForDeployment();

    const Faucet = await ethers.getContractFactory("CCMSandboxFaucet");
    faucet = (await Faucet.deploy(await token.getAddress())) as unknown as CCMSandboxFaucet;
    await faucet.waitForDeployment();

    // Grant MINTER_ROLE so the faucet can mint
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, await faucet.getAddress());
  });

  describe("constructor", () => {
    it("reverts on zero token", async () => {
      const Faucet = await ethers.getContractFactory("CCMSandboxFaucet");
      await expect(Faucet.deploy(ethers.ZeroAddress)).to.be.revertedWith("Faucet: token zero");
    });

    it("sets immutable token", async () => {
      expect(await faucet.token()).to.equal(await token.getAddress());
    });

    it("constants are correct", async () => {
      expect(await faucet.CLAIM_AMOUNT()).to.equal(CLAIM);
      expect(await faucet.COOLDOWN()).to.equal(COOLDOWN);
    });
  });

  describe("claim", () => {
    it("first claim mints CLAIM_AMOUNT", async () => {
      await expect(faucet.connect(alice).claim()).to.emit(faucet, "Claimed");
      expect(await token.balanceOf(alice.address)).to.equal(CLAIM);
      expect(await faucet.totalMinted()).to.equal(CLAIM);
      expect(await faucet.claimCount()).to.equal(1);
    });

    it("second claim within cooldown reverts", async () => {
      await faucet.connect(alice).claim();
      await expect(faucet.connect(alice).claim()).to.be.revertedWith("Faucet: cooldown active");
    });

    it("second claim after cooldown succeeds", async () => {
      await faucet.connect(alice).claim();
      await time.increase(COOLDOWN + 1);
      await faucet.connect(alice).claim();
      expect(await token.balanceOf(alice.address)).to.equal(CLAIM * 2n);
      expect(await faucet.claimCount()).to.equal(2);
    });

    it("two different users claim independently", async () => {
      await faucet.connect(alice).claim();
      await faucet.connect(bob).claim();
      expect(await token.balanceOf(alice.address)).to.equal(CLAIM);
      expect(await token.balanceOf(bob.address)).to.equal(CLAIM);
      expect(await faucet.totalMinted()).to.equal(CLAIM * 2n);
    });

    it("cannot mint without MINTER_ROLE", async () => {
      const MINTER_ROLE = await token.MINTER_ROLE();
      await token.revokeRole(MINTER_ROLE, await faucet.getAddress());
      await expect(faucet.connect(alice).claim()).to.be.reverted;
    });

    it("respects CCMToken 5B hard cap", async () => {
      // Drain all but 50 CCM of cap, then a claim should revert
      const cap = await token.cap();
      const nearCap = cap - 50n * 10n ** 18n;
      await token.mint(DEAD, nearCap);
      // Faucet tries to mint 100 more → cap exceeded
      await expect(faucet.connect(alice).claim()).to.be.reverted;
    });
  });

  describe("view helpers", () => {
    it("nextClaimAt returns 0 for never-claimed user", async () => {
      expect(await faucet.nextClaimAt(alice.address)).to.equal(0);
    });

    it("nextClaimAt returns last + COOLDOWN after a claim", async () => {
      const tx = await faucet.connect(alice).claim();
      const r = await tx.wait();
      const block = await ethers.provider.getBlock(r!.blockNumber);
      expect(await faucet.nextClaimAt(alice.address)).to.equal(BigInt(block!.timestamp) + BigInt(COOLDOWN));
    });

    it("cooldownRemaining is 0 before first claim", async () => {
      expect(await faucet.cooldownRemaining(alice.address)).to.equal(0);
    });

    it("cooldownRemaining decreases over time", async () => {
      await faucet.connect(alice).claim();
      const half = COOLDOWN / 2;
      await time.increase(half);
      const remaining = Number(await faucet.cooldownRemaining(alice.address));
      // Should be roughly COOLDOWN/2; allow ±2s slop
      expect(remaining).to.be.gt(half - 5);
      expect(remaining).to.be.lt(half + 5);
    });

    it("cooldownRemaining is 0 after cooldown elapses", async () => {
      await faucet.connect(alice).claim();
      await time.increase(COOLDOWN + 1);
      expect(await faucet.cooldownRemaining(alice.address)).to.equal(0);
    });
  });
});
