-- 0003 admin audit log
--
-- Append-only ledger of every privileged action initiated from the
-- operator console (admin.ccmnetwork.net). Each row is identified by
-- the SIWE-authenticated wallet that signed in, plus the chain + target
-- + action params. Rows transition status pending → submitted → confirmed
-- (or pending → failed) via PATCH from the admin client. The on-chain
-- tx_hash links the off-chain audit entry to chain truth.

CREATE TABLE admin_audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet          TEXT    NOT NULL,        -- lowercase 0x; matches SIWE session.address
  chain_id        INTEGER NOT NULL,
  action          TEXT    NOT NULL,        -- 'mint' | 'transfer' | 'pause' | 'unpause' | 'grant_role' | 'revoke_role' | 'sign_in'
  target_contract TEXT    NOT NULL,        -- the CCM contract acted on (e.g. CCMToken)
  target_address  TEXT,                    -- recipient / grantee (null for pause/unpause/sign_in)
  amount_wei      TEXT,                    -- decimal string for mint/transfer; null otherwise
  role_name       TEXT,                    -- 'MINTER_ROLE' / 'PAUSER_ROLE' / 'DEFAULT_ADMIN_ROLE' for role ops
  tx_hash         TEXT,                    -- 0x… (null until broadcast)
  status          TEXT    NOT NULL,        -- 'pending' | 'submitted' | 'confirmed' | 'failed'
  error_msg       TEXT,                    -- truncated, populated on status=failed
  ip_country      TEXT,                    -- from CF-IPCountry header
  user_agent      TEXT,                    -- truncated
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX idx_audit_wallet ON admin_audit_log(wallet, created_at DESC);
CREATE INDEX idx_audit_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX idx_audit_status ON admin_audit_log(status);
CREATE INDEX idx_audit_chain  ON admin_audit_log(chain_id, created_at DESC);
