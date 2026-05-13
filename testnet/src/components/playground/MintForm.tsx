import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { keccak256, toBytes } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SANDBOX, CCMSandboxNFTAbi } from "../../lib/contracts";
import CooldownTimer from "./CooldownTimer";

const PROJECT_ID = keccak256(toBytes("ccm-testnet-playground"));

export default function MintForm() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [grade, setGrade] = useState(0);
  const [vintage, setVintage] = useState(2026);
  const [tonnage, setTonnage] = useState(50);

  const { data: cooldownUntil, refetch: refetchCd } = useReadContract({
    address: SANDBOX.ccmSandboxNFT,
    abi: CCMSandboxNFTAbi,
    functionName: "nextMintAt",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const now = Math.floor(Date.now() / 1000);
  const onCooldown = !!cooldownUntil && Number(cooldownUntil) > now;
  const disabled = !isConnected || isPending || confirming || onCooldown;

  // After a successful mint, refetch cooldown
  useEffect(() => {
    if (isSuccess) void refetchCd();
  }, [isSuccess, refetchCd]);

  function onMine() {
    writeContract({
      address: SANDBOX.ccmSandboxNFT,
      abi: CCMSandboxNFTAbi,
      functionName: "mint",
      args: [grade, vintage, BigInt(tonnage), PROJECT_ID],
    });
  }

  const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.12em" };
  const inputStyle: React.CSSProperties = { padding: "6px 10px", border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink)", marginLeft: 8 };

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "end", flexWrap: "wrap" }}>
      <label style={labelStyle}>
        {t("step1.labels.grade")}
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} style={inputStyle}>
          <option value={0}>A</option>
          <option value={1}>B</option>
          <option value={2}>C</option>
          <option value={3}>D</option>
        </select>
      </label>
      <label style={labelStyle}>
        {t("step1.labels.vintage")}
        <input type="number" min={2020} max={2030} value={vintage} onChange={(e) => setVintage(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} />
      </label>
      <label style={labelStyle}>
        {t("step1.labels.tonnage")}
        <input type="number" min={1} max={1000} value={tonnage} onChange={(e) => setTonnage(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} />
      </label>
      <button
        onClick={onMine}
        disabled={disabled}
        style={{
          background: disabled ? "transparent" : "var(--moss)",
          color: disabled ? "var(--ink-soft)" : "var(--paper)",
          border: `1px solid ${disabled ? "var(--rule)" : "var(--moss)"}`,
          padding: "8px 18px",
          cursor: disabled ? "not-allowed" : "pointer",
          textTransform: "uppercase",
          fontSize: 12,
          letterSpacing: "0.14em",
        }}
      >
        {onCooldown && cooldownUntil
          ? t("step1.cooldown", { time: "" })
          : isPending || confirming
            ? "…"
            : t("step1.mine")}
      </button>
      {onCooldown && cooldownUntil ? <CooldownTimer untilTimestamp={cooldownUntil as bigint} /> : null}
    </div>
  );
}
