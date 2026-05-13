/**
 * Operator console persona model.
 *
 * Identity flows from Cloudflare Access (mainnet only — Zero Trust SSO
 * gate on admin.ccmnetwork.net). The Pages Function /api/me reads the
 * Cf-Access-Authenticated-User-Email header that CF Access injects into
 * origin requests and returns it to the SPA. We map that email to a
 * persona, then filter NAV + gate write actions in the UI.
 *
 * Defense layers:
 *   1. CF Access (gateway)       — only approved emails reach the site
 *   2. Persona-based UI          — irrelevant tabs hidden, write disabled
 *   3. portal-api SIWE audit log — every write is logged with wallet
 *   4. On-chain RBAC             — contract-level role enforcement
 *
 * NOTE: the persona map is hardcoded for Phase 0. Once the team grows
 * past ~5 emails per persona, move this to a D1 table with an admin UI
 * to manage assignments.
 */

export type Persona = "super_admin" | "treasury" | "compliance" | "read_only";

export const PERSONA_LABEL: Record<Persona, string> = {
  super_admin: "Super-admin",
  treasury: "Treasury",
  compliance: "Compliance",
  read_only: "Read-only",
};

export const PERSONA_DESC: Record<Persona, string> = {
  super_admin:
    "founder / DEFAULT_ADMIN_ROLE holder — sees and writes all pages. The bootstrap persona; over time, prefer delegating to treasury/compliance.",
  treasury:
    "moves money — Token (mint/transfer), TGE (rounds, USDC withdraw), Timelock (governance ops)",
  compliance:
    "daily compliance ops — KYC status, Vesting schedules. No funds movement.",
  read_only:
    "view-only access to all dashboards. Cannot write. For audit/observers.",
};

/**
 * Routes each persona can NAVIGATE to (sees in the NAV bar).
 * Read-only sees everything but can write nothing.
 */
export const PERSONA_ROUTES: Record<Persona, readonly string[]> = {
  super_admin: ["/", "/tge", "/vesting", "/kyc", "/timelock"],
  treasury: ["/", "/tge", "/timelock"],
  compliance: ["/vesting", "/kyc"],
  read_only: ["/", "/tge", "/vesting", "/kyc", "/timelock"],
};

/**
 * Routes each persona can WRITE to (CTAs enabled).
 * Read-only's set is empty.
 */
export const PERSONA_WRITES: Record<Persona, ReadonlySet<string>> = {
  super_admin: new Set(["/", "/tge", "/vesting", "/kyc", "/timelock"]),
  treasury: new Set(["/", "/tge", "/timelock"]),
  compliance: new Set(["/vesting", "/kyc"]),
  read_only: new Set(),
};

/**
 * Email → persona mapping.
 *
 * Lower-case keys; we lower-case the input before lookup.
 *
 * To add a teammate: add `"<email>": "<persona>"` here. CF Access also
 * needs to allow that email in the Application policy.
 */
export const EMAIL_PERSONA_MAP: Record<string, Persona> = {
  "cogo0@cogo.xyz": "super_admin",
  // add more as the team grows:
  //   "treasury-lead@cogo.xyz": "treasury",
  //   "compliance@cogo.xyz":    "compliance",
  //   "auditor@external.com":   "read_only",
};

/**
 * Default for emails that authenticated through CF Access but aren't in
 * the persona map. Defaulting to read_only is safe: CF Access already
 * decided they're approved to reach the site at all.
 */
export const DEFAULT_PERSONA: Persona = "read_only";

export function getPersonaForEmail(email: string | null | undefined): Persona {
  if (!email) return DEFAULT_PERSONA;
  return EMAIL_PERSONA_MAP[email.toLowerCase()] ?? DEFAULT_PERSONA;
}

export function canWriteRoute(persona: Persona, route: string): boolean {
  return PERSONA_WRITES[persona].has(route);
}

export function canViewRoute(persona: Persona, route: string): boolean {
  return PERSONA_ROUTES[persona].includes(route);
}

// localStorage key for testnet dev override (no CF Access there)
export const DEV_PERSONA_KEY = "ccm-admin-persona-override";
