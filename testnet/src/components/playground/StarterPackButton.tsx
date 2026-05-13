/**
 * One-click starter pack — 50 CCM + 100 sUSDC to caller, 1h cooldown.
 * Visible at top of page for connected wallets. Lets new visitors
 * skip the mine→wrap dance if they just want to try staking or swap.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { SANDBOX, CCMSandboxStarterPackAbi } from "../../lib/contracts";
import { pingActivityFeed } from "../../lib/activityBus";

function fmtCooldown(secs: number): string {
  if (secs <= 0) return "0s";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function StarterPackButton() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();

  const { data: cdRaw, refetch: refetchCd } = useReadContract({
    address: SANDBOX.starterPack,
    abi: CCMSandboxStarterPackAbi,
    functionName: "cooldownRemaining",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15000 },
  });
  const cd = Number((cdRaw as bigint | undefined) ?? 0n);

  const { writeContract, data: claimHash, isPending: claiming } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: claimHash });

  useEffect(() => {
    if (isSuccess) {
      void refetchCd();
      pingActivityFeed();
    }
  }, [isSuccess, refetchCd]);

  function onClaim() {
    writeContract({
      address: SANDBOX.starterPack,
      abi: CCMSandboxStarterPackAbi,
      functionName: "claim",
    });
  }

  if (!isConnected) return null;
  const disabled = cd > 0 || claiming || confirming;

  return (
    <button
      onClick={onClaim}
      disabled={disabled}
      title={cd > 0 ? `Next claim in ${fmtCooldown(cd)}` : "Mints 50 CCM + 100 sUSDC to your wallet. 1h cooldown."}
      style={{
        background: disabled ? "transparent" : "var(--moss)",
        color: disabled ? "var(--ink-soft)" : "var(--paper)",
        border: disabled ? "1px solid var(--rule)" : "0",
        padding: "8px 18px",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {claiming || confirming
        ? "…"
        : cd > 0
          ? t("starter.cooldown", { time: fmtCooldown(cd) })
          : t("starter.claim")}
    </button>
  );
}
