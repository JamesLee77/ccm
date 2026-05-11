# CCM Token + Vesting Mainnet Deploy (Phase 1) — Design Spec

**Date**: 2026-05-11
**Status**: Draft for review
**Owner**: james.lee@finenex.net
**Network**: Base mainnet (chainId 8453)
**Scope**: Phase 1 minimal deploy — CCMToken + CCMVesting + initial 10M CCM treasury mint for OTC SAFT distribution.

---

## 1. Goal

Deploy the live CCM token to Base mainnet and seed a pre-sale treasury with 10,000,000 CCM (0.2% of 5B cap) for off-chain SAFT distribution to KYC-cleared buyers.

The deploy intentionally skips Phase 0 governance scaffolding (Gnosis Safe, Timelock) for speed. This is documented as **Phase 1** to make the trade-off explicit and to clarify the migration path to Phase 2.

## 2. Out of scope

- Gnosis Safe deployment for admin or treasury custody.
- CCMTimelock deployment and admin handoff.
- CCMTGESale, CCMStaking, CCMMigration, CCMKYCRegistry on mainnet.
- External security audit (separate track via `docs/audit-rfp.md`).
- On-chain vesting schedule creation for the 10M (vesting contract is deployed for future use only; the 10M sits in a treasury EOA and is distributed by SAFT contracts off-chain).

## 3. Architecture

```
Deployer EOA  ──mints──>  CCMToken  ──transfer──>  Treasury EOA  ──per-buyer transfer──>  KYC-cleared SAFT buyer
                            │
                            └─ admin role: Deployer EOA (Phase 1; migrates to Safe in Phase 2)

CCMVesting (deployed, idle in Phase 1)
  ├─ admin / SCHEDULE_MANAGER_ROLE: Deployer EOA
  └─ ccm: CCMToken address
```

Two roles, two EOAs:
- **Deployer EOA** holds `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE` on `CCMToken` and `DEFAULT_ADMIN_ROLE`, `SCHEDULE_MANAGER_ROLE` on `CCMVesting`.
- **Treasury EOA** holds the 10,000,000 CCM and signs SAFT distribution `transfer()` calls. No protocol roles.

Recommendation: Both EOAs should be hardware-wallet backed (Ledger / Trezor) — these keys protect ~$1.5–$2M of pre-sale value plus the entire token's mint/pause authority.

## 4. Contracts deployed

| Contract | Source | Constructor args | Initial roles |
|---|---|---|---|
| `CCMToken` | `onchain/contracts/CCMToken.sol` (v1.0.0, ERC20 + Capped 5B + Burnable + Pausable + Permit + AccessControl) | `admin = deployer EOA` | Deployer holds DEFAULT_ADMIN, MINTER, PAUSER |
| `CCMVesting` | `onchain/contracts/CCMVesting.sol` (linear vest + cliff, deposit-funded) | `ccm = CCMToken addr`, `admin = deployer EOA` | Deployer holds DEFAULT_ADMIN, SCHEDULE_MANAGER |

Both contracts are unchanged from the Base Sepolia sandbox deploys (CCMToken at `0x5641…CEFD`, CCMVesting at `0xc3E1…24C5`), already covered by 210 passing Hardhat unit tests.

## 5. Pre-deploy gating

Items that must be complete before running mainnet scripts:

1. **Slither static analysis re-run** on `CCMToken.sol` and `CCMVesting.sol` (per `DEPLOYMENT.md` gating list — verifies the CZM→CCM rename did not introduce regressions). Command: `cd onchain && slither contracts/CCMToken.sol contracts/CCMVesting.sol`. Any non-informational findings must be triaged.
2. **BaseScan API key** issued at https://basescan.org/myapikey and written to `onchain/.env` as `BASESCAN_API_KEY=...`.
3. **Mainnet RPC endpoint** configured. Public `https://mainnet.base.org` works but has occasional staleness; an Alchemy / Infura paid endpoint is preferred for deploy-day reliability. Set `BASE_MAINNET_RPC=...` in `.env`.
4. **Deployer EOA funded** with ~0.02 ETH on Base mainnet (covers 4 deploy + verify + mint transactions with comfortable gas margin).
5. **Treasury EOA address finalized** and recorded out-of-band. Recommended: hardware wallet, not yet used for any other activity (clean nonce 0).
6. **`.env` populated** with `PRIVATE_KEY` (deployer), `ADMIN_ADDRESS` (= deployer EOA — used as `CCMToken` admin arg), `BASESCAN_API_KEY`, `BASE_MAINNET_RPC`. The treasury address is passed inline at mint time, not via env.

The full Phase 0 gating items (external audit, Safe, Timelock) are explicitly deferred to Phase 2.

## 6. Deployment sequence

All commands run from `onchain/`. Each step's tx hash and contract address must be appended to `DEPLOYMENT.md` § "Phase 1 — Mainnet" (new section).

### Step 1 — Deploy CCMToken

```bash
ADMIN_ADDRESS=<deployer EOA> npx hardhat run scripts/deploy-token.ts --network base
```

Records: `<CCMTokenAddr>`, deploy tx hash.

### Step 2 — Deploy CCMVesting

```bash
CCM_TOKEN=<CCMTokenAddr> ADMIN_ADDRESS=<deployer EOA> \
  npx hardhat run scripts/_deploy-vesting-only.ts --network base
```

(`_deploy-vesting-only.ts` is the same script that successfully deployed Vesting on Sepolia after the `deploy-presale.ts` RPC stale-state issue noted in `DEPLOYMENT.md`. Reads `CCM_TOKEN` and `ADMIN_ADDRESS` from env.)

Records: `<CCMVestingAddr>`, deploy tx hash.

### Step 3 — BaseScan verification

```bash
npx hardhat verify --network base <CCMTokenAddr> <deployer EOA>
npx hardhat verify --network base <CCMVestingAddr> <CCMTokenAddr> <deployer EOA>
```

Records: BaseScan verified-source URLs for both contracts.

### Step 4 — Mint 10M CCM to Treasury

A new one-off script `scripts/mint-treasury-phase1.ts` is added that:
1. Reads `CCM_TOKEN` and `TREASURY_ADDRESS` from env (no hardcoded address — must be supplied per invocation). Uses `CCM_TOKEN` for consistency with `_deploy-vesting-only.ts`.
2. Asserts `network.chainId === 8453n` and prints a 10-second `await sleep` confirmation banner showing the amount and recipient.
3. Calls `token.mint(TREASURY_ADDRESS, 10_000_000n * 10n ** 18n)`.
4. Reads back `balanceOf(TREASURY_ADDRESS)` and `totalSupply()` and asserts both equal `10_000_000 * 10**18`.

Run:
```bash
CCM_TOKEN=<CCMTokenAddr> TREASURY_ADDRESS=<treasury EOA> \
  npx hardhat run scripts/mint-treasury-phase1.ts --network base
```

Records: mint tx hash, post-mint `totalSupply` and `balanceOf(treasury)`.

### Step 5 — Final verification (read-only)

A read-only script (or manual BaseScan checks) confirms:
- `CCMToken.totalSupply() == 10_000_000 * 10**18`
- `CCMToken.balanceOf(<treasury>) == 10_000_000 * 10**18`
- `CCMToken.cap() - totalSupply() == 4_990_000_000 * 10**18`
- `CCMToken.hasRole(DEFAULT_ADMIN_ROLE, <deployer>) == true`
- `CCMVesting.ccm() == <CCMTokenAddr>`
- `CCMVesting.getScheduleCount() == 0`

## 7. Post-deploy operations

- **OTC SAFT distribution**: Treasury EOA signs `CCMToken.transfer(<buyer>, <amount>)` per buyer as KYC clears. No protocol involvement.
- **Vesting standby**: `CCMVesting` is deployed but holds zero tokens. If/when a SAFT buyer requests on-chain enforcement, deployer transfers their allocation from Treasury to Vesting and calls `createSchedule(...)`.
- **Documentation**: Update `DEPLOYMENT.md` with addresses, tx hashes, BaseScan links, and a clear note that Phase 1 uses EOA admin/treasury (deferred Phase 0 gating items called out in the same section).

## 8. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Deployer EOA key compromised | Low (with HW wallet) | **Catastrophic** — attacker can mint up to 5B cap, pause transfers, drain treasury (treasury EOA also at risk if same key) | Hardware wallet; air-gapped key generation; treasury EOA strictly separate from deployer EOA |
| Treasury EOA key compromised | Low (with HW wallet) | **High** — attacker drains 10M CCM (~$1.5–2M at SAFT price) | Hardware wallet; restrict treasury usage to signed SAFT distributions only |
| Deployer EOA key lost | Low | **Permanent** — token is frozen (no future mint, no pause, no role recovery) | Encrypted backup of seed in geographically separate locations; documented recovery procedure |
| BaseScan verification fails | Low | Medium — investors cannot read source on explorer; reputational | Pre-tested on Sepolia (already verified); retry with `--force` flag; manual upload as fallback |
| Mint tx mined to wrong recipient (typo) | Low | **Catastrophic** — 10M minted to wrong address, cannot recover (only `recoverERC20` for non-self ERC-20s) | Script asserts chainId 8453, prints recipient address, sleeps 10 s before send; all addresses passed via env never hardcoded |
| Public 5B-cap visible on cap, market interprets as "5B inflation soon" | Medium | Low–Medium — narrative risk | IR / FAQ message: "5B is hard cap, not float; Phase 1 mint is 10M (0.2%), all future mints have 48h timelock starting Phase 2" |
| Deferred Safe/Timelock seen as "centralized" by exchanges or strategic investors | Medium | Medium — could block listings or large allocations | Public roadmap commits to Phase 2 (Safe + Timelock + audit) before public listing; Phase 1 explicitly framed as "internal SAFT only" |

## 9. Phase 2 migration path

This Phase 1 deploy is forward-compatible with the documented Phase 0 governance setup:

1. Deploy Gnosis Safe 3-of-5 (governance) and Safe 2-of-3 (treasury).
2. Deploy `CCMTimelock` (48h, Safe as proposer/executor).
3. Run `scripts/transfer-admin-to-timelock.ts` to hand `CCMToken` admin/minter/pauser to the Timelock.
4. Repeat for `CCMVesting` (grant admin to Timelock, renounce from deployer).
5. Treasury EOA transfers remaining balance to Treasury Safe; deployer renounces all roles.

The contracts themselves do not change. No migration of token holders or balances is required. The only on-chain change is role membership — handled by the existing rehearsed `transfer-admin-to-timelock.ts` flow (proven on Base Sepolia 2026-05-09).

## 10. Testing / dry-run

Before mainnet execution:

1. **Hardhat fork test** of Base mainnet — run `Step 1`–`Step 5` locally against a forked Base mainnet RPC (`hardhat.config.ts` already supports this via `--network hardhat` with fork URL set inline). Confirms gas estimates and that no Base-specific opcodes/precompiles surprise us.
2. **Sepolia rehearsal of new mint script** — `mint-treasury-phase1.ts` is new; run it on Sepolia against the rehearsal token (`0xB5e5…3999`) with 10 CCM (not 10M) to confirm the chainId guard, banner, and post-mint asserts work.
3. **Treasury address sanity**: send 0.001 ETH from deployer to treasury EOA on Base mainnet first as a "ping". Confirms the address is correct and the receiving wallet can sign before we mint $1.5M of tokens to it.

## 11. Documentation deliverables

- New section in `onchain/DEPLOYMENT.md`: "Phase 1 — Mainnet (Base, deployed YYYY-MM-DD)" with addresses, tx hashes, BaseScan links, and an explicit "Deferred to Phase 2" subsection listing what is intentionally not done.
- Update `docs/ccm-phase0-architecture.md` if needed to reflect the Phase 1 → Phase 2 split.
- Public-facing message (whitepaper / website) optionally updated to reflect the staged rollout.

## 12. Open questions

1. Treasury EOA address — must be supplied before deployment day. Confirm hardware wallet brand and seed-backup procedure.
2. Should `mint-treasury-phase1.ts` be parameterized for amount (defaulting to 10M) so it can also serve future mint operations? Recommend yes; cuts script duplication in Phase 2.
3. Does the team want a public announcement at the time of mint, or stay quiet until Phase 2 is ready? Affects timing of mint tx (e.g., Friday vs Monday).
