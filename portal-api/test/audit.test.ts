import { env, SELF, applyD1Migrations } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

beforeEach(async () => {
  const migrations = JSON.parse((env as any).TEST_MIGRATIONS);
  await applyD1Migrations(env.DB, migrations);
});

async function siweSignIn(account: ReturnType<typeof privateKeyToAccount>, app: "portal" | "admin" = "admin") {
  // Get nonce + message
  const origin = app === "admin" ? "https://admin.ccmnetwork.net" : (env as any).ALLOWED_ORIGIN;
  const chainId = app === "admin" ? 84532 : 8453;
  const nonceRes = await SELF.fetch("http://localhost/api/auth/nonce", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ address: account.address, app, chainId }),
  });
  expect(nonceRes.status).toBe(200);
  const { message } = (await nonceRes.json()) as { message: string; nonce: string };

  const signature = await account.signMessage({ message });

  const verifyRes = await SELF.fetch("http://localhost/api/auth/verify", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ message, signature }),
  });
  expect(verifyRes.status).toBe(200);
  const body = (await verifyRes.json()) as { address: string; token: string; exp: number };
  expect(body.token).toBeTruthy();
  return body;
}

describe("audit log", () => {
  it("rejects without session", async () => {
    const r = await SELF.fetch("http://localhost/api/me/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chain_id: 84532,
        action: "mint",
        target_contract: "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD",
      }),
    });
    expect(r.status).toBe(401);
  });

  it("posts a pending audit entry with Authorization Bearer (admin path)", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const session = await siweSignIn(account, "admin");

    const r = await SELF.fetch("http://localhost/api/me/audit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        chain_id: 84532,
        action: "mint",
        target_contract: "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD",
        target_address: "0x1111111111111111111111111111111111111111",
        amount_wei: "1000000000000000000000",
        status: "pending",
      }),
    });
    expect(r.status).toBe(200);
    const body = (await r.json()) as { id: number; wallet: string; status: string };
    expect(body.id).toBeGreaterThan(0);
    expect(body.wallet).toBe(account.address.toLowerCase());
    expect(body.status).toBe("pending");
  });

  it("rejects invalid action", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const session = await siweSignIn(account, "admin");
    const r = await SELF.fetch("http://localhost/api/me/audit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        chain_id: 84532,
        action: "drain_treasury",
        target_contract: "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD",
      }),
    });
    expect(r.status).toBe(400);
  });

  it("PATCH updates tx_hash + status of own row", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const session = await siweSignIn(account, "admin");
    const post = await SELF.fetch("http://localhost/api/me/audit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        chain_id: 84532,
        action: "transfer",
        target_contract: "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD",
        target_address: "0x1111111111111111111111111111111111111111",
        amount_wei: "100",
        status: "pending",
      }),
    });
    const { id } = (await post.json()) as { id: number };

    const fakeHash = "0x" + "ab".repeat(32);
    const patch = await SELF.fetch(`http://localhost/api/me/audit/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ tx_hash: fakeHash, status: "submitted" }),
    });
    expect(patch.status).toBe(200);
  });

  it("PATCH rejects updates to other users' rows", async () => {
    const alice = privateKeyToAccount(generatePrivateKey());
    const bob = privateKeyToAccount(generatePrivateKey());
    const aliceSess = await siweSignIn(alice, "admin");
    const bobSess = await siweSignIn(bob, "admin");

    // Alice creates a row
    const post = await SELF.fetch("http://localhost/api/me/audit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${aliceSess.token}`,
      },
      body: JSON.stringify({
        chain_id: 84532,
        action: "pause",
        target_contract: "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD",
        status: "pending",
      }),
    });
    const { id } = (await post.json()) as { id: number };

    // Bob tries to PATCH it — must 404
    const patch = await SELF.fetch(`http://localhost/api/me/audit/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${bobSess.token}`,
      },
      body: JSON.stringify({ status: "confirmed" }),
    });
    expect(patch.status).toBe(404);
  });

  it("GET lists own rows in desc order", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const session = await siweSignIn(account, "admin");
    for (const action of ["pause", "unpause", "mint"]) {
      await SELF.fetch("http://localhost/api/me/audit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          chain_id: 84532,
          action,
          target_contract: "0x5641d6A2a6AD2B835b37489c72D2Bd716903CEFD",
          status: "pending",
        }),
      });
    }
    const list = await SELF.fetch("http://localhost/api/me/audit", {
      headers: { authorization: `Bearer ${session.token}` },
    });
    expect(list.status).toBe(200);
    const body = (await list.json()) as { rows: { action: string }[] };
    expect(body.rows).toHaveLength(3);
    expect(body.rows[0].action).toBe("mint"); // most recent
    expect(body.rows[2].action).toBe("pause"); // oldest
  });
});

describe("auth — admin SIWE flow", () => {
  it("rejects nonce request from unknown admin origin", async () => {
    const r = await SELF.fetch("http://localhost/api/auth/nonce", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://evil.example" },
      body: JSON.stringify({
        address: "0x048f42B850cC126468EE112852b6aC67e08e5d24",
        app: "admin",
        chainId: 84532,
      }),
    });
    expect(r.status).toBe(400);
    const body = (await r.json()) as { error: string };
    expect(body.error).toBe("INVALID_ORIGIN");
  });

  it("rejects unsupported chain", async () => {
    const r = await SELF.fetch("http://localhost/api/auth/nonce", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://admin.ccmnetwork.net",
      },
      body: JSON.stringify({
        address: "0x048f42B850cC126468EE112852b6aC67e08e5d24",
        app: "admin",
        chainId: 1, // ethereum mainnet — not in our allowlist
      }),
    });
    expect(r.status).toBe(400);
  });
});
