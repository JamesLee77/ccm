import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { SANDBOX, CCMSandboxNodeRegistryAbi } from "../../lib/contracts";

type Node = { owner: `0x${string}`; label: string; endpoint: string; registeredAt: bigint; active: boolean };

export default function NodeRegistrationCallout() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [label, setLabel] = useState("");
  const [endpoint, setEndpoint] = useState("");

  const { data: nodeRaw, refetch } = useReadContract({
    address: SANDBOX.nodeRegistry,
    abi: CCMSandboxNodeRegistryAbi,
    functionName: "nodeOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const node = nodeRaw as Node | undefined;
  const isRegistered = !!node && node.active && node.owner !== "0x0000000000000000000000000000000000000000";

  useEffect(() => {
    if (node && node.active) {
      setLabel(node.label);
      setEndpoint(node.endpoint);
    }
  }, [node?.label, node?.endpoint, node?.active]);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) void refetch();
  }, [isSuccess, refetch]);

  function onRegisterOrUpdate() {
    if (!label.trim()) return;
    writeContract({
      address: SANDBOX.nodeRegistry,
      abi: CCMSandboxNodeRegistryAbi,
      functionName: isRegistered ? "update" : "register",
      args: [label.slice(0, 64), endpoint.slice(0, 128)],
    });
  }

  function onUnregister() {
    writeContract({
      address: SANDBOX.nodeRegistry,
      abi: CCMSandboxNodeRegistryAbi,
      functionName: "unregister",
    });
  }

  return (
    <section style={{ marginBottom: 64, border: "1px solid var(--rule)", padding: 24, background: "var(--paper-deep)" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--moss)", marginBottom: 12 }}>
        {t("node.title")}
      </div>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: "0 0 20px 0", maxWidth: 640 }}>
        {t("node.subtitle")}
      </p>
      {!isConnected ? (
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{t("node.connect")}</div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <label style={{ fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {t("node.label")}
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={64}
              placeholder={t("node.labelPlaceholder")}
              style={{ display: "block", marginTop: 4, padding: "6px 10px", border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink)", width: 220 }}
            />
          </label>
          <label style={{ fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {t("node.endpoint")}
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              maxLength={128}
              placeholder={t("node.endpointPlaceholder")}
              style={{ display: "block", marginTop: 4, padding: "6px 10px", border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink)", width: 300 }}
            />
          </label>
          <button
            onClick={onRegisterOrUpdate}
            disabled={!label.trim() || isPending || confirming}
            style={{ background: "var(--moss)", color: "var(--paper)", border: 0, padding: "8px 18px", cursor: "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {isPending || confirming ? "…" : (isRegistered ? t("node.update") : t("node.register"))}
          </button>
          {isRegistered && (
            <button
              onClick={onUnregister}
              disabled={isPending || confirming}
              style={{ background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--rule)", padding: "8px 14px", cursor: "pointer", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              {t("node.unregister")}
            </button>
          )}
        </div>
      )}
      {isRegistered && (
        <div style={{ marginTop: 12, fontSize: 11, color: "var(--ink-soft)" }}>
          ✓ {t("node.registered")}: <span style={{ color: "var(--moss)", fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>{node!.label}</span>
        </div>
      )}
    </section>
  );
}
