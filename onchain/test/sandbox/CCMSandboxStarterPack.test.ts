import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { CCMSandboxStarterPack, MockSandboxUSDC, CCMToken } from "../../typechain-types";

describe("CCMSandboxStarterPack", () => {
  let starter: CCMSandboxStarterPack;
  let ccm: CCMToken;
  let susdc: MockSandboxUSDC;
  let owner: any, alice: any, bob: any;

  const CCM_AMT = 50n * 10n ** 18n;
  const SUSDC_AMT = 100n * 10n ** 6n;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const CCM = await ethers.getContractFactory("CCMToken");
    ccm = await CCM.deploy(owner.address);
    await ccm.waitForDeployment();
    const USDC = await ethers.getContractFactory("MockSandboxUSDC");
    susdc = await USDC.deploy(owner.address);
    await susdc.waitForDeployment();
    const Starter = await ethers.getContractFactory("CCMSandboxStarterPack");
    starter = await Starter.deploy(await ccm.getAddress(), await susdc.getAddress(), owner.address);
    await starter.waitForDeployment();
    // Grant MINTER_ROLE on CCMToken to the starter pack
    const MINTER = await ccm.MINTER_ROLE();
    await ccm.grantRole(MINTER, await starter.getAddress());
    // Preload starter pack with sUSDC
    await susdc.ownerMint(await starter.getAddress(), 1_000n * 10n ** 6n); // 1000 sUSDC
  });

  it("starter pack initialized correctly", async () => {
    expect(await starter.CCM_AMOUNT()).to.equal(CCM_AMT);
    expect(await starter.SUSDC_AMOUNT()).to.equal(SUSDC_AMT);
    expect(await starter.COOLDOWN()).to.equal(3600n);
    expect(await starter.cooldownRemaining(alice.address)).to.equal(0n);
  });

  it("claim mints CCM + transfers sUSDC", async () => {
    await expect(starter.connect(alice).claim())
      .to.emit(starter, "StarterPackClaimed")
      .withArgs(alice.address, CCM_AMT, SUSDC_AMT);
    expect(await ccm.balanceOf(alice.address)).to.equal(CCM_AMT);
    expect(await susdc.balanceOf(alice.address)).to.equal(SUSDC_AMT);
  });

  it("enforces 1h cooldown", async () => {
    await starter.connect(alice).claim();
    await expect(starter.connect(alice).claim())
      .to.be.revertedWithCustomError(starter, "CooldownActive");
    await time.increase(3600);
    await expect(starter.connect(alice).claim()).to.emit(starter, "StarterPackClaimed");
  });

  it("different addresses have independent cooldowns", async () => {
    await starter.connect(alice).claim();
    await expect(starter.connect(bob).claim()).to.emit(starter, "StarterPackClaimed");
  });

  it("cooldownRemaining returns 0 ready / positive after claim", async () => {
    expect(await starter.cooldownRemaining(alice.address)).to.equal(0n);
    await starter.connect(alice).claim();
    const rem = await starter.cooldownRemaining(alice.address);
    expect(rem).to.be.gt(0n);
    expect(rem).to.be.lte(3600n);
    await time.increase(3600);
    expect(await starter.cooldownRemaining(alice.address)).to.equal(0n);
  });

  it("reverts if sUSDC reserve insufficient", async () => {
    // Drain almost all sUSDC, leaving only 50 < SUSDC_AMOUNT
    const have: bigint = await susdc.balanceOf(await starter.getAddress());
    await starter.withdrawSUsdc(owner.address, have - 50n * 10n ** 6n);
    await expect(starter.connect(alice).claim())
      .to.be.revertedWithCustomError(starter, "InsufficientSUsdcBalance");
  });

  it("owner can withdraw sUSDC; non-owner cannot", async () => {
    const before = await susdc.balanceOf(owner.address);
    await starter.withdrawSUsdc(owner.address, 100n * 10n ** 6n);
    expect(await susdc.balanceOf(owner.address)).to.equal(before + 100n * 10n ** 6n);
    await expect(starter.connect(alice).withdrawSUsdc(alice.address, 1n)).to.be.reverted;
  });

  it("constructor reverts on zero addresses", async () => {
    const F = await ethers.getContractFactory("CCMSandboxStarterPack");
    await expect(F.deploy(ethers.ZeroAddress, await susdc.getAddress(), owner.address))
      .to.be.revertedWith("StarterPack: zero addr");
    await expect(F.deploy(await ccm.getAddress(), ethers.ZeroAddress, owner.address))
      .to.be.revertedWith("StarterPack: zero addr");
  });
});
