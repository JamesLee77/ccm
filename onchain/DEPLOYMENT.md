# CCM Smart Contract Deployment Record

> Time-ordered record of deployed contract addresses, transaction hashes, and verification status.
> Update this document on every new deployment or migration.
>
> **Status (2026-05-09)**: Testnet (Base Sepolia) deploy complete; mainnet
> deploy pending. CCM-renamed sources were forked from the czero precursor
> (which had its own CZM-branded testnet deployment, see `czero/DEPLOYMENT.md`).
> Mainnet deploy gated on the pre-deploy checklist below (`docs/ccm-phase0-architecture.md` §1).

---

## Sandbox — Base Sepolia testnet (deployed 2026-05-09)

For the public testnet sandbox at testnet.ccmnetwork.net. These tokens
have no real value; the contracts were deployed with the existing czero
testnet dev EOA as both deployer and admin (no multisig needed for sandbox).

### Network

| Item | Value |
|---|---|
| Chain | Base Sepolia |
| Chain ID | `84532` |
| RPC | `https://sepolia.base.org` |
| Explorer | https://sepolia.basescan.org |
| Solidity | 0.8.24 (Cancun, optimizer 200 runs) |

### Deployer / Admin

| Item | Value |
|---|---|
| Deployer | `0xB722843587DA96bdFb5638Bb0AbC8FC56a9dfa1D` (EOA, testnet only) |
| Admin | same EOA — sandbox does not need multisig |
| Roles on Token | `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE` |
| Roles on Vesting | `DEFAULT_ADMIN_ROLE`, `SCHEDULE_MANAGER_ROLE` |

### Deployed contracts

| Contract | Address | BaseScan |
|---|---|---|
| **CCMToken v1.0.0** | `0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD` | [verified](https://sepolia.basescan.org/address/0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD#code) |
| **CCMVesting** | `0xc3E1bC1073b89DB6593e4257aD903A1611Bb24C5` | [verified](https://sepolia.basescan.org/address/0xc3E1bC1073b89DB6593e4257aD903A1611Bb24C5#code) |
| **CCMSandboxFaucet** *(sandbox-only)* | `0xfADAc6697d2Ee295d03a4De0F5ef79A431290E46` | [verified](https://sepolia.basescan.org/address/0xfADAc6697d2Ee295d03a4De0F5ef79A431290E46#code) |
| **CCMSandboxNFT** *(sandbox-only)* | `0xbC3EAc7514F82A868807b81b165D2121495380E9` | [verified](https://sepolia.basescan.org/address/0xbC3EAc7514F82A868807b81b165D2121495380E9#code) |
| **CCMSandboxVault** *(sandbox-only)* | `0xEd62b71e9ff0200CFf02C8F38618Af153C609334` | [verified](https://sepolia.basescan.org/address/0xEd62b71e9ff0200CFf02C8F38618Af153C609334#code) |
| **CCMSandboxGradeWrapper** *(sandbox-only)* | `0x35A4f714847cDB0e34e40cFA99A9CDB0ed232986` | [verified](https://sepolia.basescan.org/address/0x35A4f714847cDB0e34e40cFA99A9CDB0ed232986#code) |
| ↳ CCM-A token | `0x90f9654B8e912715614aE8072D272c456323F8F4` | [verified](https://sepolia.basescan.org/address/0x90f9654B8e912715614aE8072D272c456323F8F4#code) |
| ↳ CCM-B token | `0xa13374DAbc181A7d0657252F16B37eEC95570C8B` | [verified](https://sepolia.basescan.org/address/0xa13374DAbc181A7d0657252F16B37eEC95570C8B#code) |
| ↳ CCM-C token | `0xb0c14AcbAa95364AC359d0AecAf2885B52e1c9B2` | [verified](https://sepolia.basescan.org/address/0xb0c14AcbAa95364AC359d0AecAf2885B52e1c9B2#code) |
| ↳ CCM-D token | `0x35571eC6301B2Ef57D153a08D05cdDa1dF9721B2` | [verified](https://sepolia.basescan.org/address/0x35571eC6301B2Ef57D153a08D05cdDa1dF9721B2#code) |
| **CCMSandboxUSDC** *(sandbox-only, 6 dec)* | `0x87D1726B81095257A9ed70Aa1e67AA740bE485B6` | [verified](https://sepolia.basescan.org/address/0x87D1726B81095257A9ed70Aa1e67AA740bE485B6#code) |
| **CCMSandboxLending** *(sandbox-only)* | `0x307e18456647B81A6BA5e90aE90949e70bB8f8C6` | [verified](https://sepolia.basescan.org/address/0x307e18456647B81A6BA5e90aE90949e70bB8f8C6#code) |
| **CCMSandboxFractionalizer** *(sandbox-only)* | `0x39FefEE1f75e711c51BA303F70CC2053eAF9Fe3a` | [verified](https://sepolia.basescan.org/address/0x39FefEE1f75e711c51BA303F70CC2053eAF9Fe3a#code) |
| ↳ FRAC0 (lazily deployed, NFT id 0) | `0xa99A094d02a6D75f7887ebb35d26117C8DA6EbAb` | [verified](https://sepolia.basescan.org/address/0xa99A094d02a6D75f7887ebb35d26117C8DA6EbAb#code) |
| **CCMSandboxYield** *(sandbox-only)* | `0x566010522f7B93b89a823Be1cFfCead53c6e1dF4` | [verified](https://sepolia.basescan.org/address/0x566010522f7B93b89a823Be1cFfCead53c6e1dF4#code) |
| **CCMSandboxInsurance** *(sandbox-only, seeded 1000 USDC)* | `0xb0F2dDB07fcE42EC677eC7a45D642f88adcc48c3` | [verified](https://sepolia.basescan.org/address/0xb0F2dDB07fcE42EC677eC7a45D642f88adcc48c3#code) |
| **CCMSandboxIndexBasket** *(sandbox-only)* | `0x4dcea36A3d6C11dA6a7d443C05908c0a4D405423` | [verified](https://sepolia.basescan.org/address/0x4dcea36A3d6C11dA6a7d443C05908c0a4D405423#code) |
| ↳ CCM-PRIME (60A/30B/10C/0D) | `0x8f3Ab4641EaF59b81a07D8bABd97D93e94245D8A` | [verified](https://sepolia.basescan.org/address/0x8f3Ab4641EaF59b81a07D8bABd97D93e94245D8A#code) |
| ↳ CCM-FOREST (0A/30B/60C/10D) | `0x3bD1A48345F5D11EFe7C458daB4584474b3Db9d8` | [verified](https://sepolia.basescan.org/address/0x3bD1A48345F5D11EFe7C458daB4584474b3Db9d8#code) |
| ↳ CCM-TECH (70A/30B/0C/0D) | `0x886320E5fbc3Ba482d6148D2e15B941C6a201FBf` | [verified](https://sepolia.basescan.org/address/0x886320E5fbc3Ba482d6148D2e15B941C6a201FBf#code) |
| **CCMSandboxRebate** *(sandbox-only, §7.9 Retire-to-Earn)* | `0x11213DBc93999b95b5d5a6fdC8a0ddE7e01c5fbD` | [verified](https://sepolia.basescan.org/address/0x11213DBc93999b95b5d5a6fdC8a0ddE7e01c5fbD#code) |
| **MockPriceOracle** *(sandbox-only, CCM/USD fixed $0.20)* | `0x467b5f3Deb6750866ae2D5e05705A9Edae13b30e` | [verified](https://sepolia.basescan.org/address/0x467b5f3Deb6750866ae2D5e05705A9Edae13b30e#code) |
| **CCMSandboxStaking** *(sandbox-only, 5M CCM pool, no eligibility gate)* | `0xAaeF319bc3B653DF68502a5A713989BB29ea8C48` | [verified](https://sepolia.basescan.org/address/0xAaeF319bc3B653DF68502a5A713989BB29ea8C48#code) |
| ~~CCMSandboxVault v0~~ *(decommissioned)* | ~~`0x69c5eB2BB679E88BAc40525cD20d1Ea84905633D`~~ | first deploy used 1:1 raw atoms (no 1e18 scale); MINTER_ROLE revoked 2026-05-09 |
| **Oracle-A** *(sandbox, $0.20)* | `0xC04aba12B9ECF3465832dee6b814A0dd6ed0991c` | [verified](https://sepolia.basescan.org/address/0xC04aba12B9ECF3465832dee6b814A0dd6ed0991c#code) |
| **Oracle-B** *(sandbox, $0.21)* | `0xd82596F1dcAA5aA2dfA688eAde568cdFf82C9427` | [verified](https://sepolia.basescan.org/address/0xd82596F1dcAA5aA2dfA688eAde568cdFf82C9427#code) |
| **Oracle-C** *(sandbox, $0.19)* | `0xe1Da27b2122A6b875a8E46B8b089FBf1151887eC` | [verified](https://sepolia.basescan.org/address/0xe1Da27b2122A6b875a8E46B8b089FBf1151887eC#code) |
| **CCMSandboxMedianAggregator** *(sandbox, display-only)* | `0x58CD4De9f68a1982e6AF0258863CeCc7E68beaE6` | [verified](https://sepolia.basescan.org/address/0x58CD4De9f68a1982e6AF0258863CeCc7E68beaE6#code) |
| **CCMSandboxNodeRegistry** *(sandbox, open registration)* | `0xE9AD5DC60a799Cc037824f2B030E641f4d460136` | [verified](https://sepolia.basescan.org/address/0xE9AD5DC60a799Cc037824f2B030E641f4d460136#code) |

### Initial state (post-deploy)

CCMToken:
- `name`: `"CCM Network Token"`
- `symbol`: `"CCM"`
- `decimals`: 18
- `cap`: 5,000,000,000 CCM
- `VERSION`: `"1.0.0"`
- `totalSupply`: 0 (no mint yet)
- `paused`: false

CCMVesting:
- `ccm`: `0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD` (linked)
- `getScheduleCount`: 0

CCMSandboxFaucet *(testnet-only)*:
- `token`: `0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD`
- `CLAIM_AMOUNT`: 100 CCM
- `COOLDOWN`: 86,400 s (24h)
- Granted `MINTER_ROLE` on CCMToken at tx `0x20ac68f5cc2c17a8b4fb23646800c4ed1acb499b93cc47ce8ec911cd95971a7e`
- Smoke-tested: deployer claimed 100 CCM at tx `0x6b3311696355ebff583b8372e5b48ec740f28adb0ef24dce166db56a7750fc47`
- 14 hardhat unit tests passing on this contract

CCMSandboxVault *(testnet-only)*:
- ERC-1155 NFT ⇄ ERC-20 CCM 1:1 wrap (1 tonne ↔ 1 CCM, vault scales by 10^18)
- FIFR enforced in-contract: lower-grade entries returned first (D → C → B → A); FIFO within grade
- Per-tx hop cap: 5 (split larger unwraps across multiple txs)
- ReentrancyGuard + CEI ordering on wrap/unwrap
- Constructor refuses chainId 8453
- MINTER_ROLE granted on CCMToken at tx `0x5b3fd8cf674b8e6ce6c0d92b1b9c52ecb1bb228e595746adbf87e658653694f1`
- Smoke-tested wrap 5 NFT → 5 CCM (`0x4d61e0cacf...`), unwrap 5 CCM → 5 NFT (`0xfae0b3beb4...`)
- 17 hardhat unit tests passing on this contract; full suite **210 passing**

NOTE: a v0 vault was deployed earlier (`0x69c5eB2B...`) with a 1:1 raw-atom bug
(no 1e18 scaling). NFTs were recovered, MINTER_ROLE revoked, current vault is
v1 at `0xEd62b71e...`.

CCMSandboxNFT *(testnet-only)*:
- ERC-1155 with on-chain `meta(id)` (grade A/B/C/D, vintage 2020–2030, tonnage 1–1,000, projectId, minter)
- `MINT_COOLDOWN`: 1 hour per address
- `mint(grade, vintage, tonnage, projectId)` open to anyone
- `retire(id, amount)` burns and increments `retiredTotal`
- Constructor refuses chainId 8453 (mainnet)
- Smoke-tested: mint id 0 grade A 2026 50t at tx `0x5a6e02fdc70b8ee89bdd16999e9a266cab00b1c95864b983aa020a2c91e6f06a`, retire 20 at tx `0x3936c230b6e7dede5253bbd7f8edb7a8cef36c1eb42112b19d6d5f9b47ff8f20`
- 19 hardhat unit tests passing on this contract; full suite **193 passing**

CCMSandboxStaking *(testnet-only)*:
- `ccm`: `0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD` (sandbox token)
- `priceOracle`: `0x467b5f3Deb6750866ae2D5e05705A9Edae13b30e` (fixed $0.20)
- `P0_TGE`: `200000000000000000` (0.20 USD in 1e18)
- `POOL_INIT`: `5000000000000000000000000` (5,000,000 CCM)
- `poolRemaining`: 5,000,000 CCM (full, fresh deploy)
- Funded at tx: `0x0eedcd397a7ed034760f47b8238b13de3a9d4621bdb2217db93b526d8483b1e9`
- For the testnet.ccmnetwork.net playground — no eligibility whitelist; anyone can stake

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
- CCMSandboxStaking (new)    `0xAaeF319bc3B653DF68502a5A713989BB29ea8C48`
- MockPriceOracle (new)      `0x467b5f3Deb6750866ae2D5e05705A9Edae13b30e`

### Network viz infrastructure (deployed 2026-05-13)

Supports the testnet visualization layer at testnet.ccmnetwork.net. None
of these are referenced by CCMSandboxStaking — they exist only to feed
the marketing visualization (OracleConsensusPanel + NodeRegistration
callout).

- 4 oracles total: existing primary (D) + Oracle-A/B/C deployed today.
  Initial prices A=0.20, B=0.21, C=0.19, D=0.20 → median 0.2025 (display only).
- Median aggregator reads all 4 via IPriceSource.
- NodeRegistry is open — anyone can `register(label, endpoint)`. Pre-seeded
  with the deployer's own registration (label `ccmine-seed-B722`).

Frontend deployed 2026-05-13: testnet.ccmnetwork.net production now serves
the 7-component visualization layer (HeroBanner + LiveNetworkState +
MiningNetworkViz + OracleConsensusPanel + YieldCurvePanel + ActivityFeed
+ NodeRegistrationCallout) above the existing 4-step playground.

### Notes

- Same script as czero proven on its CZM testnet (deploy-presale.ts) but
  crashed mid-way reading `VERSION()` immediately after deploy due to RPC
  state caching (czero's known issue, doc §6 in czero DEPLOYMENT.md).
  CCMVesting was deployed via a one-off `_deploy-vesting-only.ts` helper.
- Both contracts verified on BaseScan via `hardhat verify --network baseSepolia`.
- The next operational step is to mint a small allocation to the vesting
  contract and create a sandbox schedule so portal/testnet UIs have data
  to render.

---

## Phase 0 — Mainnet pre-audit deploy (Base)

### Network (planned)

| Item | Value |
|---|---|
| Chain | **Base mainnet** |
| Chain ID | `8453` |
| RPC | `https://mainnet.base.org` |
| Explorer | https://basescan.org |
| Solidity | `0.8.24` (Cancun EVM, optimizer 200 runs) |
| Deploy date | _pending_ |

### Pre-deploy gating list

Per `docs/ccm-phase0-architecture.md` §1, **none of the following may be skipped**:

- [⚠] **Admin role on every contract granted to a Gnosis Safe 3-of-5 (no EOA)** — flow rehearsed end-to-end on Base Sepolia: Safe v1.4.1 3-of-4 (`0xCD2A…3108`) deployed via canonical factory, wired as sole proposer/executor on Timelock v2 (`0x1280…6362`), 3-of-4 EIP-712 SafeTx → `Timelock.schedule` → `CallScheduled` event verified 2026-05-09. Mainnet step left: deploy a Safe at safe.global with the real 5 signers, run `scripts/deploy-timelock.ts` and `scripts/transfer-admin-to-timelock.ts` against it.
- [x] **`CCMTimelock` (48h delay) implemented** — `contracts/CCMTimelock.sol` enforces 48h floor on-chain (chainId 84532 / 8453); local Hardhat permitted to use shorter delays for unit tests. Deploy via `scripts/deploy-timelock.ts`, hand admin off via `scripts/transfer-admin-to-timelock.ts`. End-to-end rehearsal status: see "Mainnet pre-flight rehearsal" below.
- [x] **Bug bounty program scope drafted** — `BUG_BOUNTY.md` + `SECURITY.md`. $500K cap, standard tiers (Critical $100K-$500K · High $25K-$100K · Medium $5K-$25K · Low $1K-$5K), KYC ≥$10K. Live submission to Immunefi gated on mainnet deploy + vault funding (operator runbook in `BUG_BOUNTY.md`).
- [ ] Slither + manual review **re-run on the renamed CCM* sources**
- [x] **Off-chain KYC whitelist with admin gate** — `CCMKYCRegistry` deployed as a single source of truth (`isKYCed(addr)` bool). Two-role design: `KYC_OPERATOR_ROLE` (Safe, hot) flips per-user status without timelock so daily approvals are real-time; `DEFAULT_ADMIN_ROLE` (Timelock, slow) manages operators. Sumsub or Persona feeds the operator role from off-chain. Base Sepolia rehearsal at `0x9172…2E46` (admin = rehearsal Timelock `0x3EbA…d979`) — handoff verified end-to-end on 2026-05-09.
- [ ] BaseScan API key configured for verify
- [ ] Deployer wallet (Gnosis Safe owner) funded for deploy gas

### Mainnet runbook (per privileged contract)

For each of `CCMToken`, `CCMVesting`, `CCMStaking`, `CCMTGESale`, `CCMMigration`:

1. Deploy contract with the deployer EOA holding all roles (existing flow).
2. From the multisig, schedule `grantRole(DEFAULT_ADMIN_ROLE, timelock)` on the contract — but on mainnet, since the *deployer* is still admin at this point, the deployer just calls it directly: `contract.grantRole(DEFAULT_ADMIN_ROLE, timelock)`.
3. Deployer also grants `PAUSER_ROLE` (and any other privileged roles) to the timelock.
4. Deployer calls `contract.renounceRole(...)` for every role they hold. **Order matters**: renounce non-admin roles first, then renounce `DEFAULT_ADMIN_ROLE` last — once the admin role is gone, the deployer cannot recover any other role.
5. Sanity: `hasRole(ADMIN, deployer) === false`, `hasRole(ADMIN, timelock) === true`. From here, every privileged op is `multisig → timelock.schedule → wait 48h → timelock.execute`.

The `scripts/transfer-admin-to-timelock.ts` script automates steps 2–4 for `CCMToken`. Replicate the same pattern for `CCMVesting` etc. by adapting the role list.

### Mainnet pre-flight rehearsal (Base Sepolia · 2026-05-09)

Rehearsal token + timelock deployed separately from the sandbox token (sandbox
`CCMToken` at `0x5641…CEFD` keeps its EOA admin so primitive deploys can grant
`MINTER_ROLE` directly).

| Contract | Address | BaseScan |
|---|---|---|
| CCMToken (rehearsal) | `0xB5e54084eEFcc4ddc93F3A6AA7A6Dea501FB3999` | [verified](https://sepolia.basescan.org/address/0xB5e54084eEFcc4ddc93F3A6AA7A6Dea501FB3999#code) |
| CCMTimelock v1 (48h, deployer=proposer/executor placeholder) | `0x3EbA7887525f1E68dc946760a96B01d1E1a1d979` | [verified](https://sepolia.basescan.org/address/0x3EbA7887525f1E68dc946760a96B01d1E1a1d979#code) |
| CCMKYCRegistry (admin=Timelock-v1, operator=deployer placeholder) | `0x9172D6eaF05587b595f4eE894B4C7917Be652E46` | [verified](https://sepolia.basescan.org/address/0x9172D6eaF05587b595f4eE894B4C7917Be652E46#code) |
| Safe (3-of-4, v1.4.1) | `0xCD2A73Fbd9B179Cd32f0d6fC7e488e2bE3a63108` | [safe.global](https://app.safe.global/home?safe=basesep:0xCD2A73Fbd9B179Cd32f0d6fC7e488e2bE3a63108) |
| CCMTimelock v2 (48h, **Safe** as proposer/executor) | `0x1280E7C73e22D35c1319145B7a9eCa4199786362` | [verified](https://sepolia.basescan.org/address/0x1280E7C73e22D35c1319145B7a9eCa4199786362#code) |

**Handoff completed end-to-end:**

| Check | Result |
|---|---|
| `hasRole(DEFAULT_ADMIN_ROLE, deployer)` | `false` |
| `hasRole(DEFAULT_ADMIN_ROLE, timelock)` | `true` |
| `hasRole(PAUSER_ROLE, deployer)` | `false` |
| `hasRole(PAUSER_ROLE, timelock)` | `true` |
| Direct EOA `grantRole` | ✓ reverts |
| Scheduled `grantRole(MINTER_ROLE, alice)` via timelock | ✓ pending, ETA 2026-05-11T10:46:48Z (48h) |
| `timelock.getMinDelay()` | `172800` s |

This proves the mainnet handoff script works on a live chain. For mainnet,
substitute the deployer EOA in `PROPOSERS` / `EXECUTORS` with the Gnosis Safe
3-of-5 address and run the same scripts.

#### Safe-controlled rehearsal (Timelock v2, 2026-05-09)

Beyond the v1 timelock with EOA placeholder, a **second** rehearsal proves
the same flow works with a real multisig in the loop. A 3-of-4 Safe
v1.4.1 was deployed at `0xCD2A…3108`, and a fresh `CCMTimelock v2` at
`0x1280…6362` was deployed with the Safe as its sole proposer/executor.

Safe owners (testnet only):

| # | Address |
|---|---|
| 1 | `0x953e7c875e0636171a3c223148183c4a8b604e5B` (bob) |
| 2 | `0xAF2f45364657d9A9e40b80489Ed15baDC4dc098D` (carol) |
| 3 | `0xB722843587DA96bdFb5638Bb0AbC8FC56a9dfa1D` (deployer) |
| 4 | `0xD4EecF3a15e6727C91E2435216e4f071717411F0` (alice) |

Threshold: **3** (the same threshold mainnet uses, just one fewer owner
since we only have 4 keys in the test env).

End-to-end check: 3 of 4 owners (bob, deployer, alice) signed an
EIP-712 `SafeTx` calling `Timelock.schedule(grantRole(MINTER_ROLE,
alice))`. Concatenated sigs were submitted via `Safe.execTransaction`.
Result: `CallScheduled` event emitted by the timelock, op id
`0xaa2aef…5c57`, ETA = submission + 48 h. **The Safe was accepted as
PROPOSER, exactly as designed.**

Mainnet substitution: deploy a Safe via [safe.global](https://app.safe.global)
(3-of-5 with the real signers), then run `scripts/deploy-timelock.ts` with
`PROPOSERS=<safe>` and `EXECUTORS=<safe>` (or `EXECUTORS=0x000…000` to
allow anyone to push the execute button after the delay). The handoff
script (`scripts/transfer-admin-to-timelock.ts`) is unchanged.

#### Phase 1 + Phase 2 full-pipeline rehearsal (Base Sepolia · 2026-05-12)

End-to-end rehearsal of the entire post-spec Phase 1 + Phase 2 sequence on
fresh contract instances. Validates: the new `mint-treasury-phase1.ts`
(chainId guard + 6 safety guards), the refactored
`transfer-admin-to-timelock.ts` (now handles MINTER_ROLE), the new
`transfer-vesting-admin-to-timelock.ts`, the new `verify-phase2-handoff.ts`
(14-assertion read-only verifier), and the new `schedule-mint-via-timelock.ts`
(Safe Wallet calldata helper).

Roles for this rehearsal: deployer EOA (`0xB722…fa1D`) plays both Deployer
and GovSafe (testnet shortcut — validates scripts without multi-sig
friction; mainnet uses a real Gnosis Safe 3-of-5). Treasury is a one-time
throwaway random address.

Rehearsal ran twice:
- **Round 1** (commit `6c1fa26`, pre-fix) — completed end-to-end, but
  surfaced two RPC stale-state race conditions on public `sepolia.base.org`:
  (a) `mint-treasury-phase1.ts` post-mint `totalSupply()` returned `0` even
  though the mint tx had landed (`Supply diff mismatch: 0 != 10e18`);
  (b) `transfer-admin-to-timelock.ts` renounce phase refused to proceed
  because `hasRole(timelock)` returned `false` immediately after the grant
  tx mined. Both were post-tx eth_call latency, not on-chain bugs — the txs
  themselves were correct and the second invocation (idempotent replay)
  completed cleanly. Final state was still validated by all 14 verifier
  assertions.
- **Round 2** (commit `593038f`, post-fix) — `await tx.wait()` was changed
  to `await tx.wait(2)` (two confirmations) for every state-mutation call
  in the three scripts. Re-running on fresh contracts produced a clean
  end-to-end pass with no false-positive failures. The mint script and
  both handoff scripts completed their full sequences (11 + 6 + 4 txs) on
  the first try.

| Contract | Address (round 2) | BaseScan |
|---|---|---|
| CCMToken (phase1+2 rehearsal) | `0x49B5014bC3Ab72e538E34dCD4b64eC00cd04B8D3` | [verified](https://sepolia.basescan.org/address/0x49B5014bC3Ab72e538E34dCD4b64eC00cd04B8D3#code) |
| CCMVesting (phase1+2 rehearsal) | `0x24557f090C5e21a6fd305cD9Bb239185b2D4D1F1` | [verified](https://sepolia.basescan.org/address/0x24557f090C5e21a6fd305cD9Bb239185b2D4D1F1#code) |
| CCMTimelock (phase1+2 rehearsal, self-admin, 48h, deployer=PROPOSER+EXECUTOR placeholder) | `0x50F384c6641B16364dcaed741F944728e027aC6F` | [verified](https://sepolia.basescan.org/address/0x50F384c6641B16364dcaed741F944728e027aC6F#code) |
| Treasury (throwaway, holds 10 CCM) | `0x7a27FBd9a533F72a057B91314e30a35bAE36EB19` | — |

**Round 2 transactions** (the validated run):

| # | Step | Tx hash |
|---|---|---|
| 5 | Mint 10 CCM → Treasury | [`0x5acd5e2e15164d3d5f068ee72ee4f9d125a4d62261268e368dbb3b47ec4e46bb`](https://sepolia.basescan.org/tx/0x5acd5e2e15164d3d5f068ee72ee4f9d125a4d62261268e368dbb3b47ec4e46bb) |
| 8.1 | Token grant DEFAULT_ADMIN → Timelock | [`0xdc84e819ce8bb7e865032290c364a130a9f92da9ec411eea43c576dde803a98f`](https://sepolia.basescan.org/tx/0xdc84e819ce8bb7e865032290c364a130a9f92da9ec411eea43c576dde803a98f) |
| 8.2 | Token grant MINTER → Timelock | [`0xad651ad0bed50ddb735f24d9f3d6576834f1a3d8486ddf863ac76633d290931c`](https://sepolia.basescan.org/tx/0xad651ad0bed50ddb735f24d9f3d6576834f1a3d8486ddf863ac76633d290931c) |
| 8.3 | Token grant PAUSER → Timelock | [`0xd085b5e9b8cc99f0675634d49283b2a25a5bfc540f54b72fa0311aa0c56eb7dd`](https://sepolia.basescan.org/tx/0xd085b5e9b8cc99f0675634d49283b2a25a5bfc540f54b72fa0311aa0c56eb7dd) |
| 8.4 | Token renounce PAUSER (deployer) | [`0xb7173e950a1f29f60e78dbf9b70c8e1d4a99efbb400be248f652e1246147126d`](https://sepolia.basescan.org/tx/0xb7173e950a1f29f60e78dbf9b70c8e1d4a99efbb400be248f652e1246147126d) |
| 8.5 | Token renounce MINTER (deployer) | [`0x46c6529670e58af14046426b23cc8c76c7e5e036c45a5d7eef04b91dc577eb58`](https://sepolia.basescan.org/tx/0x46c6529670e58af14046426b23cc8c76c7e5e036c45a5d7eef04b91dc577eb58) |
| 8.6 | Token renounce DEFAULT_ADMIN (deployer) | [`0x6fb68400a249302e8e8d7f4cdbc9804c0b8c984d284bba2f4e0087557818ff97`](https://sepolia.basescan.org/tx/0x6fb68400a249302e8e8d7f4cdbc9804c0b8c984d284bba2f4e0087557818ff97) |
| 9.1 | Vesting grant DEFAULT_ADMIN → Timelock | [`0xfe556c7f7728faf1828067561d2c1570f6e8dd49d2d4ff526b0ba42fcad9d835`](https://sepolia.basescan.org/tx/0xfe556c7f7728faf1828067561d2c1570f6e8dd49d2d4ff526b0ba42fcad9d835) |
| 9.2 | Vesting grant SCHEDULE_MANAGER → Timelock | [`0xbfc153345732a0f7756a5b2ffdafa2d9d35348c1e4008be2b59df2fb1bb70a95`](https://sepolia.basescan.org/tx/0xbfc153345732a0f7756a5b2ffdafa2d9d35348c1e4008be2b59df2fb1bb70a95) |
| 9.3 | Vesting renounce SCHEDULE_MANAGER (deployer) | [`0x66a3b8f075ecf92a411bf814997affcefbb9aaa9f718a64d59c485a1a6e2a2ef`](https://sepolia.basescan.org/tx/0x66a3b8f075ecf92a411bf814997affcefbb9aaa9f718a64d59c485a1a6e2a2ef) |
| 9.4 | Vesting renounce DEFAULT_ADMIN (deployer) | [`0x4790ee8b0e703fcc537439675bd5092e0913e64ee8327c9b2a8cc90f85985e66`](https://sepolia.basescan.org/tx/0x4790ee8b0e703fcc537439675bd5092e0913e64ee8327c9b2a8cc90f85985e66) |

**Verifier output** (Step 10, `verify-phase2-handoff.ts`):

```
✓ Token.hasRole(ADMIN, deployer)        = false
✓ Token.hasRole(MINTER, deployer)       = false
✓ Token.hasRole(PAUSER, deployer)       = false
✓ Token.hasRole(ADMIN, timelock)        = true
✓ Token.hasRole(MINTER, timelock)       = true
✓ Token.hasRole(PAUSER, timelock)       = true
✓ Vesting.hasRole(ADMIN, deployer)             = false
✓ Vesting.hasRole(SCHEDULE_MANAGER, deployer)  = false
✓ Vesting.hasRole(ADMIN, timelock)             = true
✓ Vesting.hasRole(SCHEDULE_MANAGER, timelock)  = true
✓ Timelock.hasRole(PROPOSER, govSafe)   = true
✓ Timelock.hasRole(EXECUTOR, govSafe)   = true
✓ Timelock.hasRole(TIMELOCK_ADMIN, deployer) = false
✓ Timelock.getMinDelay()                = 172800
✓ All Phase 2 handoff checks passed
```

**Idempotency spot check** (Step 12): re-running
`transfer-admin-to-timelock.ts` against the now-handed-off Token correctly
throws `Signer 0xB722…fa1D does not hold DEFAULT_ADMIN_ROLE`, confirming
the script refuses to act after the deployer's authority has been revoked.

**Schedule-mint helper** (Step 11): `schedule-mint-via-timelock.ts` produced
the expected Safe Wallet calldata for a future mint of 5 CCM, with
operation id `0xddab83c7f2b2620c021ade6c25662e783da20c1dd43734aaf350f1eb10edeff7`
(salt label: `sepolia-rehearsal-2026-05-12`). Schedule data 324 bytes,
execute data 292 bytes — both readable by Safe Wallet's Contract
Interaction form.

**Cost**: ~0.00009 ETH per full rehearsal at Base Sepolia base fees
(~30M gas across ~15 txs at ~0.003 gwei). Round 1 + Round 2 combined
spent ~0.00018 ETH from the deployer's testnet float.

**Mainnet RPC recommendation** (reinforced): the two race conditions
observed in Round 1 were on the public `sepolia.base.org` endpoint.
With `tx.wait(2)` they no longer manifest, but mainnet should still use
a paid RPC (Alchemy / Infura) for both lower stale-state risk and
predictable gas estimation. The Phase 1 spec §5 already requires this;
do not relax it.

### Deployed contracts

See **Phase 1 — Mainnet** section below for real deployed addresses.

---

## Phase 1 — Mainnet (Base, deployed 2026-05-12)

> **Phase 1 deliberately uses an EOA admin / minter / pauser / treasury all on a single MetaMask EOA (no Safe / no Timelock / no hardware wallet).** This is an explicit risk acceptance for fast deployment; the migration path to (a) hardware wallet, (b) Safe + Timelock is fully scripted and Sepolia-rehearsed. See `docs/superpowers/specs/2026-05-11-ccm-mainnet-deploy-design.md` §9 and `docs/superpowers/specs/2026-05-12-ccm-phase2-timelock-migration-design.md` for the planned Phase 2 governance handoff.

### Network

| Item | Value |
|---|---|
| Chain | Base mainnet |
| Chain ID | `8453` |
| RPC | CDP (`https://api.developer.coinbase.com/rpc/v1/base/...`) |
| Explorer | https://basescan.org |
| Solidity | 0.8.24 (Cancun, optimizer 200 runs) |

### Deployer / Admin / Treasury (Phase 1, EOA-only)

| Item | Value |
|---|---|
| Deployer EOA (MetaMask) | `0xfcb1B5B833700E08714275E0DC321c534690E842` |
| Token admin / minter / pauser | same EOA |
| Vesting admin / schedule manager | same EOA |
| Treasury (holds 10M CCM) | same EOA |

### Deployed contracts

| Contract | Address | BaseScan |
|---|---|---|
| **CCMToken v1.0.0** | `0x398b2eB83C59890a01418b8D661e9A36a7c9d23d` | [verified](https://basescan.org/address/0x398b2eB83C59890a01418b8D661e9A36a7c9d23d#code) |
| **CCMVesting** | `0x019B68683a8c31f4A8295215D8Da7f8Ec95582dc` | [verified](https://basescan.org/address/0x019B68683a8c31f4A8295215D8Da7f8Ec95582dc#code) |

### Initial state (post-deploy snapshot)

CCMToken:
- `totalSupply`: 10,000,000 CCM
- `balanceOf(0xfcb1...E842)`: 10,000,000 CCM
- `cap - totalSupply`: 4,990,000,000 CCM (remaining headroom for future mints)
- `paused`: false
- Mint tx: `0x9820cd1942f06512f4d152fd4443a3ac5c9d1d26068ce912208ad93b434f260f` ([BaseScan](https://basescan.org/tx/0x9820cd1942f06512f4d152fd4443a3ac5c9d1d26068ce912208ad93b434f260f))

CCMVesting:
- `ccm`: `0x398b2eB83C59890a01418b8D661e9A36a7c9d23d` (linked)
- `getScheduleCount`: 0 (idle, available for future per-buyer SAFT schedules)

### Deferred to Phase 2

- Gnosis Safe 3-of-5 deployment
- CCMTimelock (48h) deployment + admin handoff
- Hardware wallet migration for admin and treasury
- External security audit (separate track via `docs/audit-rfp.md`)
- KYC Registry, TGE Sale, Staking, Migration contracts on mainnet

---

## Operations (Phase 0)

### SAFT investor onboarding procedure

For each KYC-approved investor:

```ts
// 1. Admin mints the investor's allocation to the Vesting contract
await token.mint("<vestingAddr>", amountInWei);

// 2. Admin creates the schedule (single or batch)
await vesting.createSchedule(
  investorAddr,    // beneficiary
  amountInWei,     // 18 decimals
  startTime,       // typically the sale-end timestamp
  cliffSeconds,    // e.g. 12 months = 31_536_000
  vestSeconds,     // e.g. 36 months = 94_608_000
  true             // revocable (so admin can redirect tokens for v2 migration)
);

// (or batch)
await vesting.createScheduleBatch(
  [a1, a2, a3], [amt1, amt2, amt3],
  startTime, cliffSeconds, vestSeconds, true
);
```

All admin txs go through the 48h Timelock; `mint` and `createSchedule`
calls are queued via the multisig and executed after the delay.

### Phase 1 migration preparation (only if audit requires v2)

If external audit identifies a critical issue requiring code change:
1. Deploy CCMTokenV2 with the audit fix
2. Deploy CCMMigration (`scripts/deploy-migration.ts`)
3. v2.grantRole(MINTER_ROLE, migrationAddr)
4. SAFT holders call `migrate()` → v1 burned + v2 minted
5. After 30-day deadline: migration.close() permanently
6. v2.revokeRole(MINTER_ROLE, migration)

If audit returns clean: skip this section entirely; v1 is canonical.

---

## Mainnet pre-deployment checklist (consolidated)

| Item | Status |
|---|---|
| External audit (Trail of Bits / OZ / Quantstamp) | ❌ scheduled after Phase 0 fundraise closes |
| Admin → Multisig (Gnosis Safe 3-of-5) | ⚠ Mainnet signers/threshold = policy decision (out-of-band). Base Sepolia rehearsal complete: 3-of-4 Safe v1.4.1 deployed at `0xCD2A…3108`, wired as sole proposer/executor on Timelock v2 (`0x1280…6362`); 3-sig EIP-712 schedule round-trip proven 2026-05-09. |
| Timelock (48h) | ✅ `CCMTimelock` implemented + tested (12/12 tests · 348/348 suite); Base Sepolia rehearsal complete (handoff proven end-to-end on 2026-05-09) |
| Bug bounty (Immunefi) | ⚠ Program scope drafted — see [`BUG_BOUNTY.md`](./BUG_BOUNTY.md) and [`SECURITY.md`](./SECURITY.md). $500K cap, KYC ≥$10K. Submission gated on mainnet deploy + vault funding. |
| KYC oracle integration | ✅ `CCMKYCRegistry` implemented + tested (22/22 tests · 370/370 suite); Base Sepolia rehearsal complete — operator (hot) / admin (timelock) role split working as designed |
| SAFT template + migration clause | ⚠ separate legal review needed |
| Holder registry (off-chain DB, portal D1) | ✅ `ccm-portal-db` D1 created (`dbd8f008-99a2-48cc-afac-6144fec3f29b`); migrations 0001+0002 applied; tables: `users`, `vesting_schedules`, `kyc_status`, `holder_snapshots`, `sync_runs`, `auth_nonces`, `sent_notifications`. Sync job + admin API ready (58/58 portal-api tests). Operational once `CCM_VESTING_ADDRESS` / `CCM_KYC_REGISTRY_ADDRESS` / `CCM_TOKEN_ADDRESS` are set in `wrangler.toml` post-mainnet-deploy. |

See [`SECURITY_REVIEW.md`](./SECURITY_REVIEW.md) for the full security
review (carried over from czero — must be re-run on CCM-renamed sources
before mainnet).

---

## Inheritance from czero

The contract source was forked from czero (CZM branding) with a
mechanical 1:1 rename on 2026-05-09. Nothing else changed. The czero
testnet deployment on Base Sepolia (chainId 84532, addresses recorded
in `czero/DEPLOYMENT.md`) remains as historical reference but is
unrelated to the CCM mainnet deploy that will occur here.

The migration contract (CCMMigration) was demonstrated end-to-end on
the czero testnet (1000 CZM swap, CEI pattern, 0 Slither warnings).
That validation transfers to CCM since only identifiers were renamed.

---

## Change log

| Date | Change |
|---|---|
| 2026-05-12 | **Phase 1 mainnet deploy executed.** CCMToken at `0x398b2eB83C59890a01418b8D661e9A36a7c9d23d`, CCMVesting at `0x019B68683a8c31f4A8295215D8Da7f8Ec95582dc`, 10M CCM minted to deployer EOA. EOA-only governance, HW wallet + Safe + Timelock migration deferred to Phase 2. |
| 2026-05-12 | Phase 1 + Phase 2 full-pipeline rehearsal completed on Base Sepolia (round 2 clean pass after `tx.wait(2)` fix at commit `593038f`); all 14 verifier assertions ✓; idempotency spot check ✓; schedule-mint calldata helper output validated. See section above. |
| 2026-05-09 | Forked from czero/contracts; mechanical CZM → CCM rename; awaiting compile + test re-run on renamed sources, then pre-deploy gating |
