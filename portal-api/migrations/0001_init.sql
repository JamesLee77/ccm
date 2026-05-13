-- 0001 init
CREATE TABLE users (
  address          TEXT PRIMARY KEY,
  email            TEXT,
  email_verified   INTEGER NOT NULL DEFAULT 0,
  email_token      TEXT,
  email_token_exp  INTEGER,
  notif_prefs      TEXT NOT NULL DEFAULT '{"cliff_7d":true,"cliff_1d":true,"claim_ready":true}',
  language         TEXT NOT NULL DEFAULT 'en',
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);

CREATE TABLE sent_notifications (
  address          TEXT NOT NULL,
  schedule_id      INTEGER NOT NULL,
  kind             TEXT NOT NULL,
  sent_at          INTEGER NOT NULL,
  PRIMARY KEY (address, schedule_id, kind)
);

CREATE TABLE auth_nonces (
  nonce            TEXT PRIMARY KEY,
  address          TEXT NOT NULL,
  expires_at       INTEGER NOT NULL
);

CREATE INDEX idx_auth_nonces_exp ON auth_nonces(expires_at);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
