import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAddress, getAddress } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useSignMessage,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CCMKYCRegistryAbi,
  CHAIN_ID,
  CONTRACTS,
  EXPLORER,
  chainLabel,
} from "../lib/contracts";
import { IS_MAINNET } from "../lib/env";
import { usePersona } from "../lib/usePersona";
import { canWriteRoute } from "../lib/personas";
import ReadOnlyBanner from "../components/site/ReadOnlyBanner";
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

type AddressStr = `0x${string}`;
const ZERO = "0x0000000000000000000000000000000000000000";

function parseBatch(input: string): { addrs: AddressStr[]; errors: string[] } {
  const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const errors: string[] = [];
  const addrs: AddressStr[] = [];
  const seen = new Set<string>();
  for (const l of lines) {
    const tok = l.split(/[\s,]+/)[0];
    if (!isAddress(tok)) {
      errors.push(`invalid: ${l}`);
      continue;
    }
    const cs = getAddress(tok);
    if (seen.has(cs.toLowerCase())) continue;
    seen.add(cs.toLowerCase());
    addrs.push(cs);
  }
  return { addrs, errors };
}

interface KycEvent {
  user: string;
  kyced: boolean;
  ts: bigint;
  operator: string;
  blockNumber: bigint;
  txHash: string;
}

export default function KycAdmin() {
  const { address, isConnected } = useAccount();
  const env = chainLabel();
  const client = usePublicClient();
  const personaCtx = usePersona();
  const canWrite = !personaCtx.loading && canWriteRoute(personaCtx.persona, "/kyc");

  const kyc = CONTRACTS.ccmKycRegistry as AddressStr;
  const kycDeployed = kyc.toLowerCase() !== ZERO;

  // ─── SIWE / audit ───
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
      setRecentAudit(rows.filter(
        (r) => r.action === "kyc_set" || r.action === "kyc_set_batch",
      ));
    } catch {/* ignore */}
  }, [session]);
  useEffect(() => { void refreshAudit(); }, [refreshAudit]);

  async function doSignIn() {
    if (!address) return;
    setSignInError(null);
    setSigningIn(true);
    try {
      const sess = await signIn({
        address: address as AddressStr,
        chainId: CHAIN_ID,
        signFn: (msg) => signMessageAsync({ message: msg }),
      });
      setSession(sess);
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

  // ─── Read state ───
  const { data: kycedCount, refetch: refetchCount } = useReadContract({
    address: kyc,
    abi: CCMKYCRegistryAbi,
    functionName: "kycedCount",
    query: { enabled: kycDeployed, refetchInterval: 12000 },
  });

  // Operator role check
  const { data: roleHash } = useReadContract({
    address: kyc,
    abi: CCMKYCRegistryAbi,
    functionName: "KYC_OPERATOR_ROLE",
    query: { enabled: kycDeployed },
  });
  const { data: hasOperator } = useReadContract({
    address: kyc,
    abi: CCMKYCRegistryAbi,
    functionName: "hasRole",
    args: address && roleHash ? [roleHash, address as AddressStr] : undefined,
    query: { enabled: !!(kycDeployed && address && roleHash), refetchInterval: 12000 },
  });
  const isOperator = hasOperator === true;

  // ─── Address lookup ───
  const [lookup, setLookup] = useState("");
  const lookupValid = isAddress(lookup);

  const { data: lookupResult, refetch: refetchLookup } = useReadContracts({
    contracts: lookupValid
      ? [
          { address: kyc, abi: CCMKYCRegistryAbi, functionName: "isKYCed", args: [lookup as AddressStr] },
          { address: kyc, abi: CCMKYCRegistryAbi, functionName: "kycedAt", args: [lookup as AddressStr] },
        ]
      : [],
    query: { enabled: lookupValid && kycDeployed },
  });
  const lookupKYCed = lookupResult?.[0]?.result as boolean | undefined;
  const lookupTs = lookupResult?.[1]?.result as bigint | undefined;

  // ─── Recent KYCStatusChanged events ───
  const [events, setEvents] = useState<KycEvent[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!client || !kycDeployed) return;
    let cancelled = false;
    (async () => {
      try {
        const head = await client.getBlockNumber();
        const fromBlock = head > 50_000n ? head - 50_000n : 0n;
        const logs = await client.getLogs({
          address: kyc,
          event: {
            type: "event",
            name: "KYCStatusChanged",
            inputs: [
              { name: "user", type: "address", indexed: true },
              { name: "kyced", type: "bool" },
              { name: "timestamp", type: "uint64" },
              { name: "operator", type: "address", indexed: true },
            ],
          },
          fromBlock,
          toBlock: head,
        });
        const out: KycEvent[] = logs.map((log) => ({
          user: log.args.user as string,
          kyced: log.args.kyced as boolean,
          ts: log.args.timestamp as bigint,
          operator: log.args.operator as string,
          blockNumber: log.blockNumber!,
          txHash: log.transactionHash!,
        }));
        out.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        if (!cancelled) setEvents(out.slice(0, 30));
      } catch {/* ignore */}
    })();
    return () => { cancelled = true; };
  }, [client, kycDeployed, kyc, reload]);

  // ─── Tx state ───
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!session || !currentAuditId.current || !txHash) return;
    void logAuditUpdate(session, currentAuditId.current, { tx_hash: txHash, status: "submitted" });
  }, [txHash, session]);
  useEffect(() => {
    if (isSuccess) {
      void refetchCount();
      void refetchLookup();
      setReload((r) => r + 1);
      if (session && currentAuditId.current) {
        void logAuditUpdate(session, currentAuditId.current, { status: "confirmed" })
          .then(() => refreshAudit());
        currentAuditId.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);
  useEffect(() => {
    if (!writeError || !session || !currentAuditId.current) return;
    void logAuditUpdate(session, currentAuditId.current, {
      status: "failed",
      error_msg: (writeError.message || "tx failed").slice(0, 500),
    }).then(() => refreshAudit());
    currentAuditId.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError]);

  async function auditedWrite(audit: Omit<AuditEntry, "status">, write: () => void) {
    if (!session) {
      write();
      return;
    }
    try {
      const { id } = await logAuditStart(session, { ...audit, status: "pending" });
      currentAuditId.current = id;
      void refreshAudit();
    } catch {
      currentAuditId.current = null;
    }
    write();
  }

  const busy = isPending || isMining;

  // ─── Form state ───
  const [singleAddr, setSingleAddr] = useState("");
  const [singleOk, setSingleOk] = useState(true);
  const [singleNote, setSingleNote] = useState("");
  const [batchCsv, setBatchCsv] = useState("");
  const [batchOk, setBatchOk] = useState(true);
  const [batchNote, setBatchNote] = useState("");

  const parsedBatch = useMemo(() => parseBatch(batchCsv), [batchCsv]);

  function doSetSingle() {
    if (!isAddress(singleAddr)) return;
    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "kyc_set",
        target_contract: kyc,
        target_address: singleAddr as AddressStr,
        notes: singleNote
          ? `setKYCed(${singleAddr}, ${singleOk}) · ${singleNote}`
          : `setKYCed(${singleAddr}, ${singleOk})`,
      },
      () => writeContract({
        address: kyc,
        abi: CCMKYCRegistryAbi,
        functionName: "setKYCed",
        args: [singleAddr as AddressStr, singleOk],
      }),
    );
  }

  function doSetBatch() {
    if (parsedBatch.addrs.length === 0) return;
    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "kyc_set_batch",
        target_contract: kyc,
        notes: batchNote
          ? `setKYCedBatchUniform(${parsedBatch.addrs.length} addrs, ${batchOk}) · ${batchNote}`
          : `setKYCedBatchUniform(${parsedBatch.addrs.length} addrs, ${batchOk})`,
      },
      () => writeContract({
        address: kyc,
        abi: CCMKYCRegistryAbi,
        functionName: "setKYCedBatchUniform",
        args: [parsedBatch.addrs, batchOk],
      }),
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">KYC Registry</SectionLabel>
        <H1>KYC operator console</H1>
        <Lede className="mt-5">
          Single source of truth for "who has passed off-chain KYC". The
          operator (Safe with KYC_OPERATOR_ROLE on mainnet, deployer on testnet)
          flips per-user status without going through the 48h Timelock —
          daily approvals need to be real-time. Every flip is recorded in
          the audit log with the operator's signed wallet and any free-text
          note (Sumsub/Persona reference, jurisdiction, etc.).
        </Lede>
      </header>

      {!canWrite && !personaCtx.loading && (
        <ReadOnlyBanner persona={personaCtx.persona} email={personaCtx.email} pageLabel="KYC Registry" />
      )}

      {/* env banner */}
      <div
        className="border px-5 py-4 flex items-center gap-4 flex-wrap"
        style={{
          background: IS_MAINNET ? "rgba(45,191,99,0.10)" : "rgba(200,96,46,0.08)",
          borderColor: IS_MAINNET ? "var(--moss)" : "var(--clay)",
        }}
      >
        <span
          className="font-mono text-[11px] tracking-[0.18em] uppercase px-2 py-1 border"
          style={{
            borderColor: IS_MAINNET ? "var(--moss)" : "var(--clay)",
            color: IS_MAINNET ? "var(--moss)" : "var(--clay)",
            fontWeight: 600,
          }}
        >
          {IS_MAINNET ? "MAINNET" : "TESTNET"}
        </span>
        <span className="font-mono text-[12px]" style={{ color: "var(--ink)" }}>
          {IS_MAINNET ? "Base · 8453" : "Base Sepolia · 84532"}
        </span>
        {kycDeployed && (
          <span className="font-mono text-[11px] ml-auto" style={{ color: "var(--ink-soft)" }}>
            registry: {kyc.slice(0, 6)}…{kyc.slice(-4)}
          </span>
        )}
      </div>

      {/* SIWE */}
      {isConnected && (
        <Card>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
            <H2>Audit log</H2>
            <span className="font-mono text-[11px]" style={{ color: "var(--ink-soft)" }}>
              {session ? "active session" : "sign in to enable audit logging"}
            </span>
          </div>
          {!session ? (
            <div className="flex flex-wrap gap-3 items-center">
              <CTA label={signingIn ? "Signing…" : "Sign in with wallet"}
                onClick={() => void doSignIn()} disabled={signingIn || !isConnected} />
              {signInError && <span className="font-mono text-[11px]" style={{ color: "#ef4444" }}>{signInError}</span>}
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap font-mono text-[12px]">
              <span style={{ color: "var(--moss)" }}>✓ signed in</span>
              <span style={{ color: "var(--ink-soft)" }}>·</span>
              <span style={{ color: "var(--ink)" }}>{session.address.slice(0, 6)}…{session.address.slice(-4)}</span>
              <button onClick={doSignOut} className="ml-auto underline" style={{ color: "var(--ink-soft)" }}>sign out</button>
            </div>
          )}
        </Card>
      )}

      {!isConnected && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>Connect a wallet from the top-right.</p>
        </Card>
      )}

      {isConnected && !kycDeployed && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            CCMKYCRegistry not deployed on this {env}.
          </p>
        </Card>
      )}

      {isConnected && kycDeployed && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Stat label="KYC-cleared addresses (live)" value={(kycedCount as bigint | undefined)?.toString() ?? "—"} />
            <div
              className="border p-5"
              style={{
                background: isOperator ? "rgba(45,191,99,0.06)" : "var(--paper-deep)",
                borderColor: isOperator ? "var(--moss)" : "var(--rule)",
              }}
            >
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>
                Your role
              </div>
              <div
                className="font-display mt-2"
                style={{ fontSize: 22, color: isOperator ? "var(--moss)" : "var(--ink-soft)" }}
              >
                {isOperator ? "✓ KYC_OPERATOR" : "✗ no KYC_OPERATOR"}
              </div>
              <div className="font-mono text-[10px] mt-2" style={{ color: "var(--ink-soft)" }}>
                {isOperator
                  ? "you can flip KYC status directly (no timelock)"
                  : "read-only · ask the admin/Safe to grant the role"}
              </div>
            </div>
          </div>

          {/* Lookup */}
          <Card>
            <H2 className="mb-4">Lookup status</H2>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3 items-end">
              <Field label="Address">
                <input
                  type="text"
                  value={lookup}
                  onChange={(e) => setLookup(e.target.value)}
                  placeholder="0x…"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <div className="font-mono text-[12px]" style={{ color: "var(--ink-soft)" }}>
                {!lookupValid && lookup ? <span style={{ color: "#ef4444" }}>invalid address</span> :
                  lookupValid && lookupKYCed === undefined ? "querying…" :
                  lookupValid && lookupKYCed
                    ? <>
                        <span style={{ color: "var(--moss)" }}>✓ KYCed</span>
                        {lookupTs && lookupTs > 0n &&
                          <span> · last set {new Date(Number(lookupTs) * 1000).toLocaleString()}</span>}
                      </>
                    : lookupValid && lookupKYCed === false
                      ? <span style={{ color: "var(--clay)" }}>✗ not KYCed</span>
                      : "enter an address to check"
                }
              </div>
            </div>
          </Card>

          {/* Single set */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Set status · single address</H2>
              <span
                className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                style={{
                  borderColor: isOperator ? "var(--moss)" : "var(--rule)",
                  color: isOperator ? "var(--moss)" : "var(--ink-soft)",
                }}
              >
                {isOperator ? "✓ OPERATOR" : "✗ KYC_OPERATOR_ROLE required"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3 items-end mb-3">
              <Field label="Address">
                <input type="text" value={singleAddr} onChange={(e) => setSingleAddr(e.target.value)}
                  placeholder="0x…"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
              <Field label="Status">
                <select value={singleOk ? "true" : "false"}
                  onChange={(e) => setSingleOk(e.target.value === "true")}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>
                  <option value="true">✓ KYCed (true)</option>
                  <option value="false">✗ Not KYCed (false)</option>
                </select>
              </Field>
              <CTA label={busy ? "…" : singleOk ? "Approve" : "Revoke"}
                onClick={doSetSingle}
                disabled={!canWrite || !isOperator || busy || !isAddress(singleAddr)}
                variant={singleOk ? "primary" : "ghost"} />
            </div>
            <Field label="Note (optional, ≤ 1000 chars — Sumsub ref / jurisdiction / SAFT id, etc.)">
              <textarea value={singleNote} onChange={(e) => setSingleNote(e.target.value)}
                rows={2} spellCheck={false}
                placeholder="Sumsub applicantId 5e8a9b… · KR jurisdiction · SAFT-2026-0517"
                className="w-full bg-transparent border px-3 py-2 font-mono text-[12px]"
                style={{ borderColor: "var(--rule)", color: "var(--ink)", background: "var(--paper)", resize: "vertical" }} />
            </Field>
          </Card>

          {/* Batch set */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Set status · batch (uniform)</H2>
              <span
                className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                style={{
                  borderColor: isOperator ? "var(--moss)" : "var(--rule)",
                  color: isOperator ? "var(--moss)" : "var(--ink-soft)",
                }}
              >
                {isOperator ? "✓ OPERATOR" : "✗ OPERATOR required"}
              </span>
            </div>
            <p className="mb-3" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.55 }}>
              All addresses get the same status. One address per line — comments after the address are ignored.
            </p>
            <textarea value={batchCsv} onChange={(e) => setBatchCsv(e.target.value)}
              rows={6} spellCheck={false}
              placeholder="0x1111111111111111111111111111111111111111&#10;0x2222222222222222222222222222222222222222 acme capital"
              className="w-full bg-transparent border px-3 py-2 font-mono text-[12px]"
              style={{ borderColor: "var(--rule)", color: "var(--ink)", background: "var(--paper)", resize: "vertical" }} />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-1"
              style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
              <Stat label="Valid addresses" value={parsedBatch.addrs.length.toString()} />
              <Stat label="Errors" value={parsedBatch.errors.length.toString()} />
              <Stat label="Status" value={batchOk ? "approve" : "revoke"} />
            </div>
            {parsedBatch.errors.length > 0 && (
              <ul className="mt-3 space-y-1 font-mono text-[11px]" style={{ color: "#ef4444" }}>
                {parsedBatch.errors.slice(0, 5).map((e, i) => <li key={i}>✗ {e}</li>)}
              </ul>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <Field label="Status">
                <select value={batchOk ? "true" : "false"}
                  onChange={(e) => setBatchOk(e.target.value === "true")}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>
                  <option value="true">✓ approve all</option>
                  <option value="false">✗ revoke all</option>
                </select>
              </Field>
              <Field label="Batch context note">
                <input type="text" value={batchNote}
                  onChange={(e) => setBatchNote(e.target.value)}
                  placeholder="Sumsub batch import 2026-Q2"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
            </div>
            <div className="mt-5">
              <CTA label={busy ? "…" : batchOk
                  ? `Approve ${parsedBatch.addrs.length} addresses`
                  : `Revoke ${parsedBatch.addrs.length} addresses`}
                onClick={doSetBatch}
                disabled={!canWrite || !isOperator || busy || parsedBatch.addrs.length === 0}
                variant={batchOk ? "primary" : "ghost"} />
            </div>
          </Card>

          {/* Recent on-chain events */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
              <H2>Recent on-chain status changes</H2>
              <button onClick={() => setReload((r) => r + 1)}
                className="font-mono text-[11px] tracking-[0.14em] uppercase underline"
                style={{ color: "var(--ink-soft)" }}>
                refresh
              </button>
            </div>
            {events.length === 0 ? (
              <p style={{ color: "var(--ink-soft)" }}>No events.</p>
            ) : (
              <div className="border" style={{ borderColor: "var(--rule)" }}>
                {events.map((e, i) => (
                  <div key={i}
                    className="font-mono text-[11px] flex items-center gap-3 px-3 py-2 border-b last:border-b-0"
                    style={{ borderColor: "var(--rule)" }}>
                    <span style={{ width: 90, color: e.kyced ? "var(--moss)" : "var(--clay)" }}>
                      {e.kyced ? "✓ approved" : "✗ revoked"}
                    </span>
                    <span style={{ color: "var(--ink)" }}>{e.user.slice(0, 6)}…{e.user.slice(-4)}</span>
                    <span style={{ color: "var(--ink-soft)" }}>by {e.operator.slice(0, 6)}…{e.operator.slice(-4)}</span>
                    <a href={`${EXPLORER}/tx/${e.txHash}`} target="_blank" rel="noreferrer"
                      className="ml-auto hover:underline" style={{ color: "var(--moss)" }}>
                      {e.txHash.slice(0, 8)}…
                    </a>
                    <span style={{ color: "var(--ink-soft)", fontSize: 10 }}>
                      {new Date(Number(e.ts) * 1000).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tx receipt */}
          {txHash && (
            <Card>
              <H3 className="mb-3">Last transaction</H3>
              <div className="font-mono text-[12px] flex items-center gap-3 flex-wrap" style={{ color: "var(--ink-soft)" }}>
                <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer"
                  className="hover:underline" style={{ color: "var(--moss)" }}>
                  {txHash.slice(0, 10)}…{txHash.slice(-8)}
                </a>
                {isMining && <span style={{ color: "var(--clay)" }}>Confirming…</span>}
                {isSuccess && <span style={{ color: "var(--moss)" }}>✓ Confirmed</span>}
                <button onClick={() => reset()} className="ml-auto underline" style={{ color: "var(--ink-soft)" }}>dismiss</button>
              </div>
            </Card>
          )}

          {writeError && (
            <div className="border p-4 font-mono text-[12px]"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "#ef4444", color: "#ef4444" }}>
              {writeError.message.slice(0, 280)}
            </div>
          )}

          {/* Recent KYC audit rows */}
          {session && recentAudit.length > 0 && (
            <Card>
              <H3 className="mb-4">Recent KYC actions (audit log)</H3>
              <div className="border" style={{ borderColor: "var(--rule)" }}>
                {recentAudit.map((row) => (
                  <div key={row.id}
                    className="font-mono text-[11px] flex items-center gap-3 px-3 py-2 border-b last:border-b-0"
                    style={{ borderColor: "var(--rule)" }}
                    title={row.notes || undefined}>
                    <span style={{ width: 80, color: "var(--ink)" }}>
                      {row.action === "kyc_set" ? "set" : row.action === "kyc_set_batch" ? "batch" : row.action}
                    </span>
                    <span className="flex-1 truncate" style={{ color: "var(--ink-soft)" }}>
                      {row.notes ? `${row.notes.slice(0, 80)}${row.notes.length > 80 ? "…" : ""}` : ""}
                    </span>
                    {row.tx_hash && (
                      <a href={`${EXPLORER}/tx/${row.tx_hash}`} target="_blank" rel="noreferrer"
                        className="hover:underline" style={{ color: "var(--moss)" }}>
                        {row.tx_hash.slice(0, 8)}…
                      </a>
                    )}
                    <span style={{ width: 70, textAlign: "right",
                      color: row.status === "confirmed" ? "var(--moss)" :
                             row.status === "submitted" ? "var(--clay)" :
                             row.status === "failed" ? "#ef4444" : "var(--ink-soft)"
                    }}>{row.status}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>
        {label}
      </div>
      {children}
    </label>
  );
}
