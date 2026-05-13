import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CONTRACTS,
  CCMTokenAbi,
  CCMSandboxNFTAbi,
  CCMSandboxVaultAbi,
  GRADE_LABELS,
} from "../lib/contracts";

const VAULT = CONTRACTS.baseSepolia.ccmSandboxVault;
const NFT = CONTRACTS.baseSepolia.ccmSandboxNFT;
const TOKEN = CONTRACTS.baseSepolia.ccmToken;
const E18 = 10n ** 18n;

function fmtCCM(raw: bigint | undefined): string {
  if (raw === undefined) return "—";
  const whole = raw / E18;
  return whole.toString();
}

export default function WrapCard() {
  const { address, isConnected } = useAccount();

  // Form state
  const [wrapId, setWrapId] = useState("0");
  const [wrapTonnage, setWrapTonnage] = useState(5);
  const [unwrapTonnage, setUnwrapTonnage] = useState(5);

  // Reads
  const { data: nftApproved, refetch: refetchNFTApproval } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, VAULT] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });
  const { data: ccmAllowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN,
    abi: CCMTokenAbi,
    functionName: "allowance",
    args: address ? [address, VAULT] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });
  const { data: ccmBal } = useReadContract({
    address: TOKEN,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });
  const { data: previewHead } = useReadContract({
    address: VAULT,
    abi: CCMSandboxVaultAbi,
    functionName: "previewUnwrapHead",
    query: { refetchInterval: 5000 },
  });
  const { data: gradeBalanceA } = useReadContract({ address: VAULT, abi: CCMSandboxVaultAbi, functionName: "gradeBalance", args: [0], query: { refetchInterval: 10000 } });
  const { data: gradeBalanceB } = useReadContract({ address: VAULT, abi: CCMSandboxVaultAbi, functionName: "gradeBalance", args: [1], query: { refetchInterval: 10000 } });
  const { data: gradeBalanceC } = useReadContract({ address: VAULT, abi: CCMSandboxVaultAbi, functionName: "gradeBalance", args: [2], query: { refetchInterval: 10000 } });
  const { data: gradeBalanceD } = useReadContract({ address: VAULT, abi: CCMSandboxVaultAbi, functionName: "gradeBalance", args: [3], query: { refetchInterval: 10000 } });

  // Writes
  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  useEffect(() => {
    if (isSuccess) {
      refetchNFTApproval();
      refetchAllowance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const busy = isPending || isMining;
  const unwrapNeeds = BigInt(unwrapTonnage) * E18;
  const allowanceEnough = ccmAllowance !== undefined && (ccmAllowance as bigint) >= unwrapNeeds;
  const ccmEnough = ccmBal !== undefined && (ccmBal as bigint) >= unwrapNeeds;

  function approveNFT() {
    writeContract({
      address: NFT,
      abi: CCMSandboxNFTAbi,
      functionName: "setApprovalForAll",
      args: [VAULT, true],
    });
  }
  function doWrap() {
    writeContract({
      address: VAULT,
      abi: CCMSandboxVaultAbi,
      functionName: "wrap",
      args: [BigInt(wrapId), BigInt(wrapTonnage)],
    });
  }
  function approveCCM() {
    writeContract({
      address: TOKEN,
      abi: CCMTokenAbi,
      functionName: "approve",
      args: [VAULT, unwrapNeeds],
    });
  }
  function doUnwrap() {
    writeContract({
      address: VAULT,
      abi: CCMSandboxVaultAbi,
      functionName: "unwrap",
      args: [unwrapNeeds],
    });
  }

  return (
    <section className="space-y-6">
      {/* Vault state */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          §&nbsp;7.2 · Wrap vault state · NFT ⇄ test $CCM (1 tonne ↔ 1 CCM)
        </h2>
        <div
          className="grid grid-cols-2 sm:grid-cols-5 gap-1"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          <Pill label="Grade A locked" value={(gradeBalanceA ?? 0n).toString() + " t"} />
          <Pill label="Grade B locked" value={(gradeBalanceB ?? 0n).toString() + " t"} />
          <Pill label="Grade C locked" value={(gradeBalanceC ?? 0n).toString() + " t"} />
          <Pill label="Grade D locked" value={(gradeBalanceD ?? 0n).toString() + " t"} />
          <Pill
            label="FIFR head (next out)"
            value={
              previewHead
                ? `Grade ${GRADE_LABELS[Number((previewHead as readonly [number, bigint, bigint])[0])] ?? "—"} · #${(previewHead as readonly [number, bigint, bigint])[1].toString()} · ${(previewHead as readonly [number, bigint, bigint])[2].toString()} t`
                : "—"
            }
          />
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
          Wrap NFT → mint test $CCM
        </h2>
        <p
          className="mb-5 max-w-[640px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 14, lineHeight: 1.6 }}
        >
          Deposit one of your sandbox NFT batches into the non-custodial vault.
          Mints exactly 1 test CCM per tonne. The NFT remains source-of-truth;
          your CCM is fungible.
        </p>
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
              label={busy ? "Approving…" : "1. Approve NFT to vault"}
              onClick={approveNFT}
              disabled={!isConnected || busy}
            />
          ) : (
            <span
              className="font-mono text-[11px] tracking-[0.14em] uppercase px-3 py-2"
              style={{ color: "var(--tn-amber-text)" }}
            >
              ✓ NFT approved to vault
            </span>
          )}
          <CTA
            label={busy ? "Wrapping…" : `2. Wrap ${wrapTonnage} t → ${wrapTonnage} CCM`}
            onClick={doWrap}
            disabled={!isConnected || !nftApproved || busy || wrapTonnage < 1}
          />
        </div>
      </div>

      {/* Unwrap */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Unwrap test $CCM → return NFTs (FIFR: lowest-grade first)
        </h2>
        <p
          className="mb-5 max-w-[640px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 14, lineHeight: 1.6 }}
        >
          Burn CCM to receive NFTs back from the vault. The vault dispenses
          lower-grade NFTs first (Grade D → C → B → A). Up to 5 queue hops
          per tx; split larger redemptions across transactions.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="CCM to unwrap (whole tonnes)">
            <input
              type="number"
              min={1}
              value={unwrapTonnage}
              onChange={(e) => setUnwrapTonnage(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <Field label="Your CCM balance">
            <div
              className="font-mono text-sm px-3 py-2"
              style={{ color: "var(--tn-text)" }}
            >
              {fmtCCM(ccmBal as bigint | undefined)} CCM
            </div>
          </Field>
        </div>
        <div className="flex flex-wrap gap-3">
          {!allowanceEnough ? (
            <CTA
              label={busy ? "Approving…" : `1. Approve ${unwrapTonnage} CCM`}
              onClick={approveCCM}
              disabled={!isConnected || busy || !ccmEnough}
            />
          ) : (
            <span
              className="font-mono text-[11px] tracking-[0.14em] uppercase px-3 py-2"
              style={{ color: "var(--tn-amber-text)" }}
            >
              ✓ Allowance set ({fmtCCM(ccmAllowance as bigint | undefined)} CCM)
            </span>
          )}
          <CTA
            label={busy ? "Unwrapping…" : `2. Unwrap ${unwrapTonnage} CCM`}
            onClick={doUnwrap}
            disabled={!isConnected || !allowanceEnough || busy || !ccmEnough}
          />
        </div>
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
        minWidth: 220,
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
      <div
        className="font-display mt-1"
        style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.015em" }}
      >
        {value}
      </div>
    </div>
  );
}
