import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type {
  CCMSandboxFractionalizer,
  CCMSandboxNFT,
  CCMFractionToken,
} from "../../typechain-types";

const Grade = { A: 0, B: 1, C: 2, D: 3 } as const;
const PROJECT = ethers.id("project:fractest");
const E18 = 10n ** 18n;

describe("CCMSandboxFractionalizer", () => {
  let nft: CCMSandboxNFT;
  let frac: CCMSandboxFractionalizer;
  let alice: any, bob: any;

  beforeEach(async () => {
    [, alice, bob] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("CCMSandboxNFT");
    nft = (await NFT.deploy()) as unknown as CCMSandboxNFT;
    const Frac = await ethers.getContractFactory("CCMSandboxFractionalizer");
    frac = (await Frac.deploy(await nft.getAddress())) as unknown as CCMSandboxFractionalizer;
  });

  async function mintAndApprove(signer: any, grade: number, tonnage: number) {
    await nft.connect(signer).mint(grade, 2026, tonnage, PROJECT);
    const id = (await nft.nextId()) - 1n;
    await nft.connect(signer).setApprovalForAll(await frac.getAddress(), true);
    return id;
  }

  function tokenAt(addr: string): Promise<CCMFractionToken> {
    return ethers.getContractAt("CCMFractionToken", addr) as unknown as Promise<CCMFractionToken>;
  }

  describe("constructor", () => {
    it("reverts on zero NFT", async () => {
      const Frac = await ethers.getContractFactory("CCMSandboxFractionalizer");
      await expect(Frac.deploy(ethers.ZeroAddress)).to.be.revertedWith("Fractionalizer: zero nft");
    });
    it("starts with zero active series", async () => {
      expect(await frac.totalActiveSeries()).to.equal(0);
    });
  });

  describe("fractionalize", () => {
    it("happy path: locks NFT, deploys ERC-20, mints fractions", async () => {
      const id = await mintAndApprove(alice, Grade.A, 1000);
      await expect(frac.connect(alice).fractionalize(id, 1000))
        .to.emit(frac, "Fractionalized");

      const tokAddr = await frac.fractionToken(id);
      expect(tokAddr).to.not.equal(ethers.ZeroAddress);

      const tok = await tokenAt(tokAddr);
      expect(await tok.symbol()).to.equal(`FRAC${id}`);
      expect(await tok.minter()).to.equal(await frac.getAddress());
      expect(await tok.balanceOf(alice.address)).to.equal(1000n * E18);
      expect(await tok.totalSupply()).to.equal(1000n * E18);
      expect(await frac.lockedTonnage(id)).to.equal(1000);
      expect(await frac.totalActiveSeries()).to.equal(1);
      expect(await nft.balanceOf(await frac.getAddress(), id)).to.equal(1000);
      expect(await nft.balanceOf(alice.address, id)).to.equal(0);
    });

    it("name encodes grade + vintage + id", async () => {
      const id = await mintAndApprove(alice, Grade.A, 50);
      await frac.connect(alice).fractionalize(id, 50);
      const tok = await tokenAt(await frac.fractionToken(id));
      const name = await tok.name();
      expect(name).to.include("CCM Frac #");
      expect(name).to.include("Grade A");
      expect(name).to.include("2026");
    });

    it("partial fractionalize is allowed (uses caller's balance, not full mint)", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await frac.connect(alice).fractionalize(id, 30);
      expect(await frac.lockedTonnage(id)).to.equal(30);
      expect(await nft.balanceOf(alice.address, id)).to.equal(70);
    });

    it("can't fractionalize while a series is active for that id", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await frac.connect(alice).fractionalize(id, 50);
      await expect(frac.connect(alice).fractionalize(id, 30)).to.be.revertedWith(
        "Fractionalizer: already active",
      );
    });

    it("zero tonnage reverts", async () => {
      await expect(frac.connect(alice).fractionalize(0, 0)).to.be.revertedWith(
        "Fractionalizer: zero tonnage",
      );
    });

    it("requires NFT approval", async () => {
      await nft.connect(alice).mint(Grade.A, 2026, 100, PROJECT);
      const id = (await nft.nextId()) - 1n;
      // Skip approve
      await expect(frac.connect(alice).fractionalize(id, 100)).to.be.reverted;
    });

    it("two different ids → two distinct fraction tokens", async () => {
      const id1 = await mintAndApprove(alice, Grade.A, 50);
      await frac.connect(alice).fractionalize(id1, 50);
      await time.increase(60 * 60 + 1);
      const id2 = await mintAndApprove(alice, Grade.B, 30);
      await frac.connect(alice).fractionalize(id2, 30);

      const tok1 = await frac.fractionToken(id1);
      const tok2 = await frac.fractionToken(id2);
      expect(tok1).to.not.equal(tok2);
      expect(await frac.totalActiveSeries()).to.equal(2);
    });
  });

  describe("reassemble", () => {
    it("happy path: holder of full set burns and recovers NFT", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await frac.connect(alice).fractionalize(id, 100);

      await expect(frac.connect(alice).reassemble(id))
        .to.emit(frac, "Reassembled")
        .withArgs(id, alice.address, 100);

      expect(await frac.lockedTonnage(id)).to.equal(0);
      expect(await frac.totalActiveSeries()).to.equal(0);

      const tok = await tokenAt(await frac.fractionToken(id));
      expect(await tok.totalSupply()).to.equal(0);
      expect(await tok.balanceOf(alice.address)).to.equal(0);

      expect(await nft.balanceOf(alice.address, id)).to.equal(100);
      expect(await nft.balanceOf(await frac.getAddress(), id)).to.equal(0);
    });

    it("reverts if caller does not hold the full set", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await frac.connect(alice).fractionalize(id, 100);

      // Alice transfers 30 fractions to Bob → she now holds 70 of 100
      const tok = await tokenAt(await frac.fractionToken(id));
      await tok.connect(alice).transfer(bob.address, 30n * E18);

      await expect(frac.connect(alice).reassemble(id)).to.be.revertedWith(
        "Fractionalizer: hold full set to reassemble",
      );
    });

    it("after Alice consolidates back, she can reassemble", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await frac.connect(alice).fractionalize(id, 100);
      const tok = await tokenAt(await frac.fractionToken(id));

      await tok.connect(alice).transfer(bob.address, 30n * E18);
      await tok.connect(bob).transfer(alice.address, 30n * E18);

      await frac.connect(alice).reassemble(id);
      expect(await nft.balanceOf(alice.address, id)).to.equal(100);
    });

    it("reverts if not active", async () => {
      await expect(frac.connect(alice).reassemble(99)).to.be.revertedWith(
        "Fractionalizer: not active",
      );
    });

    it("re-fractionalize after reassembly reuses same token address", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await frac.connect(alice).fractionalize(id, 100);
      const tok1 = await frac.fractionToken(id);
      await frac.connect(alice).reassemble(id);

      // Mint cooldown bypass: just re-approve and re-fractionalize the same id
      // Need to set approval again? It persists from before.
      await frac.connect(alice).fractionalize(id, 50);
      const tok2 = await frac.fractionToken(id);
      expect(tok1).to.equal(tok2); // same ERC-20 contract reused
      expect(await frac.lockedTonnage(id)).to.equal(50);
    });
  });

  describe("CCMFractionToken minter gate", () => {
    it("non-minter cannot mint", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await frac.connect(alice).fractionalize(id, 100);
      const tok = await tokenAt(await frac.fractionToken(id));
      await expect(tok.connect(alice).mint(alice.address, 1n)).to.be.revertedWith(
        "FracToken: not minter",
      );
    });
    it("non-minter cannot burnFromMinter", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await frac.connect(alice).fractionalize(id, 100);
      const tok = await tokenAt(await frac.fractionToken(id));
      await expect(tok.connect(alice).burnFromMinter(alice.address, 1n)).to.be.revertedWith(
        "FracToken: not minter",
      );
    });
    it("standard ERC-20 transfer works", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await frac.connect(alice).fractionalize(id, 100);
      const tok = await tokenAt(await frac.fractionToken(id));
      await tok.connect(alice).transfer(bob.address, 25n * E18);
      expect(await tok.balanceOf(bob.address)).to.equal(25n * E18);
      expect(await tok.balanceOf(alice.address)).to.equal(75n * E18);
    });
  });

  describe("invariant: locked * 1e18 == totalSupply", () => {
    it("holds across fractionalize → transfer → reassemble", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await frac.connect(alice).fractionalize(id, 100);
      const tok = await tokenAt(await frac.fractionToken(id));

      // After fractionalize
      expect(await tok.totalSupply()).to.equal((await frac.lockedTonnage(id)) * E18);
      // Transfers don't affect totalSupply
      await tok.connect(alice).transfer(bob.address, 40n * E18);
      expect(await tok.totalSupply()).to.equal((await frac.lockedTonnage(id)) * E18);
      // Consolidate
      await tok.connect(bob).transfer(alice.address, 40n * E18);
      await frac.connect(alice).reassemble(id);
      expect(await tok.totalSupply()).to.equal(0);
      expect(await frac.lockedTonnage(id)).to.equal(0);
    });
  });
});
