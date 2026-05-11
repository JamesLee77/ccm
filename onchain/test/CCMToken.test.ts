import { expect } from "chai";
import { ethers } from "hardhat";
import { CCMToken, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const MAX_SUPPLY = ethers.parseUnits("5000000000", 18); // 5B

describe("CCMToken", () => {
  let token: CCMToken;
  let admin: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, user, other] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCMToken");
    token = await Token.deploy(admin.address);
  });

  describe("metadata", () => {
    it("name and symbol", async () => {
      expect(await token.name()).to.equal("CCM Network Token");
      expect(await token.symbol()).to.equal("CCM");
      expect(await token.decimals()).to.equal(18);
    });

    it("MAX_SUPPLY = 5B", async () => {
      expect(await token.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      expect(await token.cap()).to.equal(MAX_SUPPLY);
    });

    it("admin holds DEFAULT_ADMIN_ROLE / MINTER_ROLE / PAUSER_ROLE", async () => {
      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await token.MINTER_ROLE();
      const PAUSER_ROLE = await token.PAUSER_ROLE();
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);
      expect(await token.hasRole(MINTER_ROLE, admin.address)).to.equal(true);
      expect(await token.hasRole(PAUSER_ROLE, admin.address)).to.equal(true);
    });
  });

  describe("constructor guards", () => {
    it("reverts on zero admin", async () => {
      const Token = await ethers.getContractFactory("CCMToken");
      await expect(Token.deploy(ethers.ZeroAddress)).to.be.revertedWith("CCM: admin zero");
    });
  });

  describe("mint", () => {
    it("MINTER can mint up to cap", async () => {
      const amt = ethers.parseUnits("1000", 18);
      await token.mint(user.address, amt);
      expect(await token.balanceOf(user.address)).to.equal(amt);
      expect(await token.totalSupply()).to.equal(amt);
    });

    it("non-MINTER reverts", async () => {
      await expect(
        token.connect(user).mint(user.address, 1n)
      ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });

    it("mint > cap reverts (ERC20ExceededCap)", async () => {
      await token.mint(admin.address, MAX_SUPPLY);
      await expect(token.mint(admin.address, 1n)).to.be.revertedWithCustomError(token, "ERC20ExceededCap");
    });

    it("can mint exactly the cap", async () => {
      await token.mint(admin.address, MAX_SUPPLY);
      expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
    });
  });

  describe("burn", () => {
    it("user can burn own tokens", async () => {
      await token.mint(user.address, ethers.parseUnits("100", 18));
      await token.connect(user).burn(ethers.parseUnits("40", 18));
      expect(await token.balanceOf(user.address)).to.equal(ethers.parseUnits("60", 18));
      expect(await token.totalSupply()).to.equal(ethers.parseUnits("60", 18));
    });

    it("burnFrom respects allowance", async () => {
      await token.mint(user.address, ethers.parseUnits("100", 18));
      await token.connect(user).approve(other.address, ethers.parseUnits("50", 18));
      await token.connect(other).burnFrom(user.address, ethers.parseUnits("30", 18));
      expect(await token.balanceOf(user.address)).to.equal(ethers.parseUnits("70", 18));
    });
  });

  describe("pause", () => {
    it("PAUSER pauses and transfer reverts", async () => {
      await token.mint(user.address, ethers.parseUnits("100", 18));
      await token.pause();
      expect(await token.paused()).to.equal(true);
      await expect(
        token.connect(user).transfer(other.address, 1n)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("non-PAUSER cannot pause", async () => {
      await expect(token.connect(user).pause()).to.be.revertedWithCustomError(
        token, "AccessControlUnauthorizedAccount"
      );
    });

    it("unpause restores transfer", async () => {
      await token.mint(user.address, ethers.parseUnits("100", 18));
      await token.pause();
      await token.unpause();
      await expect(token.connect(user).transfer(other.address, ethers.parseUnits("10", 18))).not.to.be.reverted;
      expect(await token.balanceOf(other.address)).to.equal(ethers.parseUnits("10", 18));
    });
  });

  describe("recoverERC20", () => {
    it("admin recovers stuck ERC-20", async () => {
      const Mock = await ethers.getContractFactory("MockUSDC");
      const usdc = (await Mock.deploy()) as unknown as MockUSDC;
      await usdc.mint(await token.getAddress(), 1_000_000n);
      await token.recoverERC20(await usdc.getAddress(), other.address, 1_000_000n);
      expect(await usdc.balanceOf(other.address)).to.equal(1_000_000n);
    });

    it("cannot recover own token", async () => {
      await expect(
        token.recoverERC20(await token.getAddress(), other.address, 1n)
      ).to.be.revertedWith("CCM: cannot recover self");
    });

    it("cannot send to zero", async () => {
      const Mock = await ethers.getContractFactory("MockUSDC");
      const usdc = (await Mock.deploy()) as unknown as MockUSDC;
      await expect(
        token.recoverERC20(await usdc.getAddress(), ethers.ZeroAddress, 0n)
      ).to.be.revertedWith("CCM: to zero");
    });

    it("non-admin cannot recover", async () => {
      const Mock = await ethers.getContractFactory("MockUSDC");
      const usdc = (await Mock.deploy()) as unknown as MockUSDC;
      await expect(
        token.connect(user).recoverERC20(await usdc.getAddress(), other.address, 0n)
      ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });
  });

  describe("permit (EIP-2612)", () => {
    it("approves via signed message", async () => {
      await token.mint(user.address, ethers.parseUnits("100", 18));
      const value = ethers.parseUnits("50", 18);
      const block = await ethers.provider.getBlock("latest");
      const deadline = (block?.timestamp ?? 0) + 3600;
      const nonce = await token.nonces(user.address);

      const domain = {
        name: "CCM Network Token",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await token.getAddress(),
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
      const message = { owner: user.address, spender: other.address, value, nonce, deadline };
      const sig = await user.signTypedData(domain, types, message);
      const { v, r, s } = ethers.Signature.from(sig);

      await token.permit(user.address, other.address, value, deadline, v, r, s);
      expect(await token.allowance(user.address, other.address)).to.equal(value);
    });
  });
});
