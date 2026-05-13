# Next steps — 2026-05-10

**Author**: cogo0
**Status**: Living backlog — update as items move
**Last full e2e baseline**: 2026-05-10 (`scripts/e2e-all.sh` ✅)

Snapshot of work after the operator-console persona model and the
data + browser e2e suites have shipped. Items are grouped by area and
tagged with a status:

- **READY** — can pick up now, no blockers
- **DEFER** — could do now, intentionally held for a later coordinated push
- **BLOCKED** — waiting on an external dependency (audit, legal, vendor)
- **DECIDE** — needs a decision before work can start

---

## 1. Snapshot of what's already done (Phase 0)

For context — these no longer appear in the backlog.

- CCM Token v1, Vesting, KYC Registry, TGE Sale, Timelock — deployed Base mainnet + Base Sepolia.
- portal-api Worker — SIWE auth, audit log with notes column, full action allowlist (16 actions).
- 5 Cloudflare Pages — `ccm-site`, `ccm-portal` / `ccm-portal-testnet`, `ccm-testnet`, `ccm-admin` / `ccm-admin-testnet`.
- Operator console — Token / Presale / Vesting / KYC / Timelock pages, manual_transfer, audit log integration.
- 4-tier persona model (`super_admin` / `treasury` / `compliance` / `read_only`) with NAV filter, route guard, write CTA gating; CF Access on mainnet, dev switcher on testnet.
- `/e2e` test wallet route with auto-connecting wagmi connector (testnet only, build-guarded).
- Data-layer e2e (`onchain/scripts/_e2e-*.ts`) and browser-layer e2e (`admin/e2e/*.spec.ts`).
- Integrated runner `scripts/e2e-all.sh`.
- Legal page drafts (Terms, Privacy, Disclaimer) on `ccmnetwork.net`.
- Safe wallet detection + pending-tx queue badge.
- `.github/workflows/e2e.yml` drafted.

Docs covering each: `ccm-phase0-architecture.md`, `audit-rfp.md`,
`operator-console-access.md`, `e2e-testing.md`,
`site-revisions-2026-05.md`.

---

## 2. Security & audit

### 2.1 External smart-contract audit — BLOCKED on engagement

`audit-rfp.md` is the RFP. Once a vendor (Trail of Bits / OpenZeppelin /
Quantstamp / equivalent) is engaged and report drafted:

- Triage findings: **must-fix** (deploy CCMTokenV2 + CCMMigration) vs
  **may-fix** (patch in place) vs **acknowledge**.
- If V2 is needed: implement migration path (reuse czero pattern), test
  on Sepolia with all four wallet types (operator + alice + bob + carol),
  schedule mainnet migration via Timelock.
- Update the persona model's role-grant procedures if audit recommends
  changes (e.g. shorter Timelock for KYC ops, separate admins per
  contract).

**Acceptance**: audit report received, findings triage table written
into a new `docs/audit-findings-2026-XX.md`, fixes either deployed or
explicitly acknowledged in the doc.

### 2.2 Hardware wallet enforcement — DEFER until post-audit

Idea: detect Ledger/Trezor (via WalletConnect signer flags) and require
hardware-backed keys for `super_admin` and `treasury` personas. Soft-warn
on hot wallets.

**Why deferred**: audit may dictate where the hardware-only line should
sit (e.g. only DEFAULT_ADMIN_ROLE? all role grants? all writes above N
USD value?). Don't pre-empt the audit.

**Acceptance** when picked up: persona badge gains a 🔐 / ⚠ marker,
on-chain `MUST_USE_HW_WALLET` check fires for the configured personas,
docs updated.

### 2.3 Multisig (Safe) hardening — READY (low priority)

Current Safe integration is read-only (badge + pending-tx count).
Possible additions:
- Auto-detect when `super_admin` is connected with an EOA but the
  contract role is held by a Safe — show a "you should be using the
  Safe" hint.
- Pre-fill Safe transaction proposals from the operator console
  ("schedule via Timelock" button → opens Safe app with pre-encoded
  calldata).

**Trade-off**: nice-to-have, not blocking. ~1–2 days work.

---

## 3. Compliance & KYC

### 3.1 Real KYC provider integration — DECIDE

Currently KYC status is set manually via the operator console; the
"Sumsub applicantId / jurisdiction" string in audit notes is operator
free-text. Options:

| Approach | Pros | Cons |
|---|---|---|
| Sumsub webhook → portal-api → setKYCedBatch | Fully automated, audit-friendly | New webhook surface to maintain; vendor lock-in |
| Persona.com same shape | Same pros/cons; Korean compliance edges differ | Lacks Sumsub's local Korean ID coverage |
| Stay manual | Zero new infra | Doesn't scale past ~50 investors/month |

**Decision needed**: which provider, and whether to integrate now (Phase
0) or after Phase 2 TGE when investor volume picks up.

**Acceptance** once decided: webhook handler in portal-api, signed
verification of webhook payloads, audit row per status flip with
provider + applicantId in notes, KYC e2e gains a webhook-driven test.

### 3.2 Legal page review — READY

Drafts exist (`frontend/src/pages/Terms.tsx`, `Privacy.tsx`,
`Disclaimer.tsx`). Pending:

- Local Korean lawyer review (PIPA compliance, Korean-language
  versions if marketing to KR).
- ADGM / DIAC counsel review of arbitration clauses (currently
  placeholder).
- Replace clay "Draft notice" banner with effective-date banner.

**Acceptance**: each page has lawyer sign-off, banner updated, a
`docs/legal-review-2026-XX.md` records who reviewed what.

### 3.3 Foundation / legal entity — BLOCKED on counsel

ADGM Cat 4 license preferred per the Phase 0 architecture doc. Track
this as a separate workstream — not engineering work, but the audit
report and the foundation incorporation gate the same Phase 0.5 → 1
boundary.

---

## 4. Operations

### 4.1 Email notifications — READY

`portal-api/types.ts` already declares `NotificationKind = "cliff_7d" | "cliff_1d" | "claim_ready"`. Implementation pending:

- Cron Worker that scans active vesting schedules, computes upcoming
  cliff/release events, queues an email via Resend.
- Per-user opt-in in portal (`user_prefs.notif_prefs` JSON column —
  already in DB schema).
- Email templates matching the moss/clay brand.

**Acceptance**: 7 days before cliff, the beneficiary email gets a
single notification. Idempotent (no duplicate notifications across
cron runs).

### 4.2 Audit log retention & export — READY (small)

`admin_audit_log` is unbounded. Add:
- Monthly CSV export script (`onchain/scripts/_export-audit.ts` →
  `audit-log/YYYY-MM.csv`).
- Retention policy: keep all rows in D1 for 7 years (matches Privacy
  policy retention), CSV-archive older to R2.

**Acceptance**: a Cron job runs the export quarterly; the script is
idempotent and supports point-in-time queries for compliance asks.

### 4.3 Multi-operator onboarding — READY

The persona model supports it; the team just hasn't grown yet.
Operational pieces that come with adding the second operator:

- Per-operator on-chain role grants (Treasury → MINTER on Token,
  ADMIN on TGESale; Compliance → SCHEDULE_MANAGER on Vesting,
  KYC_OPERATOR via Timelock).
- CF Access policy update.
- `EMAIL_PERSONA_MAP` entry added + admin redeployed.

**Acceptance**: first non-founder operator successfully signs in,
performs an audited write, and shows up in `admin_audit_log` with the
correct persona context.

---

## 5. Dev infrastructure

### 5.1 GitHub Actions CI activation — DEFER (user-initiated)

Workflow at `.github/workflows/e2e.yml` is ready. Pending: populate
GitHub repo secrets and enable workflow_dispatch / push triggers. See
`e2e-testing.md` §7.

**Acceptance**: green run on `main`, `workflow_dispatch` flow tested,
slack/email notification on failure (optional).

### 5.2 Persona map → D1 migration — READY when team > 5

Currently `EMAIL_PERSONA_MAP` is hardcoded in `personas.ts`. When the
team grows past ~5 emails per persona, migrate to a `admin_persona_map`
table in `ccm-portal-db` with an admin-only UI page.

**Trade-off**: code-as-config is reviewable in PRs, easier to roll
back. D1 lets you change permissions without redeploy. Defer until the
ergonomic loss matters.

### 5.3 Browser e2e expansion — READY

Current coverage:
- persona NAV filter (9 tests)
- SIWE sign-in (1 test)
- KYC + role gating (4 tests)
- Vesting create flow (1 test, real on-chain tx)

Gaps worth filling, in rough priority order:

1. **Vesting full lifecycle** — create → cliff wait → partial release
   → revoke (revocable) → assert state at each phase. Reuses the
   compliance test wallet. ~1 spec file.
2. **Timelock browser flow** — schedule → wait `minDelay` → execute →
   audit log. Slow (real 2-minute wait or short-delay testnet
   contract). Worth doing once the workflow is high-traffic.
3. **TGE sale flow (manual)** — create round, whitelist, simulated
   buyer purchase. Best done after audit since round shape may change.
4. **Mobile viewport coverage** — Playwright `devices['Pixel 7']`
   project entry. Validates the responsive header (Persona / Safe / E2E
   badges stack correctly on narrow screens).

**Acceptance per item**: spec file added, full suite green via
`./scripts/e2e-all.sh`, baseline updated in `e2e-testing.md` §6.

### 5.4 Test-wallet preset env vars — READY (small)

Currently the `/e2e` page accepts a private key; there's no preset
button. Add `VITE_E2E_*_KEY` build-time env vars so testnet preview
deploys can offer "Use Compliance" / "Use Operator" preset buttons
without paste. Mainnet build still has none.

**Trade-off**: the keys end up in the testnet JS bundle. Acceptable
since they're testnet-only. ~1 day work.

---

## 6. Marketing & visibility — DEFER until "everything is ready"

User instruction (2026-05-10): *"SEO 및 SEO 관련 내용을 제외하자. 모든
것이 준비되었을 때, SEO 진행한다."* — defer all marketing-visibility
infrastructure until the coordinated launch push.

Items that will resume when SEO unfreezes:

- OpenGraph cards (per route) — Title + description + image (1200×630).
- Sitemap.xml + robots.txt.
- Schema.org JSON-LD (`Organization`, `Product` for $CCM, `WebSite`).
- Cloudflare Web Analytics enabled across all 5 Pages projects.
- Google Search Console verification + initial crawl request.
- Whitepaper / Pitch Deck PDF download buttons (already linked in
  `/whitepaper` route — verify cache/CDN headers).

**Trigger to unfreeze**: audit clean (or v2 deployed and migration
complete) + foundation incorporated + first round closed. At that
point we want indexable content.

---

## 7. Phase progression markers

These aren't "tasks" so much as gates. Recording for completeness.

| Phase | Trigger | Status |
|---|---|---|
| 0 | now | **active** — operator console, vesting, KYC, manual_transfer all working |
| 0.5 | private sale closes (initial costs covered) | engaged audit + foundation setup |
| 1 | audit complete | v1 if clean, else v2 + migration |
| 2 | foundation operational | public TGE seed + series A, mainnet dApp |
| 3 | post-TGE | DeFi composability primitives (whitepaper §8) |

Per `ccm-phase0-architecture.md`, Phase 0.5 unblocks both 2.1 (audit)
and 3.3 (foundation).

---

## 8. Open questions

These need a decision before the corresponding item can move forward.

| Question | Owner | Affects |
|---|---|---|
| Sumsub vs Persona vs stay-manual for KYC? | cogo0 | §3.1 |
| When to run external audit (cost vs timing)? | cogo0 + counsel | §2.1, §2.2 |
| KR-language site versions before or after audit? | cogo0 | §3.2 marketing |
| Persona D1 migration trigger (5 emails? 10? team event)? | cogo0 | §5.2 |
| Hardware-wallet enforcement scope (DEFAULT_ADMIN_ROLE only? all roles?) | post-audit | §2.2 |
