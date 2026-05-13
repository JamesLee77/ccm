import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAddress, parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useSignMessage,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CCMTokenAbi,
  CONTRACTS,
  EXPLORER,
  chainLabel,
} from "../lib/contracts";
import { fmtCCM } from "../lib/format";
import { usePersona } from "../lib/usePersona";
import { canWriteRoute } from "../lib/personas";
import ReadOnlyBanner from "../components/site/ReadOnlyBanner";
import CopyableAddress from "../components/CopyableAddress";
import {
  Card,
  CTA,
  H1,
  H2,
  H3,
  Lede,
  SectionLabel,
  Stat,
} from "../components/site/primitives";
import {
  type AuditAction,
  type AuditEntry,
  type AuditRow,
  type SiweSession,
  clearSession,
  listMyAudit,
  logAuditStart,
  logAuditUpdate,
  readSession,
  signIn,
} from "../lib/audit";

const ZERO = "0x0000000000000000000000000000000000000000";

type AddressStr = `0x${string}`;

interface ParsedRow {
  to: AddressStr;
  amount: bigint;
  raw: string;
  error?: string;
}

function parseCsv(input: string): ParsedRow[] {
  return input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((raw) => {
      const parts = raw.split(/[\s,]+/).filter(Boolean);
      if (parts.length < 2)
        return { to: ZERO as AddressStr, amount: 0n, raw, error: "expected: address amount" };
      const [addr, amtStr] = parts;
      if (!isAddress(addr))
        return { to: ZERO as AddressStr, amount: 0n, raw, error: `invalid address: ${addr}` };
      let amount: bigint;
      try {
        amount = parseUnits(amtStr, 18);
      } catch {
        return { to: addr as AddressStr, amount: 0n, raw, error: `invalid amount: ${amtStr}` };
      }
      if (amount === 0n) return { to: addr as AddressStr, amount: 0n, raw, error: "amount is zero" };
      return { to: addr as AddressStr, amount, raw };
    });
}

export default function TokenAdmin() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const env = chainLabel();
  const personaCtx = usePersona();
  const canWrite = !personaCtx.loading && canWriteRoute(personaCtx.persona, "/");
  const tokenAddr = CONTRACTS.ccmTokenV1 as AddressStr;
  const tokenDeployed = tokenAddr.toLowerCase() !== ZERO;

  // Track which airdrop rows have been confirmed (by their raw line text)
  const [sentRows, setSentRows] = useState<Set<string>>(new Set());
  const [pendingRow, setPendingRow] = useState<string | null>(null);

  // ─── Token info ───
  const { data: tokenInfo } = useReadContracts({
    contracts: tokenDeployed
      ? [
          { address: tokenAddr, abi: CCMTokenAbi, functionName: "name" },
          { address: tokenAddr, abi: CCMTokenAbi, functionName: "symbol" },
          { address: tokenAddr, abi: CCMTokenAbi, functionName: "VERSION" },
          { address: tokenAddr, abi: CCMTokenAbi, functionName: "totalSupply" },
          { address: tokenAddr, abi: CCMTokenAbi, functionName: "cap" },
          { address: tokenAddr, abi: CCMTokenAbi, functionName: "paused" },
          { address: tokenAddr, abi: CCMTokenAbi, functionName: "decimals" },
        ]
      : [],
    query: { enabled: tokenDeployed, refetchInterval: 8000 },
  });

  const tokenSymbol = tokenInfo?.[1]?.result as string | undefined;
  const tokenVersion = tokenInfo?.[2]?.result as string | undefined;
  const totalSupply = tokenInfo?.[3]?.result as bigint | undefined;
  const cap = tokenInfo?.[4]?.result as bigint | undefined;
  const paused = tokenInfo?.[5]?.result as boolean | undefined;

  // ─── Role discovery ───
  const { data: roleHashes } = useReadContracts({
    contracts: tokenDeployed
      ? [
          { address: tokenAddr, abi: CCMTokenAbi, functionName: "DEFAULT_ADMIN_ROLE" },
          { address: tokenAddr, abi: CCMTokenAbi, functionName: "MINTER_ROLE" },
          { address: tokenAddr, abi: CCMTokenAbi, functionName: "PAUSER_ROLE" },
        ]
      : [],
    query: { enabled: tokenDeployed },
  });

  const ADMIN_ROLE = roleHashes?.[0]?.result as `0x${string}` | undefined;
  const MINTER_ROLE = roleHashes?.[1]?.result as `0x${string}` | undefined;
  const PAUSER_ROLE = roleHashes?.[2]?.result as `0x${string}` | undefined;

  const { data: myRoles, refetch: refetchRoles } = useReadContracts({
    contracts:
      tokenDeployed && address && ADMIN_ROLE && MINTER_ROLE && PAUSER_ROLE
        ? [
            { address: tokenAddr, abi: CCMTokenAbi, functionName: "hasRole", args: [ADMIN_ROLE, address] },
            { address: tokenAddr, abi: CCMTokenAbi, functionName: "hasRole", args: [MINTER_ROLE, address] },
            { address: tokenAddr, abi: CCMTokenAbi, functionName: "hasRole", args: [PAUSER_ROLE, address] },
          ]
        : [],
    query: {
      enabled: !!(tokenDeployed && address && ADMIN_ROLE && MINTER_ROLE && PAUSER_ROLE),
      refetchInterval: 8000,
    },
  });
  const isAdmin = myRoles?.[0]?.result === true;
  const isMinter = myRoles?.[1]?.result === true;
  const isPauser = myRoles?.[2]?.result === true;
  const hasAnyRole = isAdmin || isMinter || isPauser;

  // ─── My balance ───
  const { data: myBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddr,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && tokenDeployed, refetchInterval: 8000 },
  });

  // ─── SIWE session + audit log ───
  const [session, setSession] = useState<SiweSession | null>(() => readSession());
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const { signMessageAsync } = useSignMessage();
  const currentAuditId = useRef<number | null>(null);
  const [recentAudit, setRecentAudit] = useState<AuditRow[]>([]);

  const refreshAudit = useCallback(async () => {
    if (!session) return;
    try {
      const rows = await listMyAudit(session, 10);
      setRecentAudit(rows);
    } catch {
      // ignore — display only
    }
  }, [session]);

  useEffect(() => {
    void refreshAudit();
  }, [refreshAudit]);

  async function doSignIn() {
    if (!address || !chainId) return;
    setSignInError(null);
    setSigningIn(true);
    try {
      const sess = await signIn({
        address: address as `0x${string}`,
        chainId,
        signFn: (msg) => signMessageAsync({ message: msg }),
      });
      setSession(sess);
      // Log the sign-in itself as an audit event for symmetry — gives ops
      // a "user X first authenticated at T" anchor in the log.
      await logAuditStart(sess, {
        chain_id: chainId,
        action: "sign_in",
        target_contract: tokenAddr,
        status: "submitted",
      }).catch(() => undefined);
      void refreshAudit();
    } catch (e: any) {
      setSignInError(e?.message ?? "sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }

  function doSignOut() {
    clearSession();
    setSession(null);
    setRecentAudit([]);
  }

  // ─── Tx state ───
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // PATCH the most-recent audit row when txHash arrives
  useEffect(() => {
    if (!session || !currentAuditId.current || !txHash) return;
    void logAuditUpdate(session, currentAuditId.current, {
      tx_hash: txHash,
      status: "submitted",
    });
  }, [txHash, session]);

  // PATCH on confirm
  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
      refetchRoles();
      if (pendingRow) {
        setSentRows((prev) => new Set([...prev, pendingRow]));
        setPendingRow(null);
      }
      if (session && currentAuditId.current) {
        void logAuditUpdate(session, currentAuditId.current, { status: "confirmed" })
          .then(() => refreshAudit());
        currentAuditId.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  // PATCH on tx submission failure (user rejected, RPC error, etc)
  useEffect(() => {
    if (!writeError || !session || !currentAuditId.current) return;
    void logAuditUpdate(session, currentAuditId.current, {
      status: "failed",
      error_msg: (writeError.message || "tx failed").slice(0, 500),
    }).then(() => refreshAudit());
    currentAuditId.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError]);

  /**
   * Wraps writeContract with audit logging. If no SIWE session, the
   * write still proceeds (operator chose not to sign in) but no
   * off-chain audit row is created. The on-chain tx itself is always
   * the source of truth.
   */
  async function auditedWrite(audit: Omit<AuditEntry, "status">, write: () => void) {
    if (!session || !chainId) {
      write();
      return;
    }
    try {
      const { id } = await logAuditStart(session, { ...audit, status: "pending" });
      currentAuditId.current = id;
      void refreshAudit();
    } catch {
      // Log failure shouldn't block the user-facing tx
      currentAuditId.current = null;
    }
    write();
  }

  // ─── Form state ───
  const [airdropCsv, setAirdropCsv] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendNote, setSendNote] = useState("");
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [grantRoleSel, setGrantRoleSel] = useState<"admin" | "minter" | "pauser">("minter");
  const [grantRoleAddr, setGrantRoleAddr] = useState("");
  const [revokeRoleSel, setRevokeRoleSel] = useState<"admin" | "minter" | "pauser">("minter");
  const [revokeRoleAddr, setRevokeRoleAddr] = useState("");

  const parsedAirdrop = useMemo(() => parseCsv(airdropCsv), [airdropCsv]);
  const validRows = parsedAirdrop.filter((r) => !r.error);
  const remainingRows = validRows.filter((r) => !sentRows.has(r.raw));
  const airdropTotalRemaining = remainingRows.reduce((acc, r) => acc + r.amount, 0n);
  const airdropFitsBalance = (myBalance as bigint | undefined ?? 0n) >= airdropTotalRemaining;
  const busy = isPending || isMining;

  async function sendNextAirdrop() {
    const next = remainingRows[0];
    if (!next || busy) return;
    setPendingRow(next.raw);
    await auditedWrite(
      {
        chain_id: chainId ?? 0,
        action: "transfer",
        target_contract: tokenAddr,
        target_address: next.to,
        amount_wei: next.amount.toString(),
      },
      () =>
        writeContract({
          address: tokenAddr,
          abi: CCMTokenAbi,
          functionName: "transfer",
          args: [next.to, next.amount],
        }),
    );
  }

  function clearSent() {
    // Remove sent rows from the textarea so the operator has a clean
    // unsent-only list at the end. Sent rows are recorded above for
    // audit (count visible). Reset tracker afterward.
    const remainingRaw = parsedAirdrop
      .filter((r) => !sentRows.has(r.raw))
      .map((r) => r.raw)
      .join("\n");
    setAirdropCsv(remainingRaw);
    setSentRows(new Set());
  }

  async function doSendCCM() {
    if (!isAddress(sendTo)) return;
    let amt: bigint;
    try {
      amt = parseUnits(sendAmount, 18);
    } catch {
      return;
    }
    if (amt === 0n) return;
    await auditedWrite(
      {
        chain_id: chainId ?? 0,
        action: "manual_transfer",
        target_contract: tokenAddr,
        target_address: sendTo as AddressStr,
        amount_wei: amt.toString(),
        notes: sendNote || null,
      },
      () =>
        writeContract({
          address: tokenAddr,
          abi: CCMTokenAbi,
          functionName: "transfer",
          args: [sendTo as AddressStr, amt],
        }),
    );
  }

  async function doMint() {
    if (!isAddress(mintTo)) return;
    let amt: bigint;
    try {
      amt = parseUnits(mintAmount, 18);
    } catch {
      return;
    }
    if (amt === 0n) return;
    await auditedWrite(
      {
        chain_id: chainId ?? 0,
        action: "mint",
        target_contract: tokenAddr,
        target_address: mintTo as AddressStr,
        amount_wei: amt.toString(),
      },
      () =>
        writeContract({
          address: tokenAddr,
          abi: CCMTokenAbi,
          functionName: "mint",
          args: [mintTo as AddressStr, amt],
        }),
    );
  }

  async function pauseToken() {
    await auditedWrite(
      { chain_id: chainId ?? 0, action: "pause", target_contract: tokenAddr },
      () => writeContract({ address: tokenAddr, abi: CCMTokenAbi, functionName: "pause" }),
    );
  }
  async function unpauseToken() {
    await auditedWrite(
      { chain_id: chainId ?? 0, action: "unpause", target_contract: tokenAddr },
      () => writeContract({ address: tokenAddr, abi: CCMTokenAbi, functionName: "unpause" }),
    );
  }

  function roleHashOf(sel: "admin" | "minter" | "pauser"): `0x${string}` | undefined {
    if (sel === "admin") return ADMIN_ROLE;
    if (sel === "minter") return MINTER_ROLE;
    return PAUSER_ROLE;
  }
  function roleNameOf(sel: "admin" | "minter" | "pauser"): string {
    if (sel === "admin") return "DEFAULT_ADMIN_ROLE";
    if (sel === "minter") return "MINTER_ROLE";
    return "PAUSER_ROLE";
  }
  async function doGrantRole() {
    if (!isAddress(grantRoleAddr)) return;
    const role = roleHashOf(grantRoleSel);
    if (!role) return;
    await auditedWrite(
      {
        chain_id: chainId ?? 0,
        action: "grant_role",
        target_contract: tokenAddr,
        target_address: grantRoleAddr as AddressStr,
        role_name: roleNameOf(grantRoleSel),
      },
      () =>
        writeContract({
          address: tokenAddr,
          abi: CCMTokenAbi,
          functionName: "grantRole",
          args: [role, grantRoleAddr as AddressStr],
        }),
    );
  }
  async function doRevokeRole() {
    if (!isAddress(revokeRoleAddr)) return;
    const role = roleHashOf(revokeRoleSel);
    if (!role) return;
    await auditedWrite(
      {
        chain_id: chainId ?? 0,
        action: "revoke_role",
        target_contract: tokenAddr,
        target_address: revokeRoleAddr as AddressStr,
        role_name: roleNameOf(revokeRoleSel),
      },
      () =>
        writeContract({
          address: tokenAddr,
          abi: CCMTokenAbi,
          functionName: "revokeRole",
          args: [role, revokeRoleAddr as AddressStr],
        }),
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Token operations</SectionLabel>
        <H1>CCM token admin</H1>
        <Lede className="mt-5">
          Direct on-chain operations against the CCM token. The active
          chain (MAINNET / TESTNET) is bound to the connected wallet's
          network — switch in your wallet to swap modes. Every action is
          a real transaction; review before signing.
        </Lede>
      </header>

      {!canWrite && !personaCtx.loading && (
        <ReadOnlyBanner persona={personaCtx.persona} email={personaCtx.email} pageLabel="Token" />
      )}

      <ModeBanner env={env} chainId={chainId} tokenAddr={tokenAddr} tokenDeployed={tokenDeployed} />

      {/* SIWE / audit log status — only when wallet connected */}
      {isConnected && (
        <Card>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
            <H2>Audit log</H2>
            <span className="font-mono text-[11px]" style={{ color: "var(--ink-soft)" }}>
              {session ? "active session — every tx is recorded" : "sign in to enable audit logging"}
            </span>
          </div>
          {!session ? (
            <>
              <p className="mb-4" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>
                Sign a message with your wallet to start an audit-logged session.
                Every privileged action (mint, transfer, pause, role change) you
                trigger from this page will be recorded with your wallet, the chain,
                the target, and the resulting tx hash. The signature itself is a
                <em className="italic-moss"> non-transaction</em> — no gas, no on-chain
                state change.
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <CTA
                  label={signingIn ? "Signing…" : "Sign in with wallet"}
                  onClick={() => void doSignIn()}
                  disabled={signingIn || !isConnected}
                />
                {signInError && (
                  <span className="font-mono text-[11px]" style={{ color: "#ef4444" }}>
                    {signInError}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 flex-wrap font-mono text-[12px]">
              <span style={{ color: "var(--moss)" }}>✓ signed in</span>
              <span style={{ color: "var(--ink-soft)" }}>·</span>
              <span style={{ color: "var(--ink)" }}>{session.address.slice(0, 6)}…{session.address.slice(-4)}</span>
              <span style={{ color: "var(--ink-soft)" }}>·</span>
              <span style={{ color: "var(--ink-soft)" }}>
                expires {new Date(session.exp * 1000).toLocaleString()}
              </span>
              <button
                onClick={doSignOut}
                className="ml-auto underline"
                style={{ color: "var(--ink-soft)" }}
              >
                sign out
              </button>
            </div>
          )}
        </Card>
      )}

      {!isConnected && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            Connect a wallet from the top-right to use admin actions.
          </p>
        </Card>
      )}

      {isConnected && !tokenDeployed && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            CCM token is not yet deployed on this chain ({chainId}). Switch
            to Base Sepolia (84532) to test against the rehearsal token, or
            wait for the Phase 0 mainnet deploy.
          </p>
        </Card>
      )}

      {isConnected && tokenDeployed && (
        <>
          {/* Overview */}
          <Card>
            <H2 className="mb-5">Overview</H2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Stat label="Token" value={`${tokenSymbol ?? "—"} · ${tokenVersion ?? "—"}`} />
              <Stat
                label="Total supply"
                value={
                  totalSupply !== undefined && cap !== undefined
                    ? `${fmtCCM(totalSupply)} / ${fmtCCM(cap, 0)}`
                    : "—"
                }
              />
              <Stat label="State" value={paused === undefined ? "—" : paused ? "Paused" : "Active"} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>
                  Token contract
                </div>
                <CopyableAddress address={tokenAddr} withExplorer />
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>
                  Your wallet
                </div>
                {address ? <CopyableAddress address={address} withExplorer /> : "—"}
              </div>
              <Stat label="Your CCM balance" value={fmtCCM(myBalance as bigint | undefined)} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <RoleBadge label="DEFAULT_ADMIN_ROLE" active={isAdmin} />
              <RoleBadge label="MINTER_ROLE" active={isMinter} />
              <RoleBadge label="PAUSER_ROLE" active={isPauser} />
              {!hasAnyRole && (
                <span
                  className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                  style={{ borderColor: "var(--rule)", color: "var(--ink-soft)" }}
                >
                  No on-chain admin role · read-only
                </span>
              )}
            </div>
          </Card>

          {/* Airdrop */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Airdrop · batch transfer</H2>
              <span className="font-mono text-[11px]" style={{ color: "var(--ink-soft)" }}>
                no role required · sends from your wallet
              </span>
            </div>
            <p
              className="mb-4 max-w-[680px]"
              style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}
            >
              One row per line:{" "}
              <code className="font-mono" style={{ color: "var(--ink)" }}>
                0xRecipient amount
              </code>
              . Comma or whitespace separated. Amounts in whole CCM
              (decimals applied). Each row is one transaction; the wallet
              pops up per-row so you can review before signing. After
              confirm, that row is automatically marked as sent (✓).
            </p>
            <textarea
              value={airdropCsv}
              onChange={(e) => setAirdropCsv(e.target.value)}
              rows={8}
              spellCheck={false}
              placeholder="0x1111111111111111111111111111111111111111 100&#10;0x2222222222222222222222222222222222222222 50.5"
              className="w-full bg-transparent border px-3 py-2 font-mono text-[12px]"
              style={{
                borderColor: "var(--rule)",
                color: "var(--ink)",
                background: "var(--paper)",
                resize: "vertical",
              }}
            />

            {/* Per-row status */}
            {parsedAirdrop.length > 0 && (
              <div className="mt-3 border" style={{ borderColor: "var(--rule)" }}>
                {parsedAirdrop.map((r, i) => {
                  const sent = sentRows.has(r.raw);
                  const isPending = pendingRow === r.raw;
                  return (
                    <div
                      key={i}
                      className="font-mono text-[11px] flex items-center gap-3 px-3 py-2 border-b last:border-b-0"
                      style={{ borderColor: "var(--rule)" }}
                    >
                      <span style={{ width: 18, color: r.error ? "#ef4444" : sent ? "var(--moss)" : isPending ? "var(--clay)" : "var(--ink-soft)" }}>
                        {r.error ? "✗" : sent ? "✓" : isPending ? "•" : "○"}
                      </span>
                      <span className="flex-1 truncate" style={{ color: r.error ? "#ef4444" : "var(--ink)" }}>
                        {r.raw}
                      </span>
                      {r.error && <span style={{ color: "#ef4444" }}>{r.error}</span>}
                      {sent && <span style={{ color: "var(--moss)" }}>sent</span>}
                      {isPending && <span style={{ color: "var(--clay)" }}>pending</span>}
                    </div>
                  );
                })}
              </div>
            )}

            <div
              className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-1"
              style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}
            >
              <Stat label="Remaining" value={remainingRows.length.toString()} />
              <Stat label="Total to send" value={`${fmtCCM(airdropTotalRemaining)} CCM`} />
              <Stat
                label="Your balance"
                value={`${fmtCCM(myBalance as bigint | undefined)} CCM`}
              />
            </div>

            <div className="mt-5 flex gap-3 flex-wrap">
              <CTA
                label={
                  busy
                    ? "Sending…"
                    : remainingRows.length === 0
                      ? "All sent"
                      : `Send next (${remainingRows.length} remaining)`
                }
                onClick={sendNextAirdrop}
                disabled={!canWrite || remainingRows.length === 0 || !airdropFitsBalance || busy}
              />
              {sentRows.size > 0 && (
                <CTA
                  variant="ghost"
                  label={`Clear ${sentRows.size} sent`}
                  onClick={clearSent}
                  disabled={busy}
                />
              )}
              {!airdropFitsBalance && remainingRows.length > 0 && (
                <span className="font-mono text-[11px] self-center" style={{ color: "#ef4444" }}>
                  Insufficient balance for total
                </span>
              )}
            </div>
          </Card>

          {/* Send CCM (single, with off-chain note) */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Send CCM · single recipient with note</H2>
              <span className="font-mono text-[11px]" style={{ color: "var(--ink-soft)" }}>
                no role required · sends from your wallet
              </span>
            </div>
            <p
              className="mb-4 max-w-[680px]"
              style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}
            >
              For SAFT investors who paid <em className="italic-moss">off-chain</em>{" "}
              (wire transfer, BTC/ETH/USDT outside the on-chain sale, etc.) and need
              their CCM allocation transferred manually. The note field captures the
              off-chain payment reference for compliance — it's stored in the audit
              log alongside the on-chain tx hash. Also useful for ad-hoc operational
              transfers (marketing, treasury moves, gas top-ups).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3 items-end mb-4">
              <Field label="Recipient address">
                <input
                  type="text"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  placeholder="0x…"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Amount (CCM)">
                <input
                  type="text"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <CTA
                label={busy ? "Sending…" : "Send"}
                onClick={() => void doSendCCM()}
                disabled={!canWrite || busy || !sendTo || !sendAmount || (myBalance as bigint | undefined ?? 0n) < (() => { try { return parseUnits(sendAmount || "0", 18); } catch { return 0n; } })()}
              />
            </div>

            <Field label="Off-chain payment note (optional, ≤ 1000 chars)">
              <textarea
                value={sendNote}
                onChange={(e) => setSendNote(e.target.value)}
                rows={3}
                spellCheck={false}
                placeholder="e.g. Wire transfer USD 150 from Acme Capital LLC, ref WIRE-2026-0517 / SAFT signed 2026-05-09"
                className="w-full bg-transparent border px-3 py-2 font-mono text-[12px]"
                style={{
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                  background: "var(--paper)",
                  resize: "vertical",
                }}
              />
            </Field>

            <p
              className="mt-3 font-mono text-[11px]"
              style={{ color: "var(--ink-soft)" }}
            >
              Your CCM balance: {fmtCCM(myBalance as bigint | undefined)} CCM
              {sendAmount && (() => {
                let amt = 0n;
                try { amt = parseUnits(sendAmount, 18); } catch { amt = 0n; }
                if (amt > (myBalance as bigint | undefined ?? 0n)) {
                  return <span style={{ color: "#ef4444" }}> · insufficient for this transfer</span>;
                }
                return null;
              })()}
            </p>
          </Card>

          {/* Mint */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Mint</H2>
              <RoleGate role="MINTER_ROLE" granted={isMinter} />
            </div>
            <p className="mb-4" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>
              Mint CCM to a recipient. Requires{" "}
              <code style={{ color: "var(--ink)" }}>MINTER_ROLE</code> and respects the token's hard cap.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3 items-end">
              <Field label="Recipient address">
                <input
                  type="text"
                  value={mintTo}
                  onChange={(e) => setMintTo(e.target.value)}
                  placeholder="0x…"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Amount (CCM)">
                <input
                  type="text"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <CTA
                label={busy ? "Minting…" : "Mint"}
                onClick={doMint}
                disabled={!canWrite || !isMinter || busy || !mintTo || !mintAmount}
              />
            </div>
            {totalSupply !== undefined && cap !== undefined && (() => {
              let mintAmt = 0n;
              try { mintAmt = parseUnits(mintAmount || "0", 18); } catch { mintAmt = 0n; }
              const room = cap - totalSupply;
              return (
                <p className="mt-3 font-mono text-[11px]" style={{ color: "var(--ink-soft)" }}>
                  Headroom under cap: {fmtCCM(room)} CCM
                  {mintAmt > room && (
                    <span style={{ color: "#ef4444" }}> · this mint exceeds the cap</span>
                  )}
                </p>
              );
            })()}
          </Card>

          {/* Pause */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Pause / unpause</H2>
              <RoleGate role="PAUSER_ROLE" granted={isPauser} />
            </div>
            <p className="mb-4" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>
              Pausing freezes all transfers (including mint, burn, vesting
              release). Use only in genuine emergency — the 48 h timelock
              would normally gate this on mainnet.
            </p>
            <div className="flex flex-wrap gap-3">
              <CTA
                variant="ghost"
                label={busy ? "Pausing…" : "Pause"}
                onClick={pauseToken}
                disabled={!canWrite || !isPauser || busy || paused === true}
              />
              <CTA
                label={busy ? "Unpausing…" : "Unpause"}
                onClick={unpauseToken}
                disabled={!canWrite || !isPauser || busy || paused === false}
              />
            </div>
          </Card>

          {/* Roles */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Role management</H2>
              <RoleGate role="DEFAULT_ADMIN_ROLE" granted={isAdmin} />
            </div>
            <p className="mb-5" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>
              Grant or revoke roles. Note: on mainnet,{" "}
              <code style={{ color: "var(--ink)" }}>DEFAULT_ADMIN_ROLE</code>{" "}
              is held by the Timelock; direct EOA grants will revert.
            </p>

            <div className="space-y-6">
              <div>
                <H3 className="mb-3">Grant</H3>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
                  <Field label="Role">
                    <select
                      value={grantRoleSel}
                      onChange={(e) => setGrantRoleSel(e.target.value as any)}
                      className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                      style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                    >
                      <option value="minter">MINTER_ROLE</option>
                      <option value="pauser">PAUSER_ROLE</option>
                      <option value="admin">DEFAULT_ADMIN_ROLE</option>
                    </select>
                  </Field>
                  <Field label="To address">
                    <input
                      type="text"
                      value={grantRoleAddr}
                      onChange={(e) => setGrantRoleAddr(e.target.value)}
                      placeholder="0x…"
                      className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                      style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                    />
                  </Field>
                  <CTA
                    label={busy ? "Granting…" : "Grant"}
                    onClick={doGrantRole}
                    disabled={!canWrite || !isAdmin || busy || !grantRoleAddr}
                  />
                </div>
              </div>

              <div>
                <H3 className="mb-3">Revoke</H3>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
                  <Field label="Role">
                    <select
                      value={revokeRoleSel}
                      onChange={(e) => setRevokeRoleSel(e.target.value as any)}
                      className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                      style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                    >
                      <option value="minter">MINTER_ROLE</option>
                      <option value="pauser">PAUSER_ROLE</option>
                      <option value="admin">DEFAULT_ADMIN_ROLE</option>
                    </select>
                  </Field>
                  <Field label="From address">
                    <input
                      type="text"
                      value={revokeRoleAddr}
                      onChange={(e) => setRevokeRoleAddr(e.target.value)}
                      placeholder="0x…"
                      className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                      style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                    />
                  </Field>
                  <CTA
                    variant="ghost"
                    label={busy ? "Revoking…" : "Revoke"}
                    onClick={doRevokeRole}
                    disabled={!canWrite || !isAdmin || busy || !revokeRoleAddr}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Tx receipt */}
          {txHash && (
            <Card>
              <H3 className="mb-3">Last transaction</H3>
              <div
                className="font-mono text-[12px] flex items-center gap-3 flex-wrap"
                style={{ color: "var(--ink-soft)" }}
              >
                <a
                  href={`${EXPLORER}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--moss)" }}
                >
                  {txHash.slice(0, 10)}…{txHash.slice(-8)}
                </a>
                {isMining && <span style={{ color: "var(--clay)" }}>Confirming…</span>}
                {isSuccess && <span style={{ color: "var(--moss)" }}>✓ Confirmed</span>}
                <button
                  onClick={() => reset()}
                  className="ml-auto underline"
                  style={{ color: "var(--ink-soft)" }}
                >
                  dismiss
                </button>
              </div>
            </Card>
          )}

          {writeError && (
            <div
              className="border p-4 font-mono text-[12px]"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "#ef4444", color: "#ef4444" }}
            >
              {writeError.message.slice(0, 280)}
            </div>
          )}

          {/* Recent admin actions (audit log) */}
          {session && recentAudit.length > 0 && (
            <Card>
              <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
                <H3>Recent actions</H3>
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>
                  last {recentAudit.length} entries
                </span>
              </div>
              <div className="border" style={{ borderColor: "var(--rule)" }}>
                {recentAudit.map((row) => (
                  <AuditRowItem
                    key={row.id}
                    row={row}
                    explorer={EXPLORER}
                  />
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function AuditRowItem({ row, explorer }: { row: AuditRow; explorer: string }) {
  const status = row.status;
  const statusColor =
    status === "confirmed" ? "var(--moss)" :
    status === "submitted" ? "var(--clay)" :
    status === "failed" ? "#ef4444" :
    "var(--ink-soft)";
  const actionLabel: Record<AuditAction, string> = {
    sign_in: "sign-in",
    mint: "mint",
    transfer: "transfer",
    manual_transfer: "manual send",
    pause: "pause",
    unpause: "unpause",
    grant_role: "grant role",
    revoke_role: "revoke role",
    create_round: "create round",
    close_round: "close round",
    whitelist_set: "whitelist",
    whitelist_set_batch: "whitelist batch",
    withdraw_usdc: "withdraw USDC",
    create_schedule: "create schedule",
    create_schedule_batch: "schedule batch",
    revoke_schedule: "revoke schedule",
    schedule_op: "schedule op",
    execute_op: "execute op",
    cancel_op: "cancel op",
    kyc_set: "kyc set",
    kyc_set_batch: "kyc batch",
  };

  // Pretty-print the parameters
  let detail = "";
  if (row.action === "mint" || row.action === "transfer" || row.action === "manual_transfer") {
    const amt = row.amount_wei ? `${(BigInt(row.amount_wei) / 10n ** 14n).toString().slice(0, 6)}…` : "?";
    detail = `${row.target_address?.slice(0, 6)}…${row.target_address?.slice(-4)} · ${amt}`;
    if (row.notes) detail += ` · note: "${row.notes.slice(0, 40)}${row.notes.length > 40 ? "…" : ""}"`;
  } else if (row.action === "grant_role" || row.action === "revoke_role") {
    detail = `${row.role_name ?? ""} → ${row.target_address?.slice(0, 6)}…${row.target_address?.slice(-4)}`;
  }

  return (
    <div
      className="font-mono text-[11px] flex items-center gap-3 px-3 py-2 border-b last:border-b-0"
      style={{ borderColor: "var(--rule)" }}
      title={row.notes || undefined}
    >
      <span style={{ width: 80, color: "var(--ink)" }}>{actionLabel[row.action]}</span>
      <span className="flex-1 truncate" style={{ color: "var(--ink-soft)" }}>{detail}</span>
      {row.tx_hash && (
        <a
          href={`${explorer}/tx/${row.tx_hash}`}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
          style={{ color: "var(--moss)" }}
        >
          {row.tx_hash.slice(0, 8)}…
        </a>
      )}
      <span style={{ width: 70, textAlign: "right", color: statusColor }}>{status}</span>
      <span style={{ color: "var(--ink-soft)", fontSize: 10 }}>
        {new Date(row.created_at * 1000).toLocaleTimeString()}
      </span>
    </div>
  );
}

function ModeBanner({
  env,
  chainId,
  tokenAddr,
  tokenDeployed,
}: {
  env: "mainnet" | "testnet" | "other";
  chainId: number | undefined;
  tokenAddr: string;
  tokenDeployed: boolean;
}) {
  const map = {
    mainnet: {
      bg: "rgba(45,191,99,0.10)",
      border: "var(--moss)",
      fg: "var(--moss)",
      label: "MAINNET",
      sub: "Base · 8453 · Real funds. Every action is irreversible.",
    },
    testnet: {
      bg: "rgba(200,96,46,0.08)",
      border: "var(--clay)",
      fg: "var(--clay)",
      label: "TESTNET",
      sub: "Base Sepolia · 84532 · No real value. Safe to experiment.",
    },
    other: {
      bg: "rgba(239,68,68,0.06)",
      border: "#ef4444",
      fg: "#ef4444",
      label: "WRONG NETWORK",
      sub: `Connected to chain ${chainId ?? "?"}. Operator console requires Base mainnet (8453) or Base Sepolia (84532).`,
    },
  }[env];

  return (
    <div
      className="border px-5 py-4 flex items-center gap-4 flex-wrap"
      style={{ background: map.bg, borderColor: map.border }}
    >
      <span
        className="font-mono text-[11px] tracking-[0.18em] uppercase px-2 py-1 border"
        style={{ borderColor: map.border, color: map.fg, fontWeight: 600 }}
      >
        {map.label}
      </span>
      <span className="font-mono text-[12px]" style={{ color: "var(--ink)" }}>
        {map.sub}
      </span>
      {tokenDeployed && (
        <span className="font-mono text-[11px] ml-auto" style={{ color: "var(--ink-soft)" }}>
          token: {tokenAddr.slice(0, 6)}…{tokenAddr.slice(-4)}
        </span>
      )}
    </div>
  );
}

function RoleBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
      style={{
        borderColor: active ? "var(--moss)" : "var(--rule)",
        background: active ? "rgba(45,191,99,0.08)" : "transparent",
        color: active ? "var(--moss)" : "var(--ink-soft)",
      }}
    >
      {active ? "✓" : "—"} {label}
    </span>
  );
}

function RoleGate({ role, granted }: { role: string; granted: boolean }) {
  return (
    <span
      className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
      style={{
        borderColor: granted ? "var(--moss)" : "var(--rule)",
        background: granted ? "rgba(45,191,99,0.08)" : "transparent",
        color: granted ? "var(--moss)" : "var(--ink-soft)",
      }}
    >
      {granted ? "✓ allowed" : "✗ no role"} · {role}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}
