/**
 * Deploy CCMSandboxStaking + MockPriceOracle to Base Sepolia and fund
 * the staking pool with sandbox CCM.
 *
 * Required env:
 *   CCM_TOKEN (sandbox)   - existing sandbox token address
 *
 * Optional env:
 *   POOL_INIT_CCM   - whole-CCM amount to seed the pool (default 5_000_000)
 *   PRICE_USD_E18   - oracle CCM/USD price, 1e18 fixed (default 200000000000000000 = $0.20)
 *
 * Run:
 *   CCM_TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
 *     npx hardhat run scripts/deploy-sandbox-staking.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const TOKEN_RAW = process.env.CCM_TOKEN;
  if (!TOKEN_RAW || !ethers.isAddress(TOKEN_RAW)) {
    throw new Error("CCM_TOKEN env var (valid address) required");
  }
  const TOKEN = ethers.getAddress(TOKEN_RAW);

  const POOL_INIT_CCM = BigInt(process.env.POOL_INIT_CCM ?? "5000000");
  const POOL_INIT = POOL_INIT_CCM * 10n ** 18n;
  const PRICE = BigInt(process.env.PRICE_USD_E18 ?? "200000000000000000"); // $0.20 in 1e18

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 84532n) {
    throw new Error(`Refusing to run: chainId is ${network.chainId} (expected 84532 = Base Sepolia)`);
  }

  console.log("=".repeat(70));
  console.log("Sandbox staking deploy");
  console.log("  Network    :", network.name, "chainId", network.chainId.toString());
  console.log("  Deployer   :", deployer.address);
  console.log("  Token      :", TOKEN);
  console.log("  Pool init  :", POOL_INIT_CCM.toString(), "CCM");
  console.log("  Oracle px  :", ethers.formatUnits(PRICE, 18), "USD");
  console.log("=".repeat(70));

  // 1. Deploy MockPriceOracle
  console.log("\n[1/4] Deploying MockPriceOracle …");
  const Oracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = await Oracle.deploy(PRICE);
  await oracle.waitForDeployment();
  const oracleAddr = await oracle.getAddress();
  console.log("       MockPriceOracle:", oracleAddr);

  // 2. Deploy CCMSandboxStaking
  console.log("\n[2/4] Deploying CCMSandboxStaking …");
  const Staking = await ethers.getContractFactory("CCMSandboxStaking");
  const staking = await Staking.deploy(
    TOKEN,
    oracleAddr,
    PRICE, // p0Tge = current price for testnet
    POOL_INIT,
    deployer.address,
  );
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log("       CCMSandboxStaking:", stakingAddr);

  // 3. Fund the staking pool — admin mints CCM and sends to the contract
  console.log("\n[3/4] Funding pool: mint", POOL_INIT_CCM.toString(), "CCM →", stakingAddr, "…");
  const token = await ethers.getContractAt("CCMToken", TOKEN);
  const MINTER_ROLE = await token.MINTER_ROLE();
  if (!(await token.hasRole(MINTER_ROLE, deployer.address))) {
    throw new Error(`Deployer ${deployer.address} does not hold MINTER_ROLE on the sandbox token`);
  }
  const mintTx = await token.mint(stakingAddr, POOL_INIT);
  const mintReceipt = await mintTx.wait(2);
  if (!mintReceipt) throw new Error("mint tx.wait returned null");
  console.log("       mint tx:", mintTx.hash);

  // 4. Verify post-deploy state
  console.log("\n[4/4] Verifying state …");
  const poolBal = await token.balanceOf(stakingAddr);
  const poolRem = await staking.poolRemaining();
  const orPx = await oracle.getPrice();
  console.log("       staking CCM balance :", ethers.formatUnits(poolBal, 18));
  console.log("       poolRemaining       :", ethers.formatUnits(poolRem, 18));
  console.log("       oracle price        :", ethers.formatUnits(orPx, 18), "USD");
  if (poolBal !== POOL_INIT) throw new Error("pool balance mismatch");
  if (poolRem !== POOL_INIT) throw new Error("poolRemaining mismatch");

  console.log("\n✓ Done. Addresses to record in DEPLOYMENT.md:");
  console.log("  MockPriceOracle  :", oracleAddr);
  console.log("  CCMSandboxStaking:", stakingAddr);
  console.log("\nVerification commands:");
  console.log(`  npx hardhat verify --network baseSepolia ${oracleAddr} ${PRICE}`);
  console.log(`  npx hardhat verify --network baseSepolia ${stakingAddr} ${TOKEN} ${oracleAddr} ${PRICE} ${POOL_INIT} ${deployer.address}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
