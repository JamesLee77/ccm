import { expect } from "chai";
import { ethers } from "hardhat";
import type { CCMSandboxNFT, CCMSandboxVault, CCMToken } from "../../typechain-types";

const Grade = { A: 0, B: 1, C: 2, D: 3 } as const;
const PROJECT = ethers.id("project:vault-test");
const E18 = 10n ** 18n;
const t = (tonnes: bigint | number) => BigInt(tonnes) * E18; // tonnes → raw CCM atoms

async function nextBlockTime(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

describe("CCMSandboxVault", () => {
  let nft: CCMSandboxNFT;
  let token: CCMToken;
  let vault: CCMSandboxVault;
  let admin: any, alice: any, bob: any;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("CCMToken");
    token = (await Token.deploy(admin.address)) as unknown as CCMToken;

    const NFT = await ethers.getContractFactory("CCMSandboxNFT");
    nft = (await NFT.deploy()) as unknown as CCMSandboxNFT;

    const Vault = await ethers.getContractFactory("CCMSandboxVault");
    vault = (await Vault.deploy(await nft.getAddress(), await token.getAddress())) as unknown as CCMSandboxVault;

    // Grant the vault MINTER_ROLE on CCMToken so it can mint on wrap.
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, await vault.getAddress());
  });

  // Helper: alice mints an NFT batch (Grade A,B,C,D) and approves vault.
  async function mintAndApprove(signer: any, grade: number, tonnage: number) {
    const tx = await nft.connect(signer).mint(grade, 2026, tonnage, PROJECT);
    const r = await tx.wait();
    // id is nextId-1 after the mint
    const nextId = await nft.nextId();
    const id = nextId - 1n;
    await nft.connect(signer).setApprovalForAll(await vault.getAddress(), true);
    return id;
  }

  describe("constructor", () => {
    it("reverts on zero NFT", async () => {
      const Vault = await ethers.getContractFactory("CCMSandboxVault");
      await expect(Vault.deploy(ethers.ZeroAddress, await token.getAddress())).to.be.revertedWith("SandboxVault: zero addr");
    });
    it("reverts on zero token", async () => {
      const Vault = await ethers.getContractFactory("CCMSandboxVault");
      await expect(Vault.deploy(await nft.getAddress(), ethers.ZeroAddress)).to.be.revertedWith("SandboxVault: zero addr");
    });
    it("sets immutables", async () => {
      expect(await vault.nft()).to.equal(await nft.getAddress());
      expect(await vault.token()).to.equal(await token.getAddress());
    });
  });

  describe("wrap", () => {
    it("zero amount reverts", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await expect(vault.connect(alice).wrap(id, 0)).to.be.revertedWith("SandboxVault: zero amount");
    });

    it("happy path: pulls NFT, mints CCM (×1e18), queues entry", async () => {
      const id = await mintAndApprove(alice, Grade.A, 100);
      await expect(vault.connect(alice).wrap(id, 60))
        .to.emit(vault, "Wrapped")
        .withArgs(alice.address, id, Grade.A, 60);

      // NFT moved to vault, CCM minted to alice (60 CCM = 60e18 raw)
      expect(await nft.balanceOf(alice.address, id)).to.equal(40);
      expect(await nft.balanceOf(await vault.getAddress(), id)).to.equal(60);
      expect(await token.balanceOf(alice.address)).to.equal(t(60));

      // queue + balances (in tonnes)
      expect(await vault.gradeBalance(Grade.A)).to.equal(60);
      expect(await vault.totalWrapped()).to.equal(60);
      expect(await vault.queueLength(Grade.A)).to.equal(1);
      const entry = await vault.queueEntry(Grade.A, 0);
      expect(entry.id).to.equal(id);
      expect(entry.amount).to.equal(60);
    });

    it("rejects without setApprovalForAll", async () => {
      const tx = await nft.connect(alice).mint(Grade.A, 2026, 100, PROJECT);
      await tx.wait();
      const id = (await nft.nextId()) - 1n;
      // Skip approval intentionally
      await expect(vault.connect(alice).wrap(id, 50)).to.be.reverted;
    });

    it("two consecutive wraps from same user → 2 queue entries", async () => {
      const id1 = await mintAndApprove(alice, Grade.A, 100);
      await vault.connect(alice).wrap(id1, 30);
      await nextBlockTime(60 * 60 + 1); // pass 1h cooldown for next mint
      const id2 = await mintAndApprove(alice, Grade.A, 100);
      await vault.connect(alice).wrap(id2, 50);
      expect(await vault.queueLength(Grade.A)).to.equal(2);
      expect(await vault.gradeBalance(Grade.A)).to.equal(80);
    });
  });

  describe("unwrap", () => {
    async function setupGrades() {
      // Alice deposits in order: Grade A 60, Grade C 40, Grade D 20
      const idA = await mintAndApprove(alice, Grade.A, 60);
      await vault.connect(alice).wrap(idA, 60);

      await nextBlockTime(60 * 60 + 1);
      const idC = await mintAndApprove(alice, Grade.C, 40);
      await vault.connect(alice).wrap(idC, 40);

      await nextBlockTime(60 * 60 + 1);
      const idD = await mintAndApprove(alice, Grade.D, 20);
      await vault.connect(alice).wrap(idD, 20);

      return { idA, idC, idD };
    }

    it("FIFR: pulls D first, then C, then A", async () => {
      const { idA, idC, idD } = await setupGrades();
      // Alice has 120 CCM (60+40+20 wrapped). Approve vault.
      await token.connect(alice).approve(await vault.getAddress(), t(120));

      // Unwrap 30 CCM → should come entirely from D (20) + C (10)
      await expect(vault.connect(alice).unwrap(t(30)))
        .to.emit(vault, "Unwrapped")
        .withArgs(alice.address, idD, Grade.D, 20)
        .and.to.emit(vault, "Unwrapped")
        .withArgs(alice.address, idC, Grade.C, 10);

      expect(await nft.balanceOf(alice.address, idD)).to.equal(20);
      expect(await nft.balanceOf(alice.address, idC)).to.equal(10);
      expect(await token.balanceOf(alice.address)).to.equal(t(120 - 30));
      expect(await vault.gradeBalance(Grade.D)).to.equal(0);
      expect(await vault.gradeBalance(Grade.C)).to.equal(30);
      expect(await vault.gradeBalance(Grade.A)).to.equal(60);
      expect(await vault.queueLength(Grade.D)).to.equal(0);
      expect(await vault.queueLength(Grade.C)).to.equal(1); // partial entry remains
    });

    it("zero amount reverts", async () => {
      await expect(vault.connect(alice).unwrap(0)).to.be.revertedWith("SandboxVault: zero amount");
    });

    it("non-multiple-of-1e18 reverts", async () => {
      await setupGrades();
      await token.connect(alice).approve(await vault.getAddress(), 200n);
      await expect(vault.connect(alice).unwrap(t(1) + 1n)).to.be.revertedWith(
        "SandboxVault: must be whole tonnes",
      );
    });

    it("reverts when allowance is missing", async () => {
      await setupGrades();
      await expect(vault.connect(alice).unwrap(t(10))).to.be.reverted;
    });

    it("reverts when amount exceeds vault balance", async () => {
      await setupGrades();
      // Alice has 120 CCM (from wrap). Mint extra so allowance/balance suffices.
      await token.mint(alice.address, t(200));
      await token.connect(alice).approve(await vault.getAddress(), t(300));
      await expect(vault.connect(alice).unwrap(t(121))).to.be.reverted;
    });

    it("hop cap enforced: 6 D-only entries can't unwrap fully in one tx", async () => {
      let cooldownBumps = 0;
      for (let i = 0; i < 6; i++) {
        if (cooldownBumps > 0) await nextBlockTime(60 * 60 + 1);
        cooldownBumps++;
        const id = await mintAndApprove(alice, Grade.D, 1);
        await vault.connect(alice).wrap(id, 1);
      }
      await token.connect(alice).approve(await vault.getAddress(), t(6));
      await expect(vault.connect(alice).unwrap(t(6))).to.be.revertedWith(
        "SandboxVault: too many hops, split unwrap",
      );
    });

    it("partial entry consumption stays in queue with reduced amount", async () => {
      const idA = await mintAndApprove(alice, Grade.A, 100);
      await vault.connect(alice).wrap(idA, 100);
      await token.connect(alice).approve(await vault.getAddress(), t(30));
      await vault.connect(alice).unwrap(t(30));
      expect(await vault.queueLength(Grade.A)).to.equal(1);
      const entry = await vault.queueEntry(Grade.A, 0);
      expect(entry.amount).to.equal(70);
    });

    it("unwrap of full amount empties queue", async () => {
      const idA = await mintAndApprove(alice, Grade.A, 50);
      await vault.connect(alice).wrap(idA, 50);
      await token.connect(alice).approve(await vault.getAddress(), t(50));
      await vault.connect(alice).unwrap(t(50));
      expect(await vault.queueLength(Grade.A)).to.equal(0);
      expect(await vault.gradeBalance(Grade.A)).to.equal(0);
      expect(await vault.totalUnwrapped()).to.equal(50);
    });

    it("preview: head reflects lowest-grade FIFR target", async () => {
      const { idD } = await setupGrades();
      const [grade, id, available] = await vault.previewUnwrapHead();
      expect(grade).to.equal(Grade.D);
      expect(id).to.equal(idD);
      expect(available).to.equal(20);
    });
  });

  describe("invariant: 1:1 wrap/unwrap accounting", () => {
    it("totalWrapped - totalUnwrapped == sum(gradeBalance)", async () => {
      const idA = await mintAndApprove(alice, Grade.A, 100);
      await vault.connect(alice).wrap(idA, 80);
      await nextBlockTime(60 * 60 + 1);
      const idC = await mintAndApprove(alice, Grade.C, 50);
      await vault.connect(alice).wrap(idC, 40);

      await token.connect(alice).approve(await vault.getAddress(), t(30));
      await vault.connect(alice).unwrap(t(30));

      const wrapped = await vault.totalWrapped();
      const unwrapped = await vault.totalUnwrapped();
      const a = await vault.gradeBalance(Grade.A);
      const b = await vault.gradeBalance(Grade.B);
      const c = await vault.gradeBalance(Grade.C);
      const d = await vault.gradeBalance(Grade.D);
      expect(wrapped - unwrapped).to.equal(a + b + c + d);
    });
  });
});
