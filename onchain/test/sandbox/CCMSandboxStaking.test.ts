import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const E18 = 10n ** 18n;
const P0 = 15n * 10n ** 16n;          // $0.15
const POOL_INIT = 1_000_000n * E18;    // 1M CCM
const STAKE_AMT = 1_000n * E18;        // 1k CCM

async function deploy() {
  const [admin, alice, bob] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("CCMToken");
  const token = await Token.deploy(admin.address);
  await token.waitForDeployment();

  const Oracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = await Oracle.deploy(P0);
  await oracle.waitForDeployment();

  const Staking = await ethers.getContractFactory("CCMSandboxStaking");
  const staking = await Staking.deploy(
    await token.getAddress(),
    await oracle.getAddress(),
    P0,
    POOL_INIT,
    admin.address,
  );
  await staking.waitForDeployment();

  // Fund the staking pool with CCM (transfer model — contract pays rewards from its balance)
  await token.mint(await staking.getAddress(), POOL_INIT);

  // Give alice/bob some CCM to stake
  await token.mint(alice.address, STAKE_AMT * 10n);
  await token.mint(bob.address, STAKE_AMT * 10n);

  return { token, oracle, staking, admin, alice, bob };
}

describe("CCMSandboxStaking", () => {
  it("anyone can stake (no eligibility gate)", async () => {
    const { token, staking, alice } = await deploy();
    await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT);
    await expect(staking.connect(alice).stake(STAKE_AMT))
      .to.emit(staking, "Staked")
      .withArgs(alice.address, STAKE_AMT, STAKE_AMT);
    const u = await staking.users(alice.address);
    expect(u.staked).to.equal(STAKE_AMT);
  });

  it("stake(0) reverts with 'zero amount'", async () => {
    const { staking, alice } = await deploy();
    await expect(staking.connect(alice).stake(0n)).to.be.revertedWith("Staking: zero amount");
  });

  it("pendingReward grows over time", async () => {
    const { token, staking, alice } = await deploy();
    await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT);
    await staking.connect(alice).stake(STAKE_AMT);
    const t0 = await staking.pendingReward(alice.address);
    await time.increase(7 * 24 * 3600); // +7 days
    const t1 = await staking.pendingReward(alice.address);
    expect(t1).to.be.greaterThan(t0);
  });

  it("claim() transfers reward and resets pending", async () => {
    const { token, staking, alice } = await deploy();
    await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT);
    await staking.connect(alice).stake(STAKE_AMT);
    await time.increase(30 * 24 * 3600);
    const before = await token.balanceOf(alice.address);
    await staking.connect(alice).claim();
    const after = await token.balanceOf(alice.address);
    expect(after).to.be.greaterThan(before);
    expect(await staking.pendingReward(alice.address)).to.equal(0n);
  });

  it("unstake(amount) returns principal and harvests reward", async () => {
    const { token, staking, alice } = await deploy();
    await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT);
    await staking.connect(alice).stake(STAKE_AMT);
    await time.increase(7 * 24 * 3600);
    const before = await token.balanceOf(alice.address);
    await staking.connect(alice).unstake(STAKE_AMT);
    const after = await token.balanceOf(alice.address);
    // Should receive principal + harvested reward (so > principal alone)
    expect(after - before).to.be.greaterThanOrEqual(STAKE_AMT);
  });

  it("yield rate is at maximum when pool is fresh and price equals TGE", async () => {
    const { staking } = await deploy();
    const rate = await staking.currentYieldRateBps();
    // R0 = 1000 bps (10%/month). With price = P0_TGE and full pool, rate ≈ R0.
    expect(rate).to.be.closeTo(1000n, 5n);
  });

  it("yield rate decays as pool drains", async () => {
    const { token, staking, alice } = await deploy();
    await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT * 10n);
    await staking.connect(alice).stake(STAKE_AMT * 10n);
    await time.increase(60 * 24 * 3600); // 60 days — many claims
    await staking.connect(alice).claim();
    const rate = await staking.currentYieldRateBps();
    expect(rate).to.be.lessThan(1000n);
  });

  it("pool exhaustion: when poolRemaining == 0 yield rate is 0", async () => {
    const { token, oracle, alice } = await deploy();
    // Use a tiny pool so we can exhaust it
    const Staking = await ethers.getContractFactory("CCMSandboxStaking");
    const tiny = 100n * E18;
    const smallStaking = await Staking.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      P0,
      tiny,
      (await ethers.getSigners())[0].address,
    );
    await smallStaking.waitForDeployment();
    await token.mint(await smallStaking.getAddress(), tiny);
    await token.connect(alice).approve(await smallStaking.getAddress(), STAKE_AMT);
    await smallStaking.connect(alice).stake(STAKE_AMT);
    await time.increase(365 * 24 * 3600); // 1 year — should drain
    await smallStaking.connect(alice).claim();
    const rate = await smallStaking.currentYieldRateBps();
    expect(rate).to.equal(0n);
  });
});
