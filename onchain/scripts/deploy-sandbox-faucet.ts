/**
 * Deploy CCMSandboxFaucet (TESTNET ONLY) and grant it MINTER_ROLE on
 * the sandbox CCMToken so it can self-mint test CCM on demand.
 *
 * SAFETY: This script must NEVER be run against Base mainnet. The faucet
 * is a sandbox-only artifact; granting it MINTER_ROLE on a mainnet token
 * would break the token's allocation policy.
 *
 * Required env:
 *   CCM_TOKEN  - the testnet CCMToken address (the deployer must hold
 *                DEFAULT_ADMIN_ROLE on it to grant MINTER_ROLE)
 *
 * Run:
 *   CCM_TOKEN=<address> npx hardhat run scripts/deploy-sandbox-faucet.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const TOKEN = process.env.CCM_TOKEN;
  if (!TOKEN) throw new Error("CCM_TOKEN env required");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  if (network.chainId === 8453n) {
    throw new Error(
      "REFUSED: this faucet is sandbox-only and must not be deployed to Base mainnet (chainId 8453).",
    );
  }

  console.log("Network :", network.name, "chainId", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Token   :", TOKEN);

  const Faucet = await ethers.getContractFactory("CCMSandboxFaucet");
  const faucet = await Faucet.deploy(TOKEN);
  await faucet.waitForDeployment();
  const faucetAddr = await faucet.getAddress();
  console.log("\n[1/2] CCMSandboxFaucet deployed:", faucetAddr);

  // Wait a beat for RPC state to settle (Base Sepolia caching issue)
  await new Promise((r) => setTimeout(r, 4000));

  const Token = await ethers.getContractAt("CCMToken", TOKEN);
  const MINTER_ROLE = await Token.MINTER_ROLE();
  console.log("\n[2/2] Granting MINTER_ROLE to faucet…");
  const tx = await Token.grantRole(MINTER_ROLE, faucetAddr);
  await tx.wait();
  console.log("       tx:", tx.hash);

  console.log("\nDeploy complete. Sandbox faucet is live:");
  console.log(`  Faucet: ${faucetAddr}`);
  console.log(`  Token : ${TOKEN}`);
  console.log(`\nVerify on BaseScan:`);
  console.log(`  npx hardhat verify --network baseSepolia ${faucetAddr} ${TOKEN}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
