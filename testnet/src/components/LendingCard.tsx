import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CONTRACTS,
  CCMSandboxNFTAbi,
  CCMSandboxLendingAbi,
  CCMSandboxUSDCAbi,
  GRADE_LABELS,
} from "../lib/contracts";

const LENDING = CONTRACTS.baseSepolia.ccmSandboxLending;
const USDC = CONTRACTS.baseSepolia.sandboxUSDC;
const NFT = CONTRACTS.baseSepolia.ccmSandboxNFT;
const E6 = 10n ** 6n;

const fmtUSDC = (raw: bigint | undefined): string =>
  raw === undefined
    ? "—"
    : (Number(raw) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 });

const STATUS_LABELS = ["Open", "Closed", "Liquidated"] as const;

type Position = {
  id: number;
  borrower: string;
  nftId: bigint;
  nftAmount: bigint;
  grade: number;
  borrowed: bigint;
  openedAt: bigint;
  status: number;
};

export default function LendingCard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [openId, setOpenId] = useState("0");
  const [openTonnage, setOpenTonnage] = useState(5);
  const [openBorrow, setOpenBorrow] = useState(100);

  // ----- USDC reads -----
  const { data: usdcBal, refetch: refetchUSDCBal } = useReadContract({
    address: USDC,
    abi: CCMSandboxUSDCAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC,
    abi: CCMSandboxUSDCAbi,
    functionName: "allowance",
    args: address ? [address, LENDING] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });
  const { data: usdcCooldown } = useReadContract({
    address: USDC,
    abi: CCMSandboxUSDCAbi,
    functionName: "cooldownRemaining",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // ----- Lending reads -----
  const { data: reserves } = useReadContract({
    address: LENDING,
    abi: CCMSandboxLendingAbi,
    functionName: "reserves",
    query: { refetchInterval: 5000 },
  });
  const { data: totalBorrowed } = useReadContract({
    address: LENDING,
    abi: CCMSandboxLendingAbi,
    functionName: "totalBorrowed",
    query: { refetchInterval: 10000 },
  });
  const { data: totalRepaid } = useReadContract({
    address: LENDING,
    abi: CCMSandboxLendingAbi,
    functionName: "totalRepaid",
    query: { refetchInterval: 10000 },
  });

  const { data: gradeParams } = useReadContracts({
    contracts: [0, 1, 2, 3].map((g) => ({
      address: LENDING,
      abi: CCMSandboxLendingAbi,
      functionName: "gradeParams",
      args: [BigInt(g)],
    })),
  });

  // ----- NFT approval -----
  const { data: nftApproved, refetch: refetchNftApproval } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, LENDING] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // ----- maxBorrow preview -----
  // We don't know grade until user enters NFT id; show separate help.
  // For now, the dApp computes off-chain via meta (the user knows their grade).

  // ----- positions of user -----
  const { data: positionIds, refetch: refetchPositions } = useReadContract({
    address: LENDING,
    abi: CCMSandboxLendingAbi,
    functionName: "userPositionsOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  const [positions, setPositions] = useState<Position[]>([]);

  async function refreshPositions() {
    if (!publicClient || !positionIds) return;
    const ids = positionIds as readonly bigint[];
    const rows = await Promise.all(
      ids.map(async (id) => {
        const p = (await publicClient.readContract({
          address: LENDING,
          abi: CCMSandboxLendingAbi,
          functionName: "positions",
          args: [id],
        })) as readonly [string, bigint, bigint, number, bigint, bigint, number];
        return {
          id: Number(id),
          borrower: p[0],
          nftId: p[1],
          nftAmount: p[2],
          grade: p[3],
          borrowed: p[4],
          openedAt: p[5],
          status: p[6],
        };
      }),
    );
    setPositions(rows);
  }

  useEffect(() => {
    void refreshPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionIds]);

  // ----- writes -----
  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetchUSDCBal();
      refetchAllowance();
      refetchNftApproval();
      refetchPositions();
      void refreshPositions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const busy = isPending || isMining;
  const borrowAtomicAmount = useMemo(() => BigInt(openBorrow) * E6, [openBorrow]);

  function claimUSDC() {
    writeContract({
      address: USDC,
      abi: CCMSandboxUSDCAbi,
      functionName: "claim",
      args: [],
    });
  }
  function approveNFT() {
    writeContract({
      address: NFT,
      abi: CCMSandboxNFTAbi,
      functionName: "setApprovalForAll",
      args: [LENDING, true],
    });
  }
  function approveUSDCForRepay(amount: bigint) {
    writeContract({
      address: USDC,
      abi: CCMSandboxUSDCAbi,
      functionName: "approve",
      args: [LENDING, amount],
    });
  }
  function doOpen() {
    writeContract({
      address: LENDING,
      abi: CCMSandboxLendingAbi,
      functionName: "open",
      args: [BigInt(openId), BigInt(openTonnage), borrowAtomicAmount],
    });
  }
  function doClose(positionId: number) {
    writeContract({
      address: LENDING,
      abi: CCMSandboxLendingAbi,
      functionName: "close",
      args: [BigInt(positionId)],
    });
  }

  const usdcCooldownNum = Number(usdcCooldown ?? 0n);
  const canClaimUSDC = usdcCooldownNum === 0;

  return (
    <section className="space-y-6">
      {/* Header + global stats */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-3"
          style={{ color: "var(--tn-amber-text)" }}
        >
          §&nbsp;7.4 · Vault Lending · NFT collateral → test USDC
        </h2>
        <p
          className="mb-5 max-w-[760px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 14, lineHeight: 1.6 }}
        >
          Pledge a CCM-NFT, borrow test USDC against it. LTV scales with grade —
          DAC tonnes get up to 70%, REDD+ tonnes capped at 30%. Sandbox liquidation
          is a simple 30-day timer; mainnet uses oracle drop + Dutch auction.
        </p>

        {/* Per-grade params */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-5"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          {GRADE_LABELS.map((label, g) => {
            const p = gradeParams?.[g]?.result as
              | readonly [bigint, number]
              | undefined;
            return (
              <div
                key={label}
                style={{ background: "var(--tn-surface)", padding: "16px 18px" }}
              >
                <div
                  className="font-mono text-[10px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--tn-text-soft)" }}
                >
                  Grade {label}
                </div>
                <div
                  className="font-display mt-1"
                  style={{ fontSize: 22, fontWeight: 400 }}
                >
                  ${p ? fmtUSDC(p[0]) : "—"}
                  <span className="font-mono text-[12px] opacity-60"> / t</span>
                </div>
                <div
                  className="font-mono text-[10px] mt-1"
                  style={{ color: "var(--tn-amber-text)" }}
                >
                  LTV {p ? Number(p[1]) / 100 : "—"}%
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1" style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}>
          <Pill label="USDC reserves (lend pool)" value={`${fmtUSDC(reserves as bigint | undefined)} USDC`} />
          <Pill label="Cumulative borrowed" value={`${fmtUSDC(totalBorrowed as bigint | undefined)} USDC`} />
          <Pill label="Cumulative repaid" value={`${fmtUSDC(totalRepaid as bigint | undefined)} USDC`} />
        </div>
      </div>

      {/* Step A — claim test USDC */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-3"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Pre-step · claim 1,000 test USDC (you'll need it to repay later)
        </h3>
        <p
          className="mb-4"
          style={{ color: "var(--tn-text-soft)", fontSize: 13, lineHeight: 1.55 }}
        >
          Your USDC balance: <span className="font-mono text-[13px]">{fmtUSDC(usdcBal as bigint | undefined)} USDC</span>
        </p>
        <CTA
          label={
            !isConnected
              ? "Connect wallet first"
              : busy
              ? "Claiming…"
              : canClaimUSDC
              ? "Claim 1,000 test USDC →"
              : `Cooldown · ${Math.floor(usdcCooldownNum / 60)}m`
          }
          onClick={claimUSDC}
          disabled={!isConnected || !canClaimUSDC || busy}
        />
      </div>

      {/* Open form */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Open a loan position · pledge NFT, receive USDC
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <Field label="NFT id">
            <input
              type="number"
              min={0}
              value={openId}
              onChange={(e) => setOpenId(e.target.value)}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <Field label="Tonnage to pledge">
            <input
              type="number"
              min={1}
              value={openTonnage}
              onChange={(e) => setOpenTonnage(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <Field label="Borrow (USDC)">
            <input
              type="number"
              min={1}
              value={openBorrow}
              onChange={(e) => setOpenBorrow(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-3">
          {!nftApproved ? (
            <CTA
              label={busy ? "Approving…" : "1. Approve NFT to lending"}
              onClick={approveNFT}
              disabled={!isConnected || busy}
            />
          ) : (
            <span
              className="font-mono text-[11px] tracking-[0.14em] uppercase px-3 py-2"
              style={{ color: "var(--tn-amber-text)" }}
            >
              ✓ NFT approved
            </span>
          )}
          <CTA
            label={busy ? "Opening…" : `2. Open · borrow ${openBorrow} USDC`}
            onClick={doOpen}
            disabled={!isConnected || !nftApproved || busy || openBorrow < 1 || openTonnage < 1}
          />
        </div>
      </div>

      {/* Positions list */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Your positions
        </h3>
        {!isConnected ? (
          <p style={{ color: "var(--tn-text-soft)", fontSize: 14 }}>
            Connect a wallet to view positions.
          </p>
        ) : positions.length === 0 ? (
          <p style={{ color: "var(--tn-text-soft)", fontSize: 14 }}>
            No positions yet. Open one above.
          </p>
        ) : (
          <ul className="grid gap-3">
            {positions.map((p) => (
              <PositionRow
                key={p.id}
                p={p}
                allowance={(usdcAllowance as bigint | undefined) ?? 0n}
                onClose={(id) => doClose(id)}
                onApprove={(needs) => approveUSDCForRepay(needs)}
                busy={busy}
              />
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="font-mono text-[12px]" style={{ color: "#ef4444" }}>
          {error.message.slice(0, 220)}
        </p>
      ) : null}
      {isSuccess ? (
        <p className="font-mono text-[12px]" style={{ color: "var(--tn-amber-text)" }}>
          ✓ Transaction confirmed.
        </p>
      ) : null}
    </section>
  );
}

function PositionRow({
  p,
  allowance,
  onClose,
  onApprove,
  busy,
}: {
  p: Position;
  allowance: bigint;
  onClose: (id: number) => void;
  onApprove: (needs: bigint) => void;
  busy: boolean;
}) {
  const open = p.status === 0;
  const enoughAllowance = allowance >= p.borrowed;
  const dateOpened = new Date(Number(p.openedAt) * 1000);
  return (
    <li
      className="border px-4 py-3 grid gap-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center"
      style={{ borderColor: "var(--tn-border)", background: "rgba(0,0,0,0.3)" }}
    >
      <div
        className="font-mono text-[11px] tracking-[0.14em] uppercase"
        style={{ color: "var(--tn-amber-text)" }}
      >
        #{p.id}
      </div>
      <div>
        <div className="font-mono text-[12px]">
          NFT #{p.nftId.toString()} · Grade {GRADE_LABELS[p.grade]} · {p.nftAmount.toString()} t collateral
        </div>
        <div
          className="font-mono text-[10px] mt-1"
          style={{ color: "var(--tn-text-soft)" }}
        >
          opened {dateOpened.toISOString().split("T")[0]} · status: {STATUS_LABELS[p.status]}
        </div>
      </div>
      <div className="text-right font-mono text-[13px] tabular-nums">
        {fmtUSDC(p.borrowed)} <span style={{ color: "var(--tn-text-soft)" }}>USDC</span>
      </div>
      <div className="flex items-center gap-2 justify-end">
        {open ? (
          enoughAllowance ? (
            <button
              type="button"
              onClick={() => onClose(p.id)}
              disabled={busy}
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-3 py-1.5 border"
              style={{
                borderColor: "var(--tn-amber)",
                color: "var(--tn-amber-text)",
                cursor: busy ? "wait" : "pointer",
              }}
            >
              Close & repay →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onApprove(p.borrowed)}
              disabled={busy}
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-3 py-1.5 border"
              style={{
                borderColor: "var(--tn-border)",
                color: "var(--tn-text-soft)",
                cursor: busy ? "wait" : "pointer",
              }}
            >
              Approve {fmtUSDC(p.borrowed)} USDC
            </button>
          )
        ) : (
          <span
            className="font-mono text-[10px] tracking-[0.14em] uppercase"
            style={{ color: "var(--tn-text-soft)" }}
          >
            {STATUS_LABELS[p.status]}
          </span>
        )}
      </div>
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2"
        style={{ color: "var(--tn-text-soft)" }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function CTA({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-mono text-[11px] tracking-[0.14em] uppercase px-4 py-2.5 transition-colors"
      style={{
        background: disabled ? "rgba(245,158,11,0.12)" : "var(--tn-amber)",
        color: disabled ? "var(--tn-text-soft)" : "#000",
        border: "1px solid var(--tn-amber)",
        cursor: disabled ? "not-allowed" : "pointer",
        minWidth: 240,
      }}
    >
      {label}
    </button>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--tn-surface)", padding: "16px 18px" }}>
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase"
        style={{ color: "var(--tn-text-soft)" }}
      >
        {label}
      </div>
      <div className="font-display mt-1" style={{ fontSize: 18, fontWeight: 400 }}>
        {value}
      </div>
    </div>
  );
}
