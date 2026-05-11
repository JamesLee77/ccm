# CCM Network bug bounty program

> Copy-pastable scope document for the Immunefi program. Sections map 1:1
> to the Immunefi onboarding form. Where this doc says `<pending>`, fill
> in the value at submission time.

**Status (2026-05-09)**: program drafted, awaiting mainnet deploy + Immunefi vault funding before going live.

---

## Program overview

| Field | Value |
|---|---|
| Project name | CCM Network |
| Project URL | https://ccmnetwork.net |
| Whitepaper | https://ccmnetwork.net/whitepaper |
| Maximum reward (USD) | **$500,000** |
| Currency of payout | USDC on Base mainnet (or other ERC-20 stable on request, settled at TWAP) |
| Hosted on | Immunefi |
| Program type | Public, always-on (no time-limited campaigns) |
| KYC required | For payouts ≥ $10,000 (Immunefi default) |
| Vault address | `<pending — funded post-mainnet-deploy>` |

---

## Assets in scope

All addresses below are placeholders that will be filled in at mainnet
deploy. Until those mainnet addresses exist, **no contract is in scope**
— testnet rehearsal contracts are explicitly excluded (see Out of scope).

| Contract | Mainnet address (Base 8453) | Source |
|---|---|---|
| `CCMToken` | `<pending>` | [contracts/CCMToken.sol](./contracts/CCMToken.sol) |
| `CCMVesting` | `<pending>` | [contracts/CCMVesting.sol](./contracts/CCMVesting.sol) |
| `CCMStaking` | `<pending>` | [contracts/CCMStaking.sol](./contracts/CCMStaking.sol) |
| `CCMTGESale` | `<pending>` | [contracts/CCMTGESale.sol](./contracts/CCMTGESale.sol) |
| `CCMMigration` | `<pending — only deployed if a v2 fix is required by audit>` | [contracts/CCMMigration.sol](./contracts/CCMMigration.sol) |
| `CCMTimelock` | `<pending>` | [contracts/CCMTimelock.sol](./contracts/CCMTimelock.sol) |

Source on GitHub: `<pending — public repo URL after open-sourcing>`.

Compiler: `solc 0.8.24`, optimizer 200 runs, evmVersion `cancun`. The
mainnet bytecode is reproducible from the tagged release commit.

---

## Impacts in scope

We follow the [Immunefi Vulnerability Severity Classification System v2.3](https://immunefi.com/severity-system/) for smart contracts, with the following project-specific calibration:

### Critical · USD $100,000 – $500,000 (scaled by impact)

A vulnerability that, if exploited, would result in any of:

- Direct theft of any user funds (CCM, USDC held by `CCMTGESale`, NFT custody on the mainnet vaults), whether at-rest or in-motion, beyond unclaimable yield/airdrops.
- Permanent freezing of user funds (e.g., bricking `CCMVesting` such that a beneficiary can never `release()` their unlocked allocation).
- Insolvency of the protocol — minting CCM beyond the `cap` (5,000,000,000 with 18 decimals), or any path that bypasses the `MINTER_ROLE` check.
- Theft or destruction of governance — any path that lets a non-Safe / non-Timelock address grant or revoke roles, or execute timelocked operations without the 48 h delay.
- Bricking the `CCMTimelock` itself such that no scheduled operation can ever execute.

Critical reward is scaled linearly within the band based on the dollar
value of funds at risk in the realistic exploit scenario (not theoretical
maximum).

### High · USD $25,000 – $100,000

- Theft of unclaimed yield, rebates, or rewards beyond a one-cycle window.
- Temporary freezing of user funds (≤ 30 days, recoverable by admin action).
- Griefing that causes individual users to permanently lose access to a *single* operation (e.g., a stuck vesting schedule that requires admin re-creation).
- Smart contract becoming unable to operate due to lack of token funds (where the token shortage is itself caused by the bug, not by external market dynamics).

### Medium · USD $5,000 – $25,000

- Smart contract unable to operate on a non-critical path (e.g., one of the `CCMVesting` view functions reverting under specific input).
- Block-stuffing or gas-exhaustion attacks that materially raise costs for legitimate users on the mainnet contracts.
- Theoretical paths to fund loss that require strong assumptions about block ordering, MEV, or admin misbehavior.

### Low · USD $1,000 – $5,000

- Contract fails on edge-case inputs that a reasonable user wouldn't hit, but the failure mode is recoverable.
- Inflated minting / accounting drift (bounded, recoverable).
- Off-by-one or rounding errors with no exploitable economic impact.

### Informational · acknowledgement only

- Code-quality issues, gas optimisation suggestions, missing NatSpec, naming conventions. Slither / Solhint-style findings.
- Already-disclosed findings from `SECURITY_REVIEW.md`. (Please cross-check before submitting.)

---

## Reward calculation

For Critical and High, the reward scales with the **realistic dollar value at risk** under a plausible exploit path:

```
reward = max(min_band, min(max_band, value_at_risk * 0.10))
```

where `value_at_risk` is computed from the mainnet on-chain TVL at the
moment of submission. Rounding is at the program's discretion in the
upper half of each band.

For Medium and Low, the reward is fixed within the band based on the
clarity of the report and the demonstrated impact.

---

## Out of scope

### Out-of-scope contracts

- All `CCMSandbox*` contracts on Base Sepolia (84532). These are
  intentional sandbox primitives, not production code.
- The rehearsal `CCMToken` at `0xB5e54084eEFcc4ddc93F3A6AA7A6Dea501FB3999`
  and rehearsal `CCMTimelock` at
  `0x3EbA7887525f1E68dc946760a96B01d1E1a1d979` (both Base Sepolia).
- Mocks (`MockUSDC`, `MockPriceOracle`, `ReentrantToken`).
- Any contract on a non-Base chain.

### Out-of-scope impact classes

- Issues that require the **Gnosis Safe 3-of-5 to be already compromised** (collusion attacks, social-engineering of signers).
- Issues that require the **deployer EOA to be already compromised** (after the post-deploy renounce sequence completes, the EOA holds no privileged role anyway).
- **Centralisation issues** that are documented in `DEPLOYMENT.md` — e.g., the Safe + Timelock can pause the token. Yes, that's the design; the 48 h Timelock + Multisig combination is the entire mitigation strategy.
- **Front-end / web vulnerabilities** on `ccmnetwork.net`, `portal.ccmnetwork.net`, `testnet.ccmnetwork.net`, `app.ccmnetwork.net` (when launched). Use the public GitHub issue tracker.
- **Infrastructure**: Cloudflare misconfig, RPC rate-limits, BaseScan availability, faucet abuse.
- **Phishing / impersonation** of CCM Network on third-party sites — report to the relevant platform, not us.
- **DDoS** / volumetric attacks.
- **Self-XSS** that requires the user to paste code into their DevTools console.
- **Already-disclosed findings** in `SECURITY_REVIEW.md` (the M-01/M-02/M-03 carryovers from Slither and the L-* `timestamp` findings).
- **Theoretical issues** without a demonstrated impact path on the deployed mainnet bytecode.
- **Best-practice violations** with no exploitable consequence (missing event emissions, suboptimal storage layout, etc.).
- **Compiler bugs** that are publicly known. (Novel compiler bugs *are* in scope, but report to the Solidity team in parallel.)

### Prohibited testing methods

The following will void any potential bounty and may result in legal action:

- Testing exploits on Base mainnet against real user funds. **Use a Hardhat fork.**
- Public disclosure before the agreed embargo expires.
- Demanding payment off-program.
- Threatening to release a vulnerability publicly to coerce a payout.
- Phishing or social-engineering CCM Network team members.
- Attacking infrastructure that is not a smart contract (frontends, RPC nodes, Cloudflare, etc.).

---

## Submission requirements

A valid submission must include:

1. **Affected contract** (mainnet address + source file).
2. **Severity self-assessment** with reasoning.
3. **Step-by-step reproduction** — a working test case that runs against a Base mainnet fork. We provide a starter Hardhat fork harness on request.
4. **Impact analysis** — realistic dollar value at risk.
5. **Suggested mitigation** (optional but appreciated; affects reward in the upper half of the band).
6. **Wallet address** for payout (Base mainnet). KYC is required before payout for amounts ≥ $10,000 — Immunefi runs the KYC flow.

Submissions that do not include a working PoC will be triaged but cannot
be paid out at full severity until the PoC is provided.

---

## Triage and payout SLA

| Stage | Target SLA |
|---|---|
| Acknowledge receipt | 1 business day |
| Triage decision (in scope / valid / severity) | 14 days |
| Patch deployed | 90 days |
| Bounty paid | 30 days after patch + KYC clearance |

If we miss any of these windows on a confirmed issue, the researcher is
free to disclose publicly per `SECURITY.md`.

---

## Submission runbook (operator-side)

For the CCM team — what to do when activating the program:

- [ ] Mainnet deploy of all in-scope contracts complete.
- [ ] Mainnet addresses populated above (replace every `<pending>`).
- [ ] Immunefi account created at https://immunefi.com (must be linked to a controlled email + 2FA).
- [ ] Vault funded with ≥ $500,000 USDC on Immunefi's escrow chain (Immunefi will provide the deposit address).
- [ ] Program form submitted at https://immunefi.com/explore/submit-project — paste the entries from this file into the matching fields.
- [ ] Once Immunefi reviews and approves (typical 5–10 business days), the program goes live.
- [ ] Update `<immunefi-program-url-pending>` in `SECURITY.md` and the marketing site (`/security` page).
- [ ] Flip `DEPLOYMENT.md` checklist row from drafted to live.
- [ ] PGP key for `security@ccmnetwork.net` published on `SECURITY.md`.

---

## Changelog

| Date | Change |
|---|---|
| 2026-05-09 | Initial draft. Program scope, rewards, exclusions defined. Awaiting mainnet deploy + Immunefi vault funding. |
