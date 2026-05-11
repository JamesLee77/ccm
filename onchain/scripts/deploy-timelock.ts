/**
 * Deploy CCMTimelock — works on Base Sepolia (rehearsal) and mainnet.
 *
 * On Base Sepolia (84532) and Base mainnet (8453), MIN_DELAY (48h) is
 * enforced on-chain by the constructor.
 *
 * Required env:
 *   PROPOSERS    - comma-separated address list (typically the multisig)
 *   EXECUTORS    - comma-separated address list (multisig, or 0x0…0 for "anyone")
 *   ADMIN        - initial admin (set to address(0) for self-administered)
 *   MIN_DELAY    - seconds; defaults to 172800 (48h)
 *
 * Examples:
 *   # Rehearsal: deployer fills all roles
 *   PROPOSERS=0xB722... EXECUTORS=0xB722... ADMIN=0x0000…0000 MIN_DELAY=172800 \
 *     npx hardhat run scripts/deploy-timelock.ts --network baseSepolia
 *
 *   # Mainnet: Safe is sole proposer/executor, self-administered
 *   PROPOSERS=<safe> EXECUTORS=<safe> ADMIN=0x0000…0000 MIN_DELAY=172800 \
 *     npx hardhat run scripts/deploy-timelock.ts --network baseMainnet
 */
import { ethers } from "hardhat";

function parseAddrList(envVal: string | undefined, label: string): string[] {
  if (!envVal) throw new Error(`${label} required`);
  const addrs = envVal
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (addrs.length === 0) throw new Error(`${label} must contain at least one address`);
  for (const a of addrs) {
    if (!ethers.isAddress(a)) throw new Error(`${label} contains invalid address: ${a}`);
  }
  return addrs;
}

async function main() {
  const proposers = parseAddrList(process.env.PROPOSERS, "PROPOSERS");
  const executors = parseAddrList(process.env.EXECUTORS, "EXECUTORS");
  const adminEnv = process.env.ADMIN;
  if (!adminEnv) throw new Error("ADMIN required (use 0x0000…0000 for self-administered)");
  if (!ethers.isAddress(adminEnv)) throw new Error(`ADMIN invalid: ${adminEnv}`);

  const minDelay = process.env.MIN_DELAY ? Number(process.env.MIN_DELAY) : 48 * 60 * 60;
  if (!Number.isInteger(minDelay) || minDelay < 0) throw new Error("MIN_DELAY invalid");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network  :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer :", deployer.address);
  console.log("Proposers:", proposers);
  console.log("Executors:", executors);
  console.log("Admin    :", adminEnv);
  console.log("minDelay :", minDelay, "s (=", (minDelay / 3600).toFixed(2), "h )");

  const TL = await ethers.getContractFactory("CCMTimelock");
  const tl = await TL.deploy(minDelay, proposers, executors, adminEnv);
  await tl.waitForDeployment();
  const addr = await tl.getAddress();
  console.log("\nCCMTimelock deployed:", addr);

  console.log("\nVerify on BaseScan:");
  const proposersJSON = JSON.stringify(proposers);
  const executorsJSON = JSON.stringify(executors);
  console.log(
    `  npx hardhat verify --network baseSepolia ${addr} ${minDelay} '${proposersJSON}' '${executorsJSON}' ${adminEnv}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
