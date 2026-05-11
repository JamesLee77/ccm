import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type {
  CCMBasketToken,
  CCMSandboxIndexBasket,
  CCMSandboxNFT,
  CCMSandboxGradeWrapper,
  CCMGradeToken,
} from "../../typechain-types";

const Grade = { A: 0, B: 1, C: 2, D: 3 } as const;
const PROJECT = ethers.id("project:basket-test");
const E18 = 10n ** 18n;

describe("CCMSandboxIndexBasket", () => {
  let nft: CCMSandboxNFT;
  let gradeWrapper: CCMSandboxGradeWrapper;
  let basket: CCMSandboxIndexBasket;
  let tokenA: CCMGradeToken,
    tokenB: CCMGradeToken,
    tokenC: CCMGradeToken,
    tokenD: CCMGradeToken;
  let prime: CCMBasketToken,
    forest: CCMBasketToken,
    tech: CCMBasketToken;
  let alice: any, bob: any;

  beforeEach(async () => {
    [, alice, bob] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("CCMSandboxNFT");
    nft = (await NFT.deploy()) as unknown as CCMSandboxNFT;

    const Wrapper = await ethers.getContractFactory("CCMSandboxGradeWrapper");
    gradeWrapper = (await Wrapper.deploy(await nft.getAddress())) as unknown as CCMSandboxGradeWrapper;

    const GradeFactory = await ethers.getContractFactory("CCMGradeToken");
    tokenA = GradeFactory.attach(await gradeWrapper.tokenOf(0)) as unknown as CCMGradeToken;
    tokenB = GradeFactory.attach(await gradeWrapper.tokenOf(1)) as unknown as CCMGradeToken;
    tokenC = GradeFactory.attach(await gradeWrapper.tokenOf(2)) as unknown as CCMGradeToken;
    tokenD = GradeFactory.attach(await gradeWrapper.tokenOf(3)) as unknown as CCMGradeToken;

    const Basket = await ethers.getContractFactory("CCMSandboxIndexBasket");
    basket = (await Basket.deploy([
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      await tokenC.getAddress(),
      await tokenD.getAddress(),
    ])) as unknown as CCMSandboxIndexBasket;

    const BasketTokFactory = await ethers.getContractFactory("CCMBasketToken");
    prime = BasketTokFactory.attach(await basket.tokenOf(0)) as unknown as CCMBasketToken;
    forest = BasketTokFactory.attach(await basket.tokenOf(1)) as unknown as CCMBasketToken;
    tech = BasketTokFactory.attach(await basket.tokenOf(2)) as unknown as CCMBasketToken;
  });

  // Helper: get grade tokens by minting NFT, approving wrapper, wrapping.
  async function getGradeTokens(signer: any, grade: number, tonnes: number) {
    await nft.connect(signer).mint(grade, 2026, tonnes, PROJECT);
    const id = (await nft.nextId()) - 1n;
    await nft.connect(signer).setApprovalForAll(await gradeWrapper.getAddress(), true);
    await gradeWrapper.connect(signer).wrap(id, tonnes);
  }

  describe("constructor", () => {
    it("rejects zero grade-token address", async () => {
      const F = await ethers.getContractFactory("CCMSandboxIndexBasket");
      await expect(
        F.deploy([
          ethers.ZeroAddress,
          await tokenB.getAddress(),
          await tokenC.getAddress(),
          await tokenD.getAddress(),
        ]),
      ).to.be.revertedWith("Basket: zero grade token");
    });

    it("deploys 3 basket tokens with correct symbols", async () => {
      expect(await prime.symbol()).to.equal("CCM-PRIME");
      expect(await forest.symbol()).to.equal("CCM-FOREST");
      expect(await tech.symbol()).to.equal("CCM-TECH");
    });

    it("each basket's weights sum to 10000 bps", async () => {
      for (let i = 0; i < 3; i++) {
        const w = await basket.weightsOf(i);
        const sum = Number(w[0]) + Number(w[1]) + Number(w[2]) + Number(w[3]);
        expect(sum).to.equal(10000);
      }
    });

    it("PRIME weights = [60, 30, 10, 0]", async () => {
      const w = await basket.weightsOf(0);
      expect(w[0]).to.equal(6000);
      expect(w[1]).to.equal(3000);
      expect(w[2]).to.equal(1000);
      expect(w[3]).to.equal(0);
    });

    it("FOREST weights = [0, 30, 60, 10]", async () => {
      const w = await basket.weightsOf(1);
      expect(w[0]).to.equal(0);
      expect(w[1]).to.equal(3000);
      expect(w[2]).to.equal(6000);
      expect(w[3]).to.equal(1000);
    });

    it("TECH weights = [70, 30, 0, 0]", async () => {
      const w = await basket.weightsOf(2);
      expect(w[0]).to.equal(7000);
      expect(w[1]).to.equal(3000);
      expect(w[2]).to.equal(0);
      expect(w[3]).to.equal(0);
    });

    it("basket token minter is the basket contract", async () => {
      const a = await basket.getAddress();
      expect(await prime.minter()).to.equal(a);
      expect(await forest.minter()).to.equal(a);
      expect(await tech.minter()).to.equal(a);
    });
  });

  describe("quoteMint / quoteRedeem", () => {
    it("PRIME 1.0 token requires 0.6 A + 0.3 B + 0.1 C + 0.0 D", async () => {
      const needs = await basket.quoteMint(0, E18);
      expect(needs[0]).to.equal((6n * E18) / 10n);
      expect(needs[1]).to.equal((3n * E18) / 10n);
      expect(needs[2]).to.equal(E18 / 10n);
      expect(needs[3]).to.equal(0n);
    });

    it("FOREST 10 tokens requires 0 A, 3 B, 6 C, 1 D", async () => {
      const needs = await basket.quoteMint(1, 10n * E18);
      expect(needs[0]).to.equal(0n);
      expect(needs[1]).to.equal(3n * E18);
      expect(needs[2]).to.equal(6n * E18);
      expect(needs[3]).to.equal(E18);
    });

    it("quoteRedeem mirrors quoteMint", async () => {
      const m = await basket.quoteMint(2, 5n * E18);
      const r = await basket.quoteRedeem(2, 5n * E18);
      expect(m[0]).to.equal(r[0]);
      expect(m[1]).to.equal(r[1]);
      expect(m[2]).to.equal(r[2]);
      expect(m[3]).to.equal(r[3]);
    });
  });

  describe("mint", () => {
    it("happy path: PRIME 1.0 — pulls grade tokens, mints basket", async () => {
      // Get grade tokens by wrapping NFTs
      await getGradeTokens(alice, Grade.A, 10); // 10 CCM-A
      await time.increase(60 * 60 + 1);
      await getGradeTokens(alice, Grade.B, 10);
      await time.increase(60 * 60 + 1);
      await getGradeTokens(alice, Grade.C, 10);

      // Approve basket for each grade token
      await tokenA.connect(alice).approve(await basket.getAddress(), 10n * E18);
      await tokenB.connect(alice).approve(await basket.getAddress(), 10n * E18);
      await tokenC.connect(alice).approve(await basket.getAddress(), 10n * E18);

      // Mint 1 PRIME → needs 0.6 A + 0.3 B + 0.1 C
      await expect(basket.connect(alice).mint(0, E18))
        .to.emit(basket, "BasketMinted")
        .withArgs(0, alice.address, E18);

      expect(await prime.balanceOf(alice.address)).to.equal(E18);
      expect(await tokenA.balanceOf(alice.address)).to.equal(10n * E18 - (6n * E18) / 10n);
      expect(await tokenB.balanceOf(alice.address)).to.equal(10n * E18 - (3n * E18) / 10n);
      expect(await tokenC.balanceOf(alice.address)).to.equal(10n * E18 - E18 / 10n);
      // Basket holds the deposited grades
      expect(await tokenA.balanceOf(await basket.getAddress())).to.equal((6n * E18) / 10n);
    });

    it("zero amount reverts", async () => {
      await expect(basket.connect(alice).mint(0, 0)).to.be.revertedWith("Basket: zero amount");
    });

    it("bad basket reverts", async () => {
      await expect(basket.connect(alice).mint(3, E18)).to.be.revertedWith("Basket: bad basket");
    });

    it("requires approval on each grade token", async () => {
      await getGradeTokens(alice, Grade.A, 10);
      await time.increase(60 * 60 + 1);
      await getGradeTokens(alice, Grade.B, 10);
      await time.increase(60 * 60 + 1);
      await getGradeTokens(alice, Grade.C, 10);

      // Only approve A; B and C still missing
      await tokenA.connect(alice).approve(await basket.getAddress(), 10n * E18);
      await expect(basket.connect(alice).mint(0, E18)).to.be.reverted;
    });

    it("TECH skips D entirely (weight 0)", async () => {
      await getGradeTokens(alice, Grade.A, 10);
      await time.increase(60 * 60 + 1);
      await getGradeTokens(alice, Grade.B, 10);

      await tokenA.connect(alice).approve(await basket.getAddress(), 10n * E18);
      await tokenB.connect(alice).approve(await basket.getAddress(), 10n * E18);

      // TECH 1.0 needs 0.7 A + 0.3 B + 0 C + 0 D
      await basket.connect(alice).mint(2, E18);
      expect(await tech.balanceOf(alice.address)).to.equal(E18);
      // No D needed — alice never had any D
      expect(await tokenD.balanceOf(alice.address)).to.equal(0n);
    });
  });

  describe("redeem", () => {
    beforeEach(async () => {
      await getGradeTokens(alice, Grade.A, 10);
      await time.increase(60 * 60 + 1);
      await getGradeTokens(alice, Grade.B, 10);
      await time.increase(60 * 60 + 1);
      await getGradeTokens(alice, Grade.C, 10);

      await tokenA.connect(alice).approve(await basket.getAddress(), 10n * E18);
      await tokenB.connect(alice).approve(await basket.getAddress(), 10n * E18);
      await tokenC.connect(alice).approve(await basket.getAddress(), 10n * E18);

      // Mint 5 PRIME → uses 3 A, 1.5 B, 0.5 C
      await basket.connect(alice).mint(0, 5n * E18);
    });

    it("burns basket, returns grades pro-rata", async () => {
      const aBefore = await tokenA.balanceOf(alice.address);
      const bBefore = await tokenB.balanceOf(alice.address);
      const cBefore = await tokenC.balanceOf(alice.address);

      await expect(basket.connect(alice).redeem(0, 2n * E18))
        .to.emit(basket, "BasketRedeemed")
        .withArgs(0, alice.address, 2n * E18);

      expect(await prime.balanceOf(alice.address)).to.equal(3n * E18);
      // Returned 1.2 A + 0.6 B + 0.2 C
      expect((await tokenA.balanceOf(alice.address)) - aBefore).to.equal((12n * E18) / 10n);
      expect((await tokenB.balanceOf(alice.address)) - bBefore).to.equal((6n * E18) / 10n);
      expect((await tokenC.balanceOf(alice.address)) - cBefore).to.equal((2n * E18) / 10n);
    });

    it("zero amount reverts", async () => {
      await expect(basket.connect(alice).redeem(0, 0)).to.be.revertedWith("Basket: zero amount");
    });

    it("insufficient basket balance reverts", async () => {
      // Alice has 5 PRIME, redeem 6 → revert (basket token burnFromMinter underflow)
      await expect(basket.connect(alice).redeem(0, 6n * E18)).to.be.reverted;
    });

    it("non-holder cannot redeem", async () => {
      // Bob has no PRIME
      await expect(basket.connect(bob).redeem(0, E18)).to.be.reverted;
    });
  });

  describe("CCMBasketToken minter gate", () => {
    it("non-minter cannot mint or burn", async () => {
      await expect(prime.connect(alice).mint(alice.address, 1n)).to.be.revertedWith(
        "BasketToken: not minter",
      );
      await expect(prime.connect(alice).burnFromMinter(alice.address, 1n)).to.be.revertedWith(
        "BasketToken: not minter",
      );
    });
  });
});
