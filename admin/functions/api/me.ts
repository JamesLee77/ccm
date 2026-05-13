/**
 * Cloudflare Pages Function: returns the authenticated CF Access identity
 * to the SPA so it can map email → persona.
 *
 * On admin.ccmnetwork.net (mainnet) Cloudflare Access injects these
 * headers into every origin request, set from the JWT it issued after
 * SSO:
 *   Cf-Access-Authenticated-User-Email
 *   Cf-Access-Jwt-Assertion        (signed JWT with email + groups)
 *
 * We don't need to verify the JWT here — CF Access has already done that
 * at the edge before the request reaches the origin. The email header is
 * authoritative.
 *
 * On testnet (no CF Access), the header is absent and we return null;
 * the SPA falls back to a localStorage dev override.
 */

interface MeResponse {
  email: string | null;
  groups: string[];
  authenticated: boolean;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const email = request.headers.get("Cf-Access-Authenticated-User-Email");
  const groupsRaw = request.headers.get("Cf-Access-Authenticated-User-Groups");
  const groups = groupsRaw ? groupsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const body: MeResponse = {
    email: email ?? null,
    groups,
    authenticated: !!email,
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store, private",
    },
  });
};
