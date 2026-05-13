export interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  RPC_URL: string;
  CHAIN_ID: string;
  CCM_VESTING_ADDRESS: string;
  CCM_KYC_REGISTRY_ADDRESS: string;
  CCM_TOKEN_ADDRESS: string;
  APP_BASE_URL: string;
  API_BASE_URL: string;
  RESEND_FROM: string;
  RESEND_API_KEY: string;       // secret
  SIWE_SECRET: string;          // secret
  ADMIN_BEARER_TOKEN: string;   // secret — gates /admin/*
}

export interface SessionPayload {
  address: string; // lowercase
  exp: number;     // unix seconds
}

export interface UserRow {
  address: string;
  email: string | null;
  email_verified: number; // 0 | 1
  email_token: string | null;
  email_token_exp: number | null;
  notif_prefs: string;     // JSON
  language: string;
  created_at: number;
  updated_at: number;
}

export type NotificationKind = "cliff_7d" | "cliff_1d" | "claim_ready";

// ============== Holder registry types ==============

export interface VestingScheduleRow {
  schedule_id: number;
  beneficiary: string;
  total_amount_wei: string;
  start_time: number;
  cliff_duration: number;
  vesting_duration: number;
  released_wei: string;
  revocable: number;
  revoked: number;
  source: string;
  legal_entity: string | null;
  jurisdiction: string | null;
  synced_at: number;
  created_at: number;
}

export interface KYCStatusRow {
  address: string;
  is_kyced: number;
  kyced_at_chain: number;
  synced_at: number;
  provider: string | null;
  provider_id: string | null;
  level: string | null;
  notes: string | null;
}

export interface HolderSnapshotRow {
  address: string;
  snapshot_at: number;
  block_number: number;
  ccm_balance_wei: string;
  vested_total_wei: string;
  released_total_wei: string;
}

export interface SyncRunRow {
  run_at: number;
  schedules_synced: number;
  kyc_synced: number;
  snapshots_taken: number;
  duration_ms: number;
  error: string | null;
}

// ============== Admin audit log types ==============

export type AdminAuditAction =
  | "sign_in"
  | "mint"
  | "transfer"
  | "manual_transfer"
  | "pause"
  | "unpause"
  | "grant_role"
  | "revoke_role"
  | "create_round"
  | "close_round"
  | "whitelist_set"
  | "whitelist_set_batch"
  | "withdraw_usdc"
  | "create_schedule"
  | "create_schedule_batch"
  | "revoke_schedule"
  | "schedule_op"
  | "execute_op"
  | "cancel_op"
  | "kyc_set"
  | "kyc_set_batch";

export type AdminAuditStatus = "pending" | "submitted" | "confirmed" | "failed";

export interface AdminAuditRow {
  id: number;
  wallet: string;
  chain_id: number;
  action: AdminAuditAction;
  target_contract: string;
  target_address: string | null;
  amount_wei: string | null;
  role_name: string | null;
  tx_hash: string | null;
  status: AdminAuditStatus;
  error_msg: string | null;
  notes: string | null;
  ip_country: string | null;
  user_agent: string | null;
  created_at: number;
  updated_at: number;
}
