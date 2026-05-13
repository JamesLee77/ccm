import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, type Address } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SANDBOX, CCMSandboxNFTAbi, CCMSandboxVaultAbi, CCMTokenAbi } from "../../lib/contracts";
import { publicClient, transferSingleEvent, getScanRange } from "../../lib/onchain";

const GRADE_LABEL = ["A", "B", "C", "D"] as const;

type NftMeta = {
  id: bigint;
  balance: bigint;
  grade: number;
  vintage: number;
  tonnage: bigint;
};

export default function WrapForm() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [items, setItems] = useState<NftMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<bigint | null>(null);

  // Scan recent mints to this address and fetch their on-chain balance + meta
  async function refreshInventory(addr: Address) {
    setLoading(true);
    try {
      const { from, to } = await getScanRange();
      const logs = await publicClient.getLogs({
        address: SANDBOX.ccmSandboxNFT,
        event: transferSingleEvent,
        args: { to: addr },
        fromBlock: from,
        toBlock: to,
      });
      const idSet = new Set<bigint>();
      for (const log of logs) {
        const id = (log.args as { id?: bigint }).id;
        if (id !== undefined) idSet.add(id);
      }
      const rows: NftMeta[] = [];
      for (const id of idSet) {
        const [balance, meta] = await Promise.all([
          publicClient.readContract({
            address: SANDBOX.ccmSandboxNFT,
            abi: CCMSandboxNFTAbi,
            functionName: "balanceOf",
            args: [addr, id],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: SANDBOX.ccmSandboxNFT,
            abi: CCMSandboxNFTAbi,
            functionName: "meta",
            args: [id],
          }) as Promise<readonly [number, number, bigint, `0x${string}`, Address, bigint]>,
        ]);
        if (balance > 0n) {
          rows.push({ id, balance, grade: meta[0], vintage: meta[1], tonnage: meta[2] });
        }
      }
      rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!address) {
      setItems([]);
      return;
    }
    void refreshInventory(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const { data: approved, refetch: refetchApproval } = useReadContract({
    address: SANDBOX.ccmSandboxNFT,
    abi: CCMSandboxNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, SANDBOX.ccmSandboxVault] : undefined,
    query: { enabled: !!address },
  });

  const { data: ccmBal, refetch: refetchCcm } = useReadContract({
    address: SANDBOX.ccmToken,
    abi: CCMTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract: writeApprove, data: approveHash, isPending: approving } = useWriteContract();
  const { isSuccess: approveOk } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: writeWrap, data: wrapHash, isPending: wrapping } = useWriteContract();
  const { isSuccess: wrapOk, isLoading: wrapConfirm } = useWaitForTransactionReceipt({ hash: wrapHash });

  useEffect(() => {
    if (approveOk) void refetchApproval();
  }, [approveOk, refetchApproval]);

  useEffect(() => {
    if (wrapOk) {
      void refetchCcm();
      setActiveId(null);
      if (address) void refreshInventory(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapOk]);

  function onApprove() {
    writeApprove({
      address: SANDBOX.ccmSandboxNFT,
      abi: CCMSandboxNFTAbi,
      functionName: "setApprovalForAll",
      args: [SANDBOX.ccmSandboxVault, true],
    });
  }

  function onWrap(row: NftMeta) {
    setActiveId(row.id);
    writeWrap({
      address: SANDBOX.ccmSandboxVault,
      abi: CCMSandboxVaultAbi,
      functionName: "wrap",
      args: [row.id, row.balance],
    });
  }

  if (!isConnected) {
    return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("wallet.connect")}</div>;
  }
  if (loading && items.length === 0) {
    return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>…</div>;
  }
  if (items.length === 0) {
    return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("step2.noNfts")}</div>;
  }

  return (
    <div>
      {!approved && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}>
            {t("step2.approveHint")}
          </div>
          <button
            onClick={onApprove}
            disabled={approving}
            style={{
              background: "transparent", color: "var(--ink)",
              border: "1px solid var(--rule)",
              padding: "8px 18px", cursor: "pointer",
              fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
            }}
          >
            {approving ? "…" : t("step2.approve")}
          </button>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((row) => {
          const isActive = activeId === row.id && (wrapping || wrapConfirm);
          return (
            <li
              key={String(row.id)}
              style={{
                padding: "10px 14px",
                border: "1px solid var(--rule)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 13 }}>
                #{String(row.id)} · Grade {GRADE_LABEL[row.grade] ?? "?"} · {row.vintage} ·{" "}
                <strong style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>{row.balance.toString()}</strong> t
              </span>
              <button
                onClick={() => onWrap(row)}
                disabled={!approved || wrapping || wrapConfirm}
                style={{
                  background: !approved ? "transparent" : "var(--moss)",
                  color: !approved ? "var(--ink-soft)" : "var(--paper)",
                  border: !approved ? "1px solid var(--rule)" : "0",
                  padding: "6px 16px",
                  cursor: !approved ? "not-allowed" : "pointer",
                  fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
                }}
              >
                {isActive ? "…" : t("step2.wrap")}
              </button>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: 16, fontSize: 13 }}>
        {t("step2.balance")}: <strong>{ccmBal ? formatUnits(ccmBal as bigint, 18) : "0"} CCM</strong>
      </div>
    </div>
  );
}
