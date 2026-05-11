/**
 * Helper: compose the Safe → Timelock calldata for a future mint operation.
 *
 * Phase 2 mints route through:
 *   Safe (3-of-5)  ──schedule──>  Timelock(48h)  ──execute──>  Token.mint(treasury, amount)
 *
 * This script prints, as hex strings:
 *   (a) The data for Safe Wallet "Contract Interaction" → target = Timelock,
 *       which encodes Timelock.schedule(target=Token, value=0, data=mint(...),
 *       predecessor=0, salt=keccak256(SALT_LABEL), delay=172800).
 *   (b) The matching Timelock.execute(...) calldata for the operator to use
 *       after the 48h delay elapses.
 *
 * The script does NOT send any transaction. It is a pure calldata builder.
 *
 * Required env:
 *   TOKEN        - CCMToken address
 *   TIMELOCK     - CCMTimelock address
 *   TREASURY     - recipient of the mint
 *   AMOUNT_CCM   - amount in whole CCM (e.g., 10000000)
 *   SALT_LABEL   - human-readable label for the salt (e.g., "ccm-mint-2026q2")
 *
 * Optional env:
 *   DELAY_S      - schedule delay in seconds (default 172800 = 48h)
 *
 * Run:
 *   TOKEN=0x... TIMELOCK=0x... TREASURY=0x... AMOUNT_CCM=1000000 SALT_LABEL=ccm-mint-2026q2 \
 *     npx hardhat run scripts/schedule-mint-via-timelock.ts --network base
 */
import { ethers } from "hardhat";

function normaliseAddress(name: string, value: string | undefined): string {
  if (!value || !ethers.isAddress(value)) throw new Error(`${name} env var (valid address) required`);
  return ethers.getAddress(value);
}

async function main() {
  const TOKEN = normaliseAddress("TOKEN", process.env.TOKEN);
  const TIMELOCK = normaliseAddress("TIMELOCK", process.env.TIMELOCK);
  const TREASURY = normaliseAddress("TREASURY", process.env.TREASURY);
  const SALT_LABEL = process.env.SALT_LABEL;
  if (!SALT_LABEL) throw new Error("SALT_LABEL env var required (use a unique human-readable string)");

  let AMOUNT_CCM: bigint;
  try {
    AMOUNT_CCM = BigInt(process.env.AMOUNT_CCM ?? "");
  } catch {
    throw new Error(`AMOUNT_CCM is not a valid integer: "${process.env.AMOUNT_CCM}"`);
  }
  if (AMOUNT_CCM <= 0n) throw new Error(`AMOUNT_CCM must be > 0 (got ${AMOUNT_CCM})`);

  const DELAY_S = BigInt(process.env.DELAY_S ?? "172800");
  if (DELAY_S < 172800n) {
    throw new Error(`DELAY_S must be >= 172800 (48h) — protocol policy. Got ${DELAY_S}`);
  }

  const amountWei = AMOUNT_CCM * 10n ** 18n;
  const salt = ethers.id(SALT_LABEL); // keccak256(utf8(SALT_LABEL))
  const predecessor = ethers.ZeroHash;

  // 1) Inner call: Token.mint(treasury, amountWei)
  const tokenIface = new ethers.Interface([
    "function mint(address to, uint256 amount)",
  ]);
  const mintData = tokenIface.encodeFunctionData("mint", [TREASURY, amountWei]);

  // 2) Wrap: Timelock.schedule(token, 0, mintData, 0, salt, delay)
  const timelockIface = new ethers.Interface([
    "function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay)",
    "function execute(address target, uint256 value, bytes payload, bytes32 predecessor, bytes32 salt) payable",
    "function hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) view returns (bytes32)",
  ]);
  const scheduleData = timelockIface.encodeFunctionData("schedule", [
    TOKEN,
    0,
    mintData,
    predecessor,
    salt,
    DELAY_S,
  ]);
  const executeData = timelockIface.encodeFunctionData("execute", [
    TOKEN,
    0,
    mintData,
    predecessor,
    salt,
  ]);

  // 3) operationId — useful for monitoring / cancellation
  const timelock = await ethers.getContractAt("CCMTimelock", TIMELOCK);
  const operationId = await timelock.hashOperation(TOKEN, 0, mintData, predecessor, salt);

  console.log("=".repeat(70));
  console.log("Phase 2 mint scheduling helper");
  console.log("  Token       :", TOKEN);
  console.log("  Timelock    :", TIMELOCK);
  console.log("  Treasury    :", TREASURY);
  console.log("  Amount      :", AMOUNT_CCM.toString(), "CCM (", amountWei.toString(), "wei )");
  console.log("  Salt label  :", SALT_LABEL);
  console.log("  Salt (hash) :", salt);
  console.log("  Delay       :", DELAY_S.toString(), "s");
  console.log("  Operation id:", operationId);
  console.log("=".repeat(70));

  console.log("\n=== STEP 1: SCHEDULE (do this now via Safe Wallet) ===");
  console.log("In Safe Wallet → New Transaction → Contract Interaction:");
  console.log("  Target:", TIMELOCK);
  console.log("  Value :", "0");
  console.log("  Data  :");
  console.log(scheduleData);

  console.log("\n=== STEP 2: EXECUTE (do this after 48h via Safe Wallet) ===");
  console.log("Wait at least", DELAY_S.toString(), "seconds (≈", (Number(DELAY_S) / 3600).toFixed(1), "hours)");
  console.log("then in Safe Wallet → New Transaction → Contract Interaction:");
  console.log("  Target:", TIMELOCK);
  console.log("  Value :", "0");
  console.log("  Data  :");
  console.log(executeData);

  console.log("\nMonitoring tip: anyone can read Timelock.getTimestamp(", operationId, ")");
  console.log("to see when this operation becomes executable (returns block timestamp once scheduled).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
