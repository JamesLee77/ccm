# Security policy

CCM Network takes the security of its smart contracts very seriously. We
welcome reports from independent security researchers. Please follow the
process below before publicly disclosing any vulnerability.

---

## Reporting a vulnerability

**Do NOT open a public GitHub issue.** Public disclosure of an unpatched
vulnerability puts every user at risk.

- **Preferred channel** — submit a report on Immunefi: `<immunefi-program-url-pending>` (program live after mainnet deploy).
- **Backup channel** — email `security@ccmnetwork.net` with PGP encryption (key fingerprint published below). Acknowledgement within **24 hours** on business days, **72 hours** otherwise.

When reporting, please include:

1. The contract(s) and address(es) affected (use mainnet address; testnet is out of scope, see below).
2. A clear description of the issue — root cause, attack path, impact.
3. A working proof-of-concept (preferably a Hardhat / Foundry test that triggers the bug against a forked Base mainnet snapshot).
4. Suggested mitigation, if you have one.
5. Your wallet address for the bounty payout (post-KYC for amounts ≥ $10K).

Please do **not**:

- Test on Base mainnet against real user funds.
- Use exploits to extract user funds, even to "prove" the bug — a Hardhat fork is sufficient.
- Demand payment outside the Immunefi process.

---

## Disclosure timeline

We follow standard coordinated-disclosure norms:

| Day | Event |
|---|---|
| 0 | Researcher submits report. |
| ≤ 1 (business) | We acknowledge receipt, assign a triager. |
| ≤ 14 | We confirm or refute the issue, scope severity, and propose a remediation timeline. |
| ≤ 90 | Patch deployed (or at most a 90-day extension agreed on, in writing). |
| Patch + 30 | Public post-mortem published; reporter credited (with consent). |

If we miss any of these windows on a confirmed issue, the researcher is
free to disclose publicly.

---

## Bug bounty program

Full program scope, rewards, and exclusions: [`BUG_BOUNTY.md`](./BUG_BOUNTY.md).

Top-level summary:

- **Maximum reward**: USD $500,000 (Critical, scaled by impact).
- **Hosted on**: Immunefi (program activates with mainnet deploy).
- **In-scope contracts**: `CCMToken`, `CCMVesting`, `CCMStaking`, `CCMTGESale`, `CCMMigration`, `CCMTimelock` — mainnet addresses only.
- **Out of scope**: testnet sandbox primitives (`CCMSandbox*`), the marketing/portal/testnet websites' frontend, infrastructure (Cloudflare/RPC), known issues already documented in [`SECURITY_REVIEW.md`](./SECURITY_REVIEW.md).
- **KYC**: required for payouts ≥ USD $10,000 (Immunefi default).

---

## Security practices

What's already in place before mainnet:

- **Static analysis**: Slither 0.11.5 — re-run on every PR; report in [`SECURITY_REVIEW.md`](./SECURITY_REVIEW.md).
- **Test coverage**: 348 tests passing on the current main branch (full suite, including `CCMTimelock` end-to-end handoff).
- **Admin handoff**: every privileged contract has its `DEFAULT_ADMIN_ROLE` and `PAUSER_ROLE` granted to a 48h `CCMTimelock` whose proposers/executors are a Gnosis Safe 3-of-5. Deployer EOA renounces all roles post-deploy. Proven end-to-end on Base Sepolia 2026-05-09 — see [`DEPLOYMENT.md`](./DEPLOYMENT.md#mainnet-pre-flight-rehearsal-base-sepolia--2026-05-09).
- **Non-upgradeable**: contracts are deployed without proxies. Bug fixes ship as a v2 deploy + opt-in `CCMMigration` (see Phase 1 plan in `DEPLOYMENT.md`); they cannot be silently mutated.
- **External audit**: scheduled with Trail of Bits / OpenZeppelin / Quantstamp after Phase 0 fundraise closes. Findings will be addressed pre-mainnet (or, if discovered post-mainnet, via the v2/migration path).

---

## Out-of-scope (not eligible for bounty)

The following are explicitly excluded — please do not report them:

- Testnet contracts (`CCMSandbox*`, the rehearsal `CCMToken` at `0xB5e5…3999`, the rehearsal `CCMTimelock` at `0x3EbA…d979` — these exist purely to rehearse the mainnet handoff and have no economic value).
- Anything that requires the deployer EOA's private key to be already compromised.
- Anything that requires the Gnosis Safe 3-of-5 to be already compromised (collusion attacks).
- Frontend issues: typos, broken links, layout glitches, console errors. These belong on the public GitHub issue tracker.
- Self-XSS that requires the user to paste arbitrary code into their own DevTools console.
- DDoS / volumetric attacks against RPC nodes or hosting — that's an infra issue, not a contract issue.
- Centralization risks that are documented in `DEPLOYMENT.md` (e.g., the multisig has admin powers — yes, that's the design).
- Slither findings already disclosed in [`SECURITY_REVIEW.md`](./SECURITY_REVIEW.md) (the M-01/M-02/M-03 carryovers and L-* timestamp findings).
- Theoretical issues with no demonstrated impact path on the deployed code.

---

## PGP key for `security@ccmnetwork.net`

_Public key will be published here once mainnet deploys; until then please use Immunefi or open a low-detail issue asking for a secure channel._

---

## Acknowledgements

We will publicly thank researchers who report verified issues (with their
consent) in a hall of fame on the public site, after the corresponding
patch has been deployed. Anonymous credits are available on request.
