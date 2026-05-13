import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SANDBOX, CCMTokenAbi, CCMSandboxStakingAbi } from "../../lib/contracts";
import { pingActivityFeed } from "../../lib/activityBus";

export default function StakeForm() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");

  const { data: ccmBal } = useReadContract({
    address: SANDBOX.ccmToken,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: SANDBOX.ccmToken,
    abi: CCMTokenAbi,
    functionName: "allowance",
    args: address ? [address, SANDBOX.ccmSandboxStaking] : undefined,
    query: { enabled: !!address },
  });

  const { data: position, refetch: refetchPosition } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "users",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: rateBps } = useReadContract({
    address: SANDBOX.ccmSandboxStaking,
    abi: CCMSandboxStakingAbi,
    functionName: "currentYieldRateBps",
  });

  const { writeContract: writeApprove, data: approveHash, isPending: approving } = useWriteContract();
  const { isSuccess: approveOk } = useWaitForTransactionReceipt({ hash: approveHash });
  const { writeContract: writeStake, data: stakeHash, isPending: staking } = useWriteContract();
  const { isSuccess: stakeOk, isLoading: stakeConfirm } = useWaitForTransactionReceipt({ hash: stakeHash });

  // After approve mines, refetch allowance
  useEffect(() => {
    if (approveOk) void refetchAllowance();
  }, [approveOk, refetchAllowance]);

  // After stake mines, refetch position and clear input
  useEffect(() => {
    if (stakeOk) {
      void refetchPosition();
      setAmount("");
      pingActivityFeed();
    }
  }, [stakeOk, refetchPosition]);

  const wantAmount = amount ? parseUnits(amount, 18) : 0n;
  const hasAllowance = !!allowance && (allowance as bigint) >= wantAmount && wantAmount > 0n;

  function onApprove() {
    writeApprove({
      address: SANDBOX.ccmToken,
      abi: CCMTokenAbi,
      functionName: "approve",
      args: [SANDBOX.ccmSandboxStaking, maxUint256],
    });
  }

  function onStake() {
    if (wantAmount === 0n) return;
    writeStake({
      address: SANDBOX.ccmSandboxStaking,
      abi: CCMSandboxStakingAbi,
      functionName: "stake",
      args: [wantAmount],
    });
  }

  function onMax() {
    if (!ccmBal) return;
    setAmount(formatUnits(ccmBal as bigint, 18));
  }

  if (!isConnected) return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("wallet.connect")}</div>;
  if (!ccmBal || (ccmBal as bigint) === 0n) return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("step3.noBalance")}</div>;

  const rate = rateBps ? Number(rateBps) / 100 : 0; // bps → %
  const stakedAmt = position ? (position as readonly [bigint, bigint])[0] : 0n;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={t("step3.amount")}
          style={{ padding: "6px 10px", border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink)", width: 180 }}
        />
        <button onClick={onMax} style={{ background: "transparent", border: "1px solid var(--rule)", padding: "6px 10px", fontSize: 11, cursor: "pointer", color: "var(--ink)" }}>
          {t("step3.max")}
        </button>
      </div>
      {hasAllowance ? (
        <button
          onClick={onStake}
          disabled={staking || stakeConfirm || wantAmount === 0n}
          style={{ background: "var(--moss)", color: "var(--paper)", border: 0, padding: "8px 18px", cursor: "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          {staking || stakeConfirm ? "…" : t("step3.stake")}
        </button>
      ) : (
        <button
          onClick={onApprove}
          disabled={approving}
          style={{ background: "transparent", border: "1px solid var(--rule)", color: "var(--ink)", padding: "8px 18px", cursor: "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          {approving ? "…" : t("step3.approveAndStake")}
        </button>
      )}
      <div style={{ marginTop: 16, fontSize: 13 }}>
        {t("step3.currentStake")}: <strong>{formatUnits(stakedAmt, 18)} CCM</strong>
        {" · "}
        {t("step3.currentRate")}: <strong>{rate.toFixed(2)}% /mo</strong>
      </div>
    </div>
  );
}
