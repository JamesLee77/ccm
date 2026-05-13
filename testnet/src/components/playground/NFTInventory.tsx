import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount, useReadContract } from "wagmi";
import { SANDBOX, CCMSandboxNFTAbi } from "../../lib/contracts";

const transferSingleEvent = parseAbiItem(
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
);

export default function NFTInventory() {
  const { t } = useTranslation();
  const { address } = useAccount();
  const [ids, setIds] = useState<bigint[]>([]);

  // Discover user's NFT ids via TransferSingle logs (from=0 → to=user).
  // For testnet UX, scan from a recent block. The sandbox was deployed
  // around block ~22000000 on Sepolia. Adjust if too slow.
  useEffect(() => {
    if (!address) { setIds([]); return; }
    let cancelled = false;
    (async () => {
      const client = createPublicClient({ chain: baseSepolia, transport: http(
        import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
      ) });
      const latest = await client.getBlockNumber();
      const fromBlock = latest > 1_000_000n ? latest - 100_000n : 0n; // last ~100k blocks ≈ 2 days
      const logs = await client.getLogs({
        address: SANDBOX.ccmSandboxNFT,
        event: transferSingleEvent,
        args: { to: address },
        fromBlock,
        toBlock: latest,
      });
      if (cancelled) return;
      const uniq = Array.from(new Set(logs.map((l) => l.args.id!)));
      setIds(uniq);
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
