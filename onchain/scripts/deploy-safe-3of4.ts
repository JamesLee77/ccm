/**
 * Deploy a 3-of-4 Gnosis Safe via the canonical Safe v1.4.1 factory.
 *
 * Owners (signers): deployer + alice + bob + carol — the four keys
 * configured in .env. Threshold 3.
 *
 * Mainnet target is 3-of-5 — for the rehearsal we use 3-of-4 (the keys
 * we have) since the dance is identical and policy-decided signers are
 * out of scope for this script.
 *
 * Run:
 *   npx hardhat run scripts/deploy-safe-3of4.ts --network baseSepolia
 */
import { ethers } from "hardhat";

// Safe v1.4.1 canonical addresses (deterministic via SingletonFactory; same
// on every chain that has the singleton factory deployed, including
// Base mainnet and Base Sepolia).
const SAFE_PROXY_FACTORY = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
const SAFE_SINGLETON = "0x41675C099F32341bf84BFc5382aF534df5C7461a";
const SAFE_FALLBACK_HANDLER = "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99";

const SAFE_PROXY_FACTORY_ABI = [
  "function createProxyWithNonce(address singleton, bytes initializer, uint256 saltNonce) returns (address proxy)",
  "function proxyCreationCode() view returns (bytes)",
];

const SAFE_SETUP_ABI = [
  "function setup(address[] _owners, uint256 _threshold, address to, bytes data, address fallbackHandler, address paymentToken, uint256 payment, address paymentReceiver)",
];

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "chainId", network.chainId.toString());

  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
  const alice = new ethers.Wallet(process.env.ALICE_PRIVATE_KEY!, ethers.provider);
  const bob = new ethers.Wallet(process.env.BOB_PRIVATE_KEY!, ethers.provider);
  const carol = new ethers.Wallet(process.env.CAROL_PRIVATE_KEY!, ethers.provider);

  // Owner order doesn't affect Safe semantics, but for readability we
  // sort by address ascending — the same order EIP-712 sig packing uses.
  const owners = [deployer.address, alice.address, bob.address, carol.address]
    .map((a) => a.toLowerCase())
    .sort()
    .map((a) => ethers.getAddress(a));
  const threshold = 3;

  console.log("\nOwners (3-of-4):");
  owners.forEach((o, i) => console.log(`  [${i}] ${o}`));
  console.log("Threshold:", threshold);

  // Sanity: factory and singleton must have code on this chain.
  const factoryCode = await ethers.provider.getCode(SAFE_PROXY_FACTORY);
  if (factoryCode === "0x") throw new Error(`SafeProxyFactory not deployed at ${SAFE_PROXY_FACTORY}`);
  const singletonCode = await ethers.provider.getCode(SAFE_SINGLETON);
  if (singletonCode === "0x") throw new Error(`Safe singleton not deployed at ${SAFE_SINGLETON}`);

  // Build the Safe.setup() initializer
  const setupIface = new ethers.Interface(SAFE_SETUP_ABI);
  const initializer = setupIface.encodeFunctionData("setup", [
    owners,
    threshold,
    ethers.ZeroAddress, // to
    "0x", // data
    SAFE_FALLBACK_HANDLER,
    ethers.ZeroAddress, // paymentToken
    0n, // payment
    ethers.ZeroAddress, // paymentReceiver
  ]);

  // Use a fresh salt nonce so this is a fresh Safe (not collide w/ any
  // existing one with the same owners/threshold).
  const saltNonce = BigInt(Math.floor(Date.now() / 1000));
  console.log("Salt nonce:", saltNonce.toString());

  const factory = new ethers.Contract(SAFE_PROXY_FACTORY, SAFE_PROXY_FACTORY_ABI, deployer);
  console.log("\nDeploying Safe proxy via factory…");
  const tx = await factory.createProxyWithNonce(SAFE_SINGLETON, initializer, saltNonce);
  console.log("  tx:", tx.hash);
  const rcpt = await tx.wait();
  console.log("  block:", rcpt.blockNumber);

  // Extract the deployed proxy address from the ProxyCreation event log.
  // The event is: ProxyCreation(address indexed proxy, address singleton)
  // Topic[1] is the proxy address.
  const PROXY_CREATION_TOPIC = ethers.id("ProxyCreation(address,address)");
  const log = rcpt.logs.find(
    (l: any) =>
      l.address.toLowerCase() === SAFE_PROXY_FACTORY.toLowerCase() &&
      l.topics[0] === PROXY_CREATION_TOPIC,
  );
  if (!log) throw new Error("ProxyCreation event not found");
  const safeAddress = ethers.getAddress("0x" + log.topics[1].slice(26));
  console.log("\n✅ Safe deployed:", safeAddress);

  // Verify state
  const safe = new ethers.Contract(
    safeAddress,
    [
      "function getOwners() view returns (address[])",
      "function getThreshold() view returns (uint256)",
      "function VERSION() view returns (string)",
    ],
    ethers.provider,
  );
  console.log("\nVerify on-chain state:");
  console.log("  VERSION  :", await safe.VERSION());
  console.log("  threshold:", (await safe.getThreshold()).toString());
  console.log("  owners   :", await safe.getOwners());

  console.log(
    "\n   safe.global app URL:",
    `https://app.safe.global/home?safe=basesep:${safeAddress}`,
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
