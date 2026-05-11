import { expect } from "chai";
import { ethers } from "hardhat";
import type {
  CCMSandboxGradeWrapper,
  CCMSandboxNFT,
  CCMGradeToken,
} from "../../typechain-types";

const Grade = { A: 0, B: 1, C: 2, D: 3 } as const;
const PROJECT = ethers.id("project:gw-test");
const E18 = 10n ** 18n;
const t = (tonnes: bigint | number) => BigInt(tonnes) * E18;

async function nextBlockTime(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

describe("CCMSandboxGradeWrapper", () => {
  let nft: CCMSandboxNFT;
  let wrapper: CCMSandboxGradeWrapper;
  let tokenA: CCMGradeToken,
    tokenB: CCMGradeToken,
    tokenC: CCMGradeToken,
    tokenD: CCMGradeToken;
  let alice: any, bob: any;

  beforeEach(async () => {
    [, alice, bob] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("CCMSandboxNFT");
    nft = (await NFT.deploy()) as unknown as CCMSandboxNFT;

    const Wrapper = await ethers.getContractFactory("CCMSandboxGradeWrapper");
    wrapper = (await Wrapper.deploy(await nft.getAddress())) as unknown as CCMSandboxGradeWrapper;

    const TokenFactory = await ethers.getContractFactory("CCMGradeToken");
    tokenA = TokenFactory.attach(await wrapper.tokenOf(0)) as unknown as CCMGradeToken;
    tokenB = TokenFactory.attach(await wrapper.tokenOf(1)) as unknown as CCMGradeToken;
    tokenC = TokenFactory.attach(await wrapper.tokenOf(2)) as unknown as CCMGradeToken;
    tokenD = TokenFactory.attach(await wrapper.tokenOf(3)) as unknown as CCMGradeToken;
  });

  async function mintAndApprove(signer: any, grade: number, tonnage: number) {
    await nft.connect(signer).mint(grade, 2026, tonnage, PROJECT);
    const id = (await nft.nextId()) - 1n;
    await nft.connect(signer).setApprovalForAll(await wrapper.getAddress(), true);
    return id;
  }

  describe("constructor", () => {
    it("reverts on zero NFT", async () => {
      const Wrapper = await ethers.getContractFactory("CCMSandboxGradeWrapper");
      await expect(Wrapper.deploy(ethers.ZeroAddress)).to.be.revertedWith("GradeWrapper: zero nft");
    });
    it("deploys 4 grade tokens with correct names/symbols", async () => {
      expect(await tokenA.name()).to.equal("CCM Grade A (testnet)");
      expect(await tokenA.symbol()).to.equal("CCM-A");
      expect(await tokenB.symbol()).to.equal("CCM-B");
      expect(await tokenC.symbol()).to.equal("CCM-C");
      expect(await tokenD.symbol()).to.equal("CCM-D");
    });
    it("each grade token's minter is the wrapper", async () => {
      const wrapAddr = await wrapper.getAddress();
      expect(await tokenA.minter()).to.equal(wrapAddr);
      expect(await tokenB.minter()).to.equal(wrapAddr);
      expect(await tokenC.minter()).to.equal(wrapAddr);
      expect(await tokenD.minter()).to.equal(wrapAddr);
    });
    it("only the wrapper (the minter) can mint or burn", async () => {
      await expect(tokenA.connect(alice).mint(alice.address, 100n)).to.be.revertedWith(
        "GradeToken: not minter",
      );
      await expect(tokenA.connect(alice).burnFromMinter(alice.address, 100n)).to.be.revertedWith(
        "GradeToken: not minter",
      );
    });
  });

  describe("wrap", () => {
    it("Grade A NFT mints CCM-A only", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await expect(wrapper.connect(alice).wrap(id, 60))
        .to.emit(wrapper, "Wrapped")
        .withArgs(alice.address, id, Grade.A, 60);

      expect(await tokenA.balanceOf(alice.address)).to.equal(t(60));
      expect(await tokenB.balanceOf(alice.address)).to.equal(0n);
      expect(await tokenC.balanceOf(alice.address)).to.equal(0n);
      expect(await tokenD.balanceOf(alice.address)).to.equal(0n);
      expect(await wrapper.gradeBalance(Grade.A)).to.equal(60);
    });

    it("Different-grade NFTs mint different tokens", async () => {
      const idA = await mintAndApprove(alice, Grade.A, 50);
      await wrapper.connect(alice).wrap(idA, 50);
      await nextBlockTime(60 * 60 + 1);
      const idC = await mintAndApprove(alice, Grade.C, 30);
      await wrapper.connect(alice).wrap(idC, 30);

      expect(await tokenA.balanceOf(alice.address)).to.equal(t(50));
      expect(await tokenB.balanceOf(alice.address)).to.equal(0n);
      expect(await tokenC.balanceOf(alice.address)).to.equal(t(30));
      expect(await tokenD.balanceOf(alice.address)).to.equal(0n);
    });

    it("zero amount reverts", async () => {
      const id = await mintAndApprove(alice, Grade.A, 50);
      await expect(wrapper.connect(alice).wrap(id, 0)).to.be.revertedWith("GradeWrapper: zero amount");
    });
  });

  describe("unwrap", () => {
    it("Grade A unwrap returns Grade A NFT, burns CCM-A", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await wrapper.connect(alice).wrap(id, 60);

      await wrapper.connect(alice).unwrap(Grade.A, t(40));
      expect(await tokenA.balanceOf(alice.address)).to.equal(t(20));
      expect(await nft.balanceOf(alice.address, id)).to.equal(40 + 40);
      expect(await wrapper.gradeBalance(Grade.A)).to.equal(20);
    });

    it("cannot unwrap grade-A using CCM-B (insufficient balance)", async () => {
      const idA = await mintAndApprove(alice, Grade.A, 50);
      await wrapper.connect(alice).wrap(idA, 50);
      // Alice has CCM-A, not CCM-B. Trying to unwrap from grade B fails.
      await expect(wrapper.connect(alice).unwrap(Grade.B, t(10))).to.be.reverted;
    });

    it("rejects ccmAmount not whole-tonne", async () => {
      const id = await mintAndApprove(alice, Grade.A, 50);
      await wrapper.connect(alice).wrap(id, 50);
      await expect(wrapper.connect(alice).unwrap(Grade.A, t(1) + 1n)).to.be.revertedWith(
        "GradeWrapper: must be whole tonnes",
      );
    });

    it("zero amount reverts", async () => {
      await expect(wrapper.connect(alice).unwrap(Grade.A, 0)).to.be.revertedWith(
        "GradeWrapper: zero amount",
      );
    });

    it("bad grade reverts", async () => {
      // grade 4 is out of [0, 3]
      await expect(wrapper.connect(alice).unwrap(4, t(10))).to.be.revertedWith(
        "GradeWrapper: bad grade",
      );
    });

    it("FIFO within grade: oldest deposit returned first", async () => {
      // Two grade-A deposits from different NFT ids
      const id1 = await mintAndApprove(alice, Grade.A, 50);
      await wrapper.connect(alice).wrap(id1, 30);
      await nextBlockTime(60 * 60 + 1);
      const id2 = await mintAndApprove(alice, Grade.A, 50);
      await wrapper.connect(alice).wrap(id2, 40);

      // Unwrap 30 → all from id1 (FIFO)
      await wrapper.connect(alice).unwrap(Grade.A, t(30));
      expect(await nft.balanceOf(alice.address, id1)).to.equal(50); // 20 from mint remain + 30 returned
      expect(await nft.balanceOf(alice.address, id2)).to.equal(10); // 50 - 40 wrapped
      expect(await wrapper.queueLength(Grade.A)).to.equal(1);
    });

    it("hop cap enforced", async () => {
      let cooldownBumps = 0;
      for (let i = 0; i < 6; i++) {
        if (cooldownBumps > 0) await nextBlockTime(60 * 60 + 1);
        cooldownBumps++;
        const id = await mintAndApprove(alice, Grade.A, 1);
        await wrapper.connect(alice).wrap(id, 1);
      }
      await expect(wrapper.connect(alice).unwrap(Grade.A, t(6))).to.be.revertedWith(
        "GradeWrapper: too many hops, split unwrap",
      );
    });

    it("partial entry consumption stays in queue", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await wrapper.connect(alice).wrap(id, 100);
      await wrapper.connect(alice).unwrap(Grade.A, t(30));
      const e = await wrapper.queueEntry(Grade.A, 0);
      expect(e.amount).to.equal(70);
    });

    it("partial unwrap leaves remainder; second unwrap drains", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await wrapper.connect(alice).wrap(id, 80);
      await wrapper.connect(alice).unwrap(Grade.A, t(50));
      expect(await wrapper.gradeBalance(Grade.A)).to.equal(30);
      await wrapper.connect(alice).unwrap(Grade.A, t(30));
      expect(await wrapper.gradeBalance(Grade.A)).to.equal(0);
      expect(await tokenA.balanceOf(alice.address)).to.equal(0n);
    });
  });

  describe("invariant: per-grade 1:1", () => {
    it("totalWrapped[g] - totalUnwrapped[g] == gradeBalance[g] for every grade", async () => {
      const idA = await mintAndApprove(alice, Grade.A, 80);
      await wrapper.connect(alice).wrap(idA, 50);
      await nextBlockTime(60 * 60 + 1);
      const idC = await mintAndApprove(alice, Grade.C, 40);
      await wrapper.connect(alice).wrap(idC, 30);

      await wrapper.connect(alice).unwrap(Grade.A, t(20));

      for (const g of [Grade.A, Grade.B, Grade.C, Grade.D]) {
        const w = await wrapper.totalWrapped(g);
        const u = await wrapper.totalUnwrapped(g);
        const b = await wrapper.gradeBalance(g);
        expect(w - u).to.equal(b);
      }
    });
    it("CCM-X totalSupply / 1e18 == gradeBalance[X]", async () => {
      const idA = await mintAndApprove(alice, Grade.A, 80);
      await wrapper.connect(alice).wrap(idA, 50);
      const supply = await tokenA.totalSupply();
      const bal = await wrapper.gradeBalance(Grade.A);
      expect(supply).to.equal(bal * E18);
    });
  });
});
