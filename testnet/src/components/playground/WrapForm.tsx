import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SANDBOX, CCMSandboxNFTAbi, CCMSandboxVaultAbi, CCMTokenAbi } from "../../lib/contracts";

const transferSingleEvent = parseAbiItem(
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
);

export default function WrapForm() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const [ids, setIds] = useState<bigint[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!address) { setIds([]); return; }
    let cancelled = false;
    (async () => {
      const client = createPublicClient({ chain: baseSepolia, transport: http(
        import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
      ) });
      const latest = await client.getBlockNumber();
      const fromBlock = latest > 1_000_000n ? latest - 100_000n : 0n;
      const logs = await client.getLogs({
        address: SANDBOX.ccmSandboxNFT,
        event: transferSingleEvent,
        args: { to: address },
        fromBlock,
        toBlock: latest,
      });
      if (cancelled) return;
      setIds(Array.from(new Set(logs.map((l) => l.args.id!))));
    })();
    return () => { cancelled = true; };
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

  // After approval mines, refetch
  useEffect(() => {
    if (approveOk) void refetchApproval();
  }, [approveOk, refetchApproval]);

  // After wrap mines, refetch CCM balance and reset selection
  useEffect(() => {
    if (wrapOk) {
      void refetchCcm();
      setSelected(new Set());
    }
  }, [wrapOk, refetchCcm]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id); // 5/tx cap
      return next;
    });
  }

  function onApprove() {
    writeApprove({
      address: SANDBOX.ccmSandboxNFT,
      abi: CCMSandboxNFTAbi,
      functionName: "setApprovalForAll",
      args: [SANDBOX.ccmSandboxVault, true],
    });
  }

  function onWrap() {
    if (selected.size === 0) return;
    const sel = Array.from(selected).map(s => BigInt(s));
    // amount per NFT = balanceOf (we wrap all of each selected NFT).
    // Simpler: wrap 1 of each (works because mint creates 1 of each id).
    const amounts = sel.map(() => 1n);
    writeWrap({
      address: SANDBOX.ccmSandboxVault,
      abi: CCMSandboxVaultAbi,
      functionName: "wrap",
      args: [sel, amounts],
    });
  }

  if (!isConnected) {
    return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("wallet.connect")}</div>;
  }
  if (ids.length === 0) {
    return <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("step2.noNfts")}</div>;
  }

  return (
    <div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {ids.map(id => (
          <li key={String(id)} style={{ padding: "6px 12px", border: "1px solid var(--rule)" }}>
            <label style={{ cursor: "pointer", display: "flex", gap: 12 }}>
              <input
                type="checkbox"
                checked={selected.has(String(id))}
                onChange={() => toggle(String(id))}
              />
              <span>#{String(id)}</span>
            </label>
          </li>
        ))}
      </ul>
      <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 8 }}>{t("step2.maxPerTx")}</div>
      {approved ? (
        <button
          onClick={onWrap}
          disabled={selected.size === 0 || wrapping || wrapConfirm}
          style={{
            background: "var(--moss)", color: "var(--paper)", border: 0,
            padding: "8px 18px", cursor: "pointer",
            fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
          }}
        >
          {wrapping || wrapConfirm ? "…" : t("step2.wrap")}
        </button>
      ) : (
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
      )}
      <div style={{ marginTop: 16, fontSize: 13 }}>
        {t("step2.balance")}: <strong>{ccmBal ? formatUnits(ccmBal as bigint, 18) : "0"} CCM</strong>
      </div>
    </div>
  );
}
