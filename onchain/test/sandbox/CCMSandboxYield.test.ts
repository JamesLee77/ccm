import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type {
  CCMSandboxNFT,
  CCMSandboxYield,
  CCMToken,
} from "../../typechain-types";

const Grade = { A: 0, B: 1, C: 2, D: 3 } as const;
const PROJECT = ethers.id("project:yield-test");
const E18 = 10n ** 18n;
const BASE_RATE = 10n ** 15n;

function expectedReward(
  tonnage: number,
  elapsedSec: number,
  grade: number,
): bigint {
  const w = grade === 0 ? 400n : grade === 1 ? 200n : grade === 2 ? 100n : 50n;
  return (BigInt(tonnage) * BigInt(elapsedSec) * BASE_RATE * w) / 100n;
}

describe("CCMSandboxYield", () => {
  let nft: CCMSandboxNFT;
  let token: CCMToken;
  let yieldVault: CCMSandboxYield;
  let admin: any, alice: any, bob: any;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("CCMToken");
    token = (await Token.deploy(admin.address)) as unknown as CCMToken;

    const NFT = await ethers.getContractFactory("CCMSandboxNFT");
    nft = (await NFT.deploy()) as unknown as CCMSandboxNFT;

    const Yield = await ethers.getContractFactory("CCMSandboxYield");
    yieldVault = (await Yield.deploy(
      await nft.getAddress(),
      await token.getAddress(),
    )) as unknown as CCMSandboxYield;

    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, await yieldVault.getAddress());
  });

  async function mintAndApprove(signer: any, grade: number, tonnage: number) {
    await nft.connect(signer).mint(grade, 2026, tonnage, PROJECT);
    const id = (await nft.nextId()) - 1n;
    await nft.connect(signer).setApprovalForAll(await yieldVault.getAddress(), true);
    return id;
  }

  describe("constructor", () => {
    it("reverts on zero NFT", async () => {
      const Y = await ethers.getContractFactory("CCMSandboxYield");
      await expect(Y.deploy(ethers.ZeroAddress, await token.getAddress())).to.be.revertedWith(
        "Yield: zero addr",
      );
    });
    it("reverts on zero token", async () => {
      const Y = await ethers.getContractFactory("CCMSandboxYield");
      await expect(Y.deploy(await nft.getAddress(), ethers.ZeroAddress)).to.be.revertedWith(
        "Yield: zero addr",
      );
    });
    it("sets immutables", async () => {
      expect(await yieldVault.nft()).to.equal(await nft.getAddress());
      expect(await yieldVault.token()).to.equal(await token.getAddress());
    });
    it("BASE_RATE = 1e15", async () => {
      expect(await yieldVault.BASE_RATE()).to.equal(BASE_RATE);
    });
  });

  describe("gradeWeight", () => {
    it("A=400, B=200, C=100, D=50", async () => {
      expect(await yieldVault.gradeWeight(0)).to.equal(400);
      expect(await yieldVault.gradeWeight(1)).to.equal(200);
      expect(await yieldVault.gradeWeight(2)).to.equal(100);
      expect(await yieldVault.gradeWeight(3)).to.equal(50);
    });
    it("bad grade reverts", async () => {
      await expect(yieldVault.gradeWeight(4)).to.be.revertedWith("Yield: bad grade");
    });
  });

  describe("stake", () => {
    it("zero tonnage reverts", async () => {
      const id = await mintAndApprove(alice, Grade.A, 5);
      await expect(yieldVault.connect(alice).stake(id, 0)).to.be.revertedWith(
        "Yield: zero tonnage",
      );
    });

    it("happy path: pulls NFT, records stake", async () => {
      const id = await mintAndApprove(alice, Grade.A, 10);
      await expect(yieldVault.connect(alice).stake(id, 6))
        .to.emit(yieldVault, "Staked")
        .withArgs(0, alice.address, id, Grade.A, 6);

      expect(await nft.balanceOf(alice.address, id)).to.equal(4);
      expect(await nft.balanceOf(await yieldVault.getAddress(), id)).to.equal(6);
      expect(await yieldVault.totalStaked()).to.equal(6);
      const s = await yieldVault.stakes(0);
      expect(s.staker).to.equal(alice.address);
      expect(s.tonnage).to.equal(6);
      expect(s.grade).to.equal(Grade.A);
      expect(s.active).to.equal(true);
    });

    it("requires NFT approval", async () => {
      await nft.connect(alice).mint(Grade.A, 2026, 5, PROJECT);
      const id = (await nft.nextId()) - 1n;
      await expect(yieldVault.connect(alice).stake(id, 5)).to.be.reverted;
    });

    it("multiple stakes per user are tracked", async () => {
      const id1 = await mintAndApprove(alice, Grade.A, 5);
      await yieldVault.connect(alice).stake(id1, 5);
      await time.increase(60 * 60 + 1);
      const id2 = await mintAndApprove(alice, Grade.D, 5);
      await yieldVault.connect(alice).stake(id2, 5);
      const ids = await yieldVault.userStakesOf(alice.address);
      expect(ids.map((x) => Number(x))).to.eql([0, 1]);
    });
  });

  describe("pendingReward", () => {
    it("Grade A: 1t × 60s = expected", async () => {
      const id = await mintAndApprove(alice, Grade.A, 1);
      await yieldVault.connect(alice).stake(id, 1);
      await time.increase(60);
      const got = await yieldVault.pendingReward(0);
      expect(got).to.be.closeTo(expectedReward(1, 60, Grade.A), expectedReward(1, 1, Grade.A));
    });

    it("scales linearly with tonnage", async () => {
      const id1 = await mintAndApprove(alice, Grade.C, 10);
      await yieldVault.connect(alice).stake(id1, 10);
      await time.increase(60 * 60); // 1 hour

      const id2 = await mintAndApprove(bob, Grade.C, 1);
      await nft.connect(bob).setApprovalForAll(await yieldVault.getAddress(), true);
      await yieldVault.connect(bob).stake(id2, 1);
      await time.increase(60 * 60);

      const r1 = await yieldVault.pendingReward(0);
      const r2 = await yieldVault.pendingReward(1);
      // Alice staked 1h longer; her reward ~= 11 × 60 minutes × 100 (sec rate × tonnage scaled)
      // Just check r1 > 10 × r2 (alice staked 2h on 10t, bob 1h on 1t → 20:1)
      expect(r1 > 10n * r2).to.equal(true);
    });

    it("Grade A reward = 8 × Grade D reward (4× / 0.5× = 8×)", async () => {
      const idA = await mintAndApprove(alice, Grade.A, 1);
      const idD = await mintAndApprove(bob, Grade.D, 1);
      await nft.connect(bob).setApprovalForAll(await yieldVault.getAddress(), true);
      // Stake both at the same block-time (close enough)
      await yieldVault.connect(alice).stake(idA, 1);
      await yieldVault.connect(bob).stake(idD, 1);
      await time.increase(3600);

      const rA = await yieldVault.pendingReward(0);
      const rD = await yieldVault.pendingReward(1);
      // A is 4× Grade C, D is 0.5× Grade C → A/D = 8
      expect(rA).to.be.closeTo(rD * 8n, expectedReward(1, 1, Grade.A));
    });

    it("returns 0 for inactive stake", async () => {
      const id = await mintAndApprove(alice, Grade.A, 5);
      await yieldVault.connect(alice).stake(id, 5);
      await time.increase(60);
      await yieldVault.connect(alice).unstake(0);
      expect(await yieldVault.pendingReward(0)).to.equal(0);
    });
  });

  describe("claim", () => {
    it("mints accrued reward, advances lastClaimedAt", async () => {
      const id = await mintAndApprove(alice, Grade.A, 5);
      await yieldVault.connect(alice).stake(id, 5);
      await time.increase(3600);

      const before = await token.balanceOf(alice.address);
      await yieldVault.connect(alice).claim(0);
      const after = await token.balanceOf(alice.address);
      const minted = after - before;
      // Approximate 1h Grade A 5t reward
      expect(minted).to.be.closeTo(expectedReward(5, 3600, Grade.A), expectedReward(5, 5, Grade.A));

      // Pending immediately after claim should be ~0
      const pending = await yieldVault.pendingReward(0);
      // Could be a few seconds of accrual from block.timestamp drift:
      expect(pending).to.be.lt(expectedReward(5, 30, Grade.A));
    });

    it("non-staker cannot claim", async () => {
      const id = await mintAndApprove(alice, Grade.A, 5);
      await yieldVault.connect(alice).stake(id, 5);
      await time.increase(60);
      await expect(yieldVault.connect(bob).claim(0)).to.be.revertedWith("Yield: not staker");
    });

    it("inactive stake claim reverts", async () => {
      const id = await mintAndApprove(alice, Grade.A, 5);
      await yieldVault.connect(alice).stake(id, 5);
      await time.increase(60);
      await yieldVault.connect(alice).unstake(0);
      await expect(yieldVault.connect(alice).claim(0)).to.be.revertedWith("Yield: not active");
    });

  });

  describe("unstake", () => {
    it("returns NFT, mints final reward, marks inactive", async () => {
      const id = await mintAndApprove(alice, Grade.A, 5);
      await yieldVault.connect(alice).stake(id, 5);
      await time.increase(3600);

      const before = await token.balanceOf(alice.address);
      await yieldVault.connect(alice).unstake(0);
      const after = await token.balanceOf(alice.address);

      expect(after - before).to.be.closeTo(expectedReward(5, 3600, Grade.A), expectedReward(5, 5, Grade.A));
      expect(await nft.balanceOf(alice.address, id)).to.equal(5);
      expect(await nft.balanceOf(await yieldVault.getAddress(), id)).to.equal(0);

      const s = await yieldVault.stakes(0);
      expect(s.active).to.equal(false);
      expect(await yieldVault.totalStaked()).to.equal(0);
    });

    it("zero-elapsed unstake still returns NFT", async () => {
      const id = await mintAndApprove(alice, Grade.A, 5);
      await yieldVault.connect(alice).stake(id, 5);
      // unstake immediately, no rewards
      await yieldVault.connect(alice).unstake(0);
      expect(await nft.balanceOf(alice.address, id)).to.equal(5);
    });

    it("non-staker cannot unstake", async () => {
      const id = await mintAndApprove(alice, Grade.A, 5);
      await yieldVault.connect(alice).stake(id, 5);
      await expect(yieldVault.connect(bob).unstake(0)).to.be.revertedWith("Yield: not staker");
    });

    it("cannot unstake twice", async () => {
      const id = await mintAndApprove(alice, Grade.A, 5);
      await yieldVault.connect(alice).stake(id, 5);
      await yieldVault.connect(alice).unstake(0);
      await expect(yieldVault.connect(alice).unstake(0)).to.be.revertedWith("Yield: not active");
    });
  });

  describe("totalEarned", () => {
    it("accumulates across claim and unstake", async () => {
      const id = await mintAndApprove(alice, Grade.A, 1);
      await yieldVault.connect(alice).stake(id, 1);
      await time.increase(3600);
      await yieldVault.connect(alice).claim(0);
      const e1 = await yieldVault.totalEarned();
      await time.increase(3600);
      await yieldVault.connect(alice).unstake(0);
      const e2 = await yieldVault.totalEarned();
      expect(e2 > e1).to.equal(true);
    });
  });
});
