# Operator console — access control

**Date**: 2026-05-10
**Status**: Implemented (testnet + mainnet)
**Surfaces**: `admin.ccmnetwork.net` (mainnet), `admin-testnet.ccmnetwork.net` (testnet)

This document is the source of truth for **who can do what on the operator
console**. It covers the four defense layers, the four-tier persona model,
how to onboard a new team member, and the testnet test-wallet escape
hatch used by browser e2e automation.

Companion doc: `e2e-testing.md` — how the persona model is verified.

---

## 1. Defense layers (four lines)

The operator console is gated at four independent layers. Defeating one
does not defeat the others.

| # | Layer | Where | Purpose |
|---|---|---|---|
| 1 | **Cloudflare Access** | `admin.ccmnetwork.net/*` | Only approved emails reach the site at all (Zero Trust SSO). Mainnet only — testnet is open by design. |
| 2 | **Persona-based UI** | SPA (`admin/src`) | Hides irrelevant tabs, disables write CTAs, and renders a "No access" page for direct URL entry to forbidden routes. Read from CF Access email header on mainnet, from a localStorage dev override on testnet. |
| 3 | **portal-api SIWE audit log** | Cloudflare Worker | Every write action is recorded as an `admin_audit_log` row keyed to a SIWE-signed wallet. Append-only ledger with notes column for compliance traceability. |
| 4 | **On-chain RBAC** | OpenZeppelin AccessControl | Contract-level role checks (`MINTER_ROLE`, `KYC_OPERATOR_ROLE`, `SCHEDULE_MANAGER_ROLE`, etc.). Final defense — even if all UI gates are bypassed, the chain rejects unauthorized writes. |

The persona model (layer 2) is **not** a security boundary — it's a UX
filter to prevent accidental misuse. Layers 1 and 4 are the real
boundaries; layer 2 makes the right action obvious and the wrong action
hard to reach.

---

## 2. Four-tier persona model

Code: `admin/src/lib/personas.ts`

| Persona | Pages it sees | Can write to | Typical holder |
|---|---|---|---|
| `super_admin` | all 5 | all 5 | founder / `DEFAULT_ADMIN_ROLE` holder. Bootstrap persona — over time, prefer delegating to treasury / compliance. |
| `treasury` | Token, Presale, Timelock | Token, Presale, Timelock | money-moving operations: mint, transfer, withdraw_usdc, role grants, governance ops. 2–3 people, normally a Safe multisig. |
| `compliance` | Vesting, KYC | Vesting, KYC | daily compliance ops — flipping KYC status, creating SAFT vesting schedules. **No funds movement.** |
| `read_only` | all 5 | none | view-only access for audit / observers. Banner at top of every page; CTAs disabled. |

### Visual cues

The `PersonaBadge` in the header shows the active persona with a
distinguishing color: `super_admin` ink, `treasury` clay, `compliance`
moss, `read_only` muted. Read-only also shows a clay banner at the top of
every page explaining the restriction.

### Route guard

Direct URL navigation to a hidden route (e.g. compliance → `/`) renders
a "No access" guard page in `admin/src/components/Layout.tsx`. The page
explains the persona's allowed routes and links back to the first
visible tab.

---

## 3. Identity → persona

### Mainnet: Cloudflare Access email

CF Access stamps `Cf-Access-Authenticated-User-Email` onto every origin
request. The Pages Function `admin/functions/api/me.ts` reads it and
returns it to the SPA. The `usePersona` hook (`admin/src/lib/usePersona.ts`)
maps the email to a persona using the table in
`admin/src/lib/personas.ts`:

```ts
export const EMAIL_PERSONA_MAP: Record<string, Persona> = {
  "cogo0@cogo.xyz": "super_admin",
  // add more as the team grows
};
```

Emails not in the map fall through to `DEFAULT_PERSONA = "read_only"`.
This is safe because CF Access has already decided they're approved to
reach the site at all.

### Testnet: localStorage dev override

`admin-testnet.ccmnetwork.net` has no CF Access. The `PersonaBadge` in
the header acts as a dropdown switcher; selecting a persona writes to
`localStorage.ccm-admin-persona-override` and reloads. Default is
`super_admin` so dev parity isn't broken.

The same dropdown is used by Playwright tests (see `e2e-testing.md`) —
no production identity is involved.

---

## 4. Onboarding a new operator

### Step 1 — assign the on-chain role

Whatever the persona, the operator's wallet still needs the actual
contract role for write actions to succeed. Roles and their admins:

| Persona | On-chain roles needed | Role admin (who grants) |
|---|---|---|
| Treasury | `MINTER_ROLE` (Token), `ADMIN_ROLE` (TGESale), `PROPOSER_ROLE`/`EXECUTOR_ROLE`/`CANCELLER_ROLE` (Timelock) | `DEFAULT_ADMIN_ROLE` holder of each — currently the Timelock for sensitive contracts |
| Compliance | `KYC_OPERATOR_ROLE` (KYCRegistry), `SCHEDULE_MANAGER_ROLE` (Vesting) | KYCRegistry: Timelock (48h) · Vesting: deployer |
| Read-only | none | — |

For testnet, the Vesting `DEFAULT_ADMIN_ROLE` is held by the deployer
operator wallet, so role grants are immediate. For mainnet and for KYC
on testnet, role grants must go through the 48h Timelock.

### Step 2 — add the email to the persona map

Edit `admin/src/lib/personas.ts`:

```ts
export const EMAIL_PERSONA_MAP: Record<string, Persona> = {
  "cogo0@cogo.xyz":         "super_admin",
  "treasury-lead@cogo.xyz": "treasury",      // ← new
  "compliance@cogo.xyz":    "compliance",    // ← new
  "auditor@external.com":   "read_only",     // ← new
};
```

Build + deploy admin (both testnet and mainnet for parity):

```bash
cd admin
VITE_ENV=testnet npm run build && \
  npx wrangler pages deploy dist --project-name=ccm-admin-testnet --branch=main
VITE_ENV=mainnet npm run build && \
  npx wrangler pages deploy dist --project-name=ccm-admin --branch=main
```

### Step 3 — add the email to the Cloudflare Access policy (mainnet only)

Cloudflare Zero Trust dashboard → Access → Applications →
`admin.ccmnetwork.net` → Edit policy → Include rule → add the email.
Without this step the operator can't even reach the site.

### Step 4 — verify

The new operator opens `admin.ccmnetwork.net`, completes SSO, and
should see only the tabs their persona allows. The `PersonaBadge` in
the header shows the persona label and email prefix.

---

## 5. Removing or changing access

| Goal | What to change |
|---|---|
| Demote operator (e.g. treasury → read_only) | Update `EMAIL_PERSONA_MAP` in `personas.ts`, redeploy admin. Their on-chain roles are unchanged — to fully revoke, also call `revokeRole` via Timelock. |
| Remove operator entirely | Delete the email from `EMAIL_PERSONA_MAP` (they fall through to `read_only`), remove from CF Access policy, schedule `revokeRole` via Timelock for any on-chain roles they hold. |
| Audit who has what role | Read `admin_audit_log` table for historical writes, run `getRoleMember` view calls on each contract for current state. |

---

## 6. Why not store the persona map in a database?

For Phase 0 the persona map is hardcoded in `personas.ts`. Once the team
grows past ~5 emails per persona, migrate to a D1 table with an admin UI
(`admin_persona_map`). Current trade-off: code-as-config is reviewable
in PRs, easier to roll back, and survives a D1 outage. The downside —
"add a teammate" becomes a redeploy — is acceptable while the team is
small and changes are infrequent.
