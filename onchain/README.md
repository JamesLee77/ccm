# CCM Network Smart Contracts

Solidity smart contracts for the CCM Network Token (`$CCM`) ecosystem, plus a React investor portal.

## Repository layout

| Path | Purpose |
|---|---|
| `contracts/` | CCMToken, CCMVesting, CCMStaking, CCMTGESale, CCMMigration |
| `contracts/mocks/` | Test-only mocks (MockUSDC, MockPriceOracle, ReentrantToken) |
| `scripts/` | Deploy and simulation scripts |
| `test/` | Hardhat unit + requirements + integration tests (160+ cases) |
| `frontend/` | Vite 8 + wagmi + RainbowKit investor portal |
| `CCM_Token_Design.md` | Token design specification |
| `CCM_Business_Model_and_Requirements.md` | Business model + functional/non-functional requirements |
| `SECURITY_REVIEW.md` | Slither + manual security review report |
| `DEPLOYMENT.md` | Deployment record (addresses, tx hashes, simulations) |

## Solidity files

| File | Role |
|---|---|
| `contracts/CCMToken.sol` | ERC-20 main token (5B hard cap, Burnable/Pausable/Permit) |
| `contracts/CCMVesting.sol` | Linear vesting with cliff (Foundation / Partners / Strategic, etc.) |
| `contracts/CCMStaking.sol` | Price-elastic yield staking pool (200M cap, auto sunset) |
| `contracts/CCMTGESale.sol` | Multi-tier TGE sale (Seed $0.15 + Series A $0.20) |
| `contracts/CCMMigration.sol` | v1 → v2 token swap (1:1 or with bonus) |

## Dependencies

```bash
npm install
```

OpenZeppelin v5.0+ is required (`ERC20Capped`, `ERC20Pausable`, `ERC20Permit`, `AccessControl`).

## Compile

```bash
npx hardhat compile
```

Solidity `^0.8.20` (Cancun EVM compatible).

## Test

```bash
npx hardhat test            # 160+ tests
npx hardhat coverage        # statements 100%, branches 92%+
```

## Recommended test coverage

| Item | Contract | Description |
|---|---|---|
| Hard cap | CCMToken | mint above 5B reverts |
| Pause / unpause | CCMToken | transfer blocked while paused |
| Vesting cliff | CCMVesting | release = 0 before cliff |
| Vesting linear | CCMVesting | release proportional to time after cliff |
| Vesting revoke | CCMVesting | vested portion paid + remainder returned |
| Yield rate cap | CCMStaking | yield = 10% (cap) when price ≤ TGE |
| Yield rate decay | CCMStaking | price 2× → yield halves |
| Pool exhaustion | CCMStaking | yield = 0 when pool drained |
| Eligibility | CCMStaking | non-whitelisted stake() reverts |
| TGE round | CCMTGESale | Seed/Series A run together, hardcap respected |
| TGE claim | CCMTGESale | vest-proportional claim after cliff |
| Migration | CCMMigration | v1 burned + v2 minted 1:1 |

## Deploy scripts

| Script | Purpose |
|---|---|
| `scripts/deploy-token.ts` | Token only (off-chain SAFT pre-sale) |
| `scripts/deploy-presale.ts` | Token + Vesting (on-chain lockup, recommended) |
| `scripts/deploy-migration.ts` | Migration (Phase 2 v1 → v2) |
| `scripts/deploy.ts` | Full system (Token + Vesting + Staking + TGESale) |
| `scripts/simulate-presale.ts` | Re-runnable pre-sale flow simulation |
| `scripts/simulate-migration.ts` | Re-runnable v1 → v2 migration simulation |

```bash
# Configure environment
export ADMIN_ADDRESS=0x...                # multisig address
export USDC_ADDRESS=0x833589fCD6...        # Base USDC
export PRICE_ORACLE_ADDRESS=0x...          # price oracle

# Deploy to testnet first
npm run deploy:presale:sepolia

# Then mainnet after verification
npm run deploy:presale:mainnet

# Verify on BaseScan
npx hardhat verify --network base <ADDRESS> <CONSTRUCTOR_ARGS>
```

## Security recommendations

1. **External audit required** — at least one of Trail of Bits / OpenZeppelin / Quantstamp before TGE
2. **Multisig admin** — all admin roles assigned to a 3-of-5 Gnosis Safe
3. **Timelock** — admin actions go through a 48-hour timelock
4. **Bug bounty** — register on Immunefi after TGE (max reward $500K)
5. **Upgrade policy** — every contract is `non-upgradeable` (user trust first); ship the next version as a new contract via `CCMMigration`

## License

MIT License — anyone may use, copy, modify, and redistribute.
