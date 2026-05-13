import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { CONTRACTS, CCMSandboxFaucetAbi } from "../lib/contracts";

const FAUCET = CONTRACTS.baseSepolia.ccmSandboxFaucet;

function fmtSeconds(s: number): string {
  if (s <= 0) return "ready";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

export default function ClaimCard() {
  const { address, isConnected } = useAccount();

  const { data: cooldownRem, refetch: refetchCooldown } = useReadContract({
    address: FAUCET,
    abi: CCMSandboxFaucetAbi,
    functionName: "cooldownRemaining",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { writeContract, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isSuccess) refetchCooldown();
  }, [isSuccess, refetchCooldown]);

  const remaining = cooldownRem !== undefined ? Number(cooldownRem) : 0;
  // Decay the on-chain remaining by client-side wallclock so the countdown is smooth.
  const liveRemaining = Math.max(0, remaining - (now % 5));
  const claimable = isConnected && liveRemaining === 0;
  const busy = isPending || isMining;

  function onClaim() {
    if (!claimable) return;
    writeContract({
      address: FAUCET,
      abi: CCMSandboxFaucetAbi,
      functionName: "claim",
      args: [],
    });
  }

  return (
    <section
      className="border p-7"
      style={{
        background: "var(--tn-surface)",
        borderColor: "var(--tn-border)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <h2
            className="font-mono text-[11px] tracking-[0.16em] uppercase mb-2"
            style={{ color: "var(--tn-amber-text)" }}
          >
            Step 3 · Claim 100 test CCM
          </h2>
          <p
            style={{
              color: "var(--tn-text-soft)",
              fontSize: 14,
              lineHeight: 1.6,
              maxWidth: 520,
            }}
          >
            One-tap claim from the sandbox faucet. 100 test CCM per call,
            24-hour cooldown per address. Tokens have no real value and stay
            on Base Sepolia.
          </p>
          {error ? (
            <p className="mt-3 font-mono text-[12px]" style={{ color: "#ef4444" }}>
              {error.message.slice(0, 120)}
            </p>
          ) : null}
          {isSuccess ? (
            <p className="mt-3 font-mono text-[12px]" style={{ color: "var(--tn-amber-text)" }}>
              ✓ Claim confirmed. 100 CCM minted to your wallet.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!claimable || busy}
          onClick={onClaim}
          className="font-mono text-[12px] tracking-[0.14em] uppercase px-6 py-3 transition-colors shrink-0"
          style={{
            background: claimable && !busy ? "var(--tn-amber)" : "rgba(245,158,11,0.18)",
            color: claimable && !busy ? "#000" : "var(--tn-text-soft)",
            border: `1px solid var(--tn-amber)`,
            cursor: claimable && !busy ? "pointer" : "not-allowed",
            minWidth: 220,
            textAlign: "center",
          }}
        >
          {!isConnected
            ? "Connect wallet first"
            : busy
            ? "Claiming…"
            : claimable
            ? "Claim 100 CCM →"
            : `Cooldown · ${fmtSeconds(liveRemaining)}`}
        </button>
      </div>
    </section>
  );
}
