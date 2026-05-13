import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SANDBOX, CCMSandboxNFTAbi } from "../../lib/contracts";
import { useAccount, useReadContract } from "wagmi";
import { publicClient, transferSingleEvent, SCAN_WINDOW } from "../../lib/onchain";

// Base Sepolia public RPC caps eth_getLogs at 2000 blocks per query, so we
// can only show NFTs minted in the last ~1.1h here. The user's full
// inventory remains queryable via balanceOf — this list is just the
// recently-minted batches discoverable without an indexer.

export default function NFTInventory() {
  const { t } = useTranslation();
  const { address } = useAccount();
  const [ids, setIds] = useState<bigint[]>([]);

  useEffect(() => {
    if (!address) { setIds([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const latest = await publicClient.getBlockNumber();
        const fromBlock = latest > SCAN_WINDOW ? latest - SCAN_WINDOW : 0n;
        const logs = await publicClient.getLogs({
          address: SANDBOX.ccmSandboxNFT,
          event: transferSingleEvent,
          args: { to: address },
          fromBlock,
          toBlock: latest,
        });
        if (cancelled) return;
        const uniq = Array.from(new Set(logs.map((l) => l.args.id!)));
        setIds(uniq);
      } catch (e) {
        console.warn("NFTInventory getLogs:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  if (!address) return null;
  if (ids.length === 0) return <div style={{ marginTop: 12, color: "var(--ink-soft)", fontSize: 13 }}>{t("step1.emptyInventory")}</div>;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 8 }}>
        {t("step1.inventory")}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {ids.map((id) => <InventoryRow key={String(id)} id={id} />)}
      </ul>
    </div>
  );
}

function InventoryRow({ id }: { id: bigint }) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { data: meta } = useReadContract({
    address: SANDBOX.ccmSandboxNFT,
    abi: CCMSandboxNFTAbi,
    functionName: "meta",
    args: [id],
  });
  const { data: bal } = useReadContract({
    address: SANDBOX.ccmSandboxNFT,
    abi: CCMSandboxNFTAbi,
    functionName: "balanceOf",
    args: address ? [address, id] : undefined,
    query: { enabled: !!address },
  });
  if (!meta || (typeof bal === "bigint" && bal === 0n)) return null;
  const gradeStr = ["A","B","C","D"][meta[0]] ?? "?";
  return (
    <li style={{ padding: "8px 12px", border: "1px solid var(--rule)", display: "flex", justifyContent: "space-between" }}>
      <span>{t("step1.row", { id: String(id), grade: gradeStr, vintage: meta[1], tonnage: meta[2] })}</span>
    </li>
  );
}
