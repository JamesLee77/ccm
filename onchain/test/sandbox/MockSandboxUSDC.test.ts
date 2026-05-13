import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { MockSandboxUSDC } from "../../typechain-types";

describe("MockSandboxUSDC", () => {
  let usdc: MockSandboxUSDC;
  let owner: any, alice: any, bob: any;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const F = await ethers.getContractFactory("MockSandboxUSDC");
    usdc = await F.deploy(owner.address);
    await usdc.waitForDeployment();
  });

  it("has 6 decimals and correct metadata", async () => {
    expect(await usdc.decimals()).to.equal(6);
    expect(await usdc.symbol()).to.equal("sUSDC");
    expect(await usdc.name()).to.equal("Sandbox USDC");
  });

  it("faucet mints 100 USDC to msg.sender", async () => {
    const amount = await usdc.FAUCET_AMOUNT();
    expect(amount).to.equal(100n * 10n ** 6n);
    await expect(usdc.connect(alice).faucet())
      .to.emit(usdc, "FaucetClaimed")
      .withArgs(alice.address, amount);
    expect(await usdc.balanceOf(alice.address)).to.equal(amount);
  });

  it("faucet enforces 1h cooldown", async () => {
    await usdc.connect(alice).faucet();
    await expect(usdc.connect(alice).faucet()).to.be.revertedWith("sUSDC: cooldown");
    await time.increase(3600);
    await expect(usdc.connect(alice).faucet()).to.emit(usdc, "FaucetClaimed");
  });

  it("cooldownRemaining returns 0 when ready, positive after claim", async () => {
    expect(await usdc.cooldownRemaining(alice.address)).to.equal(0n);
    await usdc.connect(alice).faucet();
    const rem = await usdc.cooldownRemaining(alice.address);
    expect(rem).to.be.gt(0n);
    expect(rem).to.be.lte(3600n);
    await time.increase(3600);
    expect(await usdc.cooldownRemaining(alice.address)).to.equal(0n);
  });

  it("ownerMint mints arbitrary amount to any address", async () => {
    const amount = 1_000n * 10n ** 6n; // 1000 USDC
    await expect(usdc.ownerMint(bob.address, amount))
      .to.emit(usdc, "OwnerMinted")
      .withArgs(bob.address, amount);
    expect(await usdc.balanceOf(bob.address)).to.equal(amount);
  });

  it("non-owner cannot ownerMint", async () => {
    await expect(
      usdc.connect(alice).ownerMint(alice.address, 1n),
    ).to.be.reverted;
  });

  it("ERC20 transfer + balanceOf work normally", async () => {
    await usdc.ownerMint(alice.address, 50n * 10n ** 6n);
    await usdc.connect(alice).transfer(bob.address, 20n * 10n ** 6n);
    expect(await usdc.balanceOf(alice.address)).to.equal(30n * 10n ** 6n);
    expect(await usdc.balanceOf(bob.address)).to.equal(20n * 10n ** 6n);
  });
});
