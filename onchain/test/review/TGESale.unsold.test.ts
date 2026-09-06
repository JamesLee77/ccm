/**
 * Review 2026-09-06 — R-04 (CCMTGESale)
 *
 * A round is pre-funded with `hardCapTokens` of CCM but the contract has no
 * way to return the unsold remainder after the round ends. Under-subscribed
 * rounds therefore strand CCM forever. Fix: `withdrawUnsoldCCM(roundId, to)`
 * callable once per round after it closes or ends, never touching the
 * buyers' claimable allocations.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const ONE_DAY = 24 * 60 * 60;
const ONE_YEAR = 365 * ONE_DAY;
const HARDCAP = ethers.parseUnits("1000000", 18);
const PRICE = ethers.parseUnits("0.15", 6);
const BUY = ethers.parseUnits("250000", 18);

describe("CCMTGESale — review R-04 unsold CCM recovery", () => {
  async function setup() {
    const [admin, buyer, treasury] = await ethers.getSigners();
    const token = await (await ethers.getContractFactory("CCMToken")).deploy(admin.address);
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const tge = await (await ethers.getContractFactory("CCMTGESale")).deploy(
      await token.getAddress(), await usdc.getAddress(), admin.address,
    );
    await token.mint(await tge.getAddress(), HARDCAP);
    await usdc.mint(buyer.address, ethers.parseUnits("1000000", 6));
    const start = await time.latest();
    await tge.createRound("Seed", PRICE, HARDCAP, 0, ONE_YEAR, start, start + 30 * ONE_DAY);
    await tge.setWhitelist(0, buyer.address, true);
    await usdc.connect(buyer).approve(await tge.getAddress(), ethers.MaxUint256);
    await tge.connect(buyer).purchase(0, BUY);
    return { admin, buyer, treasury, token, tge };
  }

  it("refuses while the round is still open", async () => {
    const { tge, treasury } = await setup();
    await expect(tge.withdrawUnsoldCCM(0, treasury.address)).to.be.revertedWith("TGE: round open");
  });

  it("returns exactly hardCap − sold once, and buyers can still claim everything", async () => {
    const { tge, token, buyer, treasury } = await setup();
    await tge.closeRound(0);

    await expect(tge.withdrawUnsoldCCM(0, treasury.address))
      .to.emit(tge, "UnsoldWithdrawn").withArgs(0, treasury.address, HARDCAP - BUY);
    expect(await token.balanceOf(treasury.address)).to.equal(HARDCAP - BUY);
    expect(await token.balanceOf(await tge.getAddress())).to.equal(BUY);

    // second call has nothing left
    await expect(tge.withdrawUnsoldCCM(0, treasury.address)).to.be.revertedWith("TGE: nothing unsold");

    // buyer's full allocation is still claimable after vesting completes
    await time.increase(ONE_YEAR + 1);
    await tge.connect(buyer).claim(0);
    expect(await token.balanceOf(buyer.address)).to.equal(BUY);
    expect(await token.balanceOf(await tge.getAddress())).to.equal(0n);
  });

  it("is admin-only", async () => {
    const { tge, buyer } = await setup();
    await tge.closeRound(0);
    await expect(tge.connect(buyer).withdrawUnsoldCCM(0, buyer.address)).to.be.reverted;
  });
});
