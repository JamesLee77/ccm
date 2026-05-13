import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SANDBOX, CCMSandboxStakingAbi } from "../../lib/contracts";

export default function RewardPanel() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [unstakeAmt, setUnstakeAmt] = useState("");

  const { data: pending, refetch: refetchPending } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "pendingReward",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // 5s live update
    },
  });

  const { data: position, refetch: refetchPosition } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "users",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: poolRem } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "poolRemaining",
  });

  const { writeContract: writeClaim, data: claimHash, isPending: claiming } = useWriteContract();
  const { isSuccess: claimOk, isLoading: claimConfirm } = useWaitForTransactionReceipt({ hash: claimHash });

  const { writeContract: writeUnstake, data: unstakeHash, isPending: unstaking } = useWriteContract();
  const { isSuccess: unstakeOk, isLoading: unstakeConfirm } = useWaitForTransactionReceipt({ hash: unstakeHash });

  // After claim mines, refetch
  useEffect(() => {
    if (claimOk) {
      void refetchPending();
      void refetchPosition();
    }
  }, [claimOk, refetchPending, refetchPosition]);

  // After unstake mines, refetch and clear input
  useEffect(() => {
    if (unstakeOk) {
      void refetchPending();
      void refetchPosition();
      setUnstakeAmt("");
    }
  }, [unstakeOk, refetchPending, refetchPosition]);

  if (!isConnected) return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("wallet.connect")}</div>;

  const pendingNum = pending ? formatUnits(pending as bigint, 18) : "0";
  const stakedAmt = position ? (position as readonly [bigint, bigint])[0] : 0n;
  const poolExhausted = poolRem !== undefined && (poolRem as bigint) === 0n;

  function onClaim() {
    writeClaim({
      address: SANDBOX.ccmSandboxStaking,
      abi: CCMSandboxStakingAbi,
      functionName: "claim",
    });
  }

  function onUnstake() {
    if (!unstakeAmt) return;
    const amt = parseUnits(unstakeAmt, 18);
    if (amt === 0n) return;
    writeUnstake({
      address: SANDBOX.ccmSandboxStaking,
      abi: CCMSandboxStakingAbi,
      functionName: "unstake",
      args: [amt],
    });
  }

  return (
    <div>
      {poolExhausted && (
        <div style={{ background: "var(--warn)", color: "var(--paper)", padding: 8, marginBottom: 12, fontSize: 13 }}>
          {t("step4.poolExhausted")}
        </div>
      )}
      <div style={{ fontSize: 14, marginBottom: 12 }}>
        {t("step4.pending")}: <strong style={{ fontFamily: "ui-monospace, monospace" }}>{pendingNum} CCM</strong>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={onClaim}
          disabled={claiming || claimConfirm || stakedAmt === 0n}
          style={{ background: "var(--moss)", color: "var(--paper)", border: 0, padding: "8px 18px", cursor: stakedAmt === 0n ? "not-allowed" : "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", opacity: stakedAmt === 0n ? 0.5 : 1 }}
        >
          {claiming || claimConfirm ? "…" : t("step4.claim")}
        </button>
        <input
          type="text"
          value={unstakeAmt}
          onChange={(e) => setUnstakeAmt(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={t("step4.unstakeAmount")}
          style={{ padding: "6px 10px", border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink)", width: 180 }}
        />
        <button
          onClick={onUnstake}
          disabled={unstaking || unstakeConfirm || !unstakeAmt || stakedAmt === 0n}
          style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--rule)", padding: "8px 18px", cursor: "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          {unstaking || unstakeConfirm ? "…" : t("step4.unstake")}
        </button>
      </div>
    </div>
  );
}
