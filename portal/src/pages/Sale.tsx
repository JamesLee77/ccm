import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CCMTGESaleAbi,
  CCMTokenAbi,
  CONTRACTS,
  EXPLORER,
  USDCAbi,
} from "../lib/contracts";
import { IS_MAINNET } from "../lib/env";
import { fmtCCM } from "../lib/format";
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

type AddressStr = `0x${string}`;
const ZERO = "0x0000000000000000000000000000000000000000";
const E18 = 10n ** 18n;

interface Round {
  id: number;
  name: string;
  priceUsdc: bigint;
  hardCapTokens: bigint;
  soldTokens: bigint;
  cliffSeconds: bigint;
  vestSeconds: bigint;
  startTime: bigint;
  endTime: bigint;
  active: boolean;
}

interface Allocation {
  totalAllocated: bigint;
  claimed: bigint;
  startTime: bigint;
  cliffSeconds: bigint;
  vestSeconds: bigint;
  claimable: bigint;
}

const fmtUSDC = (raw: bigint | undefined): string => {
  if (raw === undefined) return "—";
  return formatUnits(raw, 6).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
};

const fmtPriceUsdcPerCcm = (priceUsdc: bigint): string =>
  `$${formatUnits(priceUsdc, 6)}`;

const fmtDuration = (secs: bigint): string => {
  const s = Number(secs);
  if (s === 0) return "0";
  const d = Math.floor(s / 86400);
  if (d > 0) return `${d}d`;
  const h = Math.floor(s / 3600);
  if (h > 0) return `${h}h`;
  return `${Math.floor(s / 60)}m`;
};

const fmtDateTime = (ts: bigint): string => {
  if (ts === 0n) return "—";
  return new Date(Number(ts) * 1000).toLocaleString();
};

export default function Sale() {
  const { address, isConnected } = useAccount();
  const sale = CONTRACTS.ccmTgeSale as AddressStr;
  const usdc = CONTRACTS.usdc as AddressStr;
  const ccm = CONTRACTS.ccmTokenV1 as AddressStr;
  const saleDeployed = sale.toLowerCase() !== ZERO;

  // ─── Read all rounds ───
  const { data: roundCount, refetch: refetchRoundCount } = useReadContract({
    address: sale,
    abi: CCMTGESaleAbi,
    functionName: "getRoundCount",
    query: { enabled: saleDeployed, refetchInterval: 12000 },
  });
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

  const rounds: Round[] = useMemo(() => {
    if (!roundsData) return [];
    return roundsData.map((r, i) => {
      const v = r.result as any;
      if (!v) return {
        id: i, name: "?", priceUsdc: 0n, hardCapTokens: 0n, soldTokens: 0n,
        cliffSeconds: 0n, vestSeconds: 0n, startTime: 0n, endTime: 0n, active: false,
      };
      return { id: i, ...v };
    });
  }, [roundsData]);

  // ─── Read user-specific data per round ───
  const wlContracts = saleDeployed && N > 0 && address
    ? Array.from({ length: N }, (_, i) => ({
        address: sale,
        abi: CCMTGESaleAbi,
        functionName: "whitelist" as const,
        args: [BigInt(i), address as AddressStr] as const,
      }))
    : [];

  const allocContracts = saleDeployed && N > 0 && address
    ? Array.from({ length: N }, (_, i) => ({
        address: sale,
        abi: CCMTGESaleAbi,
        functionName: "allocations" as const,
        args: [BigInt(i), address as AddressStr] as const,
      }))
    : [];

  const claimContracts = saleDeployed && N > 0 && address
    ? Array.from({ length: N }, (_, i) => ({
        address: sale,
        abi: CCMTGESaleAbi,
        functionName: "claimable" as const,
        args: [BigInt(i), address as AddressStr] as const,
      }))
    : [];

  const { data: wlResult, refetch: refetchWL } = useReadContracts({
    contracts: wlContracts,
    query: { enabled: !!(saleDeployed && N > 0 && address), refetchInterval: 12000 },
  });
  const { data: allocResult, refetch: refetchAlloc } = useReadContracts({
    contracts: allocContracts,
    query: { enabled: !!(saleDeployed && N > 0 && address), refetchInterval: 12000 },
  });
  const { data: claimResult, refetch: refetchClaim } = useReadContracts({
    contracts: claimContracts,
    query: { enabled: !!(saleDeployed && N > 0 && address), refetchInterval: 12000 },
  });

  // Per-round whitelist + allocation
  const isWhitelisted: boolean[] = wlResult
    ? wlResult.map((r) => r.result === true)
    : [];

  const allocations: Allocation[] = useMemo(() => {
    if (!allocResult || !claimResult) return [];
    return allocResult.map((r, i) => {
      const v = r.result as readonly [bigint, bigint, bigint, bigint, bigint] | undefined;
      const claimable = (claimResult[i]?.result as bigint | undefined) ?? 0n;
      if (!v) return {
        totalAllocated: 0n, claimed: 0n, startTime: 0n,
        cliffSeconds: 0n, vestSeconds: 0n, claimable,
      };
      return {
        totalAllocated: v[0],
        claimed: v[1],
        startTime: v[2],
        cliffSeconds: v[3],
        vestSeconds: v[4],
        claimable,
      };
    });
  }, [allocResult, claimResult]);

  // ─── User USDC + CCM balances + allowance to sale ───
  const { data: usdcMeta } = useReadContracts({
    contracts: [
      { address: usdc, abi: USDCAbi, functionName: "balanceOf", args: address ? [address as AddressStr] : undefined },
      { address: usdc, abi: USDCAbi, functionName: "allowance", args: address ? [address as AddressStr, sale] : undefined },
      { address: usdc, abi: USDCAbi, functionName: "symbol" },
    ],
    query: { enabled: !!(saleDeployed && address), refetchInterval: 12000 },
  });
  const usdcBalance = (usdcMeta?.[0]?.result as bigint | undefined) ?? 0n;
  const usdcAllowance = (usdcMeta?.[1]?.result as bigint | undefined) ?? 0n;
  const usdcSymbol = (usdcMeta?.[2]?.result as string | undefined) ?? "USDC";

  // CCM balance shows what investor has been *delivered* (post-claim)
  const { data: ccmBalance } = useReadContract({
    address: ccm,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: address ? [address as AddressStr] : undefined,
    query: { enabled: !!(saleDeployed && address), refetchInterval: 12000 },
  });

  // ─── Tx state ───
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      void refetchRoundCount();
      void refetchRounds();
      void refetchWL();
      void refetchAlloc();
      void refetchClaim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const busy = isPending || isMining;

  // ─── Purchase form (per round) ───
  const [activeRound, setActiveRound] = useState<number>(0);
  const [purchaseAmount, setPurchaseAmount] = useState<string>("");

  const purchaseAmountAtoms = useMemo(() => {
    try { return parseUnits(purchaseAmount || "0", 18); } catch { return 0n; }
  }, [purchaseAmount]);

  const activeRoundData = rounds[activeRound];
  const usdcRequired = activeRoundData
    ? (purchaseAmountAtoms * activeRoundData.priceUsdc) / E18
    : 0n;

  function approveUsdc() {
    if (!activeRoundData || usdcRequired === 0n) return;
    writeContract({
      address: usdc,
      abi: USDCAbi,
      functionName: "approve",
      args: [sale, usdcRequired],
    });
  }

  function purchase() {
    if (!activeRoundData || purchaseAmountAtoms === 0n) return;
    writeContract({
      address: sale,
      abi: CCMTGESaleAbi,
      functionName: "purchase",
      args: [BigInt(activeRound), purchaseAmountAtoms],
    });
  }

  function claim(roundId: number) {
    writeContract({
      address: sale,
      abi: CCMTGESaleAbi,
      functionName: "claim",
      args: [BigInt(roundId)],
    });
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Sale · Phase 0</SectionLabel>
        <H1>SAFT presale</H1>
        <Lede className="mt-5">
          Multi-tier CCM token presale. KYC-cleared investors purchase with
          USDC; tokens lock for the round's cliff period, then vest linearly
          and become claimable. {IS_MAINNET
            ? "Investments here are real — review every transaction before signing."
            : "This is the testnet rehearsal. Test tokens have no real value."}
        </Lede>
      </header>

      {/* env banner — testnet only (mainnet sale is the default state) */}
      {!IS_MAINNET && (
        <div
          className="border px-5 py-4 flex items-center gap-4 flex-wrap"
          style={{ background: "rgba(200,96,46,0.08)", borderColor: "var(--clay)" }}
        >
          <span
            className="font-mono text-[11px] tracking-[0.18em] uppercase px-2 py-1 border"
            style={{ borderColor: "var(--clay)", color: "var(--clay)", fontWeight: 600 }}
          >
            TESTNET
          </span>
          <span className="font-mono text-[12px]" style={{ color: "var(--ink)" }}>
            Base Sepolia · 84532 · No real value. CCM &amp; USDC are sandbox tokens.
          </span>
        </div>
      )}

      {!isConnected && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            Connect your wallet from the top right to view rounds and purchase.
          </p>
        </Card>
      )}

      {isConnected && !saleDeployed && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            CCMTGESale is not yet deployed. {IS_MAINNET
              ? "Phase 0 mainnet deploy is pending; check back when sale opens."
              : "Testnet rehearsal sale will be available once the operator deploys it."}
          </p>
        </Card>
      )}

      {isConnected && saleDeployed && N === 0 && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>
            No rounds have been created yet.
          </p>
        </Card>
      )}

      {isConnected && saleDeployed && N > 0 && (
        <>
          {/* Your balances */}
          <Card>
            <H2 className="mb-5">Your balances</H2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label={`Your ${usdcSymbol}`} value={`${fmtUSDC(usdcBalance)} ${usdcSymbol}`} />
              <Stat label="Your CCM (claimed)" value={fmtCCM(ccmBalance as bigint | undefined)} />
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>
                  Your wallet
                </div>
                {address && <CopyableAddress address={address} withExplorer />}
              </div>
            </div>
          </Card>

          {/* Round overview */}
          <Card>
            <H2 className="mb-5">Available rounds</H2>
            <div className="space-y-3">
              {rounds.map((r) => (
                <RoundRow
                  key={r.id}
                  r={r}
                  whitelisted={isWhitelisted[r.id]}
                  selected={activeRound === r.id}
                  now={now}
                  onSelect={() => setActiveRound(r.id)}
                />
              ))}
            </div>
          </Card>

          {/* Purchase */}
          {activeRoundData && (
            <Card>
              <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
                <H2>Purchase · #{activeRoundData.id} {activeRoundData.name}</H2>
                <PurchaseEligibility
                  r={activeRoundData}
                  whitelisted={isWhitelisted[activeRound]}
                  now={now}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[2fr_auto] gap-4 items-end mb-5">
                <Field label="Amount to buy (whole CCM)">
                  <input
                    type="number"
                    min={1}
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
                    style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                  />
                </Field>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>
                    USDC required
                  </div>
                  <div
                    className="font-display"
                    style={{ fontSize: 22, color: "var(--ink)", fontWeight: 400, letterSpacing: "-0.02em" }}
                  >
                    {fmtUSDC(usdcRequired)} {usdcSymbol}
                  </div>
                </div>
              </div>

              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-1 mb-5"
                style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}
              >
                <Stat
                  label={`Your ${usdcSymbol}`}
                  value={`${fmtUSDC(usdcBalance)} ${usdcSymbol}`}
                />
                <Stat
                  label="Allowance to sale"
                  value={`${fmtUSDC(usdcAllowance)} ${usdcSymbol}`}
                />
                <Stat
                  label="Sufficient?"
                  value={
                    usdcBalance >= usdcRequired
                      ? usdcAllowance >= usdcRequired
                        ? "✓ ready"
                        : "approve needed"
                      : "balance too low"
                  }
                />
              </div>

              <ol className="space-y-3 mb-5">
                <Step
                  n={1}
                  active={usdcAllowance < usdcRequired && usdcRequired > 0n}
                  done={usdcAllowance >= usdcRequired && usdcRequired > 0n}
                  title={`Approve sale to spend ${fmtUSDC(usdcRequired)} ${usdcSymbol}`}
                  detail="One-time per amount. Approves only what's needed for this purchase."
                />
                <Step
                  n={2}
                  active={usdcAllowance >= usdcRequired && usdcRequired > 0n}
                  done={false}
                  title={`Purchase ${purchaseAmount || "?"} CCM`}
                  detail="Tokens are credited to your allocation, locked for the round's cliff, then vest linearly."
                />
              </ol>

              <div className="flex flex-wrap gap-3">
                <CTA
                  variant="ghost"
                  label={busy ? "Approving…" : "Approve USDC"}
                  onClick={approveUsdc}
                  disabled={
                    busy ||
                    !isWhitelisted[activeRound] ||
                    usdcRequired === 0n ||
                    usdcAllowance >= usdcRequired
                  }
                />
                <CTA
                  label={busy ? "Purchasing…" : "Purchase"}
                  onClick={purchase}
                  disabled={
                    busy ||
                    !isWhitelisted[activeRound] ||
                    usdcRequired === 0n ||
                    !activeRoundData.active ||
                    now < activeRoundData.startTime ||
                    now > activeRoundData.endTime ||
                    usdcAllowance < usdcRequired ||
                    usdcBalance < usdcRequired
                  }
                />
              </div>
            </Card>
          )}

          {/* My allocations */}
          <Card>
            <H2 className="mb-5">Your allocations</H2>
            {allocations.every((a) => a.totalAllocated === 0n) ? (
              <p style={{ color: "var(--ink-soft)" }}>
                No purchases yet. Buy from a whitelisted round above to start a vesting allocation.
              </p>
            ) : (
              <div className="space-y-3">
                {allocations.map((a, i) =>
                  a.totalAllocated === 0n ? null : (
                    <AllocationRow
                      key={i}
                      roundId={i}
                      roundName={rounds[i]?.name ?? `#${i}`}
                      a={a}
                      now={now}
                      busy={busy}
                      onClaim={() => claim(i)}
                    />
                  ),
                )}
              </div>
            )}
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
        </>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

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

function Step({
  n,
  active,
  done,
  title,
  detail,
}: {
  n: number;
  active: boolean;
  done: boolean;
  title: string;
  detail: string;
}) {
  const bg = done ? "var(--moss)" : active ? "var(--moss)" : "var(--rule)";
  const fg = done || active ? "var(--paper)" : "var(--ink-soft)";
  return (
    <li className="flex gap-4 items-start">
      <span
        className="font-mono text-[11px] flex items-center justify-center"
        style={{ width: 24, height: 24, background: bg, color: fg, fontWeight: 600 }}
      >
        {done ? "✓" : n}
      </span>
      <div className="flex-1">
        <div className="font-display" style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
          {title}
        </div>
        <div className="font-mono text-[11px] mt-1" style={{ color: "var(--ink-soft)" }}>
          {detail}
        </div>
      </div>
    </li>
  );
}

function RoundRow({
  r,
  whitelisted,
  selected,
  now,
  onSelect,
}: {
  r: Round;
  whitelisted: boolean | undefined;
  selected: boolean;
  now: bigint;
  onSelect: () => void;
}) {
  const pct = r.hardCapTokens > 0n ? Number((r.soldTokens * 10000n) / r.hardCapTokens) / 100 : 0;
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
    <button
      type="button"
      onClick={onSelect}
      className="border w-full text-left p-4 transition-colors"
      style={{
        background: selected ? "rgba(45,191,99,0.04)" : "transparent",
        borderColor: selected ? "var(--moss)" : "var(--rule)",
        cursor: "pointer",
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
          {whitelisted !== undefined && (
            <span
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-1.5 py-0.5 border"
              style={{
                borderColor: whitelisted ? "var(--moss)" : "var(--clay)",
                color: whitelisted ? "var(--moss)" : "var(--clay)",
                background: whitelisted ? "rgba(45,191,99,0.06)" : "rgba(200,96,46,0.06)",
              }}
            >
              {whitelisted ? "✓ whitelisted" : "✗ not whitelisted"}
            </span>
          )}
        </div>
        <span
          className="font-mono text-[10px] tracking-[0.14em] uppercase px-1.5 py-0.5"
          style={{ color: "var(--ink-soft)" }}
        >
          {selected ? "✓ selected for purchase" : "click to select"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mb-3">
        <Field2 label="Price" value={`${fmtPriceUsdcPerCcm(r.priceUsdc)} / CCM`} />
        <Field2
          label="Sold / Hardcap"
          value={`${fmtCCM(r.soldTokens)} / ${fmtCCM(r.hardCapTokens, 0)} (${pct.toFixed(2)}%)`}
        />
        <Field2 label="Time" value={timeStatus} color={timeColor} />
        <Field2 label="Cliff / Vest" value={`${fmtDuration(r.cliffSeconds)} / ${fmtDuration(r.vestSeconds)}`} />
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: "var(--rule)" }}>
        <div
          className="h-1"
          style={{
            width: r.hardCapTokens > 0n ? `${pct.toFixed(2)}%` : "0%",
            background: "var(--moss)",
          }}
        />
      </div>
    </button>
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

function PurchaseEligibility({
  r,
  whitelisted,
  now,
}: {
  r: Round;
  whitelisted: boolean | undefined;
  now: bigint;
}) {
  let label: string;
  let color: string;
  if (!r.active) { label = "round closed"; color = "var(--ink-soft)"; }
  else if (now < r.startTime) { label = "not started"; color = "var(--clay)"; }
  else if (now > r.endTime) { label = "ended"; color = "var(--ink-soft)"; }
  else if (whitelisted === false) { label = "not whitelisted"; color = "var(--clay)"; }
  else if (whitelisted === true) { label = "✓ eligible"; color = "var(--moss)"; }
  else { label = "checking…"; color = "var(--ink-soft)"; }
  return (
    <span
      className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
      style={{ borderColor: color, color }}
    >
      {label}
    </span>
  );
}

function AllocationRow({
  roundId,
  roundName,
  a,
  now,
  busy,
  onClaim,
}: {
  roundId: number;
  roundName: string;
  a: Allocation;
  now: bigint;
  busy: boolean;
  onClaim: () => void;
}) {
  const cliffEnd = a.startTime + a.cliffSeconds;
  const vestEnd = a.startTime + a.vestSeconds;
  const elapsed = now > a.startTime ? now - a.startTime : 0n;
  const vestPct =
    a.vestSeconds > 0n
      ? Math.min(100, Number((elapsed * 10000n) / a.vestSeconds) / 100)
      : 0;
  const claimedPct =
    a.totalAllocated > 0n
      ? Number((a.claimed * 10000n) / a.totalAllocated) / 100
      : 0;

  let phase: string;
  let phaseColor: string;
  if (now < cliffEnd) { phase = `cliff · unlocks ${fmtDateTime(cliffEnd)}`; phaseColor = "var(--clay)"; }
  else if (now < vestEnd) { phase = "vesting"; phaseColor = "var(--moss)"; }
  else { phase = "fully vested"; phaseColor = "var(--moss)"; }

  return (
    <div
      className="border p-4"
      style={{ background: "var(--paper-deep)", borderColor: "var(--rule)" }}
    >
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>
            #{roundId}
          </span>
          <span className="font-display" style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>
            {roundName}
          </span>
          <span
            className="font-mono text-[10px] tracking-[0.14em] uppercase px-1.5 py-0.5"
            style={{ color: phaseColor }}
          >
            {phase}
          </span>
        </div>
        <CTA
          label={busy ? "Claiming…" : `Claim ${fmtCCM(a.claimable)} CCM`}
          onClick={onClaim}
          disabled={busy || a.claimable === 0n}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mb-3">
        <Field2 label="Total" value={`${fmtCCM(a.totalAllocated)} CCM`} />
        <Field2
          label="Claimed"
          value={`${fmtCCM(a.claimed)} CCM (${claimedPct.toFixed(2)}%)`}
        />
        <Field2 label="Claimable now" value={`${fmtCCM(a.claimable)} CCM`} color="var(--moss)" />
        <Field2 label="Vest" value={`${vestPct.toFixed(2)}% of duration`} />
      </div>

      <div className="h-1 w-full" style={{ background: "var(--rule)" }}>
        <div
          className="h-1"
          style={{ width: `${claimedPct.toFixed(2)}%`, background: "var(--moss)" }}
        />
      </div>
    </div>
  );
}
