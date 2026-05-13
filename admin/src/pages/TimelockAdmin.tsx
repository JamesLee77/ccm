import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  encodeFunctionData,
  keccak256,
  parseUnits,
  toHex,
} from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContracts,
  useSignMessage,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CCMKYCRegistryAbi,
  CCMTimelockAbi,
  CCMTokenAbi,
  CCMTGESaleAbi,
  CCMVestingAbi,
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
type Hash = `0x${string}`;
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000" as Hash;

// ──────────────────────────────────────────────────────
// Common admin operations the operator can wrap in a Timelock schedule.
// Each builder produces (target, calldata) for the action.
// ──────────────────────────────────────────────────────

type ActionId =
  | "token_mint"
  | "token_pause"
  | "token_unpause"
  | "token_grant"
  | "token_revoke"
  | "vesting_create_schedule"
  | "vesting_revoke"
  | "kyc_set"
  | "tge_close_round"
  | "tge_withdraw_usdc"
  | "custom";

interface ActionBuilder {
  id: ActionId;
  label: string;
  defaultTarget: AddressStr;
  description: string;
  fields: { name: string; label: string; placeholder?: string; type?: string }[];
  build: (
    args: Record<string, string>,
    targets: { token: AddressStr; vesting: AddressStr; tge: AddressStr; kyc: AddressStr },
  ) => { target: AddressStr; data: Hash };
}

function buildActions(c: typeof CONTRACTS): ActionBuilder[] {
  const token = c.ccmTokenV1 as AddressStr;
  const vesting = c.ccmVesting as AddressStr;
  const kyc = c.ccmKycRegistry as AddressStr;
  const tge = c.ccmTgeSale as AddressStr;

  return [
    {
      id: "token_mint",
      label: "Token: mint",
      defaultTarget: token,
      description: "Mint CCM to a recipient. Requires MINTER_ROLE held by Timelock.",
      fields: [
        { name: "to", label: "Recipient", placeholder: "0x…" },
        { name: "amount", label: "Amount (whole CCM)", placeholder: "1000" },
      ],
      build: (args) => ({
        target: token,
        data: encodeFunctionData({
          abi: CCMTokenAbi,
          functionName: "mint",
          args: [args.to as AddressStr, parseUnits(args.amount, 18)],
        }) as Hash,
      }),
    },
    {
      id: "token_pause",
      label: "Token: pause",
      defaultTarget: token,
      description: "Freeze all CCM transfers. Requires PAUSER_ROLE held by Timelock.",
      fields: [],
      build: () => ({
        target: token,
        data: encodeFunctionData({ abi: CCMTokenAbi, functionName: "pause", args: [] }) as Hash,
      }),
    },
    {
      id: "token_unpause",
      label: "Token: unpause",
      defaultTarget: token,
      description: "Re-enable transfers.",
      fields: [],
      build: () => ({
        target: token,
        data: encodeFunctionData({ abi: CCMTokenAbi, functionName: "unpause", args: [] }) as Hash,
      }),
    },
    {
      id: "token_grant",
      label: "Token: grant role",
      defaultTarget: token,
      description: "Grant a role on the token. Requires DEFAULT_ADMIN_ROLE held by Timelock.",
      fields: [
        { name: "role", label: "Role hash (DEFAULT_ADMIN_ROLE / MINTER_ROLE / PAUSER_ROLE)", placeholder: "0x…" },
        { name: "account", label: "Grantee", placeholder: "0x…" },
      ],
      build: (args) => ({
        target: token,
        data: encodeFunctionData({
          abi: CCMTokenAbi,
          functionName: "grantRole",
          args: [args.role as Hash, args.account as AddressStr],
        }) as Hash,
      }),
    },
    {
      id: "token_revoke",
      label: "Token: revoke role",
      defaultTarget: token,
      description: "Revoke a role on the token.",
      fields: [
        { name: "role", label: "Role hash", placeholder: "0x…" },
        { name: "account", label: "From address", placeholder: "0x…" },
      ],
      build: (args) => ({
        target: token,
        data: encodeFunctionData({
          abi: CCMTokenAbi,
          functionName: "revokeRole",
          args: [args.role as Hash, args.account as AddressStr],
        }) as Hash,
      }),
    },
    {
      id: "vesting_create_schedule",
      label: "Vesting: create schedule",
      defaultTarget: vesting,
      description: "Create a single vesting schedule. Requires SCHEDULE_MANAGER_ROLE.",
      fields: [
        { name: "beneficiary", label: "Beneficiary", placeholder: "0x…" },
        { name: "amount", label: "Amount (whole CCM)", placeholder: "100000" },
        { name: "startTime", label: "Start (unix sec)", placeholder: "1799999999" },
        { name: "cliffSeconds", label: "Cliff (sec)", placeholder: "31536000" },
        { name: "vestSeconds", label: "Vest (sec, ≥ cliff)", placeholder: "94608000" },
        { name: "revocable", label: "Revocable (true/false)", placeholder: "false" },
      ],
      build: (args) => ({
        target: vesting,
        data: encodeFunctionData({
          abi: CCMVestingAbi,
          functionName: "createSchedule",
          args: [
            args.beneficiary as AddressStr,
            parseUnits(args.amount, 18),
            BigInt(args.startTime),
            BigInt(args.cliffSeconds),
            BigInt(args.vestSeconds),
            args.revocable === "true",
          ],
        }) as Hash,
      }),
    },
    {
      id: "vesting_revoke",
      label: "Vesting: revoke schedule",
      defaultTarget: vesting,
      description: "Revoke a revocable vesting schedule. Requires SCHEDULE_MANAGER_ROLE.",
      fields: [{ name: "id", label: "Schedule id", placeholder: "0" }],
      build: (args) => ({
        target: vesting,
        data: encodeFunctionData({
          abi: CCMVestingAbi,
          functionName: "revoke",
          args: [BigInt(args.id)],
        }) as Hash,
      }),
    },
    {
      id: "kyc_set",
      label: "KYC: set status",
      defaultTarget: kyc,
      description: "Flip KYC status for a user. Requires KYC_OPERATOR_ROLE held by Timelock (typically held by Safe directly).",
      fields: [
        { name: "user", label: "User address", placeholder: "0x…" },
        { name: "ok", label: "Status (true/false)", placeholder: "true" },
      ],
      build: (args) => ({
        target: kyc,
        data: encodeFunctionData({
          abi: CCMKYCRegistryAbi,
          functionName: "setKYCed",
          args: [args.user as AddressStr, args.ok === "true"],
        }) as Hash,
      }),
    },
    {
      id: "tge_close_round",
      label: "TGE: close round",
      defaultTarget: tge,
      description: "Close a TGE sale round. Requires ADMIN_ROLE held by Timelock.",
      fields: [{ name: "roundId", label: "Round id", placeholder: "0" }],
      build: (args) => ({
        target: tge,
        data: encodeFunctionData({
          abi: CCMTGESaleAbi,
          functionName: "closeRound",
          args: [BigInt(args.roundId)],
        }) as Hash,
      }),
    },
    {
      id: "tge_withdraw_usdc",
      label: "TGE: withdraw USDC",
      defaultTarget: tge,
      description: "Withdraw USDC from sale contract. Requires ADMIN_ROLE held by Timelock.",
      fields: [
        { name: "to", label: "Withdraw to", placeholder: "0x…" },
        { name: "amount", label: "Amount (USDC, 6 decimals)", placeholder: "150" },
      ],
      build: (args) => ({
        target: tge,
        data: encodeFunctionData({
          abi: CCMTGESaleAbi,
          functionName: "withdrawUSDC",
          args: [args.to as AddressStr, parseUnits(args.amount, 6)],
        }) as Hash,
      }),
    },
    {
      id: "custom",
      label: "Custom: paste calldata",
      defaultTarget: ZERO_ADDR as AddressStr,
      description: "For operations not covered by the templates above. Operator pastes raw calldata hex.",
      fields: [
        { name: "target", label: "Target contract", placeholder: "0x…" },
        { name: "data", label: "Calldata (0x-prefixed hex)", placeholder: "0x…" },
      ],
      build: (args) => ({
        target: args.target as AddressStr,
        data: args.data as Hash,
      }),
    },
  ];
}

// ──────────────────────────────────────────────────────
// Decode known calldata for display in pending op list
// ──────────────────────────────────────────────────────

function decodeCalldata(target: string, data: string): string {
  if (!data || data.length < 10) return "—";
  const selector = data.slice(0, 10);
  const map: Record<string, string> = {
    "0x40c10f19": "mint(to,amount)",
    "0x8456cb59": "pause()",
    "0x3f4ba83a": "unpause()",
    "0x2f2ff15d": "grantRole(role,account)",
    "0xd547741f": "revokeRole(role,account)",
    "0x36568abe": "renounceRole(role,account)",
    "0x9d63848a": "createSchedule(...)",
    "0x74a8f103": "revoke(id)",
    "0x29c5e10b": "setKYCed(user,ok)",
    "0x3ff0c41a": "setKYCedBatchUniform(...)",
    "0x96b08d0e": "closeRound(id)",
    "0xb5cb15f2": "withdrawUSDC(to,amount)",
    "0x9a99b4f0": "createRound(...)",
    "0x49aff1a0": "setWhitelist(...)",
    "0xa9059cbb": "transfer(to,amount)",
  };
  return `${map[selector] ?? "unknown"} → ${target.slice(0, 6)}…${target.slice(-4)}`;
}

interface PendingOp {
  id: Hash;
  index: bigint;
  target: AddressStr;
  value: bigint;
  data: Hash;
  predecessor: Hash;
  delay: bigint;
  blockNumber: bigint;
  txHash: Hash;
  // computed
  eta: bigint;
  ready: boolean;
  done: boolean;
}

export default function TimelockAdmin() {
  const { address, isConnected } = useAccount();
  const env = chainLabel();
  const client = usePublicClient();
  const personaCtx = usePersona();
  const canWrite = !personaCtx.loading && canWriteRoute(personaCtx.persona, "/timelock");

  const timelock = CONTRACTS.ccmTimelock as AddressStr;
  const timelockDeployed = timelock.toLowerCase() !== ZERO_ADDR;

  const builders = useMemo(() => buildActions(CONTRACTS), []);

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
        ["schedule_op", "execute_op", "cancel_op", "sign_in"].includes(r.action),
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

  // ─── Read timelock state ───
  const { data: state, refetch: refetchState } = useReadContracts({
    contracts: timelockDeployed
      ? [
          { address: timelock, abi: CCMTimelockAbi, functionName: "getMinDelay" },
          { address: timelock, abi: CCMTimelockAbi, functionName: "MIN_DELAY" },
          { address: timelock, abi: CCMTimelockAbi, functionName: "VERSION" },
          { address: timelock, abi: CCMTimelockAbi, functionName: "PROPOSER_ROLE" },
          { address: timelock, abi: CCMTimelockAbi, functionName: "EXECUTOR_ROLE" },
          { address: timelock, abi: CCMTimelockAbi, functionName: "CANCELLER_ROLE" },
        ]
      : [],
    query: { enabled: timelockDeployed, refetchInterval: 30000 },
  });
  const minDelay = state?.[0]?.result as bigint | undefined;
  const minDelayPolicy = state?.[1]?.result as bigint | undefined;
  const version = state?.[2]?.result as string | undefined;
  const proposerRole = state?.[3]?.result as Hash | undefined;
  const executorRole = state?.[4]?.result as Hash | undefined;
  const cancellerRole = state?.[5]?.result as Hash | undefined;

  // Connected wallet roles
  const { data: myRoles, refetch: refetchRoles } = useReadContracts({
    contracts:
      timelockDeployed && address && proposerRole && executorRole && cancellerRole
        ? [
            { address: timelock, abi: CCMTimelockAbi, functionName: "hasRole", args: [proposerRole, address] },
            { address: timelock, abi: CCMTimelockAbi, functionName: "hasRole", args: [executorRole, address] },
            { address: timelock, abi: CCMTimelockAbi, functionName: "hasRole", args: [cancellerRole, address] },
          ]
        : [],
    query: {
      enabled: !!(timelockDeployed && address && proposerRole && executorRole && cancellerRole),
      refetchInterval: 12000,
    },
  });
  const isProposer = myRoles?.[0]?.result === true;
  const isExecutor = myRoles?.[1]?.result === true;
  const isCanceller = myRoles?.[2]?.result === true;

  // ─── Read pending ops list from CallScheduled events ───
  const [pending, setPending] = useState<PendingOp[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!client || !timelockDeployed) return;
    let cancelled = false;
    (async () => {
      setLoadingPending(true);
      try {
        // Query last ~50_000 blocks for CallScheduled events (Sepolia is fast,
        // 50k blocks ≈ a few days at 2s block time)
        const head = await client.getBlockNumber();
        const fromBlock = head > 50_000n ? head - 50_000n : 0n;
        const logs = await client.getLogs({
          address: timelock,
          event: {
            type: "event",
            name: "CallScheduled",
            inputs: [
              { name: "id", type: "bytes32", indexed: true },
              { name: "index", type: "uint256", indexed: true },
              { name: "target", type: "address" },
              { name: "value", type: "uint256" },
              { name: "data", type: "bytes" },
              { name: "predecessor", type: "bytes32" },
              { name: "delay", type: "uint256" },
            ],
          },
          fromBlock,
          toBlock: head,
        });

        const ops: PendingOp[] = [];
        for (const log of logs) {
          const id = log.args.id as Hash;
          // Ask the contract whether each id is still pending / ready / done
          const ts = (await client.readContract({
            address: timelock,
            abi: CCMTimelockAbi,
            functionName: "getTimestamp",
            args: [id],
          })) as bigint;
          // ts == 0 → never scheduled or cancelled
          // ts == 1 → done (DONE_TIMESTAMP)
          // ts > 1 → eta
          const done = ts === 1n;
          const cancelled = ts === 0n;
          if (cancelled) continue;
          const eta = done ? 0n : ts;
          const ready = !done && eta > 0n && BigInt(Math.floor(Date.now() / 1000)) >= eta;
          ops.push({
            id,
            index: log.args.index as bigint,
            target: log.args.target as AddressStr,
            value: log.args.value as bigint,
            data: log.args.data as Hash,
            predecessor: log.args.predecessor as Hash,
            delay: log.args.delay as bigint,
            blockNumber: log.blockNumber!,
            txHash: log.transactionHash!,
            eta,
            ready,
            done,
          });
        }
        // Sort: most recent first
        ops.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        if (!cancelled) setPending(ops);
      } finally {
        if (!cancelled) setLoadingPending(false);
      }
    })();
    return () => { cancelled = true; };
  }, [client, timelockDeployed, timelock, reload]);

  // ─── Tx state ───
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!session || !currentAuditId.current || !txHash) return;
    void logAuditUpdate(session, currentAuditId.current, { tx_hash: txHash, status: "submitted" });
  }, [txHash, session]);
  useEffect(() => {
    if (isSuccess) {
      void refetchState();
      void refetchRoles();
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

  // ─── Schedule new op form ───
  const [activeAction, setActiveAction] = useState<ActionId>("token_mint");
  const [actionArgs, setActionArgs] = useState<Record<string, string>>({});
  const [scheduleDelay, setScheduleDelay] = useState<string>(
    minDelay !== undefined ? minDelay.toString() : "172800",
  );

  useEffect(() => {
    // When minDelay loads, initialize scheduleDelay default
    if (minDelay !== undefined && scheduleDelay === "172800") {
      setScheduleDelay(minDelay.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDelay]);

  const activeBuilder = builders.find((b) => b.id === activeAction)!;

  function doSchedule() {
    let built: { target: AddressStr; data: Hash };
    try {
      built = activeBuilder.build(actionArgs, {
        token: CONTRACTS.ccmTokenV1 as AddressStr,
        vesting: CONTRACTS.ccmVesting as AddressStr,
        tge: CONTRACTS.ccmTgeSale as AddressStr,
        kyc: CONTRACTS.ccmKycRegistry as AddressStr,
      });
    } catch (e: any) {
      alert(`Build failed: ${e?.message ?? e}`);
      return;
    }
    const salt = keccak256(toHex(`${activeAction}:${Date.now()}:${address}`)) as Hash;
    const delay = BigInt(scheduleDelay);

    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "schedule_op",
        target_contract: timelock,
        target_address: built.target,
        notes: `${activeBuilder.label} · delay=${delay}s · ${decodeCalldata(built.target, built.data)}`,
      },
      () =>
        writeContract({
          address: timelock,
          abi: CCMTimelockAbi,
          functionName: "schedule",
          args: [built.target, 0n, built.data, ZERO_HASH as Hash, salt, delay],
        }),
    );
  }

  function doCancel(op: PendingOp) {
    if (!confirm(`Cancel scheduled op ${op.id.slice(0, 10)}…?`)) return;
    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "cancel_op",
        target_contract: timelock,
        notes: `op ${op.id} · target ${op.target}`,
      },
      () => writeContract({
        address: timelock,
        abi: CCMTimelockAbi,
        functionName: "cancel",
        args: [op.id],
      }),
    );
  }

  function doExecute(op: PendingOp) {
    void auditedWrite(
      {
        chain_id: CHAIN_ID,
        action: "execute_op",
        target_contract: timelock,
        target_address: op.target,
        notes: `op ${op.id} · ${decodeCalldata(op.target, op.data)}`,
      },
      () => writeContract({
        address: timelock,
        abi: CCMTimelockAbi,
        functionName: "execute",
        args: [op.target, op.value, op.data, op.predecessor, ZERO_HASH as Hash],
      }),
    );
  }

  // ─── Render ───
  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Timelock · governance gateway</SectionLabel>
        <H1>Timelock scheduler</H1>
        <Lede className="mt-5">
          Wraps every privileged action behind a {minDelay !== undefined ? Number(minDelay) / 3600 : 48}h delay.
          On mainnet this is the <em className="italic-moss">only</em> way to mint, pause, grant roles, manage vesting,
          or close TGE rounds — the deployer EOA holds nothing post-handoff.
          Operator schedules an op here, optionally cancels before execution, and
          executes after the delay elapses. The proposer/executor is typically the
          Gnosis Safe multisig.
        </Lede>
      </header>

      {!canWrite && !personaCtx.loading && (
        <ReadOnlyBanner persona={personaCtx.persona} email={personaCtx.email} pageLabel="Timelock" />
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
          {minDelay !== undefined && ` · ${Number(minDelay) / 3600}h delay`}
          {version && ` · v${version}`}
        </span>
        {timelockDeployed && (
          <span className="font-mono text-[11px] ml-auto" style={{ color: "var(--ink-soft)" }}>
            timelock: {timelock.slice(0, 6)}…{timelock.slice(-4)}
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

      {isConnected && !timelockDeployed && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            CCMTimelock is not yet deployed on this {env}.
          </p>
        </Card>
      )}

      {isConnected && timelockDeployed && (
        <>
          {/* KPIs + roles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat
              label="Min delay (active)"
              value={minDelay !== undefined ? `${Number(minDelay) / 3600}h (${minDelay}s)` : "—"}
            />
            <Stat
              label="Min delay (policy floor)"
              value={minDelayPolicy !== undefined ? `${Number(minDelayPolicy) / 3600}h` : "—"}
            />
            <Stat label="Pending ops" value={pending.filter((o) => !o.done).length.toString()} />
          </div>

          <div className="flex flex-wrap gap-2">
            <RoleBadge label="PROPOSER_ROLE" active={isProposer} />
            <RoleBadge label="EXECUTOR_ROLE" active={isExecutor} />
            <RoleBadge label="CANCELLER_ROLE" active={isCanceller} />
            {!isProposer && !isExecutor && !isCanceller && (
              <span
                className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                style={{ borderColor: "var(--rule)", color: "var(--ink-soft)" }}
              >
                No roles — read-only
              </span>
            )}
          </div>

          {/* Schedule new op */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <H2>Schedule new operation</H2>
              <span
                className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
                style={{
                  borderColor: isProposer ? "var(--moss)" : "var(--rule)",
                  color: isProposer ? "var(--moss)" : "var(--ink-soft)",
                }}
              >
                {isProposer ? "✓ PROPOSER" : "✗ PROPOSER_ROLE required"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end mb-4">
              <Field label="Action">
                <select
                  value={activeAction}
                  onChange={(e) => { setActiveAction(e.target.value as ActionId); setActionArgs({}); }}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                >
                  {builders.map((b) => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </Field>
              <Field label={`Delay (sec, min ${minDelay?.toString() ?? "?"})`}>
                <input
                  type="text"
                  value={scheduleDelay}
                  onChange={(e) => setScheduleDelay(e.target.value)}
                  className="bg-transparent border px-3 py-2 font-mono text-sm w-32"
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                />
              </Field>
            </div>

            <p className="mb-4" style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.55 }}>
              {activeBuilder.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {activeBuilder.fields.map((f) => (
                <Field key={f.name} label={f.label}>
                  <input
                    type={f.type ?? "text"}
                    value={actionArgs[f.name] ?? ""}
                    onChange={(e) => setActionArgs({ ...actionArgs, [f.name]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                    style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                  />
                </Field>
              ))}
            </div>

            <div>
              <CTA
                label={busy ? "Scheduling…" : "Schedule"}
                onClick={doSchedule}
                disabled={!canWrite || !isProposer || busy ||
                  activeBuilder.fields.some((f) => !actionArgs[f.name])}
              />
            </div>
          </Card>

          {/* Pending operations */}
          <Card>
            <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
              <H2>Pending / past operations</H2>
              <button onClick={() => setReload((r) => r + 1)}
                className="font-mono text-[11px] tracking-[0.14em] uppercase underline"
                style={{ color: "var(--ink-soft)" }}>
                refresh
              </button>
            </div>
            {loadingPending && (
              <p className="font-mono text-sm" style={{ color: "var(--ink-soft)" }}>Loading events…</p>
            )}
            {!loadingPending && pending.length === 0 && (
              <p style={{ color: "var(--ink-soft)" }}>No scheduled operations.</p>
            )}
            <div className="space-y-3">
              {pending.map((op) => (
                <OpRow
                  key={op.id}
                  op={op}
                  isExecutor={canWrite && isExecutor}
                  isCanceller={canWrite && isCanceller}
                  busy={busy}
                  onExecute={() => doExecute(op)}
                  onCancel={() => doCancel(op)}
                />
              ))}
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

          {/* Recent timelock actions */}
          {session && recentAudit.length > 0 && (
            <Card>
              <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
                <H3>Recent timelock actions</H3>
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>
                  last {recentAudit.length}
                </span>
              </div>
              <div className="border" style={{ borderColor: "var(--rule)" }}>
                {recentAudit.map((row) => (
                  <div key={row.id}
                    className="font-mono text-[11px] flex items-center gap-3 px-3 py-2 border-b last:border-b-0"
                    style={{ borderColor: "var(--rule)" }}
                    title={row.notes || undefined}>
                    <span style={{ width: 100, color: "var(--ink)" }}>{row.action.replaceAll("_", " ")}</span>
                    <span className="flex-1 truncate" style={{ color: "var(--ink-soft)" }}>
                      {row.target_address ? `${row.target_address.slice(0, 6)}…${row.target_address.slice(-4)}` : ""}
                      {row.notes ? ` · ${row.notes.slice(0, 50)}${row.notes.length > 50 ? "…" : ""}` : ""}
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

function OpRow({
  op,
  isExecutor,
  isCanceller,
  busy,
  onExecute,
  onCancel,
}: {
  op: PendingOp;
  isExecutor: boolean;
  isCanceller: boolean;
  busy: boolean;
  onExecute: () => void;
  onCancel: () => void;
}) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const remaining = op.eta > now ? op.eta - now : 0n;
  const status: { label: string; color: string } = op.done
    ? { label: "DONE", color: "var(--moss)" }
    : op.ready
      ? { label: "READY", color: "var(--moss)" }
      : { label: "WAITING", color: "var(--clay)" };

  const decoded = decodeCalldata(op.target, op.data);

  return (
    <div className="border p-3" style={{ background: "var(--paper-deep)", borderColor: "var(--rule)" }}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase px-1.5 py-0.5"
            style={{ color: status.color, fontWeight: 600 }}>
            {status.label}
          </span>
          <span className="font-mono text-[11px]" style={{ color: "var(--ink)" }}>
            {decoded}
          </span>
        </div>
        <div className="flex gap-2">
          {!op.done && op.ready && isExecutor && (
            <button onClick={onExecute} disabled={busy}
              className="font-mono text-[11px] tracking-[0.14em] uppercase px-3 py-1 border"
              style={{ background: "var(--moss)", color: "var(--paper)", borderColor: "var(--moss)" }}>
              Execute
            </button>
          )}
          {!op.done && isCanceller && (
            <button onClick={onCancel} disabled={busy}
              className="font-mono text-[11px] tracking-[0.14em] uppercase px-3 py-1 border"
              style={{ background: "transparent", color: "var(--clay)", borderColor: "var(--clay)" }}>
              Cancel
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mb-1">
        <KV k="Op id" v={`${op.id.slice(0, 10)}…${op.id.slice(-8)}`} />
        <KV k="Target" v={`${op.target.slice(0, 6)}…${op.target.slice(-4)}`} />
        <KV
          k="ETA"
          v={op.eta > 0n
            ? `${new Date(Number(op.eta) * 1000).toLocaleString()} (${remaining > 0n ? `in ${formatRemaining(remaining)}` : "ready"})`
            : "—"}
        />
        <KV k="Delay" v={`${(Number(op.delay) / 3600).toFixed(1)}h`} />
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>{k}</div>
      <div className="font-mono text-[11px]" style={{ color: "var(--ink)" }}>{v}</div>
    </div>
  );
}

function formatRemaining(secs: bigint): string {
  const s = Number(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
