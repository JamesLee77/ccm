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
  CCMSandboxRebateAbi,
  CCMTokenAbi,
  GRADE_LABELS,
} from "../lib/contracts";

const REBATE = CONTRACTS.baseSepolia.ccmSandboxRebate;
const NFT = CONTRACTS.baseSepolia.ccmSandboxNFT;
const CCM = CONTRACTS.baseSepolia.ccmToken;
const E18 = 10n ** 18n;

const fmtCCM = (raw: bigint | undefined): string => {
  if (raw === undefined) return "—";
  const whole = raw / E18;
  const frac = ((raw % E18) * 10000n) / E18;
  return `${whole.toString()}.${frac.toString().padStart(4, "0")}`;
};

const GRADE_BASE_DISPLAY: Record<number, string> = {
  0: "2.0 CCM / t",
  1: "1.0 CCM / t",
  2: "0.5 CCM / t",
  3: "0.2 CCM / t",
};

export default function RebateCard() {
  const { address, isConnected } = useAccount();
  const [nftId, setNftId] = useState("0");
  const [tonnage, setTonnage] = useState(10);

  const idBig = (() => {
    try { return BigInt(nftId); } catch { return 0n; }
  })();
  const tonnageBig = BigInt(Math.max(0, tonnage));

  // Pull NFT meta (grade) for the chosen id
  const { data: meta } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "meta",
    args: [idBig],
    query: { refetchInterval: 8000 },
  });
  const metaTuple = meta as
    | readonly [number, number, bigint, `0x${string}`, `0x${string}`, bigint]
    | undefined;
  const idGrade = metaTuple ? metaTuple[0] : undefined;

  // User's NFT balance for the chosen id
  const { data: nftBalance } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "balanceOf",
    args: address ? [address, idBig] : undefined,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  // Approval to rebate vault
  const { data: nftApproved, refetch: refetchApproval } = useReadContract({
    address: NFT,
    abi: CCMSandboxNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, REBATE] : undefined,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  // Cumulative retired and current multiplier for the user
  const { data: cumulativeRetired, refetch: refetchCum } = useReadContract({
    address: REBATE,
    abi: CCMSandboxRebateAbi,
    functionName: "cumulativeRetired",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 6000 },
  });
  const { data: multiplierBps, refetch: refetchMult } = useReadContract({
    address: REBATE,
    abi: CCMSandboxRebateAbi,
    functionName: "currentMultiplierBps",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  // Quote rebate (preview)
  const canQuote =
    !!address && idGrade !== undefined && idGrade <= 3 && tonnageBig > 0n;
  const { data: quote } = useReadContract({
    address: REBATE,
    abi: CCMSandboxRebateAbi,
    functionName: "quoteRebate",
    args: canQuote ? [address!, idGrade!, tonnageBig] : undefined,
    query: { enabled: canQuote, refetchInterval: 5000 },
  });
  const quoteTuple = quote as readonly [bigint, number] | undefined;
  const rebatePreview = quoteTuple?.[0];

  // CCM balance (post-rebate display)
  const { data: ccmBalance, refetch: refetchCcm } = useReadContract({
    address: CCM,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  // Globals
  const { data: totalRetired, refetch: refetchTotalR } = useReadContract({
    address: REBATE,
    abi: CCMSandboxRebateAbi,
    functionName: "totalRetired",
    query: { refetchInterval: 8000 },
  });
  const { data: totalRebated, refetch: refetchTotalRb } = useReadContract({
    address: REBATE,
    abi: CCMSandboxRebateAbi,
    functionName: "totalRebated",
    query: { refetchInterval: 8000 },
  });

  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetchApproval();
      refetchCum();
      refetchMult();
      refetchCcm();
      refetchTotalR();
      refetchTotalRb();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const busy = isPending || isMining;

  function approveNFT() {
    writeContract({
      address: NFT,
      abi: CCMSandboxNFTAbi,
      functionName: "setApprovalForAll",
      args: [REBATE, true],
    });
  }
  function doRetire() {
    writeContract({
      address: REBATE,
      abi: CCMSandboxRebateAbi,
      functionName: "retire",
      args: [idBig, tonnageBig],
    });
  }

  const userBal = (nftBalance as bigint | undefined) ?? 0n;
  const enoughNFT = userBal >= tonnageBig;
  const isApproved = (nftApproved as boolean | undefined) === true;
  const cum = (cumulativeRetired as bigint | undefined) ?? 0n;
  const mult = (multiplierBps as number | undefined) ?? 10000;
  const tier = mult === 20000 ? "2.0×" : mult === 15000 ? "1.5×" : "1.0×";
  const nextThreshold =
    cum < 100n ? 100n - cum : cum < 1000n ? 1000n - cum : null;

  return (
    <section className="space-y-6">
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h2
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-3"
          style={{ color: "var(--tn-amber-text)" }}
        >
          §&nbsp;7.9 · Retire-to-Earn · burn NFT, mint $CCM rebate
        </h2>
        <p
          className="mb-5 max-w-[760px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 14, lineHeight: 1.6 }}
        >
          Permanent retirement that pays. Burn a CCM-NFT (the carbon credit
          comes off-chain forever) and earn $CCM proportional to grade and a
          per-user cumulative-retirement multiplier. The more you retire over
          time, the higher your tier — frequent retirers get 1.5×, dedicated
          retirers get 2×.
        </p>

        {/* Per-grade base rates */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-5"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          {GRADE_LABELS.map((label, g) => (
            <div key={label} style={{ background: "var(--tn-surface)", padding: "16px 18px" }}>
              <div
                className="font-mono text-[10px] tracking-[0.14em] uppercase"
                style={{ color: "var(--tn-text-soft)" }}
              >
                Grade {label} base
              </div>
              <div className="font-display mt-1" style={{ fontSize: 22, fontWeight: 400 }}>
                {GRADE_BASE_DISPLAY[g]}
              </div>
            </div>
          ))}
        </div>

        {/* Tier ladder */}
        <div
          className="grid grid-cols-3 gap-1"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          <Tier label="Tier 1" range="0 – 99 t cumulative" mult="1.0×" active={mult === 10000} />
          <Tier label="Tier 2" range="100 – 999 t cumulative" mult="1.5×" active={mult === 15000} />
          <Tier label="Tier 3" range="1,000 t+ cumulative" mult="2.0×" active={mult === 20000} />
        </div>
      </div>

      {/* User stats */}
      {isConnected ? (
        <div
          className="border p-7"
          style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
        >
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-1"
            style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
          >
            <Stat label="Your tier" value={tier} />
            <Stat label="Your cumulative retired" value={`${cum.toString()} t`} />
            <Stat
              label="To next tier"
              value={nextThreshold !== null ? `${nextThreshold.toString()} t` : "max"}
            />
            <Stat label="Your $CCM balance" value={fmtCCM(ccmBalance as bigint | undefined)} />
          </div>
        </div>
      ) : null}

      {/* Retire form */}
      <div
        className="border p-7"
        style={{ background: "var(--tn-surface)", borderColor: "var(--tn-border)" }}
      >
        <h3
          className="font-mono text-[11px] tracking-[0.16em] uppercase mb-4"
          style={{ color: "var(--tn-amber-text)" }}
        >
          Retire NFT for $CCM rebate
        </h3>
        <p
          className="mb-4 max-w-[640px]"
          style={{ color: "var(--tn-text-soft)", fontSize: 13, lineHeight: 1.55 }}
        >
          Pre-requisite: hold the CCM-NFT (mint via §7.0 above). The vault
          calls{" "}
          <code style={{ color: "var(--tn-amber-text)" }}>nft.retire(id, t)</code>{" "}
          to permanently burn supply, then mints $CCM at base × tonnage ×
          tier-multiplier. Multiplier uses your cumulative retired BEFORE this
          call (a single huge retire does not unlock a higher tier mid-flight).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="NFT id">
            <input
              type="number"
              min={0}
              value={nftId}
              onChange={(e) => setNftId(e.target.value)}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <Field label="Tonnage to retire">
            <input
              type="number"
              min={1}
              value={tonnage}
              onChange={(e) => setTonnage(Number(e.target.value))}
              className="w-full bg-transparent border px-3 py-2 font-mono text-sm"
              style={{ borderColor: "var(--tn-border)", color: "var(--tn-text)" }}
            />
          </Field>
          <div>
            <div
              className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2"
              style={{ color: "var(--tn-text-soft)" }}
            >
              Inferred grade
            </div>
            <div
              className="border px-3 py-2 font-mono text-sm"
              style={{
                borderColor: "var(--tn-border)",
                color: "var(--tn-text)",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              {idGrade !== undefined && idGrade <= 3 ? `Grade ${GRADE_LABELS[idGrade]}` : "—"}
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-1 mb-5"
          style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
        >
          <Stat label="Your balance for id" value={`${userBal.toString()} t`} />
          <Stat
            label="Multiplier (this call)"
            value={tier}
          />
          <Stat
            label="$CCM you will receive"
            value={fmtCCM(rebatePreview)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CTA
            label={isApproved ? "✓ NFT approved" : "Approve NFT"}
            onClick={approveNFT}
            disabled={!isConnected || busy || isApproved}
          />
          <CTA
            label={busy ? "Retiring…" : `Retire ${tonnage}t`}
            onClick={doRetire}
            disabled={
              !isConnected ||
              busy ||
              !isApproved ||
              !enoughNFT ||
              tonnage < 1 ||
              idGrade === undefined ||
              idGrade > 3
            }
          />
        </div>

        {!enoughNFT && isConnected ? (
          <p className="font-mono text-[11px] mt-3" style={{ color: "#ef4444" }}>
            Insufficient NFT balance for id {idBig.toString()} ({userBal.toString()} held).
          </p>
        ) : null}

        {error ? (
          <p className="font-mono text-[12px] mt-3" style={{ color: "#ef4444" }}>
            {error.message.slice(0, 220)}
          </p>
        ) : null}
        {isSuccess ? (
          <p
            className="font-mono text-[12px] mt-3"
            style={{ color: "var(--tn-amber-text)" }}
          >
            ✓ Transaction confirmed.
          </p>
        ) : null}
      </div>

      {/* Global stats */}
      <div
        className="grid grid-cols-2 gap-1"
        style={{ background: "var(--tn-border)", border: "1px solid var(--tn-border)" }}
      >
        <Stat
          label="Total retired (all users)"
          value={`${((totalRetired as bigint | undefined) ?? 0n).toString()} t`}
        />
        <Stat
          label="Total $CCM rebated"
          value={fmtCCM(totalRebated as bigint | undefined)}
        />
      </div>
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
      }}
    >
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--tn-surface)", padding: "16px 18px" }}>
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase"
        style={{ color: "var(--tn-text-soft)" }}
      >
        {label}
      </div>
      <div className="font-display mt-1" style={{ fontSize: 20, fontWeight: 400 }}>
        {value}
      </div>
    </div>
  );
}

function Tier({
  label,
  range,
  mult,
  active,
}: {
  label: string;
  range: string;
  mult: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        background: active ? "rgba(245,158,11,0.08)" : "var(--tn-surface)",
        padding: "16px 18px",
        borderLeft: active ? "2px solid var(--tn-amber)" : "2px solid transparent",
      }}
    >
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase"
        style={{ color: active ? "var(--tn-amber-text)" : "var(--tn-text-soft)" }}
      >
        {label} {active ? "· active" : ""}
      </div>
      <div className="font-display mt-1" style={{ fontSize: 22, fontWeight: 400 }}>
        {mult}
      </div>
      <div
        className="font-mono text-[10px] mt-1"
        style={{ color: "var(--tn-text-soft)" }}
      >
        {range}
      </div>
    </div>
  );
}
