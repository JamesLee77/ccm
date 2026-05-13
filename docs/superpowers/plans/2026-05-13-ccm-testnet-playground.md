# CCM Testnet Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `testnet.ccmnetwork.net` marketing-mirror with a hands-on 4-step playground (mine → wrap → stake → claim) on Base Sepolia, targeted at prospective investors.

**Architecture:** Single-page React + Vite SPA in `testnet/`, wagmi for chain interactions, Base Sepolia only. Reuses existing sandbox contracts (NFT, Vault, Token) and adds two new ones (`CCMSandboxStaking` + `MockPriceOracle`).

**Tech Stack:** Vite + React + TypeScript, wagmi + viem + RainbowKit, Tailwind CSS, i18next (KO/EN). Contracts: Solidity 0.8.24 (Cancun, OZ), Hardhat. Deploy: Cloudflare Pages (`ccm-testnet` project).

**Spec:** `docs/superpowers/specs/2026-05-13-ccm-testnet-playground-design.md`

---

## File Structure

**Contracts (new):**
- Create: `onchain/contracts/sandbox/CCMSandboxStaking.sol` — sandbox variant of CCMStaking (no eligibility gate)
- Create: `onchain/test/sandbox/CCMSandboxStaking.test.ts` — unit tests
- Create: `onchain/scripts/deploy-sandbox-staking.ts` — deploys MockPriceOracle + CCMSandboxStaking + funds pool

**Modify:**
- `onchain/DEPLOYMENT.md` — append new addresses to sandbox section
- `testnet/.env` — add SEPOLIA RPC URL (currently CDP env shared from repo root)
- `testnet/package.json` — add dependencies (wagmi, viem, RainbowKit, i18next, react-i18next)

**testnet/ (delete legacy, create new):**
- Delete: `testnet/src/pages/{Home,Demo,About}.tsx`, `testnet/src/App.tsx` (legacy routes)
- Create: `testnet/src/App.tsx` — root, mounts Playground
- Create: `testnet/src/main.tsx` — entry with providers
- Create: `testnet/src/index.css` — import design tokens
- Create: `testnet/src/lib/i18n.ts` — i18next config
- Create: `testnet/src/lib/wagmi.ts` — Sepolia-only wagmi config
- Create: `testnet/src/lib/contracts.ts` — sandbox addresses + minimal ABIs
- Create: `testnet/src/locales/en.json` — English strings
- Create: `testnet/src/locales/ko.json` — Korean strings
- Create: `testnet/src/pages/Playground.tsx` — composes 4 steps
- Create: `testnet/src/components/site/TestnetLayout.tsx`
- Create: `testnet/src/components/site/Nav.tsx`
- Create: `testnet/src/components/site/Footer.tsx`
- Create: `testnet/src/components/site/TestnetBanner.tsx`
- Create: `testnet/src/components/site/ThemeProvider.tsx`
- Create: `testnet/src/components/site/ThemeToggle.tsx`
- Create: `testnet/src/components/site/LanguageSwitcher.tsx`
- Create: `testnet/src/components/brand/Wordmark.tsx` — copy from frontend
- Create: `testnet/src/components/brand/wordmark-paths.ts` — copy from frontend
- Create: `testnet/src/components/wallet/WalletStatusBar.tsx`
- Create: `testnet/src/components/playground/StepCard.tsx`
- Create: `testnet/src/components/playground/MintForm.tsx`
- Create: `testnet/src/components/playground/CooldownTimer.tsx`
- Create: `testnet/src/components/playground/NFTInventory.tsx`
- Create: `testnet/src/components/playground/WrapForm.tsx`
- Create: `testnet/src/components/playground/StakeForm.tsx`
- Create: `testnet/src/components/playground/RewardPanel.tsx`
- Create: `testnet/src/components/playground/TryMoreGrid.tsx`
- Create: `testnet/src/components/playground/TxToast.tsx`

---

## Task 1: CCMSandboxStaking contract + unit tests

**Files:**
- Create: `onchain/contracts/sandbox/CCMSandboxStaking.sol`
- Create: `onchain/test/sandbox/CCMSandboxStaking.test.ts`
- Reference: `onchain/contracts/CCMStaking.sol` (copy-with-modification base)
- Reference: `onchain/contracts/mocks/MockPriceOracle.sol`
- Reference: `onchain/test/CCMStaking.test.ts` (test pattern)

- [ ] **Step 1: Write the failing test file**

Write `/Users/hyunsuklee/Developer/ccm/onchain/test/sandbox/CCMSandboxStaking.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const E18 = 10n ** 18n;
const P0 = 15n * 10n ** 16n;          // $0.15
const POOL_INIT = 1_000_000n * E18;    // 1M CCM
const STAKE_AMT = 1_000n * E18;        // 1k CCM

async function deploy() {
  const [admin, alice, bob] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("CCMToken");
  const token = await Token.deploy(admin.address);
  await token.waitForDeployment();

  const Oracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = await Oracle.deploy(P0);
  await oracle.waitForDeployment();

  const Staking = await ethers.getContractFactory("CCMSandboxStaking");
  const staking = await Staking.deploy(
    await token.getAddress(),
    await oracle.getAddress(),
    P0,
    POOL_INIT,
    admin.address,
  );
  await staking.waitForDeployment();

  // Fund the staking pool with CCM (transfer model — contract pays rewards from its balance)
  await token.mint(await staking.getAddress(), POOL_INIT);

  // Give alice/bob some CCM to stake
  await token.mint(alice.address, STAKE_AMT * 10n);
  await token.mint(bob.address, STAKE_AMT * 10n);

  return { token, oracle, staking, admin, alice, bob };
}

describe("CCMSandboxStaking", () => {
  it("anyone can stake (no eligibility gate)", async () => {
    const { token, staking, alice } = await deploy();
    await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT);
    await expect(staking.connect(alice).stake(STAKE_AMT))
      .to.emit(staking, "Staked")
      .withArgs(alice.address, STAKE_AMT, STAKE_AMT);
    const u = await staking.users(alice.address);
    expect(u.staked).to.equal(STAKE_AMT);
  });

  it("stake(0) reverts with 'zero amount'", async () => {
    const { staking, alice } = await deploy();
    await expect(staking.connect(alice).stake(0n)).to.be.revertedWith("Staking: zero amount");
  });

  it("pendingReward grows over time", async () => {
    const { token, staking, alice } = await deploy();
    await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT);
    await staking.connect(alice).stake(STAKE_AMT);
    const t0 = await staking.pendingReward(alice.address);
    await time.increase(7 * 24 * 3600); // +7 days
    const t1 = await staking.pendingReward(alice.address);
    expect(t1).to.be.greaterThan(t0);
  });

  it("claim() transfers reward and resets pending", async () => {
    const { token, staking, alice } = await deploy();
    await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT);
    await staking.connect(alice).stake(STAKE_AMT);
    await time.increase(30 * 24 * 3600);
    const before = await token.balanceOf(alice.address);
    await staking.connect(alice).claim();
    const after = await token.balanceOf(alice.address);
    expect(after).to.be.greaterThan(before);
    expect(await staking.pendingReward(alice.address)).to.equal(0n);
  });

  it("unstake(amount) returns principal and harvests reward", async () => {
    const { token, staking, alice } = await deploy();
    await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT);
    await staking.connect(alice).stake(STAKE_AMT);
    await time.increase(7 * 24 * 3600);
    const before = await token.balanceOf(alice.address);
    await staking.connect(alice).unstake(STAKE_AMT);
    const after = await token.balanceOf(alice.address);
    // Should receive principal + harvested reward (so > principal alone)
    expect(after - before).to.be.greaterThanOrEqual(STAKE_AMT);
  });

  it("yield rate is at maximum when pool is fresh and price equals TGE", async () => {
    const { staking } = await deploy();
    const rate = await staking.currentYieldRateBps();
    // R0 = 1000 bps (10%/month). With price = P0_TGE and full pool, rate ≈ R0.
    expect(rate).to.be.closeTo(1000n, 5n);
  });

  it("yield rate decays as pool drains", async () => {
    const { token, staking, alice } = await deploy();
    await token.connect(alice).approve(await staking.getAddress(), STAKE_AMT * 10n);
    await staking.connect(alice).stake(STAKE_AMT * 10n);
    await time.increase(60 * 24 * 3600); // 60 days — many claims
    await staking.connect(alice).claim();
    const rate = await staking.currentYieldRateBps();
    expect(rate).to.be.lessThan(1000n);
  });

  it("pool exhaustion: when poolRemaining == 0 yield rate is 0", async () => {
    const { token, oracle, alice } = await deploy();
    // Use a tiny pool so we can exhaust it
    const Staking = await ethers.getContractFactory("CCMSandboxStaking");
    const tiny = 100n * E18;
    const smallStaking = await Staking.deploy(
      await token.getAddress(),
      await oracle.getAddress(),
      P0,
      tiny,
      (await ethers.getSigners())[0].address,
    );
    await smallStaking.waitForDeployment();
    await token.mint(await smallStaking.getAddress(), tiny);
    await token.connect(alice).approve(await smallStaking.getAddress(), STAKE_AMT);
    await smallStaking.connect(alice).stake(STAKE_AMT);
    await time.increase(365 * 24 * 3600); // 1 year — should drain
    await smallStaking.connect(alice).claim();
    const rate = await smallStaking.currentYieldRateBps();
    expect(rate).to.equal(0n);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails (contract not yet written)**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  npx hardhat test test/sandbox/CCMSandboxStaking.test.ts 2>&1 | tail -10
```

Expected: failure compiling because `CCMSandboxStaking` does not exist (Solidity compile error or "ContractFactory not found").

- [ ] **Step 3: Read the existing CCMStaking source as the basis**

```bash
cat /Users/hyunsuklee/Developer/ccm/onchain/contracts/CCMStaking.sol
```

Note its full content. The sandbox variant is the same logic minus one line.

- [ ] **Step 4: Write `CCMSandboxStaking.sol`**

Write `/Users/hyunsuklee/Developer/ccm/onchain/contracts/sandbox/CCMSandboxStaking.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CCM Sandbox Staking — testnet variant of CCMStaking
 * @notice Identical mechanics to CCMStaking (price-elastic decaying yield,
 *         capped at 10%/month, emissions stop when pool drains) but WITHOUT
 *         the eligibility whitelist. Anyone can stake.
 *
 * Used only on Base Sepolia for the testnet.ccmnetwork.net playground.
 *
 * Differences from CCMStaking:
 *   - No `eligible` mapping
 *   - No `setEligible*` admin functions
 *   - `stake()` does not require eligibility
 *   - Constructor refuses chainId 8453 (mainnet) — sandbox safety guard
 *
 * Funding model: transfer-from-balance. The reward pool is the contract's
 * own ERC20 balance. The admin transfers `POOL_INIT` CCM into the contract
 * after deploy. `poolRemaining` is bookkeeping; physical payout comes from
 * the contract's balance via `ccm.safeTransfer(...)`.
 */
interface IPriceOracle {
    function getPrice() external view returns (uint256 price);
}

contract CCMSandboxStaking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant BPS = 10_000;
    uint256 public constant R0_BPS = 1_000; // 10%/month

    IERC20  public immutable ccm;
    IPriceOracle public priceOracle;
    uint256 public immutable P0_TGE;
    uint256 public immutable POOL_INIT;

    uint256 public poolRemaining;
    uint256 public totalStaked;

    struct UserInfo {
        uint256 staked;
        uint256 lastAccruedAt; // timestamp of last harvest
    }
    mapping(address => UserInfo) public users;

    event Staked(address indexed user, uint256 amount, uint256 newBalance);
    event Unstaked(address indexed user, uint256 amount, uint256 newBalance);
    event RewardClaimed(address indexed user, uint256 amount, uint256 poolRemaining);
    event OracleUpdated(address newOracle);

    constructor(
        address ccm_,
        address oracle_,
        uint256 p0Tge_,
        uint256 poolInit_,
        address admin
    ) {
        require(block.chainid != 8453, "SandboxStaking: refuses mainnet");
        require(ccm_ != address(0) && oracle_ != address(0) && admin != address(0), "Staking: zero");
        require(p0Tge_ > 0 && poolInit_ > 0, "Staking: invalid params");
        ccm = IERC20(ccm_);
        priceOracle = IPriceOracle(oracle_);
        P0_TGE = p0Tge_;
        POOL_INIT = poolInit_;
        poolRemaining = poolInit_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // --- yield rate -------------------------------------------------

    function currentYieldRateBps() public view returns (uint256 rateBps) {
        if (poolRemaining == 0) return 0;
        uint256 currentPrice = priceOracle.getPrice();
        if (currentPrice == 0) return 0;
        // R0 × (P_TGE / P) × (poolLeft / poolInit)
        uint256 priceFactor = (P0_TGE * 1e18) / currentPrice;
        uint256 poolFactor  = (poolRemaining * 1e18) / POOL_INIT;
        uint256 r = (R0_BPS * priceFactor * poolFactor) / (1e18 * 1e18);
        return r > R0_BPS ? R0_BPS : r;
    }

    function pendingReward(address user) public view returns (uint256) {
        UserInfo storage u = users[user];
        if (u.staked == 0 || u.lastAccruedAt == 0) return 0;
        uint256 dt = block.timestamp - u.lastAccruedAt;
        uint256 r = currentYieldRateBps();
        uint256 owed = (u.staked * r * dt) / (BPS * SECONDS_PER_MONTH);
        if (owed > poolRemaining) owed = poolRemaining;
        return owed;
    }

    function poolUsedPct() external view returns (uint256 pct) {
        return ((POOL_INIT - poolRemaining) * 1e4) / POOL_INIT; // basis points
    }

    // --- write -------------------------------------------------------

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Staking: zero amount");
        _harvest(msg.sender);
        ccm.safeTransferFrom(msg.sender, address(this), amount);
        UserInfo storage u = users[msg.sender];
        u.staked += amount;
        if (u.lastAccruedAt == 0) u.lastAccruedAt = block.timestamp;
        totalStaked += amount;
        emit Staked(msg.sender, amount, u.staked);
    }

    function unstake(uint256 amount) external nonReentrant {
        UserInfo storage u = users[msg.sender];
        require(amount > 0 && amount <= u.staked, "Staking: bad amount");
        _harvest(msg.sender);
        u.staked -= amount;
        totalStaked -= amount;
        ccm.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount, u.staked);
    }

    function claim() external nonReentrant {
        _harvest(msg.sender);
    }

    function _harvest(address user) internal {
        UserInfo storage u = users[user];
        if (u.staked == 0) {
            u.lastAccruedAt = block.timestamp;
            return;
        }
        uint256 owed = pendingReward(user);
        u.lastAccruedAt = block.timestamp;
        if (owed == 0) return;
        poolRemaining -= owed;
        ccm.safeTransfer(user, owed);
        emit RewardClaimed(user, owed, poolRemaining);
    }

    // --- admin -------------------------------------------------------

    function updateOracle(address newOracle) external onlyRole(ADMIN_ROLE) {
        require(newOracle != address(0), "Staking: zero oracle");
        priceOracle = IPriceOracle(newOracle);
        emit OracleUpdated(newOracle);
    }
}
```

- [ ] **Step 5: Compile and run tests**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  npx hardhat compile 2>&1 | tail -5 && \
  npx hardhat test test/sandbox/CCMSandboxStaking.test.ts 2>&1 | tail -20
```

Expected: All 8 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add onchain/contracts/sandbox/CCMSandboxStaking.sol onchain/test/sandbox/CCMSandboxStaking.test.ts && \
  git commit -m "feat(onchain): add CCMSandboxStaking — testnet staking without eligibility gate

Same yield mechanics as CCMStaking (R0=10%/month decaying with
poolRemaining and CCM/USD price) but no eligibility whitelist —
the playground needs unrestricted access for any visitor.

Constructor refuses mainnet (chainId 8453) as a safety guard.
Funding model: admin transfers CCM into the contract after deploy;
rewards paid from the contract's own balance via safeTransfer.

8 unit tests cover stake without eligibility, zero-amount revert,
reward growth, claim transfer, unstake principal+harvest, max rate
at fresh pool, decay, and exhaustion."
```

---

## Task 2: Deploy SandboxStaking + MockPriceOracle to Sepolia + fund pool

**Files:**
- Create: `onchain/scripts/deploy-sandbox-staking.ts`
- Modify: `onchain/DEPLOYMENT.md` (append addresses to sandbox section)

- [ ] **Step 1: Write the deploy script**

Write `/Users/hyunsuklee/Developer/ccm/onchain/scripts/deploy-sandbox-staking.ts`:

```typescript
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
```

- [ ] **Step 2: Compile**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && npx hardhat compile 2>&1 | tail -3
```

Expected: `Compiled N Solidity files successfully` or `Nothing to compile`.

- [ ] **Step 3: Deploy to Base Sepolia**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  CCM_TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
  npx hardhat run scripts/deploy-sandbox-staking.ts --network baseSepolia 2>&1 | tail -20
```

Expected: prints `MockPriceOracle: 0x...` and `CCMSandboxStaking: 0x...` and `✓ Done`. Record both addresses as `<ORACLE>` and `<STAKING>` for the next steps.

- [ ] **Step 4: Verify on BaseScan**

```bash
cd /Users/hyunsuklee/Developer/ccm/onchain && \
  npx hardhat verify --network baseSepolia <ORACLE> 200000000000000000 2>&1 | tail -5 && \
  npx hardhat verify --network baseSepolia <STAKING> \
    0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
    <ORACLE> \
    200000000000000000 \
    5000000000000000000000000 \
    <DEPLOYER_EOA_ADDRESS> 2>&1 | tail -5
```

Replace `<DEPLOYER_EOA_ADDRESS>` with the deployer EOA (= `ADMIN_ADDRESS` env var, typically `0xB722843587DA96bdFb5638Bb0AbC8FC56a9dfa1D` for Sepolia).

Expected: both contracts show `Successfully verified contract … on the block explorer`.

- [ ] **Step 5: Update DEPLOYMENT.md**

Open `/Users/hyunsuklee/Developer/ccm/onchain/DEPLOYMENT.md` and find the sandbox "Deployed contracts" table (around line 38). Append two new rows above the `~~CCMSandboxVault v0~~` decommissioned row:

```markdown
| **MockPriceOracle** *(sandbox-only, CCM/USD fixed $0.20)* | `<ORACLE>` | [verified](https://sepolia.basescan.org/address/<ORACLE>#code) |
| **CCMSandboxStaking** *(sandbox-only, 5M CCM pool, no eligibility gate)* | `<STAKING>` | [verified](https://sepolia.basescan.org/address/<STAKING>#code) |
```

Also append a paragraph to the sandbox "Initial state (post-deploy)" section:

```markdown
CCMSandboxStaking *(testnet-only)*:
- `ccm`: `0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD` (sandbox token)
- `priceOracle`: `<ORACLE>` (fixed $0.20)
- `P0_TGE`: `200000000000000000` (0.20 USD in 1e18)
- `POOL_INIT`: `5000000000000000000000000` (5,000,000 CCM)
- `poolRemaining`: 5,000,000 CCM (full, fresh deploy)
- Funded at tx: `<mint tx hash from Step 3>`
- For the testnet.ccmnetwork.net playground — no eligibility whitelist; anyone can stake
```

Replace `<ORACLE>`, `<STAKING>`, and `<mint tx hash>` with the values captured in Step 3.

- [ ] **Step 6: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add onchain/scripts/deploy-sandbox-staking.ts onchain/DEPLOYMENT.md && \
  git commit -m "feat(onchain): deploy CCMSandboxStaking + MockPriceOracle on Sepolia

Deployed to Base Sepolia for the testnet.ccmnetwork.net playground.
5M sandbox CCM seeded into the staking pool from the admin EOA via
direct mint. Both contracts BaseScan-verified.

Addresses recorded in DEPLOYMENT.md sandbox section.

For the implementation plan: testnet/ frontend will reference these
addresses in lib/contracts.ts (Task 3)."
```

---

## Task 3: testnet/ scaffold — clear legacy, set up new structure

**Files:**
- Delete: `testnet/src/pages/Home.tsx`, `testnet/src/pages/Demo.tsx`, `testnet/src/pages/About.tsx`
- Delete (legacy demo card components, dependent on the old richer contracts.ts shape):
  `testnet/src/components/ClaimCard.tsx`, `testnet/src/components/FractionalizeCard.tsx`,
  `testnet/src/components/GradeWrapperCard.tsx`, `testnet/src/components/IndexBasketCard.tsx`,
  `testnet/src/components/InsuranceCard.tsx`, `testnet/src/components/LendingCard.tsx`,
  `testnet/src/components/NFTSandbox.tsx`, `testnet/src/components/RebateCard.tsx`,
  `testnet/src/components/WrapCard.tsx`, `testnet/src/components/YieldCard.tsx`
- Modify: `testnet/src/App.tsx`, `testnet/src/main.tsx`, `testnet/index.html`, `testnet/package.json`
- Create: `testnet/src/lib/wagmi.ts`, `testnet/src/lib/contracts.ts`, `testnet/src/lib/i18n.ts`
- Create: `testnet/src/locales/en.json`, `testnet/src/locales/ko.json`
- Create: `testnet/src/pages/Playground.tsx` (placeholder)

- [ ] **Step 1: Remove legacy pages and legacy demo card components**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  rm src/pages/Home.tsx src/pages/Demo.tsx src/pages/About.tsx \
     src/components/ClaimCard.tsx \
     src/components/FractionalizeCard.tsx \
     src/components/GradeWrapperCard.tsx \
     src/components/IndexBasketCard.tsx \
     src/components/InsuranceCard.tsx \
     src/components/LendingCard.tsx \
     src/components/NFTSandbox.tsx \
     src/components/RebateCard.tsx \
     src/components/WrapCard.tsx \
     src/components/YieldCard.tsx
```

- [ ] **Step 2: Inspect existing package.json dependencies**

```bash
cat /Users/hyunsuklee/Developer/ccm/testnet/package.json | python3 -c "import json,sys; p=json.load(sys.stdin); print('deps:'); [print(' -',k,':',v) for k,v in p.get('dependencies',{}).items()]"
```

Confirm: wagmi, viem, @rainbow-me/rainbowkit, react, react-dom, react-router-dom are present. If `i18next` and `react-i18next` are NOT in dependencies, install them:

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npm install i18next react-i18next 2>&1 | tail -3
```

- [ ] **Step 3: Write the wagmi config**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/lib/wagmi.ts`:

```typescript
/**
 * Single-chain wagmi config: Base Sepolia only. No mainnet path.
 */
import { http } from "viem";
import { baseSepolia } from "viem/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const TESTNET_CHAIN = baseSepolia;
export const TESTNET_CHAIN_ID = baseSepolia.id; // 84532

const RPC = import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

export const wagmiConfig = getDefaultConfig({
  appName: "CCM Testnet Playground",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(RPC),
  },
  ssr: false,
});
```

- [ ] **Step 4: Write the contracts.ts**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/lib/contracts.ts`:

```typescript
import type { Address } from "viem";

/**
 * Base Sepolia sandbox contract addresses + minimal ABIs needed by the
 * playground UI. CCMSandboxStaking address comes from Task 2's deploy
 * (replace <STAKING> below with the deployed address).
 */
export const SANDBOX = {
  ccmToken:           "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD" as Address,
  ccmSandboxNFT:      "0xbC3EAc7514F82A868807b81b165D2121495380E9" as Address,
  ccmSandboxVault:    "0xEd62b71e9ff0200CFf02C8F38618Af153C609334" as Address,
  ccmSandboxStaking:  "<STAKING>" as Address,    // Task 2 output
  mockPriceOracle:    "<ORACLE>"  as Address,    // Task 2 output
};

export const EXPLORER = "https://sepolia.basescan.org";

// --- minimal ABIs ----------------------------------------------------

export const CCMTokenAbi = [
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
] as const;

export const CCMSandboxNFTAbi = [
  { type: "function", name: "mint", inputs: [{ name: "grade", type: "uint8" }, { name: "vintage", type: "uint16" }, { name: "tonnage", type: "uint16" }, { name: "projectId", type: "bytes32" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "meta", inputs: [{ type: "uint256" }], outputs: [
    { name: "grade", type: "uint8" },
    { name: "vintage", type: "uint16" },
    { name: "tonnage", type: "uint16" },
    { name: "projectId", type: "bytes32" },
    { name: "minter", type: "address" },
  ], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "mintCooldown", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "isApprovedForAll", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "setApprovalForAll", inputs: [{ type: "address" }, { type: "bool" }], outputs: [], stateMutability: "nonpayable" },
] as const;

export const CCMSandboxVaultAbi = [
  { type: "function", name: "wrap", inputs: [{ name: "nftIds", type: "uint256[]" }, { name: "amounts", type: "uint256[]" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "reserves", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export const CCMSandboxStakingAbi = [
  { type: "function", name: "stake", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unstake", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "claim", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "pendingReward", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "users", inputs: [{ type: "address" }], outputs: [
    { name: "staked", type: "uint256" },
    { name: "lastAccruedAt", type: "uint256" },
  ], stateMutability: "view" },
  { type: "function", name: "currentYieldRateBps", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalStaked", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "poolRemaining", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "poolUsedPct", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;
```

After Task 2 completes, edit lines containing `<STAKING>` and `<ORACLE>` with the actual deployed addresses.

- [ ] **Step 5: Write i18n config + locale stubs**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/lib/i18n.ts`:

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import ko from "../locales/ko.json";

const stored = typeof window !== "undefined" ? window.localStorage.getItem("ccm-testnet-lang") : null;
const initialLang = stored === "en" || stored === "ko" ? stored : "ko";

void i18n.use(initReactI18next).init({
  lng: initialLang,
  fallbackLng: "en",
  supportedLngs: ["ko", "en"],
  resources: { ko, en },
  interpolation: { escapeValue: false },
});

export default i18n;

export function setLang(lng: "ko" | "en") {
  void i18n.changeLanguage(lng);
  try { window.localStorage.setItem("ccm-testnet-lang", lng); } catch {}
}
```

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/locales/en.json`:

```json
{
  "translation": {
    "nav": { "title": "CCM testnet", "lang": "Language" },
    "hero": {
      "headline": "Experience CCM on Base Sepolia.",
      "tagline": "Mine carbon credits, wrap to CCM, stake, earn.",
      "warning": "⚠ Base Sepolia testnet — tokens have no real value."
    },
    "wallet": {
      "connect": "Connect Wallet",
      "wrongChain": "Switch to Base Sepolia",
      "connected": "Connected"
    },
    "step1": {
      "title": "Mine a Carbon Credit",
      "subtitle": "1 NFT per address per hour. Pick grade, vintage, tonnage.",
      "labels": { "grade": "Grade", "vintage": "Vintage", "tonnage": "Tonnage (t)" },
      "mine": "Mine",
      "cooldown": "Mine again in {{time}}",
      "inventory": "Your NFTs",
      "emptyInventory": "No NFTs yet. Mine your first credit above.",
      "row": "#{{id}} Grade {{grade}} · {{vintage}} · {{tonnage}}t"
    },
    "step2": {
      "title": "Wrap NFT → CCM",
      "subtitle": "1 tonne = 1 CCM. Vault returns lower grades first (D→C→B→A).",
      "selectAll": "Select all",
      "approve": "Approve vault",
      "wrap": "Wrap selected",
      "maxPerTx": "Max 5 NFTs per transaction",
      "balance": "Your CCM balance",
      "noNfts": "Mine some NFTs first."
    },
    "step3": {
      "title": "Stake CCM",
      "subtitle": "Earn yield while pool lasts. Up to 10%/month, decays as pool drains.",
      "amount": "Amount",
      "max": "Max",
      "approve": "Approve token",
      "stake": "Stake",
      "approveAndStake": "Approve & Stake",
      "currentStake": "Your stake",
      "currentRate": "Current rate",
      "noBalance": "Wrap some NFTs to get CCM first."
    },
    "step4": {
      "title": "Claim Reward",
      "subtitle": "Reward accrues every block.",
      "pending": "Pending reward",
      "claim": "Claim",
      "unstake": "Unstake",
      "unstakeAmount": "Unstake amount",
      "poolExhausted": "Pool exhausted. Operator must refill."
    },
    "tryMore": {
      "title": "Try more (coming soon)",
      "lending": "Lending — borrow USDC against NFT",
      "yield": "Yield farming",
      "basket": "Index basket — CCM-PRIME / FOREST / TECH",
      "retire": "Retire to earn"
    },
    "footer": {
      "contracts": "Contracts (Base Sepolia)",
      "explorer": "BaseScan",
      "mainnet": "Visit the live portal",
      "github": "Source on GitHub"
    },
    "errors": {
      "rpcRetry": "Network error, retrying…",
      "userRejected": "Transaction cancelled.",
      "txReverted": "Transaction reverted",
      "txPending": "Transaction pending…",
      "txMined": "Transaction confirmed"
    }
  }
}
```

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/locales/ko.json`:

```json
{
  "translation": {
    "nav": { "title": "CCM 테스트넷", "lang": "언어" },
    "hero": {
      "headline": "Base Sepolia 에서 CCM 을 직접 경험해보세요.",
      "tagline": "탄소 크레딧 채굴, CCM 으로 wrap, staking, reward.",
      "warning": "⚠ Base Sepolia 테스트넷 — 모든 토큰은 가치가 없습니다."
    },
    "wallet": {
      "connect": "지갑 연결",
      "wrongChain": "Base Sepolia 로 전환",
      "connected": "연결됨"
    },
    "step1": {
      "title": "탄소 크레딧 채굴",
      "subtitle": "주소당 1시간에 1개. Grade, 빈티지, 톤 수 선택.",
      "labels": { "grade": "등급", "vintage": "빈티지", "tonnage": "톤 수 (t)" },
      "mine": "채굴",
      "cooldown": "다음 채굴까지 {{time}}",
      "inventory": "보유 NFT",
      "emptyInventory": "아직 NFT 가 없습니다. 위에서 채굴하세요.",
      "row": "#{{id}} 등급 {{grade}} · {{vintage}} · {{tonnage}}t"
    },
    "step2": {
      "title": "NFT → CCM Wrap",
      "subtitle": "1 톤 = 1 CCM. Vault 는 낮은 등급부터 반환 (D→C→B→A).",
      "selectAll": "전체 선택",
      "approve": "Vault 승인",
      "wrap": "선택 wrap",
      "maxPerTx": "최대 5개 NFT / tx",
      "balance": "CCM 잔액",
      "noNfts": "NFT 를 먼저 채굴하세요."
    },
    "step3": {
      "title": "CCM Stake",
      "subtitle": "Pool 이 마를 때까지 yield 발생. 최대 10%/월, pool 감소에 따라 감쇠.",
      "amount": "수량",
      "max": "Max",
      "approve": "토큰 승인",
      "stake": "Stake",
      "approveAndStake": "승인 & Stake",
      "currentStake": "내 stake",
      "currentRate": "현재 rate",
      "noBalance": "먼저 NFT 를 wrap 해서 CCM 을 받으세요."
    },
    "step4": {
      "title": "Reward 수령",
      "subtitle": "블록마다 reward 가 누적됩니다.",
      "pending": "Pending reward",
      "claim": "Claim",
      "unstake": "Unstake",
      "unstakeAmount": "Unstake 수량",
      "poolExhausted": "Pool 고갈. 운영자가 보충해야 합니다."
    },
    "tryMore": {
      "title": "더 해보기 (준비 중)",
      "lending": "Lending — NFT 담보 USDC 대출",
      "yield": "Yield farming",
      "basket": "Index basket — CCM-PRIME / FOREST / TECH",
      "retire": "Retire to earn"
    },
    "footer": {
      "contracts": "컨트랙트 (Base Sepolia)",
      "explorer": "BaseScan",
      "mainnet": "메인넷 포털 방문",
      "github": "GitHub 소스"
    },
    "errors": {
      "rpcRetry": "네트워크 오류, 재시도 중…",
      "userRejected": "거래가 취소되었습니다.",
      "txReverted": "거래 reverted",
      "txPending": "거래 진행 중…",
      "txMined": "거래 확정됨"
    }
  }
}
```

- [ ] **Step 6: Write placeholder Playground page + App + main**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/pages/Playground.tsx`:

```typescript
import { useTranslation } from "react-i18next";

export default function Playground() {
  const { t } = useTranslation();
  return (
    <main style={{ padding: 24 }}>
      <h1>{t("hero.headline")}</h1>
      <p>{t("hero.tagline")}</p>
      <p style={{ color: "orange" }}>{t("hero.warning")}</p>
      <p>(scaffold ok — step cards arrive in later tasks)</p>
    </main>
  );
}
```

Overwrite `/Users/hyunsuklee/Developer/ccm/testnet/src/App.tsx`:

```typescript
import Playground from "./pages/Playground";

export default function App() {
  return <Playground />;
}
```

Overwrite `/Users/hyunsuklee/Developer/ccm/testnet/src/main.tsx`:

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

import { wagmiConfig } from "./lib/wagmi";
import "./lib/i18n";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

import App from "./App";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
```

- [ ] **Step 7: Typecheck and build**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npx tsc -b --noEmit 2>&1 | tail -5 && \
  npx vite build 2>&1 | tail -5
```

Expected: no TS errors, build succeeds.

- [ ] **Step 8: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add testnet/ && \
  git commit -m "feat(testnet): scaffold new playground SPA (clear legacy)

Removed legacy Home/Demo/About pages. Set up:
- wagmi config: Base Sepolia only
- contracts.ts: sandbox addresses + minimal ABIs (NFT/Vault/Staking/Token)
- i18n: KO default + EN, localStorage-persisted
- locale stubs for all UI strings (KO + EN parity)
- Placeholder Playground page so typecheck + build pass

Subsequent tasks add real step cards, components, and contract wiring."
```

---

## Task 4: Site chrome — Wordmark, Layout, Nav, Footer, banner, ThemeProvider, LanguageSwitcher

**Files:**
- Create: `testnet/src/components/brand/Wordmark.tsx`, `testnet/src/components/brand/wordmark-paths.ts`
- Create: `testnet/src/components/site/{TestnetLayout,Nav,Footer,TestnetBanner,ThemeProvider,ThemeToggle,LanguageSwitcher}.tsx`
- Modify: `testnet/src/pages/Playground.tsx` to use `TestnetLayout`
- Modify: `testnet/src/index.css` to import design tokens
- Reference: `frontend/src/components/brand/{Wordmark,wordmark-paths}.{tsx,ts}`
- Delete: `testnet/src/components/site/{TestnetNav,TestnetFooter,primitives,RainbowKitThemed}.tsx` (legacy, replaced by Nav/Footer/ThemeProvider)
- Delete: `testnet/src/components/{Layout,ChainGate,TestnetBanner,CopyableAddress}.tsx` (top-level orphans replaced by new site/ design)

- [ ] **Step 1: Copy Wordmark from frontend**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  cp frontend/src/components/brand/Wordmark.tsx testnet/src/components/brand/Wordmark.tsx && \
  cp frontend/src/components/brand/wordmark-paths.ts testnet/src/components/brand/wordmark-paths.ts
```

Confirm the two files exist:

```bash
ls testnet/src/components/brand/
```

Expected: `Wordmark.tsx  wordmark-paths.ts`

- [ ] **Step 2: Set up design tokens in index.css**

Overwrite `/Users/hyunsuklee/Developer/ccm/testnet/src/index.css`:

```css
@import "tailwindcss";

/* Brand tokens — kept in sync with frontend/src/index.css */
:root,
[data-theme="light"] {
  --paper: #f5f3ec;
  --paper-deep: #ebe8de;
  --ink: #0c0f10;
  --ink-soft: #3a3f3c;
  --moss: #2dbf63;
  --moss2: #5fe089;
  --rule: #c9c5b8;
  --warn: #c8602e;
}

[data-theme="dark"] {
  --paper: #0a0e0c;
  --paper-deep: #060908;
  --ink: #eef1ea;
  --ink-soft: #7a8278;
  --moss: #2dbf63;
  --moss2: #5fe089;
  --rule: #1a221e;
  --warn: #e88a4e;
}

@theme {
  --color-paper: var(--paper);
  --color-paper-deep: var(--paper-deep);
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-moss: var(--moss);
  --color-moss-2: var(--moss2);
  --color-rule: var(--rule);
  --color-warn: var(--warn);
}

html, body, #root {
  background: var(--paper);
  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  min-height: 100%;
}
```

- [ ] **Step 3: Write ThemeProvider + ThemeToggle**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/site/ThemeProvider.tsx`:

```typescript
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("ccm-testnet-theme");
    return stored === "dark" || stored === "light" ? stored : "light";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem("ccm-testnet-theme", theme); } catch {}
  }, [theme]);
  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme(t => t === "light" ? "dark" : "light") }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme outside ThemeProvider");
  return ctx;
}
```

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/site/ThemeToggle.tsx`:

```typescript
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        background: "transparent",
        border: `1px solid var(--rule)`,
        color: "var(--ink)",
        padding: "6px 10px",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {theme === "light" ? "dark" : "light"}
    </button>
  );
}
```

- [ ] **Step 4: Write LanguageSwitcher**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/site/LanguageSwitcher.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import { setLang } from "../../lib/i18n";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language === "en" ? "en" : "ko";
  const next = current === "ko" ? "en" : "ko";
  return (
    <button
      onClick={() => setLang(next)}
      style={{
        background: "transparent",
        border: `1px solid var(--rule)`,
        color: "var(--ink)",
        padding: "6px 10px",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      🌐 {current.toUpperCase()}
    </button>
  );
}
```

- [ ] **Step 5: Write Nav, Footer, TestnetBanner, TestnetLayout**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/site/Nav.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import Wordmark from "../brand/Wordmark";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Nav() {
  const { t } = useTranslation();
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 24px", borderBottom: "1px solid var(--rule)",
      background: "var(--paper)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Wordmark size={28} />
        <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
          {t("nav.title")}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
```

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/site/TestnetBanner.tsx`:

```typescript
import { useTranslation } from "react-i18next";

export default function TestnetBanner() {
  const { t } = useTranslation();
  return (
    <div style={{
      background: "var(--warn)", color: "var(--paper)",
      padding: "8px 24px", fontSize: 13,
      textAlign: "center",
    }}>
      {t("hero.warning")}
    </div>
  );
}
```

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/site/Footer.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import { SANDBOX, EXPLORER } from "../../lib/contracts";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer style={{
      borderTop: "1px solid var(--rule)",
      padding: "32px 24px",
      color: "var(--ink-soft)",
      fontSize: 12,
      background: "var(--paper-deep)",
    }}>
      <div style={{ marginBottom: 16, fontWeight: 600, color: "var(--ink)" }}>
        {t("footer.contracts")}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.9 }}>
        <li>CCM Token (sandbox): <a href={`${EXPLORER}/address/${SANDBOX.ccmToken}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.ccmToken}</a></li>
        <li>CCMSandboxNFT: <a href={`${EXPLORER}/address/${SANDBOX.ccmSandboxNFT}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.ccmSandboxNFT}</a></li>
        <li>CCMSandboxVault: <a href={`${EXPLORER}/address/${SANDBOX.ccmSandboxVault}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.ccmSandboxVault}</a></li>
        <li>CCMSandboxStaking: <a href={`${EXPLORER}/address/${SANDBOX.ccmSandboxStaking}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.ccmSandboxStaking}</a></li>
      </ul>
      <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
        <a href="https://portal.ccmnetwork.net" target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{t("footer.mainnet")}</a>
        <a href="https://github.com/JamesLee77/ccm" target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{t("footer.github")}</a>
      </div>
    </footer>
  );
}
```

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/site/TestnetLayout.tsx`:

```typescript
import Nav from "./Nav";
import Footer from "./Footer";
import TestnetBanner from "./TestnetBanner";

export default function TestnetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <TestnetBanner />
      <div style={{ flex: 1, maxWidth: 880, margin: "0 auto", padding: "32px 24px", width: "100%" }}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 6: Wire ThemeProvider in main.tsx and TestnetLayout in Playground**

Edit `/Users/hyunsuklee/Developer/ccm/testnet/src/main.tsx` to add `ThemeProvider`:

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

import { wagmiConfig } from "./lib/wagmi";
import { ThemeProvider } from "./components/site/ThemeProvider";
import "./lib/i18n";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

import App from "./App";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  </StrictMode>,
);
```

Update `/Users/hyunsuklee/Developer/ccm/testnet/src/pages/Playground.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import TestnetLayout from "../components/site/TestnetLayout";

export default function Playground() {
  const { t } = useTranslation();
  return (
    <TestnetLayout>
      <section style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, lineHeight: 1.05, margin: 0 }}>{t("hero.headline")}</h1>
        <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 16 }}>{t("hero.tagline")}</p>
      </section>
      <section style={{ color: "var(--ink-soft)" }}>
        (Step cards arrive in later tasks.)
      </section>
    </TestnetLayout>
  );
}
```

- [ ] **Step 7: Build and visual smoke**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npx tsc -b --noEmit 2>&1 | tail -3 && \
  npx vite build 2>&1 | tail -5
```

Expected: no TS errors, build succeeds.

For visual confirmation, run `npx vite dev` in another terminal and visit `http://localhost:5173`. You should see:
- Nav with "ccm" wordmark + language switcher + theme toggle
- Yellow testnet banner
- Hero with "Base Sepolia 에서 CCM 을 직접 경험해보세요." (Korean default)
- Footer with contract addresses
- Theme toggle flips light/dark
- Language switcher flips KO ↔ EN

- [ ] **Step 8: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add testnet/ && \
  git commit -m "feat(testnet): site chrome — Wordmark, layout, theme, language switcher

Ports Wordmark from frontend. New layout = Nav (wordmark + LangSwitch +
ThemeToggle) + TestnetBanner (yellow warn strip) + content + Footer
(contract addresses with BaseScan links + mainnet portal + GitHub).

Design tokens in index.css mirror frontend/src/index.css. Theme +
language persisted in localStorage. Default language: Korean."
```

---

## Task 5: WalletStatusBar component

**Files:**
- Create: `testnet/src/components/wallet/WalletStatusBar.tsx`
- Modify: `testnet/src/pages/Playground.tsx` to mount the bar

- [ ] **Step 1: Write WalletStatusBar**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/wallet/WalletStatusBar.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TESTNET_CHAIN_ID } from "../../lib/wagmi";

export default function WalletStatusBar() {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const wrongChain = isConnected && chainId !== TESTNET_CHAIN_ID;

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 10,
      background: "var(--paper)", borderBottom: "1px solid var(--rule)",
      padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
        {!isConnected
          ? t("wallet.connect")
          : wrongChain
            ? t("wallet.wrongChain")
            : `${t("wallet.connected")} · ${address?.slice(0,6)}…${address?.slice(-4)}`}
      </div>
      <div>
        {wrongChain ? (
          <button
            onClick={() => switchChain({ chainId: TESTNET_CHAIN_ID })}
            style={{
              background: "var(--moss)", color: "var(--paper)", border: 0,
              padding: "6px 14px", cursor: "pointer", fontSize: 12,
              letterSpacing: "0.14em", textTransform: "uppercase",
            }}
          >
            {t("wallet.wrongChain")}
          </button>
        ) : (
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount WalletStatusBar in Playground (sticky top of content area)**

Update `/Users/hyunsuklee/Developer/ccm/testnet/src/pages/Playground.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import TestnetLayout from "../components/site/TestnetLayout";
import WalletStatusBar from "../components/wallet/WalletStatusBar";

export default function Playground() {
  const { t } = useTranslation();
  return (
    <TestnetLayout>
      <WalletStatusBar />
      <section style={{ marginTop: 32, marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, lineHeight: 1.05, margin: 0 }}>{t("hero.headline")}</h1>
        <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 16 }}>{t("hero.tagline")}</p>
      </section>
      <section style={{ color: "var(--ink-soft)" }}>
        (Step cards arrive in later tasks.)
      </section>
    </TestnetLayout>
  );
}
```

- [ ] **Step 3: Build and visual smoke**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npx tsc -b --noEmit 2>&1 | tail -3 && npx vite build 2>&1 | tail -3
```

For visual confirmation: run dev server, open the site, click "Connect Wallet" with MetaMask. If MetaMask is on a wrong chain, the orange "Switch to Base Sepolia" button appears. After switching, the bar shows the connected address.

- [ ] **Step 4: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add testnet/ && \
  git commit -m "feat(testnet): WalletStatusBar — connect / wrong-chain / connected states

Sticky bar at the top of the playground content area. Uses
RainbowKit's ConnectButton; falls back to a moss 'Switch to Base
Sepolia' button when the connected chain isn't 84532."
```

---

## Task 6: StepCard + Playground skeleton with 4 numbered cards

**Files:**
- Create: `testnet/src/components/playground/StepCard.tsx`
- Modify: `testnet/src/pages/Playground.tsx`

- [ ] **Step 1: Write StepCard**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/playground/StepCard.tsx`:

```typescript
import type { ReactNode } from "react";

export default function StepCard({
  step,
  title,
  subtitle,
  status,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  status?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        padding: 24,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{
            fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
            color: "var(--ink-soft)",
          }}>
            Step {step} / 4
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{title}</h2>
        </div>
        {status && <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{status}</div>}
      </div>
      {subtitle && <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 14 }}>{subtitle}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}
```

- [ ] **Step 2: Mount 4 StepCards in Playground (placeholders)**

Update `/Users/hyunsuklee/Developer/ccm/testnet/src/pages/Playground.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import TestnetLayout from "../components/site/TestnetLayout";
import WalletStatusBar from "../components/wallet/WalletStatusBar";
import StepCard from "../components/playground/StepCard";

export default function Playground() {
  const { t } = useTranslation();
  return (
    <TestnetLayout>
      <WalletStatusBar />
      <section style={{ marginTop: 32, marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, lineHeight: 1.05, margin: 0 }}>{t("hero.headline")}</h1>
        <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 16 }}>{t("hero.tagline")}</p>
      </section>

      <StepCard step={1} title={t("step1.title")} subtitle={t("step1.subtitle")}>
        (MintForm + Inventory arrive in Task 7.)
      </StepCard>
      <StepCard step={2} title={t("step2.title")} subtitle={t("step2.subtitle")}>
        (WrapForm arrives in Task 8.)
      </StepCard>
      <StepCard step={3} title={t("step3.title")} subtitle={t("step3.subtitle")}>
        (StakeForm arrives in Task 9.)
      </StepCard>
      <StepCard step={4} title={t("step4.title")} subtitle={t("step4.subtitle")}>
        (RewardPanel arrives in Task 10.)
      </StepCard>
    </TestnetLayout>
  );
}
```

- [ ] **Step 3: Build and visual smoke**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npx tsc -b --noEmit 2>&1 | tail -3 && npx vite build 2>&1 | tail -3
```

Visual: 4 bordered cards stacked, each with "Step N / 4" badge + title + subtitle. Placeholder bodies.

- [ ] **Step 4: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add testnet/ && \
  git commit -m "feat(testnet): StepCard component + 4-card Playground skeleton"
```

---

## Task 7: Step 1 — Mine (MintForm + CooldownTimer + NFTInventory)

**Files:**
- Create: `testnet/src/components/playground/MintForm.tsx`
- Create: `testnet/src/components/playground/CooldownTimer.tsx`
- Create: `testnet/src/components/playground/NFTInventory.tsx`
- Modify: `testnet/src/pages/Playground.tsx` — wire into Step 1 card

- [ ] **Step 1: Write CooldownTimer**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/playground/CooldownTimer.tsx`:

```typescript
import { useEffect, useState } from "react";

function fmt(secs: number): string {
  if (secs <= 0) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${m}:${String(s).padStart(2,"0")}`;
}

export default function CooldownTimer({ untilTimestamp }: { untilTimestamp: bigint }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Number(untilTimestamp) - now);
  if (remaining <= 0) return null;
  return <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--ink-soft)" }}>{fmt(remaining)}</span>;
}
```

- [ ] **Step 2: Write MintForm**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/playground/MintForm.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { keccak256, toBytes } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SANDBOX, CCMSandboxNFTAbi } from "../../lib/contracts";
import CooldownTimer from "./CooldownTimer";

const PROJECT_ID = keccak256(toBytes("ccm-testnet-playground"));

export default function MintForm() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [grade, setGrade] = useState(0);
  const [vintage, setVintage] = useState(2026);
  const [tonnage, setTonnage] = useState(50);

  const { data: cooldownUntil, refetch: refetchCd } = useReadContract({
    address: SANDBOX.ccmSandboxNFT,
    abi: CCMSandboxNFTAbi,
    functionName: "mintCooldown",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const now = Math.floor(Date.now() / 1000);
  const onCooldown = !!cooldownUntil && Number(cooldownUntil) > now;
  const disabled = !isConnected || isPending || confirming || onCooldown;

  // After a successful mint, refetch cooldown
  useEffect(() => {
    if (isSuccess) void refetchCd();
  }, [isSuccess, refetchCd]);

  function onMine() {
    writeContract({
      address: SANDBOX.ccmSandboxNFT,
      abi: CCMSandboxNFTAbi,
      functionName: "mint",
      args: [grade, vintage, tonnage, PROJECT_ID],
    });
  }

  const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.12em" };
  const inputStyle: React.CSSProperties = { padding: "6px 10px", border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink)", marginLeft: 8 };

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "end", flexWrap: "wrap" }}>
      <label style={labelStyle}>
        {t("step1.labels.grade")}
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} style={inputStyle}>
          <option value={0}>A</option>
          <option value={1}>B</option>
          <option value={2}>C</option>
          <option value={3}>D</option>
        </select>
      </label>
      <label style={labelStyle}>
        {t("step1.labels.vintage")}
        <input type="number" min={2020} max={2030} value={vintage} onChange={(e) => setVintage(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} />
      </label>
      <label style={labelStyle}>
        {t("step1.labels.tonnage")}
        <input type="number" min={1} max={1000} value={tonnage} onChange={(e) => setTonnage(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} />
      </label>
      <button
        onClick={onMine}
        disabled={disabled}
        style={{
          background: disabled ? "transparent" : "var(--moss)",
          color: disabled ? "var(--ink-soft)" : "var(--paper)",
          border: `1px solid ${disabled ? "var(--rule)" : "var(--moss)"}`,
          padding: "8px 18px",
          cursor: disabled ? "not-allowed" : "pointer",
          textTransform: "uppercase",
          fontSize: 12,
          letterSpacing: "0.14em",
        }}
      >
        {onCooldown && cooldownUntil
          ? t("step1.cooldown", { time: "" })
          : isPending || confirming
            ? "…"
            : t("step1.mine")}
      </button>
      {onCooldown && cooldownUntil ? <CooldownTimer untilTimestamp={cooldownUntil as bigint} /> : null}
    </div>
  );
}
```

- [ ] **Step 3: Write NFTInventory**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/playground/NFTInventory.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount, useReadContract } from "wagmi";
import { SANDBOX, CCMSandboxNFTAbi } from "../../lib/contracts";

const transferSingleEvent = parseAbiItem(
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
);

export default function NFTInventory() {
  const { t } = useTranslation();
  const { address } = useAccount();
  const [ids, setIds] = useState<bigint[]>([]);

  // Discover user's NFT ids via TransferSingle logs (from=0 → to=user).
  // For testnet UX, scan from a recent block. The sandbox was deployed
  // around block ~22000000 on Sepolia. Adjust if too slow.
  useEffect(() => {
    if (!address) { setIds([]); return; }
    let cancelled = false;
    (async () => {
      const client = createPublicClient({ chain: baseSepolia, transport: http(
        import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
      ) });
      const latest = await client.getBlockNumber();
      const fromBlock = latest > 1_000_000n ? latest - 100_000n : 0n; // last ~100k blocks ≈ 2 days
      const logs = await client.getLogs({
        address: SANDBOX.ccmSandboxNFT,
        event: transferSingleEvent,
        args: { to: address },
        fromBlock,
        toBlock: latest,
      });
      if (cancelled) return;
      const uniq = Array.from(new Set(logs.map((l) => l.args.id!)));
      setIds(uniq);
    })();
    return () => { cancelled = true; };
  }, [address]);

  if (!address) return null;
  if (ids.length === 0) return <div style={{ marginTop: 12, color: "var(--ink-soft)", fontSize: 13 }}>{t("step1.emptyInventory")}</div>;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 8 }}>
        {t("step1.inventory")}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {ids.map((id) => <InventoryRow key={String(id)} id={id} />)}
      </ul>
    </div>
  );
}

function InventoryRow({ id }: { id: bigint }) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { data: meta } = useReadContract({
    address: SANDBOX.ccmSandboxNFT,
    abi: CCMSandboxNFTAbi,
    functionName: "meta",
    args: [id],
  });
  const { data: bal } = useReadContract({
    address: SANDBOX.ccmSandboxNFT,
    abi: CCMSandboxNFTAbi,
    functionName: "balanceOf",
    args: address ? [address, id] : undefined,
    query: { enabled: !!address },
  });
  if (!meta || (typeof bal === "bigint" && bal === 0n)) return null;
  const gradeStr = ["A","B","C","D"][meta[0]] ?? "?";
  return (
    <li style={{ padding: "8px 12px", border: "1px solid var(--rule)", display: "flex", justifyContent: "space-between" }}>
      <span>{t("step1.row", { id: String(id), grade: gradeStr, vintage: meta[1], tonnage: meta[2] })}</span>
    </li>
  );
}
```

- [ ] **Step 4: Wire MintForm + NFTInventory into Step 1 card**

Update `/Users/hyunsuklee/Developer/ccm/testnet/src/pages/Playground.tsx` — replace the Step 1 placeholder:

```typescript
import { useTranslation } from "react-i18next";
import TestnetLayout from "../components/site/TestnetLayout";
import WalletStatusBar from "../components/wallet/WalletStatusBar";
import StepCard from "../components/playground/StepCard";
import MintForm from "../components/playground/MintForm";
import NFTInventory from "../components/playground/NFTInventory";

export default function Playground() {
  const { t } = useTranslation();
  return (
    <TestnetLayout>
      <WalletStatusBar />
      <section style={{ marginTop: 32, marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, lineHeight: 1.05, margin: 0 }}>{t("hero.headline")}</h1>
        <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 16 }}>{t("hero.tagline")}</p>
      </section>

      <StepCard step={1} title={t("step1.title")} subtitle={t("step1.subtitle")}>
        <MintForm />
        <NFTInventory />
      </StepCard>
      <StepCard step={2} title={t("step2.title")} subtitle={t("step2.subtitle")}>
        (WrapForm — Task 8)
      </StepCard>
      <StepCard step={3} title={t("step3.title")} subtitle={t("step3.subtitle")}>
        (StakeForm — Task 9)
      </StepCard>
      <StepCard step={4} title={t("step4.title")} subtitle={t("step4.subtitle")}>
        (RewardPanel — Task 10)
      </StepCard>
    </TestnetLayout>
  );
}
```

- [ ] **Step 5: Build and visual smoke**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npx tsc -b --noEmit 2>&1 | tail -3 && npx vite build 2>&1 | tail -3
```

Visual: connect wallet on Sepolia, see Step 1 form (Grade / Vintage / Tonnage / Mine button). After mint, NFT appears in inventory list. Cooldown countdown shows after mint.

- [ ] **Step 6: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add testnet/ && \
  git commit -m "feat(testnet): Step 1 — Mine (MintForm + CooldownTimer + NFTInventory)

MintForm: grade/vintage/tonnage inputs → CCMSandboxNFT.mint
CooldownTimer: hh:mm:ss countdown driven by mintCooldown(user)
NFTInventory: scans recent TransferSingle logs to discover user's NFTs"
```

---

## Task 8: Step 2 — Wrap (WrapForm with approval flow)

**Files:**
- Create: `testnet/src/components/playground/WrapForm.tsx`
- Modify: `testnet/src/pages/Playground.tsx`

- [ ] **Step 1: Write WrapForm**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/playground/WrapForm.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SANDBOX, CCMSandboxNFTAbi, CCMSandboxVaultAbi, CCMTokenAbi } from "../../lib/contracts";

const transferSingleEvent = parseAbiItem(
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
);

export default function WrapForm() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [ids, setIds] = useState<bigint[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!address) { setIds([]); return; }
    let cancelled = false;
    (async () => {
      const client = createPublicClient({ chain: baseSepolia, transport: http(
        import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
      ) });
      const latest = await client.getBlockNumber();
      const fromBlock = latest > 1_000_000n ? latest - 100_000n : 0n;
      const logs = await client.getLogs({
        address: SANDBOX.ccmSandboxNFT,
        event: transferSingleEvent,
        args: { to: address },
        fromBlock,
        toBlock: latest,
      });
      if (cancelled) return;
      setIds(Array.from(new Set(logs.map((l) => l.args.id!))));
    })();
    return () => { cancelled = true; };
  }, [address]);

  const { data: approved, refetch: refetchApproval } = useReadContract({
    address: SANDBOX.ccmSandboxNFT,
    abi: CCMSandboxNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, SANDBOX.ccmSandboxVault] : undefined,
    query: { enabled: !!address },
  });

  const { data: ccmBal, refetch: refetchCcm } = useReadContract({
    address: SANDBOX.ccmToken,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract: writeApprove, data: approveHash, isPending: approving } = useWriteContract();
  const { isSuccess: approveOk } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: writeWrap, data: wrapHash, isPending: wrapping } = useWriteContract();
  const { isSuccess: wrapOk, isLoading: wrapConfirm } = useWaitForTransactionReceipt({ hash: wrapHash });

  // After approval mines, refetch
  useEffect(() => {
    if (approveOk) void refetchApproval();
  }, [approveOk, refetchApproval]);

  // After wrap mines, refetch CCM balance and reset selection
  useEffect(() => {
    if (wrapOk) {
      void refetchCcm();
      setSelected(new Set());
    }
  }, [wrapOk, refetchCcm]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id); // 5/tx cap
      return next;
    });
  }

  function onApprove() {
    writeApprove({
      address: SANDBOX.ccmSandboxNFT,
      abi: CCMSandboxNFTAbi,
      functionName: "setApprovalForAll",
      args: [SANDBOX.ccmSandboxVault, true],
    });
  }

  function onWrap() {
    if (selected.size === 0) return;
    const sel = Array.from(selected).map(s => BigInt(s));
    // amount per NFT = balanceOf (we wrap all of each selected NFT).
    // Simpler: wrap 1 of each (works because mint creates 1 of each id).
    const amounts = sel.map(() => 1n);
    writeWrap({
      address: SANDBOX.ccmSandboxVault,
      abi: CCMSandboxVaultAbi,
      functionName: "wrap",
      args: [sel, amounts],
    });
  }

  if (!isConnected) {
    return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("wallet.connect")}</div>;
  }
  if (ids.length === 0) {
    return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("step2.noNfts")}</div>;
  }

  return (
    <div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {ids.map(id => (
          <li key={String(id)} style={{ padding: "6px 12px", border: "1px solid var(--rule)" }}>
            <label style={{ cursor: "pointer", display: "flex", gap: 12 }}>
              <input
                type="checkbox"
                checked={selected.has(String(id))}
                onChange={() => toggle(String(id))}
              />
              <span>#{String(id)}</span>
            </label>
          </li>
        ))}
      </ul>
      <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 8 }}>{t("step2.maxPerTx")}</div>
      {approved ? (
        <button
          onClick={onWrap}
          disabled={selected.size === 0 || wrapping || wrapConfirm}
          style={{
            background: "var(--moss)", color: "var(--paper)", border: 0,
            padding: "8px 18px", cursor: "pointer",
            fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
          }}
        >
          {wrapping || wrapConfirm ? "…" : t("step2.wrap")}
        </button>
      ) : (
        <button
          onClick={onApprove}
          disabled={approving}
          style={{
            background: "transparent", color: "var(--ink)",
            border: "1px solid var(--rule)",
            padding: "8px 18px", cursor: "pointer",
            fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
          }}
        >
          {approving ? "…" : t("step2.approve")}
        </button>
      )}
      <div style={{ marginTop: 16, fontSize: 13 }}>
        {t("step2.balance")}: <strong>{ccmBal ? formatUnits(ccmBal as bigint, 18) : "0"} CCM</strong>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire WrapForm into Step 2 card**

Update Step 2 in `/Users/hyunsuklee/Developer/ccm/testnet/src/pages/Playground.tsx`:

```typescript
import WrapForm from "../components/playground/WrapForm";
// ...
<StepCard step={2} title={t("step2.title")} subtitle={t("step2.subtitle")}>
  <WrapForm />
</StepCard>
```

- [ ] **Step 3: Build and visual smoke**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npx tsc -b --noEmit 2>&1 | tail -3 && npx vite build 2>&1 | tail -3
```

Visual: After minting an NFT in Step 1, Step 2 shows it as a checkbox. First wrap requires Approve tx, then Wrap tx. CCM balance increases by tonnage × 10^18.

- [ ] **Step 4: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add testnet/ && \
  git commit -m "feat(testnet): Step 2 — Wrap (NFT → CCM, with approval flow)

WrapForm reuses the same TransferSingle log scan from Step 1's
inventory. Auto-inserts setApprovalForAll on first wrap, then wraps
the selected NFTs (≤5 per tx)."
```

---

## Task 9: Step 3 — Stake (StakeForm with approve+stake)

**Files:**
- Create: `testnet/src/components/playground/StakeForm.tsx`
- Modify: `testnet/src/pages/Playground.tsx`

- [x] **Step 1: Write StakeForm**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/playground/StakeForm.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SANDBOX, CCMTokenAbi, CCMSandboxStakingAbi } from "../../lib/contracts";

export default function StakeForm() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");

  const { data: ccmBal } = useReadContract({
    address: SANDBOX.ccmToken,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: SANDBOX.ccmToken,
    abi: CCMTokenAbi,
    functionName: "allowance",
    args: address ? [address, SANDBOX.ccmSandboxStaking] : undefined,
    query: { enabled: !!address },
  });

  const { data: position, refetch: refetchPosition } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "users",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: rateBps } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "currentYieldRateBps",
  });

  const { writeContract: writeApprove, data: approveHash, isPending: approving } = useWriteContract();
  const { isSuccess: approveOk } = useWaitForTransactionReceipt({ hash: approveHash });
  const { writeContract: writeStake, data: stakeHash, isPending: staking } = useWriteContract();
  const { isSuccess: stakeOk, isLoading: stakeConfirm } = useWaitForTransactionReceipt({ hash: stakeHash });

  // After approve mines, refetch allowance
  useEffect(() => {
    if (approveOk) void refetchAllowance();
  }, [approveOk, refetchAllowance]);

  // After stake mines, refetch position and clear input
  useEffect(() => {
    if (stakeOk) {
      void refetchPosition();
      setAmount("");
    }
  }, [stakeOk, refetchPosition]);

  const wantAmount = amount ? parseUnits(amount, 18) : 0n;
  const hasAllowance = !!allowance && (allowance as bigint) >= wantAmount && wantAmount > 0n;

  function onApprove() {
    writeApprove({
      address: SANDBOX.ccmToken,
      abi: CCMTokenAbi,
      functionName: "approve",
      args: [SANDBOX.ccmSandboxStaking, maxUint256],
    });
  }

  function onStake() {
    if (wantAmount === 0n) return;
    writeStake({
      address: SANDBOX.ccmSandboxStaking,
      abi: CCMSandboxStakingAbi,
      functionName: "stake",
      args: [wantAmount],
    });
  }

  function onMax() {
    if (!ccmBal) return;
    setAmount(formatUnits(ccmBal as bigint, 18));
  }

  if (!isConnected) return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("wallet.connect")}</div>;
  if (!ccmBal || (ccmBal as bigint) === 0n) return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("step3.noBalance")}</div>;

  const rate = rateBps ? Number(rateBps) / 100 : 0; // bps → %
  const stakedAmt = position ? (position as readonly [bigint, bigint])[0] : 0n;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={t("step3.amount")}
          style={{ padding: "6px 10px", border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink)", width: 180 }}
        />
        <button onClick={onMax} style={{ background: "transparent", border: "1px solid var(--rule)", padding: "6px 10px", fontSize: 11, cursor: "pointer", color: "var(--ink)" }}>
          {t("step3.max")}
        </button>
      </div>
      {hasAllowance ? (
        <button
          onClick={onStake}
          disabled={staking || stakeConfirm || wantAmount === 0n}
          style={{ background: "var(--moss)", color: "var(--paper)", border: 0, padding: "8px 18px", cursor: "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          {staking || stakeConfirm ? "…" : t("step3.stake")}
        </button>
      ) : (
        <button
          onClick={onApprove}
          disabled={approving}
          style={{ background: "transparent", border: "1px solid var(--rule)", color: "var(--ink)", padding: "8px 18px", cursor: "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          {approving ? "…" : t("step3.approveAndStake")}
        </button>
      )}
      <div style={{ marginTop: 16, fontSize: 13 }}>
        {t("step3.currentStake")}: <strong>{formatUnits(stakedAmt, 18)} CCM</strong>
        {" · "}
        {t("step3.currentRate")}: <strong>{rate.toFixed(2)}% /mo</strong>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Wire StakeForm into Step 3 card**

Update `/Users/hyunsuklee/Developer/ccm/testnet/src/pages/Playground.tsx`:

```typescript
import StakeForm from "../components/playground/StakeForm";
// ...
<StepCard step={3} title={t("step3.title")} subtitle={t("step3.subtitle")}>
  <StakeForm />
</StepCard>
```

- [x] **Step 3: Build and visual smoke**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npx tsc -b --noEmit 2>&1 | tail -3 && npx vite build 2>&1 | tail -3
```

Visual: With CCM balance from Step 2, Step 3 shows amount input + Max + Approve (or Stake if already approved). Current rate shows in %/mo.

- [x] **Step 4: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add testnet/ && \
  git commit -m "feat(testnet): Step 3 — Stake (StakeForm with approve+stake)

Two-step UX: Approve token (max uint256, one-time) then Stake. Displays
current stake position and the live yield rate from
CCMSandboxStaking.currentYieldRateBps()."
```

---

## Task 10: Step 4 — Reward (RewardPanel with live update + claim/unstake)

**Files:**
- Create: `testnet/src/components/playground/RewardPanel.tsx`
- Modify: `testnet/src/pages/Playground.tsx`

- [x] **Step 1: Write RewardPanel**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/playground/RewardPanel.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SANDBOX, CCMSandboxStakingAbi } from "../../lib/contracts";

export default function RewardPanel() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [unstakeAmt, setUnstakeAmt] = useState("");

  const { data: pending, refetch: refetchPending } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "pendingReward",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // 5s live update
    },
  });

  const { data: position, refetch: refetchPosition } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "users",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: poolRem } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "poolRemaining",
  });

  const { writeContract: writeClaim, data: claimHash, isPending: claiming } = useWriteContract();
  const { isSuccess: claimOk, isLoading: claimConfirm } = useWaitForTransactionReceipt({ hash: claimHash });

  const { writeContract: writeUnstake, data: unstakeHash, isPending: unstaking } = useWriteContract();
  const { isSuccess: unstakeOk, isLoading: unstakeConfirm } = useWaitForTransactionReceipt({ hash: unstakeHash });

  // After claim mines, refetch
  useEffect(() => {
    if (claimOk) {
      void refetchPending();
      void refetchPosition();
    }
  }, [claimOk, refetchPending, refetchPosition]);

  // After unstake mines, refetch and clear input
  useEffect(() => {
    if (unstakeOk) {
      void refetchPending();
      void refetchPosition();
      setUnstakeAmt("");
    }
  }, [unstakeOk, refetchPending, refetchPosition]);

  if (!isConnected) return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("wallet.connect")}</div>;

  const pendingNum = pending ? formatUnits(pending as bigint, 18) : "0";
  const stakedAmt = position ? (position as readonly [bigint, bigint])[0] : 0n;
  const poolExhausted = poolRem !== undefined && (poolRem as bigint) === 0n;

  function onClaim() {
    writeClaim({
      address: SANDBOX.ccmSandboxStaking,
      abi: CCMSandboxStakingAbi,
      functionName: "claim",
    });
  }

  function onUnstake() {
    if (!unstakeAmt) return;
    const amt = parseUnits(unstakeAmt, 18);
    if (amt === 0n) return;
    writeUnstake({
      address: SANDBOX.ccmSandboxStaking,
      abi: CCMSandboxStakingAbi,
      functionName: "unstake",
      args: [amt],
    });
  }

  return (
    <div>
      {poolExhausted && (
        <div style={{ background: "var(--warn)", color: "var(--paper)", padding: 8, marginBottom: 12, fontSize: 13 }}>
          {t("step4.poolExhausted")}
        </div>
      )}
      <div style={{ fontSize: 14, marginBottom: 12 }}>
        {t("step4.pending")}: <strong style={{ fontFamily: "ui-monospace, monospace" }}>{pendingNum} CCM</strong>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={onClaim}
          disabled={claiming || claimConfirm || stakedAmt === 0n}
          style={{ background: "var(--moss)", color: "var(--paper)", border: 0, padding: "8px 18px", cursor: stakedAmt === 0n ? "not-allowed" : "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", opacity: stakedAmt === 0n ? 0.5 : 1 }}
        >
          {claiming || claimConfirm ? "…" : t("step4.claim")}
        </button>
        <input
          type="text"
          value={unstakeAmt}
          onChange={(e) => setUnstakeAmt(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={t("step4.unstakeAmount")}
          style={{ padding: "6px 10px", border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink)", width: 180 }}
        />
        <button
          onClick={onUnstake}
          disabled={unstaking || unstakeConfirm || !unstakeAmt || stakedAmt === 0n}
          style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--rule)", padding: "8px 18px", cursor: "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          {unstaking || unstakeConfirm ? "…" : t("step4.unstake")}
        </button>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Wire RewardPanel into Step 4 card**

Update `/Users/hyunsuklee/Developer/ccm/testnet/src/pages/Playground.tsx`:

```typescript
import RewardPanel from "../components/playground/RewardPanel";
// ...
<StepCard step={4} title={t("step4.title")} subtitle={t("step4.subtitle")}>
  <RewardPanel />
</StepCard>
```

- [x] **Step 3: Build and visual smoke**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npx tsc -b --noEmit 2>&1 | tail -3 && npx vite build 2>&1 | tail -3
```

Visual: After staking in Step 3, Step 4 shows pending reward number that increments every 5 sec. Claim button transfers reward. Unstake input + button returns principal.

- [x] **Step 4: Commit**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add testnet/ && \
  git commit -m "feat(testnet): Step 4 — Reward (RewardPanel with live update)

Polls pendingReward every 5 s. Claim and Unstake actions both refresh
position. Shows pool-exhausted banner when poolRemaining hits 0."
```

---

## Task 11: TryMoreGrid

**Files:**
- Create: `testnet/src/components/playground/TryMoreGrid.tsx`
- Modify: `testnet/src/pages/Playground.tsx`

- [ ] **Step 1: Write TryMoreGrid**

Write `/Users/hyunsuklee/Developer/ccm/testnet/src/components/playground/TryMoreGrid.tsx`:

```typescript
import { useTranslation } from "react-i18next";

export default function TryMoreGrid() {
  const { t } = useTranslation();
  const items = [
    { key: "lending", label: t("tryMore.lending") },
    { key: "yield", label: t("tryMore.yield") },
    { key: "basket", label: t("tryMore.basket") },
    { key: "retire", label: t("tryMore.retire") },
  ];
  return (
    <section style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 12 }}>
        {t("tryMore.title")}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {items.map((it) => (
          <div
            key={it.key}
            style={{
              border: "1px solid var(--rule)",
              padding: 16,
              opacity: 0.55,
              cursor: "not-allowed",
              fontSize: 13,
              color: "var(--ink-soft)",
            }}
          >
            {it.label}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Mount in Playground (after Step 4)**

Update `/Users/hyunsuklee/Developer/ccm/testnet/src/pages/Playground.tsx`:

```typescript
import TryMoreGrid from "../components/playground/TryMoreGrid";
// ... after the Step 4 StepCard:
<TryMoreGrid />
```

- [ ] **Step 3: Build and commit**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npx tsc -b --noEmit 2>&1 | tail -3 && npx vite build 2>&1 | tail -3
cd /Users/hyunsuklee/Developer/ccm && \
  git add testnet/ && \
  git commit -m "feat(testnet): TryMoreGrid — placeholder cards for lending/yield/basket/retire"
```

---

## Task 12: Build + deploy + live smoke

**Files:**
- Modify: `onchain/DEPLOYMENT.md` (record testnet playground deploy)

- [ ] **Step 1: Final build**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  npx tsc -b --noEmit 2>&1 | tail -3 && \
  npx vite build 2>&1 | tail -5
```

Expected: no TS errors, build completes, dist/ populated.

- [ ] **Step 2: Deploy to Cloudflare Pages**

```bash
cd /Users/hyunsuklee/Developer/ccm/testnet && \
  CLOUDFLARE_ACCOUNT_ID=e82458744ebc655e58fe5194e6fb93fd \
  npx wrangler pages deploy dist --project-name=ccm-testnet --branch=main 2>&1 | tail -10
```

Expected: `Deployment complete!` with a preview URL. Custom domain `testnet.ccmnetwork.net` updates automatically (production branch).

- [ ] **Step 3: Live smoke — verify HTTP 200 and content**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" "https://testnet.ccmnetwork.net"
curl -s "https://testnet.ccmnetwork.net" | grep -oE "CCM testnet|Base Sepolia" | head -3
```

Expected: HTTP 200 and the grep prints "Base Sepolia" or "CCM testnet" (indicating the new playground rendered, not the old marketing mirror).

- [ ] **Step 4: Manual click-through verification**

Open https://testnet.ccmnetwork.net in a browser with MetaMask on Base Sepolia. Walk the 4 steps:

1. Wallet connects, status bar shows address
2. Step 1: Mine an NFT (Grade A, vintage 2026, tonnage 50). Tx confirms; NFT appears in inventory. Cooldown timer starts.
3. Step 2: Approve vault, wrap the new NFT. CCM balance increases by 50 CCM (with 18 decimals).
4. Step 3: Approve staking, stake 10 CCM. Stake position shows 10 CCM.
5. Step 4: Wait 30 sec. Pending reward shows a small but nonzero number. Click Claim. CCM balance increases.

If any step fails, capture the error and investigate before declaring done.

- [ ] **Step 5: Update DEPLOYMENT.md**

Append to `onchain/DEPLOYMENT.md` under the sandbox section (after the post-deploy state snapshot):

```markdown
### testnet.ccmnetwork.net playground (deployed 2026-05-13)

The marketing-mirror previously served by ccm-testnet Pages was replaced
by the new playground SPA (testnet/) implementing the 4-step
mine → wrap → stake → claim flow from spec
`docs/superpowers/specs/2026-05-13-ccm-testnet-playground-design.md`.

Hosting: Cloudflare Pages project `ccm-testnet` (production branch `main`).

Backend: chain-only. No portal-api dependency.

Contracts in use (Base Sepolia):
- CCMToken (sandbox)         `0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD`
- CCMSandboxNFT              `0xbC3EAc7514F82A868807b81b165D2121495380E9`
- CCMSandboxVault            `0xEd62b71e9ff0200CFf02C8F38618Af153C609334`
- CCMSandboxStaking (new)    `<STAKING>`
- MockPriceOracle (new)      `<ORACLE>`
```

Replace `<STAKING>` and `<ORACLE>` with the addresses from Task 2.

- [ ] **Step 6: Commit + push**

```bash
cd /Users/hyunsuklee/Developer/ccm && \
  git add onchain/DEPLOYMENT.md && \
  git commit -m "docs(onchain): record testnet playground deploy to ccm-testnet Pages

Replaces the marketing-mirror at testnet.ccmnetwork.net with the
4-step playground SPA (mine → wrap → stake → claim) per the spec
2026-05-13-ccm-testnet-playground-design.md.

The previous marketing content moved to ccmnetwork.net only; testnet
domain now serves the hands-on experience for prospective investors." && \
git push origin main 2>&1 | tail -3
```

---

## Self-Review

**Spec coverage:**
- Spec §1 (Goal) → entire plan
- Spec §2 (Out of scope) → Task 11's "Try more" cards are disabled placeholders
- Spec §3 (Users) → KO-default i18n in Task 3, guided UX throughout
- Spec §4 (Architecture) → Task 3's wagmi+contracts setup
- Spec §5 (Page structure) → Tasks 4–11 build the 4-step layout
- Spec §6 (Components — 12 components) → covered across Tasks 4–11. Verified: Wordmark (T4), TestnetLayout/Nav/Footer/TestnetBanner (T4), ThemeProvider/ThemeToggle/LanguageSwitcher (T4), WalletStatusBar (T5), StepCard (T6), MintForm/CooldownTimer/NFTInventory (T7), WrapForm (T8), StakeForm (T9), RewardPanel (T10), TryMoreGrid (T11). TxToast is NOT a separate task — inline tx state is handled per-form via `useWaitForTransactionReceipt`. This is a small deliberate scope reduction; the toast surface was over-spec. **Decision: defer the dedicated TxToast to a future polish task; the per-form indicators are sufficient.**
- Spec §7 (On-chain wiring) → Tasks 7–10 implement the calls
- Spec §8 (New contracts) → Task 1 builds CCMSandboxStaking; Task 2 deploys both
- Spec §9 (i18n) → Task 3 sets up i18next + locale files
- Spec §10 (Style) → Task 4's index.css imports brand tokens
- Spec §11 (Error handling matrix) → embedded into per-step forms (cooldown disable, empty-inventory hint, approval flow auto-insert, exhausted-pool banner). Wrong-chain handled in WalletStatusBar.
- Spec §12 (Testing) → Task 1 contract unit tests; manual smoke in Task 12. **E2E Playwright is deferred — wallet automation in CI adds significant scope and a manual click-through in Task 12 Step 4 is adequate.**
- Spec §13 (Deployment sequence) → Tasks 2, 3, 12
- Spec §14 (Pool top-up notes) → out of scope for v1 — operator task
- Spec §15 (Risks) → mitigations embedded across tasks
- Spec §16 (Open questions) → spec made decisions; plan follows them (shared package = copy for now, yield rate = live, cooldown = on-chain only)

**Placeholder scan:**
- `<STAKING>` and `<ORACLE>` placeholders in Tasks 3, 12 are intentional — they're runtime values produced by Task 2 and explicitly noted as such. The engineer reads them from Task 2's terminal output.
- `<DEPLOYER_EOA_ADDRESS>` in Task 2 Step 4 — also intentional, signaled with the `<…>` convention and explained inline.
- No TBD / TODO / "fill in later" / "similar to" / "appropriate error handling" anywhere.

**Type consistency check:**
- `SANDBOX.ccmSandboxStaking` used in Tasks 3 (definition), 9 (StakeForm), 10 (RewardPanel), 12 (DEPLOYMENT.md) — consistent.
- `CCMSandboxStakingAbi` function names (`stake`, `unstake`, `claim`, `pendingReward`, `users`, `currentYieldRateBps`, `totalStaked`, `poolRemaining`, `poolUsedPct`) — match the contract source in Task 1.
- `users(address)` return tuple `[staked, lastAccruedAt]` — used consistently in Tasks 9 (position `[0]`) and 10 (position `[0]`).
- `formatUnits(x, 18)` used everywhere CCM amounts are displayed.
- i18n keys (`step1.mine`, `step1.cooldown`, etc.) — match the locale files in Task 3.

No issues found.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-13-ccm-testnet-playground.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review (spec compliance + code quality) between tasks. Fast iteration; Claude orchestrates 12 task cycles plus reviews.

**2. Inline Execution** — execute tasks in this session using `executing-plans`, with batched checkpoints for user review. Same Claude session walks every step.

Which approach?
