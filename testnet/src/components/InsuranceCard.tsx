import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  CONTRACTS,
  CCMSandboxNFTAbi,
  CCMSandboxInsuranceAbi,
} from "../lib/contracts";

const INS = CONTRACTS.baseSepolia.ccmSandboxInsurance;
const NFT = CONTRACTS.baseSepolia.ccmSandboxNFT;

const fmtUSDC = (raw: bigint | undefined): string =>
  raw === undefined
    ? "—"
    : (Number(raw) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 4 });

export default function InsuranceCard() {
  const { address, isConnected } = useAccount();
  const [declareId, setDeclareId] = useState("0");
  const [claimId, setClaimId] = useState("0");
  const [claimTonnage, setClaimTonnage] = useState(5);

  // ----- Reads -----
  const { data: reserves } = useReadContract({
    address: INS,
    abi: CCMSandboxInsuranceAbi,
    functionName: "reserves",
    query: { refetchInterval: 8000 },
  });
  const { data: totalDeclared } = useReadContract({
    address: INS,
    abi: CCMSandboxInsuranceAbi,
    functionName: "totalDeclared",
    query: { refetchInterval: 10000 },
  });
  const { data: totalPaidOut } = useReadContract({
    address: INS,
    abi: CCMSandboxInsuranceAbi,
    functionName: "totalPaidOut",
    query: { refetchInterval: 10000 },
  });
  const { data: nftApproved, refetch: refetchApproval } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, INS] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Live failure state for the inputs (declareId for declare; claimId for claim)
  const declareIdNum = Number(declareId || "0");
  const claimIdNum = Number(claimId || "0");

  const { data: declareFailure } = useReadContract({
    address: INS,
    abi: CCMSandboxInsuranceAbi,
    functionName: "failures",
    args: [BigInt(declareIdNum)],
    query: { refetchInterval: 5000 },
  });
  const { data: claimFailure } = useReadContract({
    address: INS,
    abi: CCMSandboxInsuranceAbi,
    functionName: "failures",
    args: [BigInt(claimIdNum)],
    query: { refetchInterval: 5000 },
  });

  // ----- Writes -----
  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) refetchApproval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const busy = isPending || isMining;

  function approveNFT() {
    writeContract({
      address: NFT,
      abi: CCMSandboxNFTAbi,
      functionName: "setApprovalForAll",
      args: [INS, true],
    });
  }
  function doDeclare() {
    writeContract({
      address: INS,
      abi: CCMSandboxInsuranceAbi,
      functionName: "declareFailure",
      args: [BigInt(declareIdNum)],
    });
  }
  function doClaim() {
    writeContract({
      address: INS,
      abi: CCMSandboxInsuranceAbi,
      functionName: "claim",
      args: [BigInt(claimIdNum), BigInt(claimTonnage)],
    });
  }

  const declareTuple = declareFailure as readonly [boolean, bigint, bigint, bigint, bigint, bigint, string] | undefined;
  const claimTuple = claimFailure as readonly [boolean, bigint, bigint, bigint, bigint, bigint, string] | undefined;
  const claimDeclared = claimTuple?.[0] === true;
  const payoutPerTonne = claimTuple?.[1] ?? 0n;
  const expectedPayout = payoutPerTonne * BigInt(claimTonnage);

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
          §&nbsp;7.7 · Insurance Vault · pro-rata payout on VVB failure
        </h2>
        <p
          className="mb-5 max-w-[760px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 14, lineHeight: 1.6 }}
        >
          When a credit's underlying VVB consensus is later invalidated
          (fraud, methodology revision), holders surrender the NFT to the
          insurance vault and receive a pro-rata USDC payout. Mainnet uses
          a multi-VVB DAO + dispute resolution; sandbox: anyone can declare,
          one-shot per id. Payout per tonne = 30% × current reserves /
          totalSupply at declaration time.
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-1"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          <Pill label="USDC reserves" value={`${fmtUSDC(reserves as bigint | undefined)} USDC`} />
          <Pill label="Failures declared" value={(totalDeclared ?? 0n).toString()} />
          <Pill label="Total paid out" value={`${fmtUSDC(totalPaidOut as bigint | undefined)} USDC`} />
        </div>
      </div>

      {/* Declare */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Declare failure (sandbox: anyone, one-shot per id)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end mb-4">
          <Field label="NFT id">
            <input
              type="number"
              min={0}
              value={declareId}
              onChange={(e) => setDeclareId(e.target.value)}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <CTA
            label={
              declareTuple?.[0]
                ? "Already declared"
                : busy
                ? "Declaring…"
                : `Declare failure for #${declareIdNum}`
            }
            onClick={doDeclare}
            disabled={!isConnected || busy || declareTuple?.[0] === true}
          />
        </div>
        {declareTuple?.[0] ? (
          <p className="font-mono text-[12px]" style={{ color: "var(--tn-text-soft)" }}>
            payoutPerTonne for #{declareIdNum}:{" "}
            <strong style={{ color: "var(--tn-amber-text)" }}>
              {fmtUSDC(declareTuple[1])} USDC
            </strong>{" "}
            · budget {fmtUSDC(declareTuple[2])} USDC · atSupply{" "}
            {declareTuple[3].toString()} t
          </p>
        ) : null}
      </div>

      {/* Claim */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Claim payout · burn NFT, receive USDC
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="NFT id (must be declared)">
            <input
              type="number"
              min={0}
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <Field label="Tonnage to burn">
            <input
              type="number"
              min={1}
              value={claimTonnage}
              onChange={(e) => setClaimTonnage(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
        </div>
        {claimDeclared ? (
          <p
            className="mb-4 font-mono text-[12px]"
            style={{ color: "var(--tn-text-soft)" }}
          >
            Expected payout:{" "}
            <strong style={{ color: "var(--tn-amber-text)" }}>
              {fmtUSDC(expectedPayout)} USDC
            </strong>{" "}
            ({fmtUSDC(payoutPerTonne)} per tonne × {claimTonnage} t)
          </p>
        ) : (
          <p
            className="mb-4 font-mono text-[12px]"
            style={{ color: "var(--tn-text-soft)" }}
          >
            NFT id #{claimIdNum} not yet declared. Declare it above first.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {!nftApproved ? (
            <CTA
              label={busy ? "Approving…" : "1. Approve NFT to insurance"}
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
            label={busy ? "Claiming…" : `2. Burn ${claimTonnage} t · receive ${fmtUSDC(expectedPayout)} USDC`}
            onClick={doClaim}
            disabled={
              !isConnected || !nftApproved || busy || !claimDeclared || claimTonnage < 1
            }
          />
        </div>
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
