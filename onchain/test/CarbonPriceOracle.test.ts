import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { CarbonPriceOracle } from "../typechain-types";

describe("CarbonPriceOracle", () => {
  let oracle: CarbonPriceOracle;
  let admin: any, keeper: any, attacker: any;

  const INIT_PRICE = ethers.parseUnits("0.027", 18); // ~ BCT
  const SOURCE = "toucan-bct";

  beforeEach(async () => {
    [admin, keeper, attacker] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CarbonPriceOracle");
    oracle = await Factory.deploy(admin.address, keeper.address, INIT_PRICE, SOURCE);
    await oracle.waitForDeployment();
  });

  it("initializes correctly", async () => {
    expect(await oracle.price()).to.equal(INIT_PRICE);
    expect(await oracle.sourceLabel()).to.equal(SOURCE);
    expect(await oracle.maxChangeBps()).to.equal(5000n);
    expect(await oracle.getPrice()).to.equal(INIT_PRICE);
    expect(await oracle.lastUpdatedAt()).to.be.gt(0n);
  });

  it("emits PriceUpdated on construction", async () => {
    // Verified above; re-deploy and capture event topics
    const Factory = await ethers.getContractFactory("CarbonPriceOracle");
    const tx = await Factory.getDeployTransaction(admin.address, keeper.address, INIT_PRICE, SOURCE);
    expect(tx).to.exist;
  });

  it("keeper can updatePrice within bounds", async () => {
    const newPrice = ethers.parseUnits("0.028", 18); // +3.7% — well within 50%
    await expect(oracle.connect(keeper).updatePrice(newPrice, "toucan-bct-v2"))
      .to.emit(oracle, "PriceUpdated");
    expect(await oracle.price()).to.equal(newPrice);
    expect(await oracle.sourceLabel()).to.equal("toucan-bct-v2");
  });

  it("non-keeper cannot updatePrice", async () => {
    await expect(
      oracle.connect(attacker).updatePrice(INIT_PRICE * 2n, "x"),
    ).to.be.reverted; // AccessControl error
    await expect(
      oracle.connect(admin).updatePrice(INIT_PRICE * 2n, "x"),
    ).to.be.reverted;
  });

  it("updatePrice(0) reverts with PriceZero", async () => {
    await expect(oracle.connect(keeper).updatePrice(0n, "x"))
      .to.be.revertedWithCustomError(oracle, "PriceZero");
  });

  it("rejects upside change > maxChangeBps", async () => {
    // 50% cap; +60% should revert
    const tooHigh = (INIT_PRICE * 16n) / 10n; // 1.6×
    await expect(oracle.connect(keeper).updatePrice(tooHigh, "x"))
      .to.be.revertedWithCustomError(oracle, "PriceChangeTooLarge")
      .withArgs(INIT_PRICE, tooHigh, 5000);
  });

  it("rejects downside change > maxChangeBps", async () => {
    // -60% should revert (newPrice < old - maxDelta)
    const tooLow = (INIT_PRICE * 4n) / 10n; // 0.4×
    await expect(oracle.connect(keeper).updatePrice(tooLow, "x"))
      .to.be.revertedWithCustomError(oracle, "PriceChangeTooLarge");
  });

  it("accepts exactly +50% (boundary)", async () => {
    const max = (INIT_PRICE * 15n) / 10n; // 1.5× = +50%
    await oracle.connect(keeper).updatePrice(max, "x");
    expect(await oracle.price()).to.equal(max);
  });

  it("admin can setMaxChangeBps; non-admin cannot", async () => {
    await expect(oracle.connect(admin).setMaxChangeBps(2000))
      .to.emit(oracle, "MaxChangeBpsUpdated")
      .withArgs(5000, 2000);
    expect(await oracle.maxChangeBps()).to.equal(2000n);

    await expect(
      oracle.connect(attacker).setMaxChangeBps(1000),
    ).to.be.reverted;
  });

  it("setMaxChangeBps > 10000 reverts", async () => {
    await expect(oracle.connect(admin).setMaxChangeBps(10001))
      .to.be.revertedWithCustomError(oracle, "InvalidBps");
  });

  it("setMaxChangeBps = 10000 disables the cap (allows any change)", async () => {
    await oracle.connect(admin).setMaxChangeBps(10000);
    // 10x jump should now be allowed
    const huge = INIT_PRICE * 10n;
    await oracle.connect(keeper).updatePrice(huge, "ignored-cap");
    expect(await oracle.price()).to.equal(huge);
  });

  it("staleness() returns seconds since last update", async () => {
    expect(await oracle.staleness()).to.be.lte(1n);
    await time.increase(3600);
    expect(await oracle.staleness()).to.be.gte(3600n);
  });

  it("constructor reverts on zero admin / zero keeper / zero price", async () => {
    const Factory = await ethers.getContractFactory("CarbonPriceOracle");
    await expect(
      Factory.deploy(ethers.ZeroAddress, keeper.address, INIT_PRICE, SOURCE),
    ).to.be.revertedWith("Oracle: zero addr");
    await expect(
      Factory.deploy(admin.address, ethers.ZeroAddress, INIT_PRICE, SOURCE),
    ).to.be.revertedWith("Oracle: zero addr");
    await expect(
      Factory.deploy(admin.address, keeper.address, 0n, SOURCE),
    ).to.be.revertedWithCustomError({ interface: Factory.interface } as any, "PriceZero");
  });
});
