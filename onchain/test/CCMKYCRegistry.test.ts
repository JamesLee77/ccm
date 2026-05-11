import { expect } from "chai";
import { ethers } from "hardhat";
import type { CCMKYCRegistry } from "../typechain-types";

const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
const KYC_OPERATOR_ROLE = ethers.id("KYC_OPERATOR_ROLE");

describe("CCMKYCRegistry", () => {
  let kyc: CCMKYCRegistry;
  let admin: any, operator: any, alice: any, bob: any, carol: any, attacker: any;

  beforeEach(async () => {
    [admin, operator, alice, bob, carol, attacker] = await ethers.getSigners();
    const F = await ethers.getContractFactory("CCMKYCRegistry");
    kyc = (await F.deploy(admin.address, operator.address)) as unknown as CCMKYCRegistry;
  });

  describe("constructor", () => {
    it("reverts on zero admin", async () => {
      const F = await ethers.getContractFactory("CCMKYCRegistry");
      await expect(F.deploy(ethers.ZeroAddress, operator.address)).to.be.revertedWithCustomError(
        kyc,
        "KYCRegistry_ZeroAddress",
      );
    });

    it("reverts on zero operator", async () => {
      const F = await ethers.getContractFactory("CCMKYCRegistry");
      await expect(F.deploy(admin.address, ethers.ZeroAddress)).to.be.revertedWithCustomError(
        kyc,
        "KYCRegistry_ZeroAddress",
      );
    });

    it("VERSION is 1.0.0", async () => {
      expect(await kyc.VERSION()).to.equal("1.0.0");
    });

    it("admin and operator roles wired correctly", async () => {
      expect(await kyc.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);
      expect(await kyc.hasRole(KYC_OPERATOR_ROLE, operator.address)).to.equal(true);
      // No cross-grant
      expect(await kyc.hasRole(DEFAULT_ADMIN_ROLE, operator.address)).to.equal(false);
      expect(await kyc.hasRole(KYC_OPERATOR_ROLE, admin.address)).to.equal(false);
    });
  });

  describe("setKYCed (single)", () => {
    it("operator can flip status", async () => {
      await expect(kyc.connect(operator).setKYCed(alice.address, true))
        .to.emit(kyc, "KYCStatusChanged");
      expect(await kyc.isKYCed(alice.address)).to.equal(true);
      expect(await kyc.kycedCount()).to.equal(1);
      const ts = await kyc.kycedAt(alice.address);
      expect(ts).to.be.greaterThan(0);
    });

    it("admin alone cannot flip status (admin only manages roles)", async () => {
      await expect(kyc.connect(admin).setKYCed(alice.address, true)).to.be.reverted;
    });

    it("attacker cannot flip status", async () => {
      await expect(kyc.connect(attacker).setKYCed(alice.address, true)).to.be.reverted;
    });

    it("zero address reverts", async () => {
      await expect(kyc.connect(operator).setKYCed(ethers.ZeroAddress, true))
        .to.be.revertedWithCustomError(kyc, "KYCRegistry_ZeroAddress");
    });

    it("revoking sets isKYCed false and decrements count", async () => {
      await kyc.connect(operator).setKYCed(alice.address, true);
      expect(await kyc.kycedCount()).to.equal(1);
      await kyc.connect(operator).setKYCed(alice.address, false);
      expect(await kyc.isKYCed(alice.address)).to.equal(false);
      expect(await kyc.kycedCount()).to.equal(0);
    });

    it("setting same value twice does not double-count", async () => {
      await kyc.connect(operator).setKYCed(alice.address, true);
      await kyc.connect(operator).setKYCed(alice.address, true);
      expect(await kyc.kycedCount()).to.equal(1);
    });

    it("kycedAt updates even when status unchanged (audit timestamp)", async () => {
      await kyc.connect(operator).setKYCed(alice.address, true);
      const t1 = await kyc.kycedAt(alice.address);
      // Mine a new block so block.timestamp moves forward
      await ethers.provider.send("evm_increaseTime", [10]);
      await ethers.provider.send("evm_mine", []);
      await kyc.connect(operator).setKYCed(alice.address, true);
      const t2 = await kyc.kycedAt(alice.address);
      expect(t2).to.be.greaterThan(t1);
    });
  });

  describe("setKYCedBatch", () => {
    it("approves N users in one tx", async () => {
      await kyc.connect(operator).setKYCedBatch(
        [alice.address, bob.address, carol.address],
        [true, true, false],
      );
      expect(await kyc.isKYCed(alice.address)).to.equal(true);
      expect(await kyc.isKYCed(bob.address)).to.equal(true);
      expect(await kyc.isKYCed(carol.address)).to.equal(false);
      expect(await kyc.kycedCount()).to.equal(2);
    });

    it("length mismatch reverts", async () => {
      await expect(
        kyc.connect(operator).setKYCedBatch([alice.address, bob.address], [true]),
      ).to.be.revertedWithCustomError(kyc, "KYCRegistry_LengthMismatch");
    });

    it("empty batch reverts", async () => {
      await expect(
        kyc.connect(operator).setKYCedBatch([], []),
      ).to.be.revertedWithCustomError(kyc, "KYCRegistry_EmptyBatch");
    });

    it("zero address in batch reverts whole tx", async () => {
      await expect(
        kyc.connect(operator).setKYCedBatch(
          [alice.address, ethers.ZeroAddress, bob.address],
          [true, true, true],
        ),
      ).to.be.revertedWithCustomError(kyc, "KYCRegistry_ZeroAddress");
      // Confirm alice didn't get partially set
      expect(await kyc.isKYCed(alice.address)).to.equal(false);
    });

    it("non-operator cannot batch", async () => {
      await expect(
        kyc.connect(attacker).setKYCedBatch([alice.address], [true]),
      ).to.be.reverted;
    });
  });

  describe("setKYCedBatchUniform", () => {
    it("flips N users to same value", async () => {
      await kyc.connect(operator).setKYCedBatchUniform(
        [alice.address, bob.address, carol.address],
        true,
      );
      expect(await kyc.kycedCount()).to.equal(3);
      await kyc.connect(operator).setKYCedBatchUniform(
        [alice.address, bob.address],
        false,
      );
      expect(await kyc.kycedCount()).to.equal(1);
      expect(await kyc.isKYCed(carol.address)).to.equal(true);
    });

    it("empty batch reverts", async () => {
      await expect(
        kyc.connect(operator).setKYCedBatchUniform([], true),
      ).to.be.revertedWithCustomError(kyc, "KYCRegistry_EmptyBatch");
    });
  });

  describe("admin role lifecycle", () => {
    it("admin can grant KYC_OPERATOR_ROLE to a new operator", async () => {
      await kyc.connect(admin).grantRole(KYC_OPERATOR_ROLE, alice.address);
      expect(await kyc.hasRole(KYC_OPERATOR_ROLE, alice.address)).to.equal(true);
      // Alice can now flip status
      await kyc.connect(alice).setKYCed(bob.address, true);
      expect(await kyc.isKYCed(bob.address)).to.equal(true);
    });

    it("admin can revoke an operator", async () => {
      await kyc.connect(admin).revokeRole(KYC_OPERATOR_ROLE, operator.address);
      await expect(
        kyc.connect(operator).setKYCed(alice.address, true),
      ).to.be.reverted;
    });

    it("operator cannot grant role to themselves a second operator", async () => {
      await expect(
        kyc.connect(operator).grantRole(KYC_OPERATOR_ROLE, attacker.address),
      ).to.be.reverted;
    });
  });

  describe("integration: handoff to a Timelock", () => {
    it("admin role can be transferred from EOA → Timelock and renounced", async () => {
      // Deploy a 1-second timelock for unit-test speed
      const TL = await ethers.getContractFactory("CCMTimelock");
      const tl = await TL.deploy(1, [admin.address], [admin.address], admin.address);

      await kyc.connect(admin).grantRole(DEFAULT_ADMIN_ROLE, await tl.getAddress());
      await kyc.connect(admin).renounceRole(DEFAULT_ADMIN_ROLE, admin.address);

      expect(await kyc.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(false);
      expect(await kyc.hasRole(DEFAULT_ADMIN_ROLE, await tl.getAddress())).to.equal(true);

      // Operator role is unaffected — still hot
      await kyc.connect(operator).setKYCed(alice.address, true);
      expect(await kyc.isKYCed(alice.address)).to.equal(true);
    });
  });
});
