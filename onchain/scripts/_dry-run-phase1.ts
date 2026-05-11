/**
 * Dry-run the entire Phase 1 deploy sequence against a forked Base mainnet,
 * in-process. No real transactions; verifies that:
 *   - CCMToken deploys and admin holds DEFAULT_ADMIN_ROLE / MINTER_ROLE / PAUSER_ROLE
 *   - CCMVesting deploys and links to the token
 *   - Mint of 10M CCM to a dummy treasury succeeds
 *   - Cap headroom is correct after mint
 *
 * Run:
 *   BASE_MAINNET_RPC=<your rpc> \
 *     npx hardhat run scripts/_dry-run-phase1.ts --network hardhat
 */
import { ethers, network } from "hardhat";

async function main() {
  const RPC = process.env.BASE_MAINNET_RPC;
  if (!RPC) throw new Error("BASE_MAINNET_RPC env required for fork");

  await network.provider.request({
    method: "hardhat_reset",
    params: [{ forking: { jsonRpcUrl: RPC } }],
  });

  const [deployer] = await ethers.getSigners();
  console.log("Forked Base mainnet. Deployer:", deployer.address);

  // Step A: Deploy Token
  const Token = await ethers.getContractFactory("CCMToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("Token:", tokenAddr, "version:", await token.VERSION());

  const ADMIN = await token.DEFAULT_ADMIN_ROLE();
  const MINTER = await token.MINTER_ROLE();
  const PAUSER = await token.PAUSER_ROLE();
  if (!(await token.hasRole(ADMIN, deployer.address))) throw new Error("Deployer missing DEFAULT_ADMIN_ROLE after deploy");
  if (!(await token.hasRole(MINTER, deployer.address))) throw new Error("Deployer missing MINTER_ROLE after deploy");
  if (!(await token.hasRole(PAUSER, deployer.address))) throw new Error("Deployer missing PAUSER_ROLE after deploy");

  // Step B: Deploy Vesting
  const Vesting = await ethers.getContractFactory("CCMVesting");
  const vesting = await Vesting.deploy(tokenAddr, deployer.address);
  await vesting.waitForDeployment();
  const vestingAddr = await vesting.getAddress();
  console.log("Vesting:", vestingAddr);

  if ((await vesting.ccm()) !== tokenAddr) throw new Error("Vesting.ccm() mismatch");

  // Step C: Mint 10M to a dummy treasury
  const treasury = "0x000000000000000000000000000000000000dEaD";
  const amount = 10_000_000n * 10n ** 18n;
  const tx = await token.mint(treasury, amount);
  await tx.wait();

  const bal = await token.balanceOf(treasury);
  const supply = await token.totalSupply();
  const cap = await token.cap();
  console.log("Post-mint:");
  console.log("  treasury:", ethers.formatUnits(bal, 18), "CCM");
  console.log("  supply  :", ethers.formatUnits(supply, 18), "CCM");
  console.log("  cap left:", ethers.formatUnits(cap - supply, 18), "CCM");

  if (bal !== amount) throw new Error(`bal ${bal} != ${amount}`);
  if (supply !== amount) throw new Error(`supply ${supply} != ${amount}`);
  if (cap - supply !== 4_990_000_000n * 10n ** 18n) throw new Error("cap headroom wrong");

  console.log("\n✓ Dry-run passed end-to-end");
}

main().catch((e) => { console.error(e); process.exit(1); });
