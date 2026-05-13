/**
 * Re-deploy CCMSandboxNFT (with shortened 5-minute cooldown) and the
 * CCMSandboxVault that wraps it (NFT address is immutable in the vault).
 * Then grant MINTER_ROLE on CCMToken to the new vault so wrap() can mint
 * CCM at the 1:1 ratio.
 *
 * The old NFT + vault are left untouched on-chain; they're simply no
 * longer referenced by testnet.ccmnetwork.net or the keeper Worker.
 *
 *   npx hardhat run --network baseSepolia scripts/_redeploy-nft-vault-cooldown.ts
 */
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const RPC = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";
const DEPLOYER_KEY = process.env.TESTNET_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
if (!DEPLOYER_KEY) throw new Error("TESTNET_PRIVATE_KEY or PRIVATE_KEY required");

const CCM_TOKEN = "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD"; // sandbox CCMToken (unchanged)

const NFT_ART = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "..", "artifacts", "contracts", "sandbox", "CCMSandboxNFT.sol", "CCMSandboxNFT.json"),
    "utf8",
  ),
);
const VAULT_ART = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "..", "artifacts", "contracts", "sandbox", "CCMSandboxVault.sol", "CCMSandboxVault.json"),
    "utf8",
  ),
);

// AccessControl minimal ABI for MINTER_ROLE management.
const TOKEN_ABI = [
  "function MINTER_ROLE() view returns (bytes32)",
  "function grantRole(bytes32 role, address account)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const deployer = new ethers.Wallet(DEPLOYER_KEY!, provider);
  const network = await provider.getNetwork();
  if (network.chainId !== 84532n) throw new Error("must be Base Sepolia");

  const balBefore = await provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address, "balance:", ethers.formatEther(balBefore), "ETH");

  // Deploy NFT
  console.log("Deploying CCMSandboxNFT (5-min cooldown)…");
  const NftFactory = new ethers.ContractFactory(NFT_ART.abi, NFT_ART.bytecode, deployer);
  const nft = await NftFactory.deploy();
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log("CCMSandboxNFT:", nftAddr);

  // Deploy Vault wrapping the new NFT and the existing CCMToken
  console.log("Deploying CCMSandboxVault…");
  const VaultFactory = new ethers.ContractFactory(VAULT_ART.abi, VAULT_ART.bytecode, deployer);
  const vault = await VaultFactory.deploy(nftAddr, CCM_TOKEN);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("CCMSandboxVault:", vaultAddr);

  // Grant MINTER_ROLE on CCMToken to the new vault
  console.log("Granting MINTER_ROLE on CCMToken to new vault…");
  const token = new ethers.Contract(CCM_TOKEN, TOKEN_ABI, deployer);
  const role = await token.MINTER_ROLE();
  const tx = await token.grantRole(role, vaultAddr);
  await tx.wait(1);
  const hasRole = await token.hasRole(role, vaultAddr);
  console.log("vault has MINTER_ROLE:", hasRole, "tx:", tx.hash);

  const balAfter = await provider.getBalance(deployer.address);
  console.log("Deployer balance after:", ethers.formatEther(balAfter), "ETH");

  console.log("\n--- update testnet/src/lib/contracts.ts ---");
  console.log(`  ccmSandboxNFT:      "${nftAddr}",`);
  console.log(`  ccmSandboxVault:    "${vaultAddr}",`);
  console.log("\n--- update portal-api/wrangler.toml ---");
  console.log(`  CCM_SANDBOX_NFT_ADDRESS = "${nftAddr}"`);
  console.log("\n--- update onchain/scripts/_bootstrap-keeper-mint.ts ---");
  console.log(`  const NFT_ADDR = "${nftAddr}";`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
