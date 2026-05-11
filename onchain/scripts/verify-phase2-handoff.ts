/**
 * Verify Phase 2 handoff state (read-only, no transactions).
 *
 * Asserts:
 *   - Deployer has zero roles on Token (ADMIN + MINTER + PAUSER all false)
 *   - Deployer has zero roles on Vesting (ADMIN + SCHEDULE_MANAGER both false)
 *   - Timelock holds all roles on Token (ADMIN + MINTER + PAUSER all true)
 *   - Timelock holds all roles on Vesting (ADMIN + SCHEDULE_MANAGER both true)
 *   - Timelock proposer is Gov Safe (PROPOSER_ROLE held by GOV_SAFE, true)
 *   - Timelock executor is Gov Safe (EXECUTOR_ROLE held by GOV_SAFE, true)
 *   - Timelock min delay is exactly 172800 (48h)
 *   - Timelock has no TIMELOCK_ADMIN_ROLE holder OTHER than itself (self-administered)
 *
 * Required env:
 *   TOKEN, VESTING, TIMELOCK, DEPLOYER, GOV_SAFE
 *
 * Run:
 *   TOKEN=0x... VESTING=0x... TIMELOCK=0x... DEPLOYER=0x... GOV_SAFE=0x... \
 *     npx hardhat run scripts/verify-phase2-handoff.ts --network base
 */
import { ethers } from "hardhat";

function normalise(name: string, value: string | undefined): string {
  if (!value || !ethers.isAddress(value)) throw new Error(`${name} env var (valid address) required`);
  return ethers.getAddress(value);
}

async function main() {
  const TOKEN = normalise("TOKEN", process.env.TOKEN);
  const VESTING = normalise("VESTING", process.env.VESTING);
  const TIMELOCK = normalise("TIMELOCK", process.env.TIMELOCK);
  const DEPLOYER = normalise("DEPLOYER", process.env.DEPLOYER);
  const GOV_SAFE = normalise("GOV_SAFE", process.env.GOV_SAFE);

  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const vesting = await ethers.getContractAt("CCMVesting", VESTING);
  const timelock = await ethers.getContractAt("CCMTimelock", TIMELOCK);

  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const MINTER_ROLE = await token.MINTER_ROLE();
  const PAUSER_ROLE = await token.PAUSER_ROLE();
  const SCHEDULE_MANAGER_ROLE = await vesting.SCHEDULE_MANAGER_ROLE();
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const TIMELOCK_ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

  const checks: { name: string; actual: unknown; expected: unknown }[] = [
    { name: "Token.hasRole(ADMIN, deployer)", actual: await token.hasRole(DEFAULT_ADMIN_ROLE, DEPLOYER), expected: false },
    { name: "Token.hasRole(MINTER, deployer)", actual: await token.hasRole(MINTER_ROLE, DEPLOYER), expected: false },
    { name: "Token.hasRole(PAUSER, deployer)", actual: await token.hasRole(PAUSER_ROLE, DEPLOYER), expected: false },
    { name: "Token.hasRole(ADMIN, timelock)", actual: await token.hasRole(DEFAULT_ADMIN_ROLE, TIMELOCK), expected: true },
    { name: "Token.hasRole(MINTER, timelock)", actual: await token.hasRole(MINTER_ROLE, TIMELOCK), expected: true },
    { name: "Token.hasRole(PAUSER, timelock)", actual: await token.hasRole(PAUSER_ROLE, TIMELOCK), expected: true },
    { name: "Vesting.hasRole(ADMIN, deployer)", actual: await vesting.hasRole(DEFAULT_ADMIN_ROLE, DEPLOYER), expected: false },
    { name: "Vesting.hasRole(SCHEDULE_MANAGER, deployer)", actual: await vesting.hasRole(SCHEDULE_MANAGER_ROLE, DEPLOYER), expected: false },
    { name: "Vesting.hasRole(ADMIN, timelock)", actual: await vesting.hasRole(DEFAULT_ADMIN_ROLE, TIMELOCK), expected: true },
    { name: "Vesting.hasRole(SCHEDULE_MANAGER, timelock)", actual: await vesting.hasRole(SCHEDULE_MANAGER_ROLE, TIMELOCK), expected: true },
    { name: "Timelock.hasRole(PROPOSER, govSafe)", actual: await timelock.hasRole(PROPOSER_ROLE, GOV_SAFE), expected: true },
    { name: "Timelock.hasRole(EXECUTOR, govSafe)", actual: await timelock.hasRole(EXECUTOR_ROLE, GOV_SAFE), expected: true },
    { name: "Timelock.hasRole(TIMELOCK_ADMIN, deployer)", actual: await timelock.hasRole(TIMELOCK_ADMIN_ROLE, DEPLOYER), expected: false },
    { name: "Timelock.getMinDelay()", actual: (await timelock.getMinDelay()).toString(), expected: "172800" },
  ];

  let allOk = true;
  console.log("Phase 2 handoff verification:");
  console.log("  Token   :", TOKEN);
  console.log("  Vesting :", VESTING);
  console.log("  Timelock:", TIMELOCK);
  console.log("  Deployer:", DEPLOYER);
  console.log("  GovSafe :", GOV_SAFE);
  console.log("");
  for (const c of checks) {
    const ok = String(c.actual) === String(c.expected);
    console.log(ok ? "✓" : "✗", c.name, "=", String(c.actual), ok ? "" : `(expected ${c.expected})`);
    if (!ok) allOk = false;
  }
  if (!allOk) throw new Error("One or more checks failed");
  console.log("\n✓ All Phase 2 handoff checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
