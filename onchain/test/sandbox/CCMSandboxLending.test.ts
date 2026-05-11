import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type {
  CCMSandboxNFT,
  CCMSandboxLending,
  CCMSandboxUSDC,
} from "../../typechain-types";

const Grade = { A: 0, B: 1, C: 2, D: 3 } as const;
const PROJECT = ethers.id("project:lending-test");
const E6 = 10n ** 6n; // USDC

async function bump(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

describe("CCMSandboxLending", () => {
  let nft: CCMSandboxNFT;
  let usdc: CCMSandboxUSDC;
  let lending: CCMSandboxLending;
  let alice: any, bob: any, lp: any;

  beforeEach(async () => {
    [, alice, bob, lp] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("CCMSandboxNFT");
    nft = (await NFT.deploy()) as unknown as CCMSandboxNFT;

    const USDC = await ethers.getContractFactory("CCMSandboxUSDC");
    usdc = (await USDC.deploy()) as unknown as CCMSandboxUSDC;

    const Lending = await ethers.getContractFactory("CCMSandboxLending");
    lending = (await Lending.deploy(
      await nft.getAddress(),
      await usdc.getAddress(),
    )) as unknown as CCMSandboxLending;

    // Seed the lending pool with USDC. lp claims, transfers in.
    await usdc.connect(lp).claim(); // 1000 USDC
    await usdc.connect(lp).transfer(await lending.getAddress(), 1000n * E6);
  });

  async function mintAndApprove(signer: any, grade: number, tonnage: number) {
    await nft.connect(signer).mint(grade, 2026, tonnage, PROJECT);
    const id = (await nft.nextId()) - 1n;
    await nft.connect(signer).setApprovalForAll(await lending.getAddress(), true);
    return id;
  }

  describe("constructor", () => {
    it("reverts on zero NFT", async () => {
      const Lending = await ethers.getContractFactory("CCMSandboxLending");
      await expect(
        Lending.deploy(ethers.ZeroAddress, await usdc.getAddress()),
      ).to.be.revertedWith("Lending: zero addr");
    });
    it("sets immutables", async () => {
      expect(await lending.nft()).to.equal(await nft.getAddress());
      expect(await lending.usdc()).to.equal(await usdc.getAddress());
    });
    it("grade params: A:$50/70%, B:$30/60%, C:$15/45%, D:$5/30%", async () => {
      const a = await lending.gradeParams(Grade.A);
      const b = await lending.gradeParams(Grade.B);
      const c = await lending.gradeParams(Grade.C);
      const d = await lending.gradeParams(Grade.D);
      expect(a.pricePerTonne).to.equal(50n * E6);
      expect(a.ltvBps).to.equal(7000);
      expect(b.pricePerTonne).to.equal(30n * E6);
      expect(b.ltvBps).to.equal(6000);
      expect(c.pricePerTonne).to.equal(15n * E6);
      expect(c.ltvBps).to.equal(4500);
      expect(d.pricePerTonne).to.equal(5n * E6);
      expect(d.ltvBps).to.equal(3000);
    });
  });

  describe("maxBorrow", () => {
    it("Grade A · 10t → $35 × 10 = $350", async () => {
      expect(await lending.maxBorrow(Grade.A, 10)).to.equal(350n * E6);
    });
    it("Grade D · 10t → $1.50 × 10 = $15", async () => {
      expect(await lending.maxBorrow(Grade.D, 10)).to.equal(15n * E6);
    });
    it("bad grade reverts", async () => {
      await expect(lending.maxBorrow(4, 10)).to.be.revertedWith("Lending: bad grade");
    });
  });

  describe("open", () => {
    it("happy path: locks NFT, transfers USDC, records position", async () => {
      const id = await mintAndApprove(alice, Grade.A, 10);
      // max borrow = 350 USDC; try 200
      await expect(lending.connect(alice).open(id, 10, 200n * E6))
        .to.emit(lending, "Opened")
        .withArgs(0, alice.address, id, Grade.A, 10, 200n * E6);

      expect(await nft.balanceOf(alice.address, id)).to.equal(0); // all 10 pledged (mint was 10t)
      expect(await nft.balanceOf(await lending.getAddress(), id)).to.equal(10);
      expect(await usdc.balanceOf(alice.address)).to.equal(200n * E6);

      const p = await lending.positions(0);
      expect(p.borrower).to.equal(alice.address);
      expect(p.nftAmount).to.equal(10);
      expect(p.borrowed).to.equal(200n * E6);
      expect(p.status).to.equal(0); // Open
      expect(await lending.totalBorrowed()).to.equal(200n * E6);
    });

    it("borrow > LTV cap reverts", async () => {
      const id = await mintAndApprove(alice, Grade.A, 10);
      await expect(lending.connect(alice).open(id, 10, 351n * E6)).to.be.revertedWith(
        "Lending: borrow > LTV cap",
      );
    });

    it("zero borrow reverts", async () => {
      const id = await mintAndApprove(alice, Grade.A, 10);
      await expect(lending.connect(alice).open(id, 10, 0)).to.be.revertedWith(
        "Lending: zero borrow",
      );
    });

    it("zero tonnage reverts", async () => {
      await expect(lending.connect(alice).open(0, 0, 100n * E6)).to.be.revertedWith(
        "Lending: zero tonnage",
      );
    });

    it("requires NFT approval", async () => {
      await nft.connect(alice).mint(Grade.A, 2026, 10, PROJECT);
      const id = (await nft.nextId()) - 1n;
      // No setApprovalForAll → reverts
      await expect(lending.connect(alice).open(id, 10, 100n * E6)).to.be.reverted;
    });

    it("insufficient reserves reverts", async () => {
      // Drain reserves: alice opens a max-LTV grade-A position (350 USDC of the 1000 pool)
      const id1 = await mintAndApprove(alice, Grade.A, 10);
      await lending.connect(alice).open(id1, 10, 350n * E6);
      await bump(60 * 60 + 1);
      // Now bob tries to borrow more than what's left (650 left).
      const id2 = await mintAndApprove(bob, Grade.A, 30); // max = 30 * 35 = 1050
      await expect(lending.connect(bob).open(id2, 30, 1000n * E6)).to.be.revertedWith(
        "Lending: insufficient reserves",
      );
    });
  });

  describe("close", () => {
    it("repays USDC, returns NFT, marks Closed", async () => {
      const id = await mintAndApprove(alice, Grade.A, 10);
      await lending.connect(alice).open(id, 10, 200n * E6);

      // Repay
      await usdc.connect(alice).approve(await lending.getAddress(), 200n * E6);
      await expect(lending.connect(alice).close(0))
        .to.emit(lending, "Closed")
        .withArgs(0, alice.address, 200n * E6);

      expect(await nft.balanceOf(alice.address, id)).to.equal(10);
      expect(await nft.balanceOf(await lending.getAddress(), id)).to.equal(0);
      const p = await lending.positions(0);
      expect(p.status).to.equal(1); // Closed
      expect(await usdc.balanceOf(alice.address)).to.equal(0);
      expect(await lending.totalRepaid()).to.equal(200n * E6);
    });

    it("non-borrower cannot close", async () => {
      const id = await mintAndApprove(alice, Grade.A, 10);
      await lending.connect(alice).open(id, 10, 200n * E6);
      await usdc.connect(bob).claim();
      await usdc.connect(bob).approve(await lending.getAddress(), 200n * E6);
      await expect(lending.connect(bob).close(0)).to.be.revertedWith("Lending: not borrower");
    });

    it("cannot close twice", async () => {
      const id = await mintAndApprove(alice, Grade.A, 10);
      await lending.connect(alice).open(id, 10, 200n * E6);
      await usdc.connect(alice).approve(await lending.getAddress(), 200n * E6);
      await lending.connect(alice).close(0);
      await expect(lending.connect(alice).close(0)).to.be.revertedWith("Lending: not open");
    });
  });

  describe("liquidate", () => {
    it("anyone can liquidate after 30 days", async () => {
      const id = await mintAndApprove(alice, Grade.A, 10);
      await lending.connect(alice).open(id, 10, 200n * E6);
      await bump(31 * 24 * 60 * 60);

      await usdc.connect(bob).claim();
      await usdc.connect(bob).approve(await lending.getAddress(), 200n * E6);
      await expect(lending.connect(bob).liquidate(0))
        .to.emit(lending, "Liquidated")
        .withArgs(0, bob.address);

      expect(await nft.balanceOf(bob.address, id)).to.equal(10);
      const p = await lending.positions(0);
      expect(p.status).to.equal(2); // Liquidated
    });

    it("cannot liquidate before window expires", async () => {
      const id = await mintAndApprove(alice, Grade.A, 10);
      await lending.connect(alice).open(id, 10, 200n * E6);
      await bump(29 * 24 * 60 * 60);
      await expect(lending.connect(bob).liquidate(0)).to.be.revertedWith(
        "Lending: not yet liquidatable",
      );
    });

    it("cannot liquidate a closed position", async () => {
      const id = await mintAndApprove(alice, Grade.A, 10);
      await lending.connect(alice).open(id, 10, 200n * E6);
      await usdc.connect(alice).approve(await lending.getAddress(), 200n * E6);
      await lending.connect(alice).close(0);
      await bump(31 * 24 * 60 * 60);
      await expect(lending.connect(bob).liquidate(0)).to.be.revertedWith(
        "Lending: not open",
      );
    });
  });

  describe("userPositionsOf", () => {
    it("tracks all positions per user", async () => {
      const id1 = await mintAndApprove(alice, Grade.A, 5);
      await lending.connect(alice).open(id1, 5, 100n * E6);
      await bump(60 * 60 + 1);
      const id2 = await mintAndApprove(alice, Grade.B, 5);
      await lending.connect(alice).open(id2, 5, 50n * E6);
      const ids = await lending.userPositionsOf(alice.address);
      expect(ids.map((x) => Number(x))).to.eql([0, 1]);
    });
  });
});
