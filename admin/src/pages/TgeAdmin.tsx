import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAddress, parseUnits, formatUnits, getAddress } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSignMessage,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CCMTGESaleAbi,
  CCMTokenAbi,
  CONTRACTS,
  EXPLORER,
  USDCAbi,
  chainLabel,
} from "../lib/contracts";
import { CHAIN_ID } from "../lib/contracts";
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
import { fmtCCM } from "../lib/format";
import { IS_MAINNET } from "../lib/env";
import { usePersona } from "../lib/usePersona";
import { canWriteRoute } from "../lib/personas";
import ReadOnlyBanner from "../components/site/ReadOnlyBanner";

type AddressStr = `0x${string}`;
const ZERO = "0x0000000000000000000000000000000000000000";

interface RoundView {
  id: number;
  name: string;
  priceUsdc: bigint;        // 6 decimals
  hardCapTokens: bigint;    // 18 decimals
  soldTokens: bigint;       // 18 decimals
  cliffSeconds: bigint;
  vestSeconds: bigint;
  startTime: bigint;
  endTime: bigint;
  active: boolean;
}

const fmtUSDC = (raw: bigint | undefined): string => {
  if (raw === undefined) return "—";
  const whole = formatUnits(raw, 6);
  // trim trailing zeros after the decimal
  return whole.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
};

const fmtPriceUsdcPerCcm = (priceUsdc: bigint): string => {
  // priceUsdc is USDC per CCM (both per-unit). Display as e.g. "$0.150000"
  return `$${formatUnits(priceUsdc, 6)}`;
};

const fmtPct = (sold: bigint, hardCap: bigint): string => {
  if (hardCap === 0n) return "0.00%";
  const bps = Number((sold * 10000n) / hardCap);
  return `${(bps / 100).toFixed(2)}%`;
};

const fmtDuration = (secs: bigint): string => {
  const s = Number(secs);
  if (s === 0) return "0";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h`;
  return `${Math.floor(s / 60)}m`;
};

const fmtDateTime = (ts: bigint): string => {
  if (ts === 0n) return "—";
  return new Date(Number(ts) * 1000).toLocaleString();
};

export default function TgeAdmin() {
  const { address, isConnected } = useAccount();
  const env = chainLabel();
  const personaCtx = usePersona();
  const canWrite = !personaCtx.loading && canWriteRoute(personaCtx.persona, "/tge");

  const sale = CONTRACTS.ccmTgeSale as AddressStr;
  const ccm = CONTRACTS.ccmTokenV1 as AddressStr;
  const usdc = CONTRACTS.usdc as AddressStr;
  const saleDeployed = sale.toLowerCase() !== ZERO;

  // ─── SIWE / audit (same pattern as TokenAdmin) ───
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
      // Filter to TGE-relevant actions only
      setRecentAudit(rows.filter((r) =>
        ["create_round", "close_round", "whitelist_set", "whitelist_set_batch", "withdraw_usdc", "sign_in"].includes(r.action),
      ));
    } catch {
      // ignore
    }
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

  // ─── Read sale state ───
  const { data: roundCount, refetch: refetchRoundCount } = useReadContract({
    address: sale,
    abi: CCMTGESaleAbi,
    functionName: "getRoundCount",
    query: { enabled: saleDeployed, refetchInterval: 12000 },
  });

  // Read each round
  const N = Number(roundCount ?? 0n);
  const { data: roundsData, refetch: refetchRounds } = useReadContracts({
    contracts: saleDeployed && N > 0
      ? Array.from({ length: N }, (_, i) => ({
          address: sale,
          abi: CCMTGESaleAbi,
          functionName: "getRound" as const,
          args: [BigInt(i)] as const,
        }))
      : [],
    query: { enabled: saleDeployed && N > 0, refetchInterval: 12000 },
  });

  const rounds: RoundView[] = useMemo(() => {
    if (!roundsData) return [];
    return roundsData.map((r, i) => {
      const v = r.result as any;
      if (!v) {
        return {
          id: i, name: "?", priceUsdc: 0n, hardCapTokens: 0n, soldTokens: 0n,
          cliffSeconds: 0n, vestSeconds: 0n, startTime: 0n, endTime: 0n, active: false,
        };
      }
      return {
        id: i,
        name: v.name as string,
        priceUsdc: v.priceUsdc as bigint,
        hardCapTokens: v.hardCapTokens as bigint,
        soldTokens: v.soldTokens as bigint,
        cliffSeconds: v.cliffSeconds as bigint,
        vestSeconds: v.vestSeconds as bigint,
        startTime: v.startTime as bigint,
        endTime: v.endTime as bigint,
        active: v.active as boolean,
      };
    });
  }, [roundsData]);

  // Sale's USDC + CCM balances
  const { data: usdcBal, refetch: refetchUsdcBal } = useReadContract({
    address: usdc,
    abi: USDCAbi,
    functionName: "balanceOf",
    args: [sale],
    query: { enabled: saleDeployed, refetchInterval: 15000 },
  });
  const { data: ccmInSale } = useReadContract({
    address: ccm,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: [sale],
    query: { enabled: saleDeployed, refetchInterval: 15000 },
  });

  // Current wallet's role status on the sale
  const { data: adminRole } = useReadContract({
    address: sale,
    abi: CCMTGESaleAbi,
    functionName: "ADMIN_ROLE",
    query: { enabled: saleDeployed },
  });
  const { data: hasAdminRole } = useReadContract({
    address: sale,
    abi: CCMTGESaleAbi,
    functionName: "hasRole",
    args: address && adminRole ? [adminRole, address as AddressStr] : undefined,
    query: { enabled: !!(saleDeployed && address && adminRole), refetchInterval: 12000 },
  });
  const isAdmin = hasAdminRole === true;

  // ─── Tx state ───
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!session || !currentAuditId.current || !txHash) return;
    void logAuditUpdate(session, currentAuditId.current, { tx_hash: txHash, status: "submitted" });
  }, [txHash, session]);

  useEffect(() => {
    if (isSuccess) {
      void refetchRoundCount();
      void refetchRounds();
      void refetchUsdcBal();
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
  const [createForm, setCreateForm] = useState({
    name: "Seed",
    priceUsdc: "0.15",       // USDC per CCM
    hardCapCcm: "1000000",   // CCM (whole tokens)
    cliffDays: "365",
    vestDays: "1095",        // 3 years
    startTime: "",           // ISO local
    endTime: "",
  });

  const [whitelistRoundId, setWhitelistRoundId] = useState<number>(0);
  const [whitelistAddr, setWhitelistAddr] = useState("");
  const [whitelistCsv, setWhitelistCsv] = useState("");
  const [whitelistRemoveMode, setWhitelistRemoveMode] = useState(false);

  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  function doCreateRound() {
    let priceUsdcWei: bigint;
    let hardCapWei: bigint;
    let startTs: bigint;
    let endTs: bigint;
    let cliffSecs: bigint;
    let vestSecs: bigint;
    try {
      priceUsdcWei = parseUnits(createForm.priceUsdc, 6);
      hardCapWei = parseUnits(createForm.hardCapCcm, 18);
      startTs = BigInt(Math.floor(new Date(createForm.startTime).getTime() / 1000));
      endTs = BigInt(Math.floor(new Date(createForm.endTime).getTime() / 1000));
      cliffSecs = BigInt(Math.floor(parseFloat(createForm.cliffDays) * 86400));
      vestSecs = BigInt(Math.floor(parseFloat(createForm.vestDays) * 86400));
    } catch {
      return;
    }
    if (priceUsdcWei <= 0n || hardCapWei <= 0n) return;
    if (vestSecs < cliffSecs) return;
    if (endTs <= startTs) return;

    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "create_round",
        target_contract: sale,
      },
      () => writeContract({
        address: sale,
        abi: CCMTGESaleAbi,
        functionName: "createRound",
        args: [
          createForm.name,
          priceUsdcWei,
          hardCapWei,
          cliffSecs,
          vestSecs,
          startTs,
          endTs,
        ],
      }),
    );
  }

  function doCloseRound(roundId: number) {
    if (!confirm(`Close round #${roundId}? Investors won't be able to purchase further.`)) return;
    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "close_round",
        target_contract: sale,
      },
      () => writeContract({
        address: sale,
        abi: CCMTGESaleAbi,
        functionName: "closeRound",
        args: [BigInt(roundId)],
      }),
    );
  }

  function doWhitelistSingle() {
    if (!isAddress(whitelistAddr)) return;
    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "whitelist_set",
        target_contract: sale,
        target_address: whitelistAddr as AddressStr,
      },
      () => writeContract({
        address: sale,
        abi: CCMTGESaleAbi,
        functionName: "setWhitelist",
        args: [BigInt(whitelistRoundId), whitelistAddr as AddressStr, !whitelistRemoveMode],
      }),
    );
  }

  function parseCsvAddrs(input: string): { addrs: AddressStr[]; errors: string[] } {
    const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const errors: string[] = [];
    const addrs: AddressStr[] = [];
    const seen = new Set<string>();
    for (const l of lines) {
      // Allow `0x... [, anything]` — only first token matters
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
  const parsedCsv = useMemo(() => parseCsvAddrs(whitelistCsv), [whitelistCsv]);

  function doWhitelistBatch() {
    if (parsedCsv.addrs.length === 0) return;
    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "whitelist_set_batch",
        target_contract: sale,
      },
      () => writeContract({
        address: sale,
        abi: CCMTGESaleAbi,
        functionName: "setWhitelistBatch",
        args: [BigInt(whitelistRoundId), parsedCsv.addrs, !whitelistRemoveMode],
      }),
    );
  }

  function doWithdrawUSDC() {
    if (!isAddress(withdrawTo)) return;
    let amt: bigint;
    try { amt = parseUnits(withdrawAmount, 6); } catch { return; }
    if (amt <= 0n) return;
    if (!confirm(`Withdraw ${withdrawAmount} USDC to ${withdrawTo}?`)) return;
    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "withdraw_usdc",
        target_contract: sale,
        target_address: withdrawTo as AddressStr,
        amount_wei: amt.toString(),
      },
      () => writeContract({
        address: sale,
        abi: CCMTGESaleAbi,
        functionName: "withdrawUSDC",
        args: [withdrawTo as AddressStr, amt],
      }),
    );
  }

  // ─── Render ───
  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Token Generation Event · Phase 0</SectionLabel>
        <H1>Presale operations</H1>
        <Lede className="mt-5">
          Multi-tier SAFT presale: round creation, KYC whitelist, treasury
          withdrawal. Investors purchase via the dApp surface (or Safe-wrapped
          off-chain flow), the CCM tokens vest per round-defined cliff/vest
          schedule, and USDC accumulates in this contract for treasury
          withdrawal by the operator.
        </Lede>
      </header>

      {!canWrite && !personaCtx.loading && (
        <ReadOnlyBanner persona={personaCtx.persona} email={personaCtx.email} pageLabel="Presale" />
      )}

      {/* Mode banner — env-pinned at build, no "wrong network" possible */}
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
          {IS_MAINNET
            ? "Base · 8453 · Real funds. Every action is irreversible."
            : "Base Sepolia · 84532 · No real value. Safe to experiment."}
        </span>
        {saleDeployed && (
          <span className="font-mono text-[11px] ml-auto" style={{ color: "var(--ink-soft)" }}>
            sale: {sale.slice(0, 6)}…{sale.slice(-4)}
          </span>
        )}
      </div>

      {/* SIWE sign-in */}
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
              <button onClick={doSignOut} className="ml-auto underline" style={{ color: "var(--ink-soft)" }}>
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

      {isConnected && !saleDeployed && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            CCMTGESale is not yet deployed on this {env}.
            {!IS_MAINNET && " Deploy a rehearsal sale contract via scripts/deploy-tge-sale.ts and add its address to admin/src/lib/contracts.ts."}
            {IS_MAINNET && " Phase 0 mainnet deploy pending."}
          </p>
        </Card>
      )}

      {isConnected && saleDeployed && (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Stat label="Rounds" value={N.toString()} />
            <Stat
              label="Active rounds"
              value={rounds.filter((r) => r.active).length.toString()}
            />
            <Stat
              label="USDC in treasury"
              value={`${fmtUSDC(usdcBal as bigint | undefined)} USDC`}
            />
            <Stat
              label="CCM in sale (unsold)"
              value={`${fmtCCM(ccmInSale as bigint | undefined)} CCM`}
            />
          </div>

          {/* Role status */}
          <div className="flex flex-wrap gap-2">
            <span
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
              style={{
                borderColor: isAdmin ? "var(--moss)" : "var(--rule)",
                background: isAdmin ? "rgba(45,191,99,0.08)" : "transparent",
                color: isAdmin ? "var(--moss)" : "var(--ink-soft)",
              }}
            >
              {isAdmin ? "✓ ADMIN_ROLE" : "✗ no ADMIN_ROLE — read-only"}
            </span>
          </div>

          {/* Round list */}
          <Card>
            <H2 className="mb-4">Rounds</H2>
            {rounds.length === 0 ? (
              <p style={{ color: "var(--ink-soft)" }}>No rounds yet. Create the first below.</p>
            ) : (
              <div className="space-y-3">
                {rounds.map((r) => (
                  <RoundRow
                    key={r.id}
                    r={r}
                    canClose={canWrite && isAdmin && !busy && r.active}
                    onClose={() => doCloseRound(r.id)}
                    onSelectWhitelist={() => setWhitelistRoundId(r.id)}
                    selectedWhitelist={whitelistRoundId === r.id}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Create round */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Create round</H2>
              <span
                className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                style={{
                  borderColor: isAdmin ? "var(--moss)" : "var(--rule)",
                  color: isAdmin ? "var(--moss)" : "var(--ink-soft)",
                }}
              >
                {isAdmin ? "✓ ADMIN" : "✗ ADMIN_ROLE required"}
              </span>
            </div>
            <p className="mb-5" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>
              Tokens for the round must be transferred to the sale contract <em className="italic-moss">before</em> investors can purchase. Cliff
              cannot exceed vest. Time is local — converted to UTC unix seconds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Round name (e.g. Seed, Series A)">
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Price (USDC per 1 CCM, e.g. 0.15)">
                <input
                  type="text"
                  value={createForm.priceUsdc}
                  onChange={(e) => setCreateForm({ ...createForm, priceUsdc: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Hard cap (whole CCM)">
                <input
                  type="text"
                  value={createForm.hardCapCcm}
                  onChange={(e) => setCreateForm({ ...createForm, hardCapCcm: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Cliff (days)">
                <input
                  type="text"
                  value={createForm.cliffDays}
                  onChange={(e) => setCreateForm({ ...createForm, cliffDays: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Total vest duration (days, ≥ cliff)">
                <input
                  type="text"
                  value={createForm.vestDays}
                  onChange={(e) => setCreateForm({ ...createForm, vestDays: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Start (local)">
                <input
                  type="datetime-local"
                  value={createForm.startTime}
                  onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="End (local)">
                <input
                  type="datetime-local"
                  value={createForm.endTime}
                  onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
            </div>
            <div className="mt-5">
              <CTA
                label={busy ? "Creating…" : "Create round"}
                onClick={doCreateRound}
                disabled={
                  !canWrite || !isAdmin || busy ||
                  !createForm.name ||
                  !createForm.priceUsdc ||
                  !createForm.hardCapCcm ||
                  !createForm.startTime ||
                  !createForm.endTime
                }
              />
            </div>
          </Card>

          {/* Whitelist */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Whitelist</H2>
              <span
                className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                style={{
                  borderColor: isAdmin ? "var(--moss)" : "var(--rule)",
                  color: isAdmin ? "var(--moss)" : "var(--ink-soft)",
                }}
              >
                {isAdmin ? "✓ ADMIN" : "✗ ADMIN_ROLE required"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4 mb-4">
              <Field label="Round">
                <select
                  value={whitelistRoundId}
                  onChange={(e) => setWhitelistRoundId(parseInt(e.target.value))}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                >
                  {rounds.length === 0 ? (
                    <option value={0}>(no rounds yet)</option>
                  ) : (
                    rounds.map((r) => (
                      <option key={r.id} value={r.id}>
                        #{r.id} · {r.name} {r.active ? "" : "(closed)"}
                      </option>
                    ))
                  )}
                </select>
              </Field>
              <Field label="Mode">
                <div className="flex items-center gap-3 font-mono text-[13px] py-1" style={{ color: "var(--ink)" }}>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={!whitelistRemoveMode}
                      onChange={() => setWhitelistRemoveMode(false)}
                      style={{ accentColor: "var(--moss)" }}
                    />
                    <span>Add (set true)</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={whitelistRemoveMode}
                      onChange={() => setWhitelistRemoveMode(true)}
                      style={{ accentColor: "var(--clay)" }}
                    />
                    <span>Remove (set false)</span>
                  </label>
                </div>
              </Field>
            </div>

            <H3 className="mb-3 mt-2">Single address</H3>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_auto] gap-3 items-end mb-6">
              <Field label="Address">
                <input
                  type="text"
                  value={whitelistAddr}
                  onChange={(e) => setWhitelistAddr(e.target.value)}
                  placeholder="0x…"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <CTA
                label={busy ? "…" : whitelistRemoveMode ? "Remove" : "Add"}
                onClick={doWhitelistSingle}
                disabled={!canWrite || !isAdmin || busy || !whitelistAddr || rounds.length === 0}
                variant={whitelistRemoveMode ? "ghost" : "primary"}
              />
            </div>

            <H3 className="mb-3">Batch (CSV)</H3>
            <p className="mb-3" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.55 }}>
              One address per line. Comments after the address (separator: comma or whitespace) are ignored — useful for pasting from a spreadsheet.
            </p>
            <textarea
              value={whitelistCsv}
              onChange={(e) => setWhitelistCsv(e.target.value)}
              rows={8}
              spellCheck={false}
              placeholder="0x1111111111111111111111111111111111111111&#10;0x2222222222222222222222222222222222222222 acme capital"
              className="w-full bg-transparent border px-3 py-2 font-mono text-[12px]"
              style={{
                borderColor: "var(--rule)",
                color: "var(--ink)",
                background: "var(--paper)",
                resize: "vertical",
              }}
            />
            <div
              className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-1"
              style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}
            >
              <Stat label="Valid addresses" value={parsedCsv.addrs.length.toString()} />
              <Stat label="Errors" value={parsedCsv.errors.length.toString()} />
              <Stat label="Mode" value={whitelistRemoveMode ? "remove" : "add"} />
            </div>
            {parsedCsv.errors.length > 0 && (
              <ul className="mt-3 space-y-1 font-mono text-[11px]" style={{ color: "#ef4444" }}>
                {parsedCsv.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>✗ {e}</li>
                ))}
                {parsedCsv.errors.length > 5 && (
                  <li style={{ color: "var(--ink-soft)" }}>
                    + {parsedCsv.errors.length - 5} more…
                  </li>
                )}
              </ul>
            )}
            <div className="mt-5">
              <CTA
                label={
                  busy
                    ? "Sending batch…"
                    : whitelistRemoveMode
                      ? `Remove ${parsedCsv.addrs.length} from whitelist`
                      : `Add ${parsedCsv.addrs.length} to whitelist`
                }
                onClick={doWhitelistBatch}
                disabled={!canWrite || !isAdmin || busy || parsedCsv.addrs.length === 0 || rounds.length === 0}
              />
            </div>
          </Card>

          {/* Treasury */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>USDC treasury</H2>
              <span
                className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                style={{
                  borderColor: isAdmin ? "var(--moss)" : "var(--rule)",
                  color: isAdmin ? "var(--moss)" : "var(--ink-soft)",
                }}
              >
                {isAdmin ? "✓ ADMIN" : "✗ ADMIN_ROLE required"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 mb-5"
                 style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
              <Stat label="USDC balance held" value={`${fmtUSDC(usdcBal as bigint | undefined)} USDC`} />
              <Stat label="Sale contract" value={
                <CopyableAddress address={sale} withExplorer />
              } />
              <Stat label="USDC token" value={
                <CopyableAddress address={usdc} withExplorer />
              } />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3 items-end">
              <Field label="Withdraw to">
                <input
                  type="text"
                  value={withdrawTo}
                  onChange={(e) => setWithdrawTo(e.target.value)}
                  placeholder="0x…"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Amount (USDC)">
                <input
                  type="text"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
              <CTA
                label={busy ? "Withdrawing…" : "Withdraw"}
                onClick={doWithdrawUSDC}
                disabled={!canWrite || !isAdmin || busy || !withdrawTo || !withdrawAmount}
                variant="ghost"
              />
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

          {/* Recent TGE actions */}
          {session && recentAudit.length > 0 && (
            <Card>
              <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
                <H3>Recent TGE actions</H3>
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
                  >
                    <span style={{ width: 110, color: "var(--ink)" }}>
                      {row.action.replaceAll("_", " ")}
                    </span>
                    <span className="flex-1 truncate" style={{ color: "var(--ink-soft)" }}>
                      {row.target_address ? `${row.target_address.slice(0, 6)}…${row.target_address.slice(-4)}` : ""}
                      {row.amount_wei ? ` · ${fmtUSDC(BigInt(row.amount_wei))} USDC` : ""}
                    </span>
                    {row.tx_hash && (
                      <a
                        href={`${EXPLORER}/tx/${row.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                        style={{ color: "var(--moss)" }}
                      >
                        {row.tx_hash.slice(0, 8)}…
                      </a>
                    )}
                    <span style={{ width: 70, textAlign: "right", color:
                      row.status === "confirmed" ? "var(--moss)" :
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

function RoundRow({
  r,
  canClose,
  onClose,
  onSelectWhitelist,
  selectedWhitelist,
}: {
  r: RoundView;
  canClose: boolean;
  onClose: () => void;
  onSelectWhitelist: () => void;
  selectedWhitelist: boolean;
}) {
  const usdcRaisedThisRound = (r.soldTokens * r.priceUsdc) / 10n ** 18n;
  const now = BigInt(Math.floor(Date.now() / 1000));
  let timeStatus: string;
  let timeColor = "var(--ink-soft)";
  if (now < r.startTime) {
    timeStatus = `starts ${fmtDateTime(r.startTime)}`;
    timeColor = "var(--clay)";
  } else if (now <= r.endTime) {
    timeStatus = `live · ends ${fmtDateTime(r.endTime)}`;
    timeColor = "var(--moss)";
  } else {
    timeStatus = `ended ${fmtDateTime(r.endTime)}`;
  }

  return (
    <div
      className="border p-4"
      style={{
        background: selectedWhitelist ? "rgba(45,191,99,0.04)" : "transparent",
        borderColor: selectedWhitelist ? "var(--moss)" : "var(--rule)",
      }}
    >
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>
            #{r.id}
          </span>
          <span className="font-display" style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)" }}>
            {r.name}
          </span>
          <span
            className="font-mono text-[10px] tracking-[0.14em] uppercase px-1.5 py-0.5 border"
            style={{
              borderColor: r.active ? "var(--moss)" : "var(--ink-soft)",
              color: r.active ? "var(--moss)" : "var(--ink-soft)",
            }}
          >
            {r.active ? "active" : "closed"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSelectWhitelist}
            className="font-mono text-[11px] tracking-[0.14em] uppercase px-3 py-1 border"
            style={{
              background: selectedWhitelist ? "var(--moss)" : "transparent",
              color: selectedWhitelist ? "var(--paper)" : "var(--ink)",
              borderColor: selectedWhitelist ? "var(--moss)" : "var(--rule)",
            }}
          >
            {selectedWhitelist ? "✓ whitelist target" : "Whitelist this round"}
          </button>
          {canClose && (
            <button
              onClick={onClose}
              className="font-mono text-[11px] tracking-[0.14em] uppercase px-3 py-1 border"
              style={{
                background: "transparent",
                color: "var(--clay)",
                borderColor: "var(--clay)",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mb-3">
        <Field2 label="Price" value={`${fmtPriceUsdcPerCcm(r.priceUsdc)} / CCM`} />
        <Field2
          label="Sold / Hardcap"
          value={`${fmtCCM(r.soldTokens)} / ${fmtCCM(r.hardCapTokens, 0)} (${fmtPct(r.soldTokens, r.hardCapTokens)})`}
        />
        <Field2 label="USDC raised" value={`${fmtUSDC(usdcRaisedThisRound)} USDC`} />
        <Field2 label="Time" value={timeStatus} color={timeColor} />
        <Field2 label="Cliff" value={fmtDuration(r.cliffSeconds)} />
        <Field2 label="Vest total" value={fmtDuration(r.vestSeconds)} />
        <Field2 label="Start" value={fmtDateTime(r.startTime)} />
        <Field2 label="End" value={fmtDateTime(r.endTime)} />
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: "var(--rule)" }}>
        <div
          className="h-1"
          style={{
            width: r.hardCapTokens > 0n ? `${Number((r.soldTokens * 10000n) / r.hardCapTokens) / 100}%` : "0%",
            background: "var(--moss)",
          }}
        />
      </div>
    </div>
  );
}

function Field2({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div
        className="font-mono text-[9px] tracking-[0.14em] uppercase"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </div>
      <div
        className="font-mono text-[11px] mt-0.5"
        style={{ color: color || "var(--ink)" }}
      >
        {value}
      </div>
    </div>
  );
}
