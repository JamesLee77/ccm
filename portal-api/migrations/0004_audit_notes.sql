-- 0004 audit notes
--
-- Free-text annotation column on admin_audit_log. Used by manual_transfer
-- actions to record off-chain payment context (wire transfer reference,
-- BTC tx hash, KRW amount, investor name, etc.) for SAFT investors who
-- paid through channels other than the on-chain CCMTGESale USDC path.
--
-- Also useful for generic ad-hoc operator notes on any action type
-- ("emergency unpause per multisig vote 2026-05-09" etc.).

ALTER TABLE admin_audit_log ADD COLUMN notes TEXT;
