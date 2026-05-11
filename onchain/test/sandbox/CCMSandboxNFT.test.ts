import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { CCMSandboxNFT } from "../../typechain-types";

const Grade = { A: 0, B: 1, C: 2, D: 3 } as const;
const COOLDOWN = 60 * 60; // 1h
const PROJECT = ethers.id("project:demo:GS-2026-001");

describe("CCMSandboxNFT", () => {
  let nft: CCMSandboxNFT;
  let alice: any, bob: any;

  beforeEach(async () => {
    [, alice, bob] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("CCMSandboxNFT");
    nft = (await NFT.deploy()) as unknown as CCMSandboxNFT;
    await nft.waitForDeployment();
  });

  describe("constructor", () => {
    it("starts with nextId = 0 and retiredTotal = 0", async () => {
      expect(await nft.nextId()).to.equal(0);
      expect(await nft.retiredTotal()).to.equal(0);
    });
  });

  describe("mint", () => {
    it("first mint succeeds, sets metadata, mints amount", async () => {
      await expect(nft.connect(alice).mint(Grade.A, 2026, 100, PROJECT))
        .to.emit(nft, "Minted")
        .withArgs(alice.address, 0, Grade.A, 2026, 100, PROJECT);
      expect(await nft.nextId()).to.equal(1);
      expect(await nft.balanceOf(alice.address, 0)).to.equal(100);
      expect(await nft["totalSupply(uint256)"](0)).to.equal(100);
      const m = await nft.meta(0);
      expect(m.grade).to.equal(Grade.A);
      expect(m.vintage).to.equal(2026);
      expect(m.tonnage).to.equal(100);
      expect(m.projectId).to.equal(PROJECT);
      expect(m.minter).to.equal(alice.address);
    });

    it("rejects grade > D", async () => {
      // enum is uint8 — passing 4 is out of valid range. Solidity enum casting
      // reverts before our require() trips, so use the nuclear path:
      const iface = nft.interface;
      const data = iface.encodeFunctionData("mint", [4 as any, 2026, 100, PROJECT]);
      await expect(alice.sendTransaction({ to: await nft.getAddress(), data })).to.be.reverted;
    });

    it("rejects vintage < MIN", async () => {
      await expect(nft.connect(alice).mint(Grade.A, 2019, 100, PROJECT)).to.be.revertedWith(
        "Sandbox: vintage range",
      );
    });

    it("rejects vintage > MAX", async () => {
      await expect(nft.connect(alice).mint(Grade.A, 2031, 100, PROJECT)).to.be.revertedWith(
        "Sandbox: vintage range",
      );
    });

    it("rejects tonnage = 0", async () => {
      await expect(nft.connect(alice).mint(Grade.A, 2026, 0, PROJECT)).to.be.revertedWith(
        "Sandbox: tonnage range",
      );
    });

    it("rejects tonnage > MAX_TONNAGE", async () => {
      await expect(nft.connect(alice).mint(Grade.A, 2026, 1001, PROJECT)).to.be.revertedWith(
        "Sandbox: tonnage range",
      );
    });

    it("second mint within cooldown reverts", async () => {
      await nft.connect(alice).mint(Grade.A, 2026, 100, PROJECT);
      await expect(nft.connect(alice).mint(Grade.B, 2026, 50, PROJECT)).to.be.revertedWith(
        "Sandbox: cooldown",
      );
    });

    it("second mint after cooldown succeeds, gets new id", async () => {
      await nft.connect(alice).mint(Grade.A, 2026, 100, PROJECT);
      await time.increase(COOLDOWN + 1);
      await nft.connect(alice).mint(Grade.B, 2026, 50, PROJECT);
      expect(await nft.balanceOf(alice.address, 0)).to.equal(100);
      expect(await nft.balanceOf(alice.address, 1)).to.equal(50);
      expect(await nft.nextId()).to.equal(2);
    });

    it("two different users mint independently — distinct ids", async () => {
      await nft.connect(alice).mint(Grade.A, 2026, 100, PROJECT);
      await nft.connect(bob).mint(Grade.C, 2025, 200, PROJECT);
      expect(await nft.balanceOf(alice.address, 0)).to.equal(100);
      expect(await nft.balanceOf(bob.address, 1)).to.equal(200);
      expect((await nft.meta(0)).minter).to.equal(alice.address);
      expect((await nft.meta(1)).minter).to.equal(bob.address);
    });
  });

  describe("retire", () => {
    beforeEach(async () => {
      await nft.connect(alice).mint(Grade.A, 2026, 100, PROJECT);
    });

    it("burns balance, increments retiredTotal, emits event", async () => {
      await expect(nft.connect(alice).retire(0, 30))
        .to.emit(nft, "Retired")
        .withArgs(alice.address, 0, 30, anyUint());
      expect(await nft.balanceOf(alice.address, 0)).to.equal(70);
      expect(await nft.retiredTotal()).to.equal(30);
      expect(await nft["totalSupply(uint256)"](0)).to.equal(70);
    });

    it("zero amount reverts", async () => {
      await expect(nft.connect(alice).retire(0, 0)).to.be.revertedWith("Sandbox: zero amount");
    });

    it("burning more than balance reverts", async () => {
      await expect(nft.connect(alice).retire(0, 101)).to.be.reverted;
    });

    it("non-holder cannot retire", async () => {
      await expect(nft.connect(bob).retire(0, 10)).to.be.reverted;
    });

    it("retire all then balance is zero, totalSupply is zero", async () => {
      await nft.connect(alice).retire(0, 100);
      expect(await nft.balanceOf(alice.address, 0)).to.equal(0);
      expect(await nft["totalSupply(uint256)"](0)).to.equal(0);
      expect(await nft.retiredTotal()).to.equal(100);
    });
  });

  describe("view helpers", () => {
    it("nextMintAt returns 0 for never-minted user", async () => {
      expect(await nft.nextMintAt(alice.address)).to.equal(0);
    });

    it("nextMintAt returns last + COOLDOWN after a mint", async () => {
      const tx = await nft.connect(alice).mint(Grade.A, 2026, 100, PROJECT);
      const r = await tx.wait();
      const block = await ethers.provider.getBlock(r!.blockNumber);
      expect(await nft.nextMintAt(alice.address)).to.equal(
        BigInt(block!.timestamp) + BigInt(COOLDOWN),
      );
    });

    it("cooldownRemaining decays correctly", async () => {
      await nft.connect(alice).mint(Grade.A, 2026, 100, PROJECT);
      await time.increase(COOLDOWN / 2);
      const r = Number(await nft.cooldownRemaining(alice.address));
      expect(r).to.be.gt(COOLDOWN / 2 - 5);
      expect(r).to.be.lt(COOLDOWN / 2 + 5);
      await time.increase(COOLDOWN);
      expect(await nft.cooldownRemaining(alice.address)).to.equal(0);
    });
  });

  describe("ERC1155 standard transfers", () => {
    it("safeTransferFrom moves balance", async () => {
      await nft.connect(alice).mint(Grade.A, 2026, 100, PROJECT);
      await nft.connect(alice).safeTransferFrom(alice.address, bob.address, 0, 40, "0x");
      expect(await nft.balanceOf(alice.address, 0)).to.equal(60);
      expect(await nft.balanceOf(bob.address, 0)).to.equal(40);
    });
  });
});

function anyUint() {
  // chai matcher loose-shim: matches any uint argument
  // We're using withArgs above for exact addr+id+amount; the timestamp arg
  // varies by test environment. Returning a function tells chai-matchers
  // to accept any value. (newer hardhat-toolbox uses anyValue/anyUint helpers,
  // but importing them adds a dep — this inline shim is enough.)
  return (val: any) => typeof val === "bigint" || typeof val === "number";
}
