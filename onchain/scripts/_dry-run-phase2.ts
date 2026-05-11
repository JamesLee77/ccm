/**
 * Dry-run the full Phase 1 + Phase 2 sequence against a forked Base mainnet.
 * In-process; no real transactions on mainnet.
 *
 * Sequence:
 *   1. Fork Base mainnet
 *   2. Deploy CCMToken with deployer as admin
 *   3. Deploy CCMVesting
 *   4. Mint 10M CCM to a dummy treasury
 *   5. Deploy CCMTimelock (mock GovSafe = signer[1], admin = 0x0, delay = 172800)
 *   6. Run Token handoff (grant + renounce all 3 roles)
 *   7. Run Vesting handoff (grant + renounce both roles)
 *   8. Assert deployer has zero roles on both contracts
 *   9. Assert Timelock has all roles
 *  10. Assert Timelock proposer/executor = mock GovSafe
 *
 * Run:
 *   BASE_MAINNET_RPC=<your rpc> \
 *     npx hardhat run scripts/_dry-run-phase2.ts --network hardhat
 */
import { ethers, network } from "hardhat";
import { runHandoff } from "./transfer-admin-to-timelock";
import { runVestingHandoff } from "./transfer-vesting-admin-to-timelock";

async function main() {
  const RPC = process.env.BASE_MAINNET_RPC;
  if (!RPC) throw new Error("BASE_MAINNET_RPC env required for fork");

  await network.provider.request({
    method: "hardhat_reset",
    params: [{ forking: { jsonRpcUrl: RPC } }],
  });

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const mockGovSafe = signers[1];
  const treasury = "0x000000000000000000000000000000000000dEaD";
  console.log("Forked Base mainnet.");
  console.log("  Deployer    :", deployer.address);
  console.log("  Mock GovSafe:", mockGovSafe.address);

  // Phase 1: Token + Vesting + 10M mint
  const Token = await ethers.getContractFactory("CCMToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("Token:", tokenAddr);

  const Vesting = await ethers.getContractFactory("CCMVesting");
  const vesting = await Vesting.deploy(tokenAddr, deployer.address);
  await vesting.waitForDeployment();
  const vestingAddr = await vesting.getAddress();
  console.log("Vesting:", vestingAddr);

  const mintAmount = 10_000_000n * 10n ** 18n;
  await (await token.mint(treasury, mintAmount)).wait();
  console.log("Minted 10M to", treasury);

  // Phase 2: Timelock + handoffs
  const Timelock = await ethers.getContractFactory("CCMTimelock");
  // NOTE: chainId on the local fork is still 31337 (Hardhat default after hardhat_reset
  // even with forking enabled — the EVM chainId is hardhat's, not the forked chain's).
  // CCMTimelock allows short delays on chainId 31337/1337, so 172800 works regardless.
  const timelock = await Timelock.deploy(
    172800,
    [mockGovSafe.address],
    [mockGovSafe.address],
    ethers.ZeroAddress,
  );
  await timelock.waitForDeployment();
  const timelockAddr = await timelock.getAddress();
  console.log("Timelock:", timelockAddr);

  const tokenResult = await runHandoff(tokenAddr, timelockAddr, deployer);
  console.log("Token handoff tx count:", tokenResult.txHashes.length);

  const vestingResult = await runVestingHandoff(vestingAddr, timelockAddr, deployer);
  console.log("Vesting handoff tx count:", vestingResult.txHashes.length);

  // Assertions (inline; mirrors verify-phase2-handoff.ts)
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const MINTER_ROLE = await token.MINTER_ROLE();
  const PAUSER_ROLE = await token.PAUSER_ROLE();
  const SCHEDULE_MANAGER_ROLE = await vesting.SCHEDULE_MANAGER_ROLE();
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();

  const checks: [string, unknown, unknown][] = [
    ["Token.ADMIN deployer", await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address), false],
    ["Token.MINTER deployer", await token.hasRole(MINTER_ROLE, deployer.address), false],
    ["Token.PAUSER deployer", await token.hasRole(PAUSER_ROLE, deployer.address), false],
    ["Token.ADMIN timelock", await token.hasRole(DEFAULT_ADMIN_ROLE, timelockAddr), true],
    ["Token.MINTER timelock", await token.hasRole(MINTER_ROLE, timelockAddr), true],
    ["Token.PAUSER timelock", await token.hasRole(PAUSER_ROLE, timelockAddr), true],
    ["Vesting.ADMIN deployer", await vesting.hasRole(DEFAULT_ADMIN_ROLE, deployer.address), false],
    ["Vesting.SCHEDULE_MANAGER deployer", await vesting.hasRole(SCHEDULE_MANAGER_ROLE, deployer.address), false],
    ["Vesting.ADMIN timelock", await vesting.hasRole(DEFAULT_ADMIN_ROLE, timelockAddr), true],
    ["Vesting.SCHEDULE_MANAGER timelock", await vesting.hasRole(SCHEDULE_MANAGER_ROLE, timelockAddr), true],
    ["Timelock.PROPOSER govSafe", await timelock.hasRole(PROPOSER_ROLE, mockGovSafe.address), true],
    ["Timelock.EXECUTOR govSafe", await timelock.hasRole(EXECUTOR_ROLE, mockGovSafe.address), true],
    ["Timelock.minDelay", (await timelock.getMinDelay()).toString(), "172800"],
  ];

  let allOk = true;
  for (const [name, actual, expected] of checks) {
    const ok = String(actual) === String(expected);
    console.log(ok ? "✓" : "✗", name, "=", String(actual), ok ? "" : `(expected ${expected})`);
    if (!ok) allOk = false;
  }
  if (!allOk) throw new Error("One or more dry-run assertions failed");

  // Idempotency check: re-run Token handoff should fail (deployer no longer has admin).
  // This confirms the handoff permanently revoked the deployer's roles.
  try {
    await runHandoff(tokenAddr, timelockAddr, deployer);
    throw new Error("Idempotency test failed: rerun should have thrown (deployer lacks admin)");
  } catch (e) {
    if (String(e).includes("does not hold DEFAULT_ADMIN_ROLE")) {
      console.log("✓ Idempotency: rerun correctly rejected (deployer no longer has admin)");
    } else {
      throw e;
    }
  }

  console.log("\n✓ Phase 2 dry-run passed end-to-end");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
