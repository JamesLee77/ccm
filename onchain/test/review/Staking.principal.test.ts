/**
 * Review 2026-09-06 — R-01 / R-02 (CCMStaking + CCMSandboxStaking)
 *
 * R-01  Rewards are paid from the contract's whole ERC-20 balance, which also
 *       holds every staker's principal. If the reward pool is under-funded
 *       (poolRemaining is pure bookkeeping), a claim pays out of other users'
 *       stakes and the last unstaker cannot withdraw.
 * R-02  Every stake/unstake/claim path calls the oracle. A reverting oracle
 *       therefore locks all principal until the admin swaps it (48 h timelock
 *       on mainnet).
 *
 * Expected after fix: rewards never exceed (balance − totalStaked); a broken
 * oracle yields a 0% rate instead of reverting.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const E18 = 10n ** 18n;
const P0 = 15n * 10n ** 16n; // $0.15
const POOL_INIT = 1_000_000n * E18;
const STAKE = 1_000n * E18;
const MONTH = 30 * 24 * 60 * 60;

type Variant = "CCMStaking" | "CCMSandboxStaking";

async function deploy(variant: Variant, opts: { fundPool: boolean; oracle: "mock" | "reverting" }) {
  const [admin, alice, bob] = await ethers.getSigners();
  const token = await (await ethers.getContractFactory("CCMToken")).deploy(admin.address);
  const oracle =
    opts.oracle === "mock"
      ? await (await ethers.getContractFactory("MockPriceOracle")).deploy(P0)
      : await (await ethers.getContractFactory("RevertingOracle")).deploy(P0);
  const staking = await (await ethers.getContractFactory(variant)).deploy(
    await token.getAddress(),
    await oracle.getAddress(),
    P0,
    POOL_INIT,
    admin.address,
  );
  if (opts.fundPool) await token.mint(await staking.getAddress(), POOL_INIT);
  await token.mint(alice.address, STAKE * 10n);
  await token.mint(bob.address, STAKE * 10n);
  if (variant === "CCMStaking") {
    await (staking as any).setEligibleBatch([alice.address, bob.address], true);
  }
  await token.connect(alice).approve(await staking.getAddress(), STAKE * 10n);
  await token.connect(bob).approve(await staking.getAddress(), STAKE * 10n);
  return { token, oracle, staking, admin, alice, bob };
}

for (const variant of ["CCMStaking", "CCMSandboxStaking"] as Variant[]) {
  describe(`${variant} — review R-01 principal protection`, () => {
    it("an unfunded pool never pays rewards out of other stakers' principal", async () => {
      const { token, staking, alice, bob } = await deploy(variant, { fundPool: false, oracle: "mock" });
      const stakingAddr = await staking.getAddress();

      await staking.connect(alice).stake(STAKE);
      await staking.connect(bob).stake(STAKE);
      await time.increase(MONTH); // alice "earns" ~10% on paper

      // Alice claims: with no reward funding the payout must be 0, not bob's tokens.
      const before = await token.balanceOf(alice.address);
      await staking.connect(alice).claim();
      expect((await token.balanceOf(alice.address)) - before).to.equal(0n);

      // Both can still withdraw their full principal.
      await staking.connect(alice).unstake(STAKE);
      await staking.connect(bob).unstake(STAKE);
      expect(await token.balanceOf(stakingAddr)).to.equal(0n);
      expect(await token.balanceOf(alice.address)).to.equal(STAKE * 10n);
      expect(await token.balanceOf(bob.address)).to.equal(STAKE * 10n);
    });

    it("a funded pool still pays rewards (fix must not disable yield)", async () => {
      const { token, staking, alice } = await deploy(variant, { fundPool: true, oracle: "mock" });
      await staking.connect(alice).stake(STAKE);
      await time.increase(MONTH);
      const before = await token.balanceOf(alice.address);
      await staking.connect(alice).claim();
      expect((await token.balanceOf(alice.address)) - before).to.be.gt(0n);
    });
  });

  describe(`${variant} — review R-02 oracle failure tolerance`, () => {
    it("unstake and claim succeed while the oracle reverts (rate falls to 0)", async () => {
      const { token, oracle, staking, alice } = await deploy(variant, { fundPool: true, oracle: "reverting" });
      await staking.connect(alice).stake(STAKE);
      await time.increase(MONTH);

      await (oracle as any).setBroken(true);
      expect(await staking.currentYieldRateBps()).to.equal(0n);
      await expect(staking.connect(alice).claim()).to.not.be.reverted;
      await expect(staking.connect(alice).unstake(STAKE)).to.not.be.reverted;
      expect(await token.balanceOf(alice.address)).to.equal(STAKE * 10n);
    });
  });
}
