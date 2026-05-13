import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CONTRACTS,
  CCMSandboxNFTAbi,
  CCMSandboxGradeWrapperAbi,
  CCMGradeTokenAbi,
  GRADE_LABELS,
} from "../lib/contracts";

const WRAPPER = CONTRACTS.baseSepolia.ccmSandboxGradeWrapper;
const NFT = CONTRACTS.baseSepolia.ccmSandboxNFT;
const GRADE_ADDRS = [
  CONTRACTS.baseSepolia.gradeTokens.A,
  CONTRACTS.baseSepolia.gradeTokens.B,
  CONTRACTS.baseSepolia.gradeTokens.C,
  CONTRACTS.baseSepolia.gradeTokens.D,
] as const;
const E18 = 10n ** 18n;
const fmtCCM = (raw: bigint | undefined): string =>
  raw === undefined ? "—" : (raw / E18).toString();

export default function GradeWrapperCard() {
  const { address, isConnected } = useAccount();

  const [wrapId, setWrapId] = useState("0");
  const [wrapTonnage, setWrapTonnage] = useState(5);
  const [unwrapGrade, setUnwrapGrade] = useState(0);
  const [unwrapTonnage, setUnwrapTonnage] = useState(5);

  // ----- NFT approval ------
  const { data: nftApproved, refetch: refetchApproval } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, WRAPPER] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // ----- 4 grade balances of caller ------
  const { data: balances, refetch: refetchBalances } = useReadContracts({
    contracts: GRADE_ADDRS.map((addr) => ({
      address: addr,
      abi: CCMGradeTokenAbi,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
    })),
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // ----- 4 grade vault locked balances ------
  const { data: locked } = useReadContracts({
    contracts: [0, 1, 2, 3].map((g) => ({
      address: WRAPPER,
      abi: CCMSandboxGradeWrapperAbi,
      functionName: "gradeBalance",
      args: [g],
    })),
    query: { refetchInterval: 10000 },
  });

  // ----- Writes ------
  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  useEffect(() => {
    if (isSuccess) {
      refetchApproval();
      refetchBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);
  const busy = isPending || isMining;

  // Always 4-element arrays so [g] never returns undefined.
  const userBalances: bigint[] = [0, 1, 2, 3].map(
    (g) => (balances?.[g]?.result as bigint | undefined) ?? 0n,
  );
  const lockedBalances: bigint[] = [0, 1, 2, 3].map(
    (g) => (locked?.[g]?.result as bigint | undefined) ?? 0n,
  );
  const unwrapNeeds = BigInt(unwrapTonnage) * E18;
  const balanceForGrade = userBalances[unwrapGrade] ?? 0n;
  const enoughGrade = balanceForGrade >= unwrapNeeds;

  function approveNFT() {
    writeContract({
      address: NFT,
      abi: CCMSandboxNFTAbi,
      functionName: "setApprovalForAll",
      args: [WRAPPER, true],
    });
  }
  function doWrap() {
    writeContract({
      address: WRAPPER,
      abi: CCMSandboxGradeWrapperAbi,
      functionName: "wrap",
      args: [BigInt(wrapId), BigInt(wrapTonnage)],
    });
  }
  function doUnwrap() {
    writeContract({
      address: WRAPPER,
      abi: CCMSandboxGradeWrapperAbi,
      functionName: "unwrap",
      args: [unwrapGrade, unwrapNeeds],
    });
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-3"
          style={{ color: "var(--tn-amber-text)" }}
        >
          §&nbsp;7.3 · Grade Wrappers · per-grade $CCM-A / B / C / D
        </h2>
        <p
          className="mb-5 max-w-[760px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 14, lineHeight: 1.6 }}
        >
          Pure-grade wrap variant. The wrap reads the NFT's grade from its
          on-chain metadata and mints the matching grade-specific ERC-20.
          Buyers who want only DAC tonnes hold $CCM-A; REDD+ exposure is
          $CCM-D. There is no cross-grade redemption — each token unwraps
          back to its own grade only.
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-1"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          {GRADE_LABELS.map((label, g) => (
            <div key={label} style={{ background: "var(--tn-surface)", padding: "16px 18px" }}>
              <div
                className="font-mono text-[10px] tracking-[0.14em] uppercase"
                style={{ color: "var(--tn-text-soft)" }}
              >
                $CCM-{label}
              </div>
              <div
                className="font-display mt-1"
                style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em" }}
              >
                {fmtCCM(userBalances[g])}
              </div>
              <div
                className="font-mono text-[10px] mt-1"
                style={{ color: "var(--tn-text-soft)" }}
              >
                vault locked: {lockedBalances[g].toString()} t
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wrap */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Wrap NFT → mint $CCM-X (auto-detected from NFT grade)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="NFT id">
            <input
              type="number"
              min={0}
              value={wrapId}
              onChange={(e) => setWrapId(e.target.value)}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <Field label="Tonnage to wrap">
            <input
              type="number"
              min={1}
              value={wrapTonnage}
              onChange={(e) => setWrapTonnage(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-3">
          {!nftApproved ? (
            <CTA
              label={busy ? "Approving…" : "1. Approve NFT to wrapper"}
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
            label={busy ? "Wrapping…" : `2. Wrap ${wrapTonnage} t → ${wrapTonnage} $CCM-X`}
            onClick={doWrap}
            disabled={!isConnected || !nftApproved || busy || wrapTonnage < 1}
          />
        </div>
      </div>

      {/* Unwrap (no allowance step — wrapper is trusted minter) */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Unwrap $CCM-X → return grade-X NFT (one tx, no approval)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="Grade">
            <select
              value={unwrapGrade}
              onChange={(e) => setUnwrapGrade(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            >
              {GRADE_LABELS.map((label, g) => (
                <option key={label} value={g} style={{ background: "var(--tn-bg)" }}>
                  $CCM-{label} · balance {fmtCCM(userBalances[g])}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (whole tonnes)">
            <input
              type="number"
              min={1}
              value={unwrapTonnage}
              onChange={(e) => setUnwrapTonnage(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
        </div>
        <CTA
          label={busy ? "Unwrapping…" : `Unwrap ${unwrapTonnage} $CCM-${GRADE_LABELS[unwrapGrade]}`}
          onClick={doUnwrap}
          disabled={!isConnected || busy || !enoughGrade}
        />
        {!enoughGrade && isConnected ? (
          <p className="mt-3 font-mono text-[12px]" style={{ color: "var(--tn-text-soft)" }}>
            Insufficient $CCM-{GRADE_LABELS[unwrapGrade]} balance ({fmtCCM(balanceForGrade)} held).
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="font-mono text-[12px]" style={{ color: "#ef4444" }}>
          {error.message.slice(0, 200)}
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
