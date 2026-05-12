import { useEffect, useMemo, useState } from "react";
import { maxUint256 } from "viem";
import {
  useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACTS, CCMTokenAbi, CCMMigrationAbi } from "../lib/contracts";
import { fmtCCM } from "../lib/format";
import { Card, CTA, H1, H2, Lede, SectionLabel } from "../components/site/primitives";

const v1 = CONTRACTS.ccmTokenV1;
const v2 = CONTRACTS.ccmTokenV2;
const mig = CONTRACTS.ccmMigration;

export default function Migrate() {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<"idle" | "approving" | "migrating">("idle");

  const { data: state } = useReadContracts({
    contracts: [
      { address: v1, abi: CCMTokenAbi, functionName: "balanceOf", args: address ? [address] : undefined },
      { address: v2, abi: CCMTokenAbi, functionName: "balanceOf", args: address ? [address] : undefined },
      { address: v1, abi: CCMTokenAbi, functionName: "allowance", args: address ? [address, mig] : undefined },
      { address: mig, abi: CCMMigrationAbi, functionName: "totalMigrated" },
      { address: mig, abi: CCMMigrationAbi, functionName: "deadline" },
      { address: mig, abi: CCMMigrationAbi, functionName: "paused" },
      { address: mig, abi: CCMMigrationAbi, functionName: "closed" },
      { address: mig, abi: CCMMigrationAbi, functionName: "bonusBps" },
    ],
    query: { enabled: !!address },
  });

  const v1Bal = state?.[0]?.result as bigint | undefined;
  const v2Bal = state?.[1]?.result as bigint | undefined;
  const allow = state?.[2]?.result as bigint | undefined;
  const totalMigrated = state?.[3]?.result as bigint | undefined;
  const deadline = state?.[4]?.result as bigint | undefined;
  const paused = state?.[5]?.result as boolean | undefined;
  const closed = state?.[6]?.result as boolean | undefined;
  const bonusBps = state?.[7]?.result as bigint | undefined;

  const { data: migratedByMe } = useReadContract({
    address: mig, abi: CCMMigrationAbi, functionName: "migratedBy",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const needsApproval = useMemo(() => {
    if (allow === undefined || v1Bal === undefined) return true;
    return allow < v1Bal;
  }, [allow, v1Bal]);

  const isExpired = deadline !== undefined && BigInt(Math.floor(Date.now() / 1000)) > deadline;
  const canMigrate =
    isConnected && !!v1Bal && v1Bal > 0n && !paused && !closed && !isExpired;

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isConfirmed) setStep("idle");
  }, [isConfirmed]);

  const onApprove = () => {
    if (!v1Bal) return;
    setStep("approving");
    writeContract({ address: v1, abi: CCMTokenAbi, functionName: "approve", args: [mig, maxUint256] });
  };
  const onMigrate = () => {
    if (!v1Bal) return;
    setStep("migrating");
    writeContract({ address: mig, abi: CCMMigrationAbi, functionName: "migrate", args: [v1Bal] });
  };

  if (!isConnected) {
    return (
      <Card className="text-center">
        <p style={{ color: "var(--ink-soft)" }}>Connect your wallet to migrate v1 → v2.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Migration</SectionLabel>
        <H1>Migrate v1 → v2</H1>
        <Lede className="mt-5">
          Burns your v1 CCM and mints the same amount of v2 CCM 1:1.
          {bonusBps !== undefined && bonusBps > 0n && (
            <span className="ml-2 italic-moss">
              + {(Number(bonusBps) / 100).toFixed(2)}% bonus
            </span>
          )}
        </Lede>
      </header>

      <Card>
        <H2 className="mb-5">Migration status</H2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          <Field label="Your v1 balance" value={fmtCCM(v1Bal)} display />
          <Field label="Your v2 balance" value={fmtCCM(v2Bal)} display />
          <Field label="You've migrated (cumulative)" value={fmtCCM(migratedByMe as bigint | undefined)} />
          <Field label="Total migrated (all)" value={fmtCCM(totalMigrated)} />
          <Field
            label="Deadline"
            value={deadline ? new Date(Number(deadline) * 1000).toLocaleDateString() : "—"}
          />
          <div>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>
              Status
            </div>
            <div className="mt-1">
              {closed ? <Status color="red">Closed</Status> :
               paused ? <Status color="clay">Paused</Status> :
               isExpired ? <Status color="red">Expired</Status> :
               <Status color="moss">Open</Status>}
            </div>
          </div>
        </div>
      </Card>

      {v1Bal !== undefined && v1Bal === 0n ? (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>You have no v1 tokens to migrate.</p>
        </Card>
      ) : (
        <Card>
          <ol className="space-y-4 mb-6">
            <Step n={1} active={needsApproval} title="Approve migration to spend your v1 CCM"
              detail={`Current allowance: ${fmtCCM(allow)}`} />
            <Step n={2} active={!needsApproval} title={`Migrate ${fmtCCM(v1Bal)} v1 → v2`}
              detail="Burns v1 and mints v2 1:1." />
          </ol>

          <div className="flex flex-wrap gap-3">
            <CTA
              variant="ghost"
              label={step === "approving" && isPending ? "Awaiting wallet…" : "Approve"}
              onClick={onApprove}
              disabled={!needsApproval || isPending || isConfirming}
            />
            <CTA
              label={
                step === "migrating" && isPending ? "Awaiting wallet…" :
                step === "migrating" && isConfirming ? "Confirming…" :
                `Migrate ${fmtCCM(v1Bal)} CCM`
              }
              onClick={onMigrate}
              disabled={needsApproval || !canMigrate || isPending || isConfirming}
            />
          </div>
        </Card>
      )}

      {error && (
        <div
          className="border p-4 font-mono text-[12px]"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "#ef4444", color: "#ef4444" }}
        >
          {error.message}
        </div>
      )}
      {isConfirmed && (
        <div
          className="border p-4 font-mono text-[12px]"
          style={{ background: "rgba(45,191,99,0.08)", borderColor: "var(--moss)", color: "var(--moss)" }}
        >
          Confirmed. Refresh to see updated balances.
        </div>
      )}
    </div>
  );
}

function Field({ label, value, display = false }: { label: string; value: string; display?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: "var(--ink-soft)" }}>
        {label}
      </div>
      <div
        className={display ? "font-display mt-1" : "font-mono mt-1"}
        style={{
          fontSize: display ? 22 : 13,
          fontWeight: display ? 400 : 400,
          letterSpacing: display ? "-0.02em" : 0,
          color: "var(--ink)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Step({ n, active, title, detail }: { n: number; active: boolean; title: string; detail: string }) {
  return (
    <li className="flex gap-4 items-start">
      <span
        className="font-mono text-[11px] flex items-center justify-center"
        style={{
          width: 24,
          height: 24,
          background: active ? "var(--moss)" : "var(--rule)",
          color: active ? "var(--paper)" : "var(--ink-soft)",
        }}
      >
        {n}
      </span>
      <div className="flex-1">
        <div className="font-display" style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500 }}>
          {title}
        </div>
        <div className="font-mono text-[11px] mt-1" style={{ color: "var(--ink-soft)" }}>
          {detail}
        </div>
      </div>
    </li>
  );
}

function Status({ color, children }: { color: "moss" | "clay" | "red"; children: React.ReactNode }) {
  const map = {
    moss: { bg: "rgba(45,191,99,0.1)", fg: "var(--moss)", border: "var(--moss)" },
    clay: { bg: "rgba(200,96,46,0.1)", fg: "var(--clay)", border: "var(--clay)" },
    red:  { bg: "rgba(239,68,68,0.1)", fg: "#ef4444", border: "#ef4444" },
  }[color];
  return (
    <span
      className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
      style={{ background: map.bg, color: map.fg, borderColor: map.border }}
    >
      {children}
    </span>
  );
}
