/**
 * E2E test: full SIWE auth → /api/me → logout flow against the production worker.
 * Uses an ephemeral wallet so we can DELETE the resulting users row at the end.
 */
import { Wallet } from "ethers";

const API = "https://ccm-portal-api.misterylee.workers.dev";

interface FetchOut {
  status: number;
  body: any;
  setCookie: string | null;
}

async function call(path: string, init: RequestInit = {}): Promise<FetchOut> {
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  return { status: res.status, body, setCookie: res.headers.get("set-cookie") };
}

function expect(label: string, cond: boolean, ctx?: any) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}`, ctx ?? "");
    process.exitCode = 1;
  }
}

async function main() {
  // Ephemeral wallet so the row can be cleaned up afterward.
  const wallet = Wallet.createRandom();
  console.log("Test wallet:", wallet.address);
  console.log();

  // 1. Anonymous /api/me must return 401
  console.log("Step 1 — anonymous GET /api/me");
  let r = await call("/api/me");
  expect("returns 401", r.status === 401, r);

  // 2. Anonymous /api/me/email POST must return 401
  console.log("\nStep 2 — anonymous POST /api/me/email");
  r = await call("/api/me/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "x@example.com" }),
  });
  expect("returns 401 (requireSession)", r.status === 401, r);

  // 3. /api/auth/logout always returns 200 + Set-Cookie clearing cookie
  console.log("\nStep 3 — POST /api/auth/logout (no cookie)");
  r = await call("/api/auth/logout", { method: "POST" });
  expect("returns 200", r.status === 200, r);
  expect("body is {ok:true}", r.body?.ok === true, r.body);
  expect("Set-Cookie present", !!r.setCookie, r.setCookie);
  expect("Set-Cookie clears siwe_session", /siwe_session=/.test(r.setCookie ?? ""), r.setCookie);
  expect("Max-Age=0 or Expires in past", /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(r.setCookie ?? ""), r.setCookie);
  expect("SameSite=None", /SameSite=None/i.test(r.setCookie ?? ""), r.setCookie);
  expect("Secure", /Secure/i.test(r.setCookie ?? ""), r.setCookie);
  expect("Path=/", /Path=\//i.test(r.setCookie ?? ""), r.setCookie);

  // 4. Full SIWE flow: nonce → sign → verify → cookie
  console.log("\nStep 4 — POST /api/auth/nonce");
  r = await call("/api/auth/nonce", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address: wallet.address }),
  });
  expect("returns 200", r.status === 200, r);
  expect("nonce is hex32", /^[a-f0-9]{32}$/.test(r.body?.nonce ?? ""), r.body);
  expect("message contains address", (r.body?.message ?? "").includes(wallet.address), r.body);
  const message: string = r.body.message;

  console.log("\nStep 5 — sign + POST /api/auth/verify");
  const signature = await wallet.signMessage(message);
  r = await call("/api/auth/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });
  expect("returns 200", r.status === 200, r);
  expect("body.address matches (lowercased)", r.body?.address === wallet.address.toLowerCase(), r.body);
  expect("Set-Cookie sets siwe_session", /siwe_session=.+/i.test(r.setCookie ?? ""), r.setCookie);

  // Extract just the cookie value for subsequent calls
  const cookieHeader = (r.setCookie ?? "").split(";")[0]; // "siwe_session=...."
  const verifyMaxAge = (r.setCookie ?? "").match(/Max-Age=(\d+)/i)?.[1];
  expect("Set-Cookie has positive Max-Age (=session ttl)", parseInt(verifyMaxAge ?? "0") > 0, verifyMaxAge);

  // 6. Authed /api/me works
  console.log("\nStep 6 — GET /api/me with session cookie");
  r = await call("/api/me", { headers: { cookie: cookieHeader } });
  expect("returns 200", r.status === 200, r);
  expect("body.address matches", r.body?.address === wallet.address.toLowerCase(), r.body);

  // 7. Authed logout: clears cookie
  console.log("\nStep 7 — POST /api/auth/logout (with session cookie)");
  r = await call("/api/auth/logout", { method: "POST", headers: { cookie: cookieHeader } });
  expect("returns 200", r.status === 200, r);
  expect("Set-Cookie clears siwe_session", /siwe_session=/.test(r.setCookie ?? "") &&
    /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(r.setCookie ?? ""), r.setCookie);

  // 8. Cleanup: delete the row from users table via wrangler (handled outside this script)
  console.log("\n--- All assertions complete ---");
  console.log("Cleanup: run");
  console.log(`  npx wrangler d1 execute ccm-portal-db --remote --command "DELETE FROM users WHERE address='${wallet.address.toLowerCase()}'"`);
}

main().catch((e) => { console.error(e); process.exit(1); });
