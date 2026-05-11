import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type {
  CCMSandboxNFT,
  CCMSandboxRebate,
  CCMToken,
} from "../../typechain-types";

const Grade = { A: 0, B: 1, C: 2, D: 3 } as const;
const PROJECT = ethers.id("project:rebate-test");
const E18 = 10n ** 18n;

describe("CCMSandboxRebate", () => {
  let nft: CCMSandboxNFT;
  let token: CCMToken;
  let rebate: CCMSandboxRebate;
  let admin: any, alice: any, bob: any;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("CCMToken");
    token = (await Token.deploy(admin.address)) as unknown as CCMToken;

    const NFT = await ethers.getContractFactory("CCMSandboxNFT");
    nft = (await NFT.deploy()) as unknown as CCMSandboxNFT;

    const Rebate = await ethers.getContractFactory("CCMSandboxRebate");
    rebate = (await Rebate.deploy(
      await nft.getAddress(),
      await token.getAddress(),
    )) as unknown as CCMSandboxRebate;

    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, await rebate.getAddress());
  });

  async function mintAndApprove(signer: any, grade: number, tonnage: number) {
    await nft.connect(signer).mint(grade, 2026, tonnage, PROJECT);
    const id = (await nft.nextId()) - 1n;
    await nft.connect(signer).setApprovalForAll(await rebate.getAddress(), true);
    return id;
  }

  describe("constructor", () => {
    it("reverts on zero NFT/token", async () => {
      const F = await ethers.getContractFactory("CCMSandboxRebate");
      await expect(F.deploy(ethers.ZeroAddress, await token.getAddress())).to.be.revertedWith(
        "Rebate: zero addr",
      );
      await expect(F.deploy(await nft.getAddress(), ethers.ZeroAddress)).to.be.revertedWith(
        "Rebate: zero addr",
      );
    });
    it("immutables set", async () => {
      expect(await rebate.nft()).to.equal(await nft.getAddress());
      expect(await rebate.token()).to.equal(await token.getAddress());
    });
  });

  describe("baseRebatePerTonne", () => {
    it("A=2, B=1, C=0.5, D=0.2 CCM", async () => {
      expect(await rebate.baseRebatePerTonne(0)).to.equal(2n * E18);
      expect(await rebate.baseRebatePerTonne(1)).to.equal(E18);
      expect(await rebate.baseRebatePerTonne(2)).to.equal(5n * 10n ** 17n);
      expect(await rebate.baseRebatePerTonne(3)).to.equal(2n * 10n ** 17n);
    });
    it("bad grade reverts", async () => {
      await expect(rebate.baseRebatePerTonne(4)).to.be.revertedWith("Rebate: bad grade");
    });
  });

  describe("currentMultiplierBps", () => {
    it("zero cumulative → 10000 (1.0×)", async () => {
      expect(await rebate.currentMultiplierBps(alice.address)).to.equal(10000);
    });
  });

  describe("retire", () => {
    it("happy path: A 50t at 1.0× → 100 CCM rebate", async () => {
      const id = await mintAndApprove(alice, Grade.A, 50);
      await expect(rebate.connect(alice).retire(id, 50))
        .to.emit(rebate, "RetiredWithRebate")
        .withArgs(alice.address, id, Grade.A, 50, 100n * E18, 10000);

      // NFT supply went 50 → 0 (NFT.retire burns)
      expect(await nft["totalSupply(uint256)"](id)).to.equal(0);
      expect(await nft.balanceOf(alice.address, id)).to.equal(0);
      expect(await nft.balanceOf(await rebate.getAddress(), id)).to.equal(0);
      // Rebate minted
      expect(await token.balanceOf(alice.address)).to.equal(100n * E18);
      // Cumulative tracker
      expect(await rebate.cumulativeRetired(alice.address)).to.equal(50);
      expect(await rebate.totalRetired()).to.equal(50);
      expect(await rebate.totalRebated()).to.equal(100n * E18);
    });

    it("Grade D 50t at 1.0× → 10 CCM rebate (0.2 × 50)", async () => {
      const id = await mintAndApprove(alice, Grade.D, 50);
      await rebate.connect(alice).retire(id, 50);
      expect(await token.balanceOf(alice.address)).to.equal(10n * E18);
    });

    it("zero tonnage reverts", async () => {
      await expect(rebate.connect(alice).retire(0, 0)).to.be.revertedWith(
        "Rebate: zero tonnage",
      );
    });

    it("requires NFT approval", async () => {
      await nft.connect(alice).mint(Grade.A, 2026, 10, PROJECT);
      const id = (await nft.nextId()) - 1n;
      await expect(rebate.connect(alice).retire(id, 10)).to.be.reverted;
    });

    it("multiplier tier transition: 1.0× → 1.5× → 2.0×", async () => {
      // First retire at 1.0×: 80 t Grade A → 80 × 2 × 1.0 = 160 CCM
      const id1 = await mintAndApprove(alice, Grade.A, 80);
      await rebate.connect(alice).retire(id1, 80);
      expect(await token.balanceOf(alice.address)).to.equal(160n * E18);
      expect(await rebate.cumulativeRetired(alice.address)).to.equal(80);
      expect(await rebate.currentMultiplierBps(alice.address)).to.equal(10000); // still 1.0×

      // Second retire pushes cumulative past 100 → BUT multiplier is computed BEFORE adding,
      // so this call still uses 1.0×. After call, cumulative = 80 + 50 = 130, tier becomes 1.5×.
      await time.increase(60 * 60 + 1);
      const id2 = await mintAndApprove(alice, Grade.A, 50);
      await rebate.connect(alice).retire(id2, 50);
      // 50 × 2 × 1.0 = 100 CCM additional → total 260 CCM
      expect(await token.balanceOf(alice.address)).to.equal(260n * E18);
      expect(await rebate.cumulativeRetired(alice.address)).to.equal(130);
      expect(await rebate.currentMultiplierBps(alice.address)).to.equal(15000); // now 1.5×

      // Third retire at 1.5×: 50 t Grade A → 50 × 2 × 1.5 = 150 CCM
      await time.increase(60 * 60 + 1);
      const id3 = await mintAndApprove(alice, Grade.A, 50);
      await rebate.connect(alice).retire(id3, 50);
      expect(await token.balanceOf(alice.address)).to.equal((260n + 150n) * E18);
    });

    it("two users have independent multipliers", async () => {
      const idA = await mintAndApprove(alice, Grade.A, 200);
      await rebate.connect(alice).retire(idA, 200);
      // alice cumulative = 200, tier 2 next time
      expect(await rebate.currentMultiplierBps(alice.address)).to.equal(15000);
      expect(await rebate.currentMultiplierBps(bob.address)).to.equal(10000);
    });

    it("totalRetired and totalRebated track lifetime", async () => {
      const id1 = await mintAndApprove(alice, Grade.B, 50);
      await rebate.connect(alice).retire(id1, 50);
      const lifetime1 = await rebate.totalRetired();
      const rebated1 = await rebate.totalRebated();
      expect(lifetime1).to.equal(50);
      expect(rebated1).to.equal(50n * E18); // 50 × 1 × 1.0

      await time.increase(60 * 60 + 1);
      const id2 = await mintAndApprove(bob, Grade.C, 30);
      await rebate.connect(bob).retire(id2, 30);
      expect(await rebate.totalRetired()).to.equal(80);
      // 30 × 0.5 × 1.0 = 15 CCM
      expect(await rebate.totalRebated()).to.equal(50n * E18 + 15n * E18);
    });
  });

  describe("quoteRebate", () => {
    it("preview matches actual mint amount", async () => {
      const id = await mintAndApprove(alice, Grade.A, 80);
      const [quoted] = await rebate.quoteRebate(alice.address, Grade.A, 80);
      const before = await token.balanceOf(alice.address);
      await rebate.connect(alice).retire(id, 80);
      const after = await token.balanceOf(alice.address);
      expect(after - before).to.equal(quoted);
    });

    it("includes multiplier in quote", async () => {
      // Push alice to tier 2
      const id = await mintAndApprove(alice, Grade.A, 200);
      await rebate.connect(alice).retire(id, 200);
      // Alice now at 1.5×
      const [quoted, mult] = await rebate.quoteRebate(alice.address, Grade.A, 50);
      expect(mult).to.equal(15000);
      // 50 × 2 × 1.5 = 150 CCM
      expect(quoted).to.equal(150n * E18);
    });
  });
});
