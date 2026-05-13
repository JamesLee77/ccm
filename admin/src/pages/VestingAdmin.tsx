import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAddress, parseUnits, getAddress } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSignMessage,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CCMTokenAbi,
  CCMVestingAbi,
  CHAIN_ID,
  CONTRACTS,
  EXPLORER,
  chainLabel,
} from "../lib/contracts";
import { IS_MAINNET } from "../lib/env";
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

interface ScheduleView {
  id: number;
  beneficiary: string;
  totalAmount: bigint;
  startTime: bigint;
  cliffDuration: bigint;
  vestingDuration: bigint;
  released: bigint;
  revocable: boolean;
  revoked: boolean;
  releasable: bigint;
}

const fmtDuration = (secs: bigint): string => {
  const s = Number(secs);
  if (s === 0) return "0";
  const d = Math.floor(s / 86400);
  if (d > 0) return `${d}d`;
  const h = Math.floor(s / 3600);
  if (h > 0) return `${h}h`;
  return `${Math.floor(s / 60)}m`;
};

const fmtDate = (ts: bigint): string => {
  if (ts === 0n) return "—";
  return new Date(Number(ts) * 1000).toLocaleString();
};

interface ParsedRow {
  beneficiary: AddressStr;
  amount: bigint;
  raw: string;
  error?: string;
}

function parseBatch(input: string): ParsedRow[] {
  return input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((raw) => {
      const parts = raw.split(/[\s,]+/).filter(Boolean);
      if (parts.length < 2)
        return { beneficiary: ZERO as AddressStr, amount: 0n, raw, error: "expected: address amount" };
      const [addr, amtStr] = parts;
      if (!isAddress(addr))
        return { beneficiary: ZERO as AddressStr, amount: 0n, raw, error: `invalid address: ${addr}` };
      let amount: bigint;
      try {
        amount = parseUnits(amtStr, 18);
      } catch {
        return { beneficiary: addr as AddressStr, amount: 0n, raw, error: `invalid amount: ${amtStr}` };
      }
      if (amount === 0n) return { beneficiary: addr as AddressStr, amount: 0n, raw, error: "amount is zero" };
      return { beneficiary: getAddress(addr) as AddressStr, amount, raw };
    });
}

export default function VestingAdmin() {
  const { address, isConnected } = useAccount();
  const env = chainLabel();
  const personaCtx = usePersona();
  const canWrite = !personaCtx.loading && canWriteRoute(personaCtx.persona, "/vesting");

  const vesting = CONTRACTS.ccmVesting as AddressStr;
  const ccm = CONTRACTS.ccmTokenV1 as AddressStr;
  const vestingDeployed = vesting.toLowerCase() !== ZERO;

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
      setRecentAudit(rows.filter((r) =>
        ["create_schedule", "create_schedule_batch", "revoke_schedule", "sign_in"].includes(r.action),
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
  const { data: scheduleCount, refetch: refetchCount } = useReadContract({
    address: vesting,
    abi: CCMVestingAbi,
    functionName: "getScheduleCount",
    query: { enabled: vestingDeployed, refetchInterval: 12000 },
  });
  const N = Number(scheduleCount ?? 0n);

  // CCM balance held by vesting (the inventory available to allocate)
  const { data: vestingCcm } = useReadContract({
    address: ccm,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: [vesting],
    query: { enabled: vestingDeployed, refetchInterval: 15000 },
  });

  // Schedule manager role check
  const { data: roleHash } = useReadContract({
    address: vesting,
    abi: CCMVestingAbi,
    functionName: "SCHEDULE_MANAGER_ROLE",
    query: { enabled: vestingDeployed },
  });
  const { data: hasManager } = useReadContract({
    address: vesting,
    abi: CCMVestingAbi,
    functionName: "hasRole",
    args: address && roleHash ? [roleHash, address as AddressStr] : undefined,
    query: { enabled: !!(vestingDeployed && address && roleHash), refetchInterval: 12000 },
  });
  const isManager = hasManager === true;

  // Read all schedules (lightweight — just iterate to N)
  const client = usePublicClient();
  const [schedules, setSchedules] = useState<ScheduleView[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!client || !vestingDeployed || N === 0) {
      setSchedules([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const out: ScheduleView[] = [];
      for (let i = 0; i < N && i < 200; i++) {
        try {
          const s = (await client.readContract({
            address: vesting,
            abi: CCMVestingAbi,
            functionName: "schedules",
            args: [BigInt(i)],
          })) as readonly [string, bigint, bigint, bigint, bigint, bigint, boolean, boolean];
          const r = (await client.readContract({
            address: vesting,
            abi: CCMVestingAbi,
            functionName: "releasable",
            args: [BigInt(i)],
          })) as bigint;
          out.push({
            id: i,
            beneficiary: s[0],
            totalAmount: s[1],
            startTime: s[2],
            cliffDuration: s[3],
            vestingDuration: s[4],
            released: s[5],
            revocable: s[6],
            revoked: s[7],
            releasable: r,
          });
        } catch { break; }
      }
      if (!cancelled) setSchedules(out);
    })();
    return () => { cancelled = true; };
  }, [client, vestingDeployed, N, reload, vesting]);

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
  const [singleForm, setSingleForm] = useState({
    beneficiary: "",
    amount: "",
    startTime: "",
    cliffDays: "365",
    vestDays: "1095",
    revocable: false,
    notes: "",
  });

  const [batchForm, setBatchForm] = useState({
    csv: "",
    startTime: "",
    cliffDays: "365",
    vestDays: "1095",
    revocable: false,
    notes: "",
  });

  const [revokeId, setRevokeId] = useState("");

  const parsedBatch = useMemo(() => parseBatch(batchForm.csv), [batchForm.csv]);
  const batchTotal = parsedBatch.filter((r) => !r.error).reduce((acc, r) => acc + r.amount, 0n);

  function doCreateSingle() {
    if (!isAddress(singleForm.beneficiary)) return;
    let amt: bigint, startTs: bigint, cliffSecs: bigint, vestSecs: bigint;
    try {
      amt = parseUnits(singleForm.amount, 18);
      startTs = BigInt(Math.floor(new Date(singleForm.startTime).getTime() / 1000));
      cliffSecs = BigInt(Math.floor(parseFloat(singleForm.cliffDays) * 86400));
      vestSecs = BigInt(Math.floor(parseFloat(singleForm.vestDays) * 86400));
    } catch { return; }
    if (amt === 0n || vestSecs < cliffSecs) return;

    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "create_schedule",
        target_contract: vesting,
        target_address: singleForm.beneficiary as AddressStr,
        amount_wei: amt.toString(),
        notes: singleForm.notes || null,
      },
      () => writeContract({
        address: vesting,
        abi: CCMVestingAbi,
        functionName: "createSchedule",
        args: [
          singleForm.beneficiary as AddressStr,
          amt,
          startTs,
          cliffSecs,
          vestSecs,
          singleForm.revocable,
        ],
      }),
    );
  }

  function doCreateBatch() {
    if (parsedBatch.length === 0 || parsedBatch.some((r) => r.error)) return;
    let startTs: bigint, cliffSecs: bigint, vestSecs: bigint;
    try {
      startTs = BigInt(Math.floor(new Date(batchForm.startTime).getTime() / 1000));
      cliffSecs = BigInt(Math.floor(parseFloat(batchForm.cliffDays) * 86400));
      vestSecs = BigInt(Math.floor(parseFloat(batchForm.vestDays) * 86400));
    } catch { return; }
    if (vestSecs < cliffSecs) return;

    const beneficiaries = parsedBatch.map((r) => r.beneficiary);
    const amounts = parsedBatch.map((r) => r.amount);

    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "create_schedule_batch",
        target_contract: vesting,
        amount_wei: batchTotal.toString(),
        notes: batchForm.notes
          ? `${batchForm.notes}\n[${beneficiaries.length} beneficiaries]`
          : `[${beneficiaries.length} beneficiaries]`,
      },
      () => writeContract({
        address: vesting,
        abi: CCMVestingAbi,
        functionName: "createScheduleBatch",
        args: [beneficiaries, amounts, startTs, cliffSecs, vestSecs, batchForm.revocable],
      }),
    );
  }

  function doRevoke() {
    const id = parseInt(revokeId);
    if (Number.isNaN(id) || id < 0) return;
    if (!confirm(`Revoke schedule #${id}? Released portion stays with beneficiary; unvested portion returns to vesting contract balance.`)) return;
    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "revoke_schedule",
        target_contract: vesting,
      },
      () => writeContract({
        address: vesting,
        abi: CCMVestingAbi,
        functionName: "revoke",
        args: [BigInt(id)],
      }),
    );
  }

  // Aggregate stats
  const totalLocked = schedules.reduce((acc, s) => acc + s.totalAmount, 0n);
  const totalReleased = schedules.reduce((acc, s) => acc + s.released, 0n);

  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Vesting · schedule manager</SectionLabel>
        <H1>Vesting allocations</H1>
        <Lede className="mt-5">
          Create vesting schedules for SAFT investors who paid off-chain
          (wire, BTC/ETH/USDT, etc.) or for non-sale categories like
          Foundation / Partners / Strategic. Tokens lock here for the
          configured cliff + linear vest, then beneficiary can call{" "}
          <code style={{ color: "var(--ink)" }}>release(id)</code> from
          their wallet (or via portal-testnet/vesting). Revocable
          schedules let the operator cancel mid-vest, returning unvested
          tokens to the contract balance.
        </Lede>
      </header>

      {!canWrite && !personaCtx.loading && (
        <ReadOnlyBanner persona={personaCtx.persona} email={personaCtx.email} pageLabel="Vesting" />
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
          {IS_MAINNET ? "Base · 8453 · Real funds." : "Base Sepolia · 84532 · Sandbox token."}
        </span>
        {vestingDeployed && (
          <span className="font-mono text-[11px] ml-auto" style={{ color: "var(--ink-soft)" }}>
            vesting: {vesting.slice(0, 6)}…{vesting.slice(-4)}
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
          ) : (
            <div className="flex items-center gap-3 flex-wrap font-mono text-[12px]">
              <span style={{ color: "var(--moss)" }}>✓ signed in</span>
              <span style={{ color: "var(--ink-soft)" }}>·</span>
              <span style={{ color: "var(--ink)" }}>{session.address.slice(0, 6)}…{session.address.slice(-4)}</span>
              <span style={{ color: "var(--ink-soft)" }}>·</span>
              <span style={{ color: "var(--ink-soft)" }}>
                expires {new Date(session.exp * 1000).toLocaleString()}
              </span>
              <button onClick={doSignOut} className="ml-auto underline" style={{ color: "var(--ink-soft)" }}>sign out</button>
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

      {isConnected && !vestingDeployed && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            CCMVesting is not yet deployed on this {env}.
          </p>
        </Card>
      )}

      {isConnected && vestingDeployed && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Stat label="Schedules" value={N.toString()} />
            <Stat label="Total locked" value={fmtCCM(totalLocked) + " CCM"} />
            <Stat label="Total released" value={fmtCCM(totalReleased) + " CCM"} />
            <Stat label="Vesting contract bal" value={fmtCCM(vestingCcm as bigint | undefined) + " CCM"} />
          </div>

          {/* Role status */}
          <div className="flex flex-wrap gap-2">
            <span
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
              style={{
                borderColor: isManager ? "var(--moss)" : "var(--rule)",
                background: isManager ? "rgba(45,191,99,0.08)" : "transparent",
                color: isManager ? "var(--moss)" : "var(--ink-soft)",
              }}
            >
              {isManager ? "✓ SCHEDULE_MANAGER_ROLE" : "✗ no SCHEDULE_MANAGER_ROLE — read-only"}
            </span>
          </div>

          {/* Schedule list */}
          <Card>
            <H2 className="mb-4">Schedules</H2>
            {schedules.length === 0 ? (
              <p style={{ color: "var(--ink-soft)" }}>No schedules yet. Create the first below.</p>
            ) : (
              <div className="space-y-2">
                {schedules.map((s) => <ScheduleRow key={s.id} s={s} />)}
              </div>
            )}
          </Card>

          {/* Create single */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Create schedule · single beneficiary</H2>
              <span
                className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                style={{
                  borderColor: isManager ? "var(--moss)" : "var(--rule)",
                  color: isManager ? "var(--moss)" : "var(--ink-soft)",
                }}
              >
                {isManager ? "✓ MANAGER" : "✗ SCHEDULE_MANAGER_ROLE required"}
              </span>
            </div>
            <p className="mb-5" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>
              Use for individual SAFT investors paid off-chain or for category allocations
              (Foundation/Partners/Strategic).
              <em className="italic-moss"> Tokens must already be in the vesting contract</em> —
              currently {fmtCCM(vestingCcm as bigint | undefined)} CCM available.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Beneficiary address">
                <input type="text" value={singleForm.beneficiary}
                  onChange={(e) => setSingleForm({ ...singleForm, beneficiary: e.target.value })}
                  placeholder="0x…"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
              <Field label="Amount (whole CCM)">
                <input type="text" value={singleForm.amount}
                  onChange={(e) => setSingleForm({ ...singleForm, amount: e.target.value })}
                  placeholder="100000"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
              <Field label="Cliff (days)">
                <input type="text" value={singleForm.cliffDays}
                  onChange={(e) => setSingleForm({ ...singleForm, cliffDays: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
              <Field label="Total vest duration (days, ≥ cliff)">
                <input type="text" value={singleForm.vestDays}
                  onChange={(e) => setSingleForm({ ...singleForm, vestDays: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
              <Field label="Start (local datetime)">
                <input type="datetime-local" value={singleForm.startTime}
                  onChange={(e) => setSingleForm({ ...singleForm, startTime: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
              <Field label="Revocable?">
                <label className="flex items-center gap-2 font-mono text-[13px] py-2" style={{ color: "var(--ink)" }}>
                  <input type="checkbox" checked={singleForm.revocable}
                    onChange={(e) => setSingleForm({ ...singleForm, revocable: e.target.checked })}
                    style={{ accentColor: "var(--moss)" }} />
                  <span>Operator can revoke mid-vest (Foundation / Partners typically yes; SAFT investors typically no)</span>
                </label>
              </Field>
            </div>
            <Field label="Off-chain payment / context note (optional, ≤ 1000 chars)">
              <textarea value={singleForm.notes}
                onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
                rows={3} spellCheck={false}
                placeholder="Wire transfer USD 15,000 from Acme Capital LLC, ref WIRE-2026-0517, SAFT signed 2026-05-09 / Seed @ $0.15"
                className="w-full bg-transparent border px-3 py-2 font-mono text-[12px]"
                style={{ borderColor: "var(--rule)", color: "var(--ink)", background: "var(--paper)", resize: "vertical" }} />
            </Field>
            <div className="mt-5">
              <CTA
                label={busy ? "Creating…" : "Create schedule"}
                onClick={doCreateSingle}
                disabled={
                  !canWrite || !isManager || busy ||
                  !singleForm.beneficiary || !singleForm.amount || !singleForm.startTime
                }
              />
            </div>
          </Card>

          {/* Create batch */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Create schedules · batch</H2>
              <span
                className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                style={{
                  borderColor: isManager ? "var(--moss)" : "var(--rule)",
                  color: isManager ? "var(--moss)" : "var(--ink-soft)",
                }}
              >
                {isManager ? "✓ MANAGER" : "✗ MANAGER required"}
              </span>
            </div>
            <p className="mb-3" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.55 }}>
              All beneficiaries share the same start / cliff / vest / revocable terms.
              Useful for round-end onboarding (e.g. all Seed investors with identical SAFT terms).
              One row per line: <code className="font-mono" style={{ color: "var(--ink)" }}>0xAddress amount</code>.
            </p>
            <textarea
              value={batchForm.csv}
              onChange={(e) => setBatchForm({ ...batchForm, csv: e.target.value })}
              rows={6} spellCheck={false}
              placeholder="0x1111111111111111111111111111111111111111 100000&#10;0x2222222222222222222222222222222222222222 50000"
              className="w-full bg-transparent border px-3 py-2 font-mono text-[12px]"
              style={{ borderColor: "var(--rule)", color: "var(--ink)", background: "var(--paper)", resize: "vertical" }}
            />
            <div
              className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-1"
              style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}
            >
              <Stat label="Valid rows" value={parsedBatch.filter((r) => !r.error).length.toString()} />
              <Stat label="Errors" value={parsedBatch.filter((r) => r.error).length.toString()} />
              <Stat label="Total to lock" value={`${fmtCCM(batchTotal)} CCM`} />
            </div>
            {parsedBatch.some((r) => r.error) && (
              <ul className="mt-3 space-y-1 font-mono text-[11px]" style={{ color: "#ef4444" }}>
                {parsedBatch.filter((r) => r.error).slice(0, 5).map((r, i) => (
                  <li key={i}>✗ {r.raw} — {r.error}</li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <Field label="Cliff (days)">
                <input type="text" value={batchForm.cliffDays}
                  onChange={(e) => setBatchForm({ ...batchForm, cliffDays: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
              <Field label="Vest (days)">
                <input type="text" value={batchForm.vestDays}
                  onChange={(e) => setBatchForm({ ...batchForm, vestDays: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
              <Field label="Start (local)">
                <input type="datetime-local" value={batchForm.startTime}
                  onChange={(e) => setBatchForm({ ...batchForm, startTime: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
            </div>
            <label className="flex items-center gap-2 font-mono text-[13px] mt-4" style={{ color: "var(--ink)" }}>
              <input type="checkbox" checked={batchForm.revocable}
                onChange={(e) => setBatchForm({ ...batchForm, revocable: e.target.checked })}
                style={{ accentColor: "var(--moss)" }} />
              <span>Revocable (all rows in batch)</span>
            </label>
            <div className="mt-3">
              <Field label="Batch context note (optional)">
                <textarea value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  rows={2} spellCheck={false}
                  placeholder="Seed round 2026-Q2 batch onboarding · SAFT v1.2"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-[12px]"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)", background: "var(--paper)", resize: "vertical" }} />
              </Field>
            </div>
            <div className="mt-5">
              <CTA
                label={busy ? "Creating batch…" : `Create ${parsedBatch.filter((r) => !r.error).length} schedules`}
                onClick={doCreateBatch}
                disabled={
                  !canWrite || !isManager || busy ||
                  parsedBatch.length === 0 || parsedBatch.some((r) => r.error) ||
                  !batchForm.startTime
                }
              />
            </div>
          </Card>

          {/* Revoke */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Revoke schedule</H2>
              <span
                className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                style={{
                  borderColor: isManager ? "var(--moss)" : "var(--rule)",
                  color: isManager ? "var(--moss)" : "var(--ink-soft)",
                }}
              >
                {isManager ? "✓ MANAGER" : "✗ MANAGER required"}
              </span>
            </div>
            <p className="mb-4" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>
              Cancels a revocable schedule. Released tokens stay with the beneficiary;
              unvested tokens stay in the contract balance (can be reallocated to another schedule).
              <em className="italic-moss"> Only revocable schedules can be revoked</em> (set at create time).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
              <Field label="Schedule id">
                <input type="text" value={revokeId} onChange={(e) => setRevokeId(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }} />
              </Field>
              <CTA variant="ghost"
                label={busy ? "Revoking…" : "Revoke"}
                onClick={doRevoke}
                disabled={!canWrite || !isManager || busy || !revokeId}
              />
            </div>
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

          {/* Recent vesting actions */}
          {session && recentAudit.length > 0 && (
            <Card>
              <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
                <H3>Recent vesting actions</H3>
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>
                  last {recentAudit.length}
                </span>
              </div>
              <div className="border" style={{ borderColor: "var(--rule)" }}>
                {recentAudit.map((row) => (
                  <div
                    key={row.id}
                    className="font-mono text-[11px] flex items-center gap-3 px-3 py-2 border-b last:border-b-0"
                    style={{ borderColor: "var(--rule)" }}
                    title={row.notes || undefined}
                  >
                    <span style={{ width: 110, color: "var(--ink)" }}>
                      {row.action.replaceAll("_", " ")}
                    </span>
                    <span className="flex-1 truncate" style={{ color: "var(--ink-soft)" }}>
                      {row.target_address ? `${row.target_address.slice(0, 6)}…${row.target_address.slice(-4)}` : ""}
                      {row.amount_wei ? ` · ${fmtCCM(BigInt(row.amount_wei))} CCM` : ""}
                      {row.notes ? ` · "${row.notes.slice(0, 30)}${row.notes.length > 30 ? "…" : ""}"` : ""}
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

function ScheduleRow({ s }: { s: ScheduleView }) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const cliffEnd = s.startTime + s.cliffDuration;
  const vestEnd = s.startTime + s.vestingDuration;
  const elapsed = now > s.startTime ? now - s.startTime : 0n;
  const vestPct = s.vestingDuration > 0n
    ? Math.min(100, Number((elapsed * 10000n) / s.vestingDuration) / 100)
    : 0;
  const claimedPct = s.totalAmount > 0n
    ? Number((s.released * 10000n) / s.totalAmount) / 100
    : 0;

  let phase: string, phaseColor: string;
  if (s.revoked) { phase = "revoked"; phaseColor = "#ef4444"; }
  else if (now < cliffEnd) { phase = "cliff"; phaseColor = "var(--clay)"; }
  else if (now < vestEnd) { phase = "vesting"; phaseColor = "var(--moss)"; }
  else { phase = "fully vested"; phaseColor = "var(--moss)"; }

  return (
    <div className="border p-3" style={{ background: "var(--paper-deep)", borderColor: "var(--rule)" }}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>
            #{s.id}
          </span>
          <CopyableAddress address={s.beneficiary} withExplorer />
          {s.revocable && (
            <span className="font-mono text-[9px] tracking-[0.14em] uppercase px-1.5 py-0.5 border"
              style={{ borderColor: "var(--clay)", color: "var(--clay)" }}>
              revocable
            </span>
          )}
          <span className="font-mono text-[9px] tracking-[0.14em] uppercase px-1.5 py-0.5"
            style={{ color: phaseColor }}>
            {phase}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mb-2">
        <Field2 label="Total" value={fmtCCM(s.totalAmount) + " CCM"} />
        <Field2 label="Released" value={`${fmtCCM(s.released)} CCM (${claimedPct.toFixed(2)}%)`} />
        <Field2 label="Releasable now" value={fmtCCM(s.releasable) + " CCM"} color={s.releasable > 0n ? "var(--moss)" : undefined} />
        <Field2 label="Vest" value={`${vestPct.toFixed(2)}%`} />
        <Field2 label="Cliff" value={fmtDuration(s.cliffDuration)} />
        <Field2 label="Vest total" value={fmtDuration(s.vestingDuration)} />
        <Field2 label="Start" value={fmtDate(s.startTime)} />
        <Field2 label="Fully vested" value={fmtDate(vestEnd)} />
      </div>
      <div className="h-1 w-full" style={{ background: "var(--rule)" }}>
        <div className="h-1" style={{ width: `${claimedPct.toFixed(2)}%`, background: "var(--moss)" }} />
      </div>
    </div>
  );
}

function Field2({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>
        {label}
      </div>
      <div className="font-mono text-[11px] mt-0.5" style={{ color: color || "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}
