/**
 * Review 2026-09-06 — R-03 (CCMMigration)
 *
 * `migrateWithPermit` calls `permit` unconditionally. Anyone who sees the
 * signature in the mempool can submit the permit first; the user's own tx
 * then reverts on the consumed nonce and the migration fails (griefing).
 * Standard mitigation: tolerate a failed permit when the allowance is
 * already sufficient.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const ONE_DAY = 24 * 60 * 60;
const AMT = ethers.parseUnits("1000", 18);

describe("CCMMigration — review R-03 permit front-run", () => {
  it("migrateWithPermit still succeeds when a third party consumed the permit first", async () => {
    const [admin, alice, griefer] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CCMToken");
    const v1 = await Token.deploy(admin.address);
    const v2 = await Token.deploy(admin.address);
    await v1.mint(alice.address, AMT);
    const deadline = (await time.latest()) + 90 * ONE_DAY;
    const migration = await (await ethers.getContractFactory("CCMMigration")).deploy(
      await v1.getAddress(),
      await v2.getAddress(),
      0,
      deadline,
      admin.address,
    );
    await v2.grantRole(await v2.MINTER_ROLE(), await migration.getAddress());

    const migAddr = await migration.getAddress();
    const permitDeadline = (await time.latest()) + 3600;
    const nonce = await v1.nonces(alice.address);
    const { chainId } = await ethers.provider.getNetwork();
    const sig = await alice.signTypedData(
      { name: "CCM Network Token", version: "1", chainId, verifyingContract: await v1.getAddress() },
      { Permit: [
        { name: "owner", type: "address" }, { name: "spender", type: "address" },
        { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" },
      ] },
      { owner: alice.address, spender: migAddr, value: AMT, nonce, deadline: permitDeadline },
    );
    const { v, r, s } = ethers.Signature.from(sig);

    // Griefer front-runs the permit with alice's signature.
    await v1.connect(griefer).permit(alice.address, migAddr, AMT, permitDeadline, v, r, s);
    expect(await v1.allowance(alice.address, migAddr)).to.equal(AMT);

    // Alice's original transaction must still migrate.
    await expect(migration.connect(alice).migrateWithPermit(AMT, AMT, permitDeadline, v, r, s))
      .to.emit(migration, "Migrated").withArgs(alice.address, AMT, AMT);
    expect(await v2.balanceOf(alice.address)).to.equal(AMT);
  });
});
