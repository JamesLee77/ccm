import type { UserRow, NotificationKind } from "./types";

export interface UpsertUserInput {
  email?: string | null;
  email_verified?: number;
  email_token?: string | null;
  email_token_exp?: number | null;
  notif_prefs?: string;
  language?: string;
}

export async function getUser(db: D1Database, address: string): Promise<UserRow | null> {
  const row = await db
    .prepare("SELECT * FROM users WHERE address = ?")
    .bind(address.toLowerCase())
    .first<UserRow>();
  return row ?? null;
}

export async function upsertUser(
  db: D1Database,
  address: string,
  input: UpsertUserInput,
  now: number,
): Promise<void> {
  const addr = address.toLowerCase();
  const existing = await getUser(db, addr);

  if (!existing) {
    await db
      .prepare(
        `INSERT INTO users (address, email, email_verified, email_token, email_token_exp, notif_prefs, language, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, COALESCE(?, '{"cliff_7d":true,"cliff_1d":true,"claim_ready":true}'), COALESCE(?, 'en'), ?, ?)`,
      )
      .bind(
        addr,
        input.email ?? null,
        input.email_verified ?? 0,
        input.email_token ?? null,
        input.email_token_exp ?? null,
        input.notif_prefs ?? null,
        input.language ?? null,
        now,
        now,
      )
      .run();
    return;
  }

  await db
    .prepare(
      `UPDATE users SET
         email           = COALESCE(?, email),
         email_verified  = COALESCE(?, email_verified),
         email_token     = COALESCE(?, email_token),
         email_token_exp = COALESCE(?, email_token_exp),
         notif_prefs     = COALESCE(?, notif_prefs),
         language        = COALESCE(?, language),
         updated_at      = ?
       WHERE address = ?`,
    )
    .bind(
      input.email ?? null,
      input.email_verified ?? null,
      input.email_token ?? null,
      input.email_token_exp ?? null,
      input.notif_prefs ?? null,
      input.language ?? null,
      now,
      addr,
    )
    .run();
}

export async function clearEmail(db: D1Database, address: string, now: number): Promise<void> {
  await db
    .prepare(
      `UPDATE users SET email=NULL, email_verified=0, email_token=NULL, email_token_exp=NULL, updated_at=? WHERE address=?`,
    )
    .bind(now, address.toLowerCase())
    .run();
}

export async function markEmailVerified(db: D1Database, address: string, now: number): Promise<void> {
  await db
    .prepare(
      `UPDATE users SET email_verified=1, email_token=NULL, email_token_exp=NULL, updated_at=? WHERE address=?`,
    )
    .bind(now, address.toLowerCase())
    .run();
}

export async function alreadySent(
  db: D1Database,
  address: string,
  scheduleId: number,
  kind: NotificationKind,
): Promise<boolean> {
  const row = await db
    .prepare(
      "SELECT 1 AS one FROM sent_notifications WHERE address = ? AND schedule_id = ? AND kind = ?",
    )
    .bind(address.toLowerCase(), scheduleId, kind)
    .first<{ one: number }>();
  return row !== null;
}

export async function markSent(
  db: D1Database,
  address: string,
  scheduleId: number,
  kind: NotificationKind,
  now: number,
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO sent_notifications (address, schedule_id, kind, sent_at) VALUES (?, ?, ?, ?)`,
    )
    .bind(address.toLowerCase(), scheduleId, kind, now)
    .run();
}

export async function putNonce(
  db: D1Database,
  nonce: string,
  address: string,
  expiresAt: number,
): Promise<void> {
  await db
    .prepare("INSERT INTO auth_nonces (nonce, address, expires_at) VALUES (?, ?, ?)")
    .bind(nonce, address.toLowerCase(), expiresAt)
    .run();
}

export async function consumeNonce(
  db: D1Database,
  nonce: string,
  now: number,
): Promise<{ address: string } | null> {
  const row = await db
    .prepare("DELETE FROM auth_nonces WHERE nonce = ? RETURNING address, expires_at")
    .bind(nonce)
    .first<{ address: string; expires_at: number }>();
  if (!row) return null;
  if (row.expires_at < now) return null;
  return { address: row.address };
}
