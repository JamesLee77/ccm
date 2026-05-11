/**
 * Demonstrate the Safe → Timelock flow end-to-end:
 *   1. Build a "grantRole(MINTER_ROLE, alice)" calldata for the rehearsal
 *      CCMToken (admin = a Timelock — but we'll send to Timelock-v2 here).
 *   2. Wrap it in a Timelock.schedule(target, value, data, predecessor, salt, delay)
 *      call so the Safe is the message originator.
 *   3. Sign the SafeTx with 3 of the 4 owners (EIP-712, sorted by signer).
 *   4. Submit Safe.execTransaction from any wallet (we use deployer; the
 *      Safe itself is the caller into Timelock).
 *   5. Verify Timelock emits CallScheduled with msg.sender = Safe.
 *
 * No tx will EXECUTE on the timelock in this script — execution requires
 * waiting 48h. The point of the rehearsal is to prove the schedule path
 * works, which is what was previously failing without a Safe in the loop.
 */
import { ethers } from "hardhat";

// Deployed addresses on Base Sepolia
const SAFE = "0xCD2A73Fbd9B179Cd32f0d6fC7e488e2bE3a63108"; // 3-of-4
const TIMELOCK = "0x1280E7C73e22D35c1319145B7a9eCa4199786362"; // v2, Safe as proposer
const REHEARSAL_TOKEN = "0xB5e54084eEFcc4ddc93F3A6AA7A6Dea501FB3999";

// Safe v1.4.1 EIP-712 domain & types
const SAFE_TX_TYPE = {
  SafeTx: [
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "data", type: "bytes" },
    { name: "operation", type: "uint8" },
    { name: "safeTxGas", type: "uint256" },
    { name: "baseGas", type: "uint256" },
    { name: "gasPrice", type: "uint256" },
    { name: "gasToken", type: "address" },
    { name: "refundReceiver", type: "address" },
    { name: "nonce", type: "uint256" },
  ],
};

const SAFE_ABI = [
  "function nonce() view returns (uint256)",
  "function getThreshold() view returns (uint256)",
  "function getOwners() view returns (address[])",
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) returns (bool success)",
];

async function main() {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 84532n) throw new Error("rehearsal-only script");

  // Build signers
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  const alice = new ethers.Wallet(process.env.ALICE_PRIVATE_KEY!, ethers.provider);
  const bob = new ethers.Wallet(process.env.BOB_PRIVATE_KEY!, ethers.provider);
  // 3 of 4: deployer, alice, bob — leave carol out

  const safe = new ethers.Contract(SAFE, SAFE_ABI, deployer);
  const nonce = await safe.nonce();
  console.log("Safe nonce:", nonce.toString());

  // Build the inner tx: Timelock.schedule(target=token, value=0, data=grantRole, predecessor=0, salt, delay=172800)
  const tokenIface = new ethers.Interface([
    "function grantRole(bytes32 role, address account)",
  ]);
  const MINTER_ROLE = ethers.id("MINTER_ROLE");
  const innerCallData = tokenIface.encodeFunctionData("grantRole", [
    MINTER_ROLE,
    alice.address,
  ]);

  const timelockIface = new ethers.Interface([
    "function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay)",
  ]);
  const salt = ethers.id("safe-demo:" + Date.now());
  const scheduleCallData = timelockIface.encodeFunctionData("schedule", [
    REHEARSAL_TOKEN,
    0n,
    innerCallData,
    ethers.ZeroHash,
    salt,
    172800n,
  ]);

  // SafeTx parameters (no refund, no payment)
  const safeTx = {
    to: TIMELOCK,
    value: 0n,
    data: scheduleCallData,
    operation: 0, // 0 = CALL
    safeTxGas: 0n,
    baseGas: 0n,
    gasPrice: 0n,
    gasToken: ethers.ZeroAddress,
    refundReceiver: ethers.ZeroAddress,
    nonce,
  };

  const domain = {
    chainId: network.chainId,
    verifyingContract: SAFE,
  };

  // Sign with 3 owners
  console.log("\nSigning SafeTx with 3 owners (EIP-712)…");
  const sig1 = await deployer.signTypedData(domain, SAFE_TX_TYPE, safeTx);
  const sig2 = await alice.signTypedData(domain, SAFE_TX_TYPE, safeTx);
  const sig3 = await bob.signTypedData(domain, SAFE_TX_TYPE, safeTx);

  // Safe expects sigs sorted by signer address ascending and concatenated
  const sigs = [
    { signer: deployer.address, sig: sig1 },
    { signer: alice.address, sig: sig2 },
    { signer: bob.address, sig: sig3 },
  ].sort((a, b) => a.signer.toLowerCase().localeCompare(b.signer.toLowerCase()));
  const concatenated = "0x" + sigs.map((s) => s.sig.slice(2)).join("");

  console.log("Sigs (sorted):");
  sigs.forEach((s) => console.log(`  ${s.signer}`));

  console.log("\nSubmitting Safe.execTransaction…");
  const tx = await safe.execTransaction(
    safeTx.to,
    safeTx.value,
    safeTx.data,
    safeTx.operation,
    safeTx.safeTxGas,
    safeTx.baseGas,
    safeTx.gasPrice,
    safeTx.gasToken,
    safeTx.refundReceiver,
    concatenated,
  );
  console.log("  tx:", tx.hash);
  const rcpt = await tx.wait();
  console.log("  block:", rcpt.blockNumber);

  // Look for CallScheduled event from the timelock
  const CALL_SCHEDULED_TOPIC = ethers.id(
    "CallScheduled(bytes32,uint256,address,uint256,bytes,bytes32,uint256)",
  );
  const found = rcpt.logs.find(
    (l: any) =>
      l.address.toLowerCase() === TIMELOCK.toLowerCase() &&
      l.topics[0] === CALL_SCHEDULED_TOPIC,
  );
  if (found) {
    console.log("\n✅ Timelock CallScheduled emitted (Safe was accepted as PROPOSER).");
    console.log("   opId:", found.topics[1]);
  } else {
    console.log("\n❌ CallScheduled event not found in receipt — schedule call may have reverted inside Safe.");
    process.exit(1);
  }

  console.log("\nNew Safe nonce:", (await safe.nonce()).toString());
}

main().catch((e) => { console.error(e); process.exit(1); });
