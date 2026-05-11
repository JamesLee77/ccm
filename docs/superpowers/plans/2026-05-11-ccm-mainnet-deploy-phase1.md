# CCM Token + Vesting Mainnet Deploy (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy CCMToken + CCMVesting to Base mainnet (chainId 8453) with deployer EOA admin, then mint 10,000,000 CCM to a treasury EOA for OTC SAFT distribution.

**Architecture:** Token + Vesting only (Phase 1 minimal). EOA admin and EOA treasury (no Safe / no Timelock — explicitly deferred to Phase 2 per spec). Mint flow uses a new chain-id-guarded script that fails closed on wrong network, missing role, or cap overflow.

**Tech Stack:** Solidity 0.8.24 (Cancun), Hardhat + ethers v6, OpenZeppelin Contracts (ERC20 + Capped + Burnable + Pausable + Permit + AccessControl), BaseScan for verification.

**Spec:** `docs/superpowers/specs/2026-05-11-ccm-mainnet-deploy-design.md`

---

## File Structure

**Create:**
- `onchain/scripts/mint-treasury-phase1.ts` — chain-id-guarded mint script with sleep banner + post-mint asserts. New file, sole responsibility: safely mint a parameterized amount of CCM to a parameterized treasury address. Reusable for Phase 2 mints by routing the mint call through a Timelock instead.

**Modify:**
- `onchain/.env` — add `BASESCAN_API_KEY`, `BASE_MAINNET_RPC`, ensure `PRIVATE_KEY` and `ADMIN_ADDRESS` are set. **Gitignored** — never committed. Plan documents required keys, not the values.
- `onchain/DEPLOYMENT.md` — append a new "Phase 1 — Mainnet (Base)" section incrementally as each contract lands. One commit per deployed-contract row to keep blame clean.

**Reference (no modification):**
- `onchain/scripts/deploy-token.ts` — used as-is for CCMToken deploy.
- `onchain/scripts/_deploy-vesting-only.ts` — used as-is for CCMVesting deploy. Reads `CCM_TOKEN` and `ADMIN_ADDRESS` from env.
- `onchain/contracts/CCMToken.sol`, `onchain/contracts/CCMVesting.sol` — unchanged. Already covered by 210 passing Hardhat unit tests.

---

## Task 1: Slither static-analysis re-run on CCM* sources

**Files:**
- Create: `onchain/.slither-phase1.txt` (output log, optionally committed)
- Modify: none

- [ ] **Step 1: Confirm Slither is installed**

```bash
cd onchain && slither --version
```

Expected: prints a version (e.g., `0.10.x`). If not installed: `pip install slither-analyzer` inside `onchain/.venv` (the venv already exists per `ls onchain/`).

- [ ] **Step 2: Run Slither against the two contracts being deployed**

```bash
cd onchain && slither contracts/CCMToken.sol contracts/CCMVesting.sol \
  --solc-remaps "@openzeppelin/=node_modules/@openzeppelin/" \
  --exclude-informational --exclude-low \
  2>&1 | tee .slither-phase1.txt
```

Expected: report listing detectors, severity-grouped. Informational/Low filtered out.

- [ ] **Step 3: Triage**

Manually review every Medium/High/Critical finding. For each:
- If it's a real bug → STOP this plan, file a fix in a new spec, do not proceed with mainnet deploy.
- If it's a known false positive → note in `.slither-phase1.txt` with rationale.

If output is empty (no Medium+/High findings): triage is "clean", proceed.

- [ ] **Step 4: Commit triage notes**

```bash
git add onchain/.slither-phase1.txt
git commit -m "chore(onchain): slither rerun on CCMToken+CCMVesting for Phase 1 deploy"
```

---

## Task 2: BaseScan API key + RPC endpoint + `.env` configuration

**Files:**
- Modify: `onchain/.env` (gitignored — never committed)

- [ ] **Step 1: Get BaseScan API key**

Visit https://basescan.org/myapikey while logged into a BaseScan account. Click "Add" → name it "CCM Phase 1 deploy" → copy the key string.

- [ ] **Step 2: Choose mainnet RPC endpoint**

Two options:
- Public: `https://mainnet.base.org` (free, occasional staleness — caused the `deploy-presale.ts` crash on Sepolia per `DEPLOYMENT.md`).
- Paid: Alchemy or Infura Base mainnet endpoint (recommended). Sign up, create a Base Mainnet app, copy the HTTPS URL.

- [ ] **Step 3: Update `.env`**

Edit `onchain/.env` (file already exists per `ls onchain/`). Ensure these four keys are set:

```
PRIVATE_KEY=0x<deployer EOA private key, 64 hex chars>
ADMIN_ADDRESS=0x<deployer EOA address>
BASE_MAINNET_RPC=https://<chosen RPC URL>
BASESCAN_API_KEY=<key from Step 1>
```

Note: `ADMIN_ADDRESS` equals the deployer EOA in Phase 1 (no separate admin yet). Both are the same hex address.

- [ ] **Step 4: Sanity-check `.env` parsing**

```bash
cd onchain && node -e "require('dotenv').config(); \
  console.log('admin:', process.env.ADMIN_ADDRESS); \
  console.log('rpc:', process.env.BASE_MAINNET_RPC); \
  console.log('basescan key set:', !!process.env.BASESCAN_API_KEY); \
  console.log('private key set:', !!process.env.PRIVATE_KEY);"
```

Expected: prints non-empty admin, rpc, `basescan key set: true`, `private key set: true`. If any field is empty/undefined, fix `.env` before continuing.

- [ ] **Step 5: Confirm deployer signer matches `ADMIN_ADDRESS`**

```bash
cd onchain && npx hardhat run --network base --no-compile <(cat <<'EOF'
import { ethers } from "hardhat";
async function main() {
  const [s] = await ethers.getSigners();
  console.log("signer:", s.address);
  console.log("admin :", process.env.ADMIN_ADDRESS);
  if (s.address.toLowerCase() !== (process.env.ADMIN_ADDRESS || "").toLowerCase()) {
    throw new Error("Signer != ADMIN_ADDRESS");
  }
  console.log("✓ match");
}
main().catch(e => { console.error(e); process.exit(1); });
EOF
)
```

Expected: `signer:` and `admin:` match (case-insensitive), prints `✓ match`. If hardhat doesn't accept process-substitution, save the snippet to `scripts/_check-env.ts` and run with `npx hardhat run scripts/_check-env.ts --network base` instead.

(No commit — `.env` is gitignored.)

---

## Task 3: Treasury EOA confirmation + 0.001 ETH ping on Base mainnet

**Files:**
- Modify: none

- [ ] **Step 1: Lock in the treasury EOA address**

Out-of-band: confirm with stakeholders the **exact** treasury EOA address. Recommended properties:
- Hardware wallet (Ledger / Trezor)
- Nonce 0 on Base mainnet (no prior activity → unique address provenance)
- Seed phrase backed up in geographically separate locations
- At least one signing test done (e.g., signed message via wallet UI) before this plan begins

Record the address in this terminal (do not commit) for use in later tasks. Refer to it as `<TREASURY>` in subsequent steps.

- [ ] **Step 2: Send 0.001 ETH ping from deployer to treasury on Base mainnet**

```bash
cd onchain && npx hardhat run --network base <(cat <<'EOF'
import { ethers } from "hardhat";
async function main() {
  const TREASURY = process.env.TREASURY_ADDRESS;
  if (!TREASURY || !ethers.isAddress(TREASURY)) throw new Error("TREASURY_ADDRESS env required");
  const [deployer] = await ethers.getSigners();
  console.log("Sending 0.001 ETH ping:", deployer.address, "→", TREASURY);
  const tx = await deployer.sendTransaction({ to: TREASURY, value: ethers.parseEther("0.001") });
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("✓ confirmed");
}
main().catch(e => { console.error(e); process.exit(1); });
EOF
)
```

Run as: `TREASURY_ADDRESS=0x<treasury> ...` (set inline, do not write to `.env`).

Expected: tx mined, link to https://basescan.org/tx/<hash> works, treasury balance shows 0.001 ETH.

- [ ] **Step 3: Have treasury sign a small return transaction**

Out-of-band: treasury wallet sends 0.0001 ETH back to deployer (or to any address). This proves the treasury wallet can sign before $1.5M+ of tokens are minted to it. If the treasury wallet cannot sign, **STOP this plan** until it can.

(No commit.)

---

## Task 4: Deployer EOA gas funding

**Files:**
- Modify: none

- [ ] **Step 1: Estimate required gas budget**

Phase 1 mainnet transactions: deploy Token (~2.5M gas), deploy Vesting (~1.8M gas), 2× verify (no on-chain gas), mint (~80k gas), 2× retry buffer. At 0.05 gwei (typical Base) ≈ 0.0003 ETH per million gas. Total: roughly 0.005 ETH absolute minimum, but bridge **0.02 ETH** for headroom against gas spikes.

- [ ] **Step 2: Bridge ETH to deployer on Base mainnet**

Use the official Base bridge (https://bridge.base.org) or a CEX that supports Base withdrawals. Transfer 0.02 ETH to the deployer EOA address (= `ADMIN_ADDRESS` from Task 2).

- [ ] **Step 3: Confirm deployer balance**

```bash
cd onchain && npx hardhat run --network base <(cat <<'EOF'
import { ethers } from "hardhat";
async function main() {
  const [d] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(d.address);
  console.log("deployer:", d.address);
  console.log("balance :", ethers.formatEther(bal), "ETH");
  if (bal < ethers.parseEther("0.015")) throw new Error("Balance below 0.015 ETH safety floor");
  console.log("✓ funded");
}
main().catch(e => { console.error(e); process.exit(1); });
EOF
)
```

Expected: balance ≥ 0.015 ETH, prints `✓ funded`.

(No commit.)

---

## Task 5: Write `scripts/mint-treasury-phase1.ts`

**Files:**
- Create: `onchain/scripts/mint-treasury-phase1.ts`

- [ ] **Step 1: Create the file with full contents**

Write `onchain/scripts/mint-treasury-phase1.ts`:

```typescript
/**
 * Mint a parameterized amount of CCM to a treasury address.
 *
 * Phase 1 only: assumes deployer EOA still holds MINTER_ROLE (no Timelock yet).
 * For Phase 2+ this becomes a Safe → Timelock scheduled call (use a different script).
 *
 * Required env:
 *   CCM_TOKEN          - already-deployed CCMToken address
 *   TREASURY_ADDRESS   - recipient (a Treasury EOA, separate from deployer)
 *
 * Optional env:
 *   AMOUNT_CCM         - amount in whole CCM (default: 10000000)
 *   ALLOW_TESTNET      - set to "1" to permit chainId other than 8453 (Sepolia rehearsal only)
 *
 * Run on mainnet:
 *   CCM_TOKEN=0x... TREASURY_ADDRESS=0x... \
 *     npx hardhat run scripts/mint-treasury-phase1.ts --network base
 *
 * Run on Sepolia rehearsal (with override + small amount):
 *   CCM_TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
 *   TREASURY_ADDRESS=0x... AMOUNT_CCM=10 ALLOW_TESTNET=1 \
 *     npx hardhat run scripts/mint-treasury-phase1.ts --network baseSepolia
 */
import { ethers } from "hardhat";

async function main() {
  const TOKEN = process.env.CCM_TOKEN;
  const TREASURY_RAW = process.env.TREASURY_ADDRESS;
  const ALLOW_TESTNET = process.env.ALLOW_TESTNET === "1";

  let AMOUNT_CCM: bigint;
  try {
    AMOUNT_CCM = BigInt(process.env.AMOUNT_CCM ?? "10000000");
  } catch {
    throw new Error(`AMOUNT_CCM is not a valid integer: "${process.env.AMOUNT_CCM}"`);
  }
  if (AMOUNT_CCM <= 0n) {
    throw new Error(`AMOUNT_CCM must be > 0 (got ${AMOUNT_CCM})`);
  }

  if (!TOKEN || !ethers.isAddress(TOKEN)) {
    throw new Error("CCM_TOKEN env var (valid address) required");
  }
  if (!TREASURY_RAW || !ethers.isAddress(TREASURY_RAW)) {
    throw new Error("TREASURY_ADDRESS env var (valid address) required");
  }
  const TREASURY = ethers.getAddress(TREASURY_RAW); // EIP-55 normalisation
  if (TREASURY === ethers.ZeroAddress) {
    throw new Error("TREASURY_ADDRESS must not be the zero address");
  }

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 8453n && !ALLOW_TESTNET) {
    throw new Error(
      `Refusing to run: chainId is ${network.chainId} (expected 8453 = Base mainnet). ` +
      `Set ALLOW_TESTNET=1 to override (Sepolia rehearsal only).`
    );
  }

  const [deployer] = await ethers.getSigners();
  const token = await ethers.getContractAt("CCMToken", TOKEN);

  const MINTER_ROLE = await token.MINTER_ROLE();
  const hasMinter = await token.hasRole(MINTER_ROLE, deployer.address);
  if (!hasMinter) {
    throw new Error(`Deployer ${deployer.address} does not hold MINTER_ROLE on ${TOKEN}`);
  }

  const amountWei = AMOUNT_CCM * 10n ** 18n;
  const supplyBefore = await token.totalSupply();
  const cap = await token.cap();
  if (supplyBefore + amountWei > cap) {
    throw new Error(
      `Mint would exceed cap: supply ${supplyBefore} + amount ${amountWei} > cap ${cap}`
    );
  }

  console.log("=".repeat(70));
  console.log("MINT TREASURY (Phase 1)");
  console.log("  Network             :", network.name, "chainId", network.chainId.toString());
  console.log("  Token               :", TOKEN);
  console.log("  Deployer            :", deployer.address);
  console.log("  Treasury            :", TREASURY);
  console.log("  Amount              :", AMOUNT_CCM.toString(), "CCM");
  console.log("  Amount wei          :", amountWei.toString());
  console.log("  Supply now          :", ethers.formatUnits(supplyBefore, 18), "CCM");
  console.log("  Cap                 :", ethers.formatUnits(cap, 18), "CCM");
  console.log("  Cap left after mint :", ethers.formatUnits(cap - supplyBefore - amountWei, 18), "CCM");
  console.log("=".repeat(70));
  console.log("Sending in 10 seconds. Ctrl-C to abort.");
  await new Promise((r) => setTimeout(r, 10_000));

  const tx = await token.mint(TREASURY, amountWei);
  console.log("\nMint tx:", tx.hash);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("tx.wait() returned null — receipt not confirmed; aborting before post-mint asserts");
  }
  console.log("Mined in block", receipt.blockNumber);

  const supplyAfter = await token.totalSupply();
  const treasuryBal = await token.balanceOf(TREASURY);
  console.log("\nPost-mint state:");
  console.log("  Treasury balance:", ethers.formatUnits(treasuryBal, 18), "CCM");
  console.log("  Total supply    :", ethers.formatUnits(supplyAfter, 18), "CCM");

  if (treasuryBal < amountWei) {
    throw new Error(`Treasury balance ${treasuryBal} < amount ${amountWei}`);
  }
  if (supplyAfter !== supplyBefore + amountWei) {
    throw new Error(`Supply diff mismatch: ${supplyAfter - supplyBefore} != ${amountWei}`);
  }

  console.log("\n✓ Success");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Verify script compiles**

```bash
cd onchain && npx hardhat compile
```

Expected: `Nothing to compile` (script is .ts, doesn't change Solidity sources). If hardhat shows TypeScript errors in the script, fix them before continuing.

- [ ] **Step 3: Verify negative path — wrong chainId**

```bash
cd onchain && CCM_TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
  TREASURY_ADDRESS=0x000000000000000000000000000000000000dEaD \
  AMOUNT_CCM=1 \
  npx hardhat run scripts/mint-treasury-phase1.ts --network baseSepolia
```

Expected: script throws `Refusing to run: chainId is 84532 (expected 8453 ...)`. The chainId guard works.

- [ ] **Step 4: Verify negative path — missing env**

```bash
cd onchain && npx hardhat run scripts/mint-treasury-phase1.ts --network baseSepolia
```

Expected: throws `CCM_TOKEN env var (valid address) required`.

- [ ] **Step 5: Commit script**

```bash
git add onchain/scripts/mint-treasury-phase1.ts
git commit -m "feat(onchain): add Phase 1 treasury mint script with chainId guard"
```

---

## Task 6: Hardhat-fork in-process dry-run of full sequence

**Files:**
- Create: `onchain/scripts/_dry-run-phase1.ts` (underscore prefix = local-use convention per existing scripts)

- [ ] **Step 1: Create the dry-run script**

Write `onchain/scripts/_dry-run-phase1.ts`:

```typescript
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
```

- [ ] **Step 2: Run dry-run against forked Base mainnet**

```bash
cd onchain && BASE_MAINNET_RPC=<your RPC> \
  npx hardhat run scripts/_dry-run-phase1.ts --network hardhat
```

Expected output:
- `Forked Base mainnet. Deployer: 0x...`
- `Token: 0x... version: 1.0.0`
- `Vesting: 0x...`
- `Post-mint: treasury: 10000000.0 CCM`, `supply: 10000000.0 CCM`, `cap left: 4990000000.0 CCM`
- `✓ Dry-run passed end-to-end`

If anything throws, fix the underlying issue (in script logic, contract call, or fork RPC reachability) before continuing.

- [ ] **Step 3: Commit dry-run script**

```bash
git add onchain/scripts/_dry-run-phase1.ts
git commit -m "test(onchain): add Phase 1 hardhat-fork dry-run script"
```

---

## Task 7: Sepolia rehearsal of mint script against sandbox token

**Files:**
- Modify: none (operational, against Sepolia sandbox token at `0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD`)

This rehearsal mints **10 CCM** (not 10M) to a throwaway address on Sepolia, exercising the same code path the mainnet mint will use.

- [ ] **Step 1: Pick a throwaway Sepolia recipient**

Generate a fresh address:
```bash
node -e "const w = require('ethers').Wallet.createRandom(); console.log(w.address);"
```
Record the address as `<SEPOLIA_TREASURY>`. The private key is irrelevant — recipient role only.

- [ ] **Step 2: Confirm sandbox token state on Sepolia**

```bash
cd onchain && CCM_TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
  npx hardhat run --network baseSepolia <(cat <<'EOF'
import { ethers } from "hardhat";
async function main() {
  const t = await ethers.getContractAt("CCMToken", process.env.CCM_TOKEN!);
  const [s] = await ethers.getSigners();
  const MINTER = await t.MINTER_ROLE();
  console.log("signer:", s.address);
  console.log("hasMinter:", await t.hasRole(MINTER, s.address));
  console.log("supply:", ethers.formatUnits(await t.totalSupply(), 18));
}
main().catch(e => { console.error(e); process.exit(1); });
EOF
)
```

Expected: `hasMinter: true` (the signer = sandbox deployer EOA who deployed the token). If `false`, the rehearsal cannot proceed against this token — see Task 7 alternative below.

- [ ] **Step 3: Run mint script with 10 CCM and `ALLOW_TESTNET=1`**

```bash
cd onchain && CCM_TOKEN=0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD \
  TREASURY_ADDRESS=<SEPOLIA_TREASURY> \
  AMOUNT_CCM=10 \
  ALLOW_TESTNET=1 \
  npx hardhat run scripts/mint-treasury-phase1.ts --network baseSepolia
```

Expected:
- Banner prints all parameters with `chainId 84532`.
- Sleep 10s, then mint tx fires.
- Post-mint: `Treasury balance: 10.0 CCM`, supply increases by 10.
- `✓ Success`.

Verify on https://sepolia.basescan.org/address/`<SEPOLIA_TREASURY>` — should show 10 CCM balance.

- [ ] **Step 4: Optional — commit rehearsal log**

If you captured tx hash and want it recorded:
```bash
echo "Sepolia rehearsal: mint 10 CCM to <SEPOLIA_TREASURY> at tx <hash>" \
  >> onchain/.rehearsal-phase1.txt
git add onchain/.rehearsal-phase1.txt
git commit -m "chore(onchain): log Sepolia mint script rehearsal"
```

(Skip if a separate ops log is preferred.)

**Task 7 alternative (if signer lacks MINTER_ROLE on sandbox token):**

Deploy a fresh Sepolia token solely for the rehearsal:
```bash
cd onchain && ADMIN_ADDRESS=<your sepolia EOA> \
  npx hardhat run scripts/deploy-token.ts --network baseSepolia
```
Then use the new token's address in Step 3 above. This is acceptable — Sepolia tokens have no value.

---

## Task 8: Mainnet — Deploy CCMToken

**Files:**
- Modify: `onchain/DEPLOYMENT.md` (append Phase 1 section header + Token row)

**Pre-conditions to verify before this task:**
- Tasks 1, 2, 3, 4 complete
- Task 5 commit `feat(onchain): add Phase 1 treasury mint script` is on the current branch
- Tasks 6 and 7 passed without errors

- [ ] **Step 1: Final preflight check on Base mainnet**

```bash
cd onchain && npx hardhat run --network base <(cat <<'EOF'
import { ethers } from "hardhat";
async function main() {
  const net = await ethers.provider.getNetwork();
  const [s] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(s.address);
  console.log("chainId:", net.chainId.toString(), net.chainId === 8453n ? "✓ mainnet" : "✗ WRONG");
  console.log("signer :", s.address, s.address.toLowerCase() === (process.env.ADMIN_ADDRESS||"").toLowerCase() ? "✓" : "✗");
  console.log("balance:", ethers.formatEther(bal), "ETH", bal >= ethers.parseEther("0.015") ? "✓" : "✗");
}
main().catch(e => { console.error(e); process.exit(1); });
EOF
)
```

Expected: three `✓` marks. If any `✗`, fix before continuing.

- [ ] **Step 2: Deploy CCMToken**

```bash
cd onchain && npx hardhat run scripts/deploy-token.ts --network base
```

Expected output includes:
- `Network : unknown ( chainId: 8453 )` (or similar; chainId 8453 is the assertion)
- `CCMToken deployed: 0x<addr>`
- `Version : 1.0.0`
- `Cap     : 5000000000.0 CCM`
- `Supply  : 0.0 CCM (initial = 0)`

Record the deployed address as `<TOKEN_MAINNET>`.

- [ ] **Step 3: Confirm token deployment on BaseScan**

Visit https://basescan.org/address/`<TOKEN_MAINNET>` — confirm contract creation tx is shown. Record the deploy tx hash.

- [ ] **Step 4: Update DEPLOYMENT.md with Phase 1 section header + Token row**

Open `onchain/DEPLOYMENT.md`. After the "Mainnet pre-flight rehearsal" section (and any sub-sections that follow it), append:

```markdown
---

## Phase 1 — Mainnet (Base, deployed YYYY-MM-DD)

> **Phase 1 deliberately uses EOA admin and EOA treasury (no Safe / no Timelock).**
> See `docs/superpowers/specs/2026-05-11-ccm-mainnet-deploy-design.md` §9 for the
> Phase 2 migration path. Deferred Phase 0 gating items: external audit, Safe,
> Timelock, KYCRegistry, TGESale, Staking, Migration on mainnet.

### Network

| Item | Value |
|---|---|
| Chain | Base mainnet |
| Chain ID | `8453` |
| RPC | `https://mainnet.base.org` (or paid endpoint) |
| Explorer | https://basescan.org |
| Solidity | 0.8.24 (Cancun, optimizer 200 runs) |

### Deployer / Admin / Treasury (Phase 1, EOA-only)

| Item | Value |
|---|---|
| Deployer | `<DEPLOYER_EOA>` (also Token admin + minter + pauser) |
| Treasury | `<TREASURY>` (holds 10M CCM, signs SAFT transfers) |

### Deployed contracts

| Contract | Address | BaseScan |
|---|---|---|
| **CCMToken v1.0.0** | `<TOKEN_MAINNET>` | _(verifying)_ |
```

Replace placeholders with real values. Date is the actual deploy date.

- [ ] **Step 5: Commit**

```bash
git add onchain/DEPLOYMENT.md
git commit -m "docs(onchain): record Phase 1 CCMToken mainnet deploy at <TOKEN_MAINNET>"
```

---

## Task 9: Mainnet — Verify CCMToken on BaseScan

**Files:**
- Modify: `onchain/DEPLOYMENT.md` (replace `_(verifying)_` with verified link)

- [ ] **Step 1: Run hardhat verify**

```bash
cd onchain && npx hardhat verify --network base <TOKEN_MAINNET> $ADMIN_ADDRESS
```

Expected: `Successfully verified contract CCMToken on the block explorer.` Output includes the verified URL.

If it fails with "already verified": that's success too — proceed.

If it fails with "Bytecode does not match": confirm `ADMIN_ADDRESS` env equals the constructor arg used in Task 8 (the deployer EOA). Re-run.

- [ ] **Step 2: Visit verified source on BaseScan**

Visit https://basescan.org/address/`<TOKEN_MAINNET>`#code — confirm the "Contract" tab shows green checkmark and source code.

- [ ] **Step 3: Update DEPLOYMENT.md row with verified link**

In the Token row, replace `_(verifying)_` with `[verified](https://basescan.org/address/<TOKEN_MAINNET>#code)`.

- [ ] **Step 4: Commit**

```bash
git add onchain/DEPLOYMENT.md
git commit -m "docs(onchain): mark Phase 1 CCMToken verified on BaseScan"
```

---

## Task 10: Mainnet — Deploy CCMVesting

**Files:**
- Modify: `onchain/DEPLOYMENT.md` (append Vesting row)

- [ ] **Step 1: Deploy CCMVesting linked to mainnet Token**

```bash
cd onchain && CCM_TOKEN=<TOKEN_MAINNET> \
  npx hardhat run scripts/_deploy-vesting-only.ts --network base
```

Expected output:
- `Network : unknown chainId 8453`
- `Token   : <TOKEN_MAINNET>`
- `CCMVesting deployed: 0x<addr>`
- `Verify: npx hardhat verify --network baseSepolia 0x<addr> <TOKEN_MAINNET> <ADMIN>` (the script prints `baseSepolia` as a default — ignore; we use `--network base` in next task)

Record the address as `<VESTING_MAINNET>`.

- [ ] **Step 2: Confirm Vesting state**

```bash
cd onchain && npx hardhat run --network base <(cat <<'EOF'
import { ethers } from "hardhat";
async function main() {
  const v = await ethers.getContractAt("CCMVesting", process.env.VESTING!);
  console.log("ccm:", await v.ccm());
  console.log("scheduleCount:", (await v.getScheduleCount()).toString());
}
main().catch(e => { console.error(e); process.exit(1); });
EOF
)
```

(Set `VESTING=<VESTING_MAINNET>` inline.) Expected: `ccm:` matches `<TOKEN_MAINNET>`.

- [ ] **Step 3: Update DEPLOYMENT.md with Vesting row**

In the Phase 1 deployed-contracts table, append:

```markdown
| **CCMVesting** | `<VESTING_MAINNET>` | _(verifying)_ |
```

- [ ] **Step 4: Commit**

```bash
git add onchain/DEPLOYMENT.md
git commit -m "docs(onchain): record Phase 1 CCMVesting mainnet deploy at <VESTING_MAINNET>"
```

---

## Task 11: Mainnet — Verify CCMVesting on BaseScan

**Files:**
- Modify: `onchain/DEPLOYMENT.md` (replace `_(verifying)_`)

- [ ] **Step 1: Run hardhat verify**

```bash
cd onchain && npx hardhat verify --network base <VESTING_MAINNET> <TOKEN_MAINNET> $ADMIN_ADDRESS
```

Expected: `Successfully verified contract CCMVesting on the block explorer.`

- [ ] **Step 2: Visit verified source**

Visit https://basescan.org/address/`<VESTING_MAINNET>`#code — confirm source is shown.

- [ ] **Step 3: Update DEPLOYMENT.md**

Replace Vesting row's `_(verifying)_` with `[verified](https://basescan.org/address/<VESTING_MAINNET>#code)`.

- [ ] **Step 4: Commit**

```bash
git add onchain/DEPLOYMENT.md
git commit -m "docs(onchain): mark Phase 1 CCMVesting verified on BaseScan"
```

---

## Task 12: Mainnet — Mint 10M CCM to Treasury

**Files:**
- Modify: `onchain/DEPLOYMENT.md` (append mint event)

⚠ **This is the irreversible step.** 10M CCM will be permanently minted; only `burn()` (by the token holder) can reduce supply, and there is no transfer-back from a wrong recipient unless they cooperate. Triple-check the recipient address.

- [ ] **Step 1: Triple-check the treasury address**

In a fresh terminal session, paste the treasury address into a transaction-decoder or just side-by-side compare with the address used in Task 3 (the 0.001 ETH ping recipient). They MUST be identical (case-insensitive).

```bash
echo "TASK 3 ping recipient: 0x...(write here from memory or notes)"
echo "TASK 12 mint recipient: <TREASURY>"
# Compare visually. If they differ, STOP.
```

- [ ] **Step 2: Run the mint script**

```bash
cd onchain && CCM_TOKEN=<TOKEN_MAINNET> TREASURY_ADDRESS=<TREASURY> \
  npx hardhat run scripts/mint-treasury-phase1.ts --network base
```

Expected:
- Banner prints with `chainId 8453`, amount `10000000 CCM`, treasury `<TREASURY>`.
- 10-second sleep — last chance to Ctrl-C if anything looks wrong.
- `Mint tx: 0x<hash>`
- Post-mint: `Treasury balance: 10000000.0 CCM`, `Total supply: 10000000.0 CCM`.
- `✓ Success`.

Record the mint tx hash as `<MINT_TX>`.

- [ ] **Step 3: Verify on BaseScan**

Visit https://basescan.org/tx/`<MINT_TX>` — confirm:
- Status: Success
- From: `<DEPLOYER_EOA>`
- To: `<TOKEN_MAINNET>`
- Token Transferred: 10,000,000 CCM from `0x0000…0000` to `<TREASURY>`

Visit https://basescan.org/address/`<TREASURY>`#tokentxns — confirm CCM balance shows 10,000,000.

- [ ] **Step 4: Update DEPLOYMENT.md with mint event**

Append to the Phase 1 section, after the deployed-contracts table:

```markdown
### Initial state (post-mint)

CCMToken:
- `totalSupply`: 10,000,000 CCM
- `balanceOf(<TREASURY>)`: 10,000,000 CCM
- `cap - totalSupply`: 4,990,000,000 CCM (remaining headroom)
- Mint tx: `<MINT_TX>` ([BaseScan](https://basescan.org/tx/<MINT_TX>))

CCMVesting:
- `ccm`: `<TOKEN_MAINNET>` (linked)
- `getScheduleCount`: 0 (idle, awaiting Phase 2 use or per-buyer SAFT requests)
```

- [ ] **Step 5: Commit**

```bash
git add onchain/DEPLOYMENT.md
git commit -m "docs(onchain): record 10M CCM mint to treasury at <MINT_TX>"
```

---

## Task 13: Final on-chain state verification

**Files:**
- Modify: none (read-only checks)

- [ ] **Step 1: Run consolidated verification script**

```bash
cd onchain && npx hardhat run --network base <(cat <<'EOF'
import { ethers } from "hardhat";
async function main() {
  const TOKEN = process.env.TOKEN_MAINNET;
  const VESTING = process.env.VESTING_MAINNET;
  const TREASURY = process.env.TREASURY;
  const DEPLOYER = process.env.DEPLOYER;
  if (!TOKEN || !VESTING || !TREASURY || !DEPLOYER) {
    throw new Error("Set TOKEN_MAINNET, VESTING_MAINNET, TREASURY, DEPLOYER env vars");
  }

  const t = await ethers.getContractAt("CCMToken", TOKEN);
  const v = await ethers.getContractAt("CCMVesting", VESTING);

  const ADMIN = await t.DEFAULT_ADMIN_ROLE();
  const MINTER = await t.MINTER_ROLE();
  const PAUSER = await t.PAUSER_ROLE();

  const checks: [string, any, any][] = [
    ["Token.totalSupply", await t.totalSupply(), 10_000_000n * 10n ** 18n],
    ["Token.cap", await t.cap(), 5_000_000_000n * 10n ** 18n],
    ["Token.balanceOf(treasury)", await t.balanceOf(TREASURY), 10_000_000n * 10n ** 18n],
    ["Token.balanceOf(deployer)", await t.balanceOf(DEPLOYER), 0n],
    ["Token.hasRole(ADMIN, deployer)", await t.hasRole(ADMIN, DEPLOYER), true],
    ["Token.hasRole(MINTER, deployer)", await t.hasRole(MINTER, DEPLOYER), true],
    ["Token.hasRole(PAUSER, deployer)", await t.hasRole(PAUSER, DEPLOYER), true],
    ["Vesting.ccm", (await v.ccm()).toLowerCase(), TOKEN.toLowerCase()],
  ];

  let allOk = true;
  for (const [name, actual, expected] of checks) {
    const ok = String(actual) === String(expected);
    console.log(ok ? "✓" : "✗", name, "=", String(actual), ok ? "" : `(expected ${expected})`);
    if (!ok) allOk = false;
  }
  if (!allOk) throw new Error("One or more checks failed");
  console.log("\n✓ All Phase 1 final-state checks passed");
}
main().catch(e => { console.error(e); process.exit(1); });
EOF
)
```

Run as: `TOKEN_MAINNET=0x... VESTING_MAINNET=0x... TREASURY=0x... DEPLOYER=0x... ...`

Expected: All 8 lines start with `✓`, then `✓ All Phase 1 final-state checks passed`.

If any `✗`: investigate before declaring deploy complete. Do NOT update docs as "done" until all checks pass.

(No commit — read-only verification.)

---

## Task 14: Final DEPLOYMENT.md polish + close out

**Files:**
- Modify: `onchain/DEPLOYMENT.md` (close out Phase 1 section), `docs/ccm-phase0-architecture.md` (optional)

- [ ] **Step 1: Cross-link spec from DEPLOYMENT.md**

In the Phase 1 section preamble (added in Task 8 Step 4), confirm the link to the spec is present:

```markdown
> See `docs/superpowers/specs/2026-05-11-ccm-mainnet-deploy-design.md` for the full design rationale.
```

(Add it if missing.)

- [ ] **Step 2: Update gating list status (in any other doc that tracks Phase 0 / Phase 1 status)**

If `docs/ccm-phase0-architecture.md` references "mainnet deploy pending", update to "Phase 1 deployed YYYY-MM-DD; Phase 2 (Safe + Timelock + audit) pending". Otherwise skip.

- [ ] **Step 3: Final commit**

```bash
git add onchain/DEPLOYMENT.md docs/ccm-phase0-architecture.md
git commit -m "docs: close out Phase 1 mainnet deploy in DEPLOYMENT.md"
```

(If no architecture-doc changes were needed, drop that path from `git add`.)

- [ ] **Step 4: Tag the release (optional)**

```bash
git tag -a phase1-mainnet -m "CCM Phase 1 mainnet deploy: Token + Vesting + 10M treasury mint"
git push origin phase1-mainnet
```

(Push gated on user permission per safety rules.)

---

## Self-Review

**Spec coverage:** Each spec section maps to a task:
- Spec §3 (Architecture) → Task 5 (script implements EOA admin + treasury flow) and Tasks 8, 10
- Spec §4 (Contracts) → Tasks 8, 10
- Spec §5 (Pre-deploy gating) → Tasks 1–4
- Spec §6 Step 1 (Deploy Token) → Task 8
- Spec §6 Step 2 (Deploy Vesting) → Task 10
- Spec §6 Step 3 (Verify) → Tasks 9, 11
- Spec §6 Step 4 (Mint script) → Task 5 (write) + Task 12 (run)
- Spec §6 Step 5 (Final verification) → Task 13
- Spec §7 (Post-deploy ops) → Documented in Task 14, no script needed
- Spec §8 (Risks) → Mitigations baked into Task 5 script (chainId guard, MINTER_ROLE check, cap check, sleep banner) and Task 12 (triple-check recipient)
- Spec §9 (Phase 2 migration) → Documented in DEPLOYMENT.md Phase 1 section preamble (Task 8 Step 4)
- Spec §10 (Testing/dry-run) → Task 6 (hardhat fork) + Task 7 (Sepolia rehearsal) + Task 3 (treasury ping)
- Spec §11 (Documentation) → Tasks 8, 10, 12, 14
- Spec §12 (Open questions) → Treasury address resolved in Task 3; mint script parameterization done in Task 5 (AMOUNT_CCM env); announcement timing is operational, not in this plan.

No spec gaps.

**Placeholder scan:** No "TBD", "TODO", "implement later", "appropriate error handling" left in plan. Code blocks are complete. The `<TOKEN_MAINNET>`, `<TREASURY>`, etc. placeholders are runtime values supplied during execution, not plan gaps — clearly labeled as such.

**Type/name consistency:**
- `mint-treasury-phase1.ts` references: `CCM_TOKEN`, `TREASURY_ADDRESS`, `AMOUNT_CCM`, `ALLOW_TESTNET` — used consistently in Tasks 5, 7, 12.
- `_deploy-vesting-only.ts` env names: `CCM_TOKEN`, `ADMIN_ADDRESS` — matches usage in Task 10 and the script's actual implementation (verified during spec self-review).
- `MINTER_ROLE` / `DEFAULT_ADMIN_ROLE` / `PAUSER_ROLE` — names match `CCMToken.sol`.
- `getScheduleCount()` referenced in Task 10 Step 2 — confirmed to exist at `CCMVesting.sol:203`.

No inconsistencies.
