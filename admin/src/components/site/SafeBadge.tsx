import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  type SafePendingTx,
  isSafeWallet,
  listPendingSafeTxs,
  safeAppUrl,
} from "../../lib/safe";
import { CHAIN_ID } from "../../lib/contracts";

/**
 * Renders a small badge in the operator console when the connected wallet
 * is detected as a Gnosis Safe. Click to open the Safe app for sig
 * coordination. Shows a count of pending Safe txs so operator knows
 * there's work waiting.
 */
export default function SafeBadge() {
  const { address, isConnected } = useAccount();
  const [info, setInfo] = useState<{
    isSafe: boolean;
    version?: string;
    threshold?: number;
    owners?: string[];
  } | null>(null);
  const [pending, setPending] = useState<SafePendingTx[]>([]);

  useEffect(() => {
    if (!isConnected || !address) {
      setInfo(null);
      setPending([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const i = await isSafeWallet(CHAIN_ID, address as `0x${string}`);
      if (cancelled) return;
      setInfo(i);
      if (i.isSafe) {
        const p = await listPendingSafeTxs(CHAIN_ID, address);
        if (!cancelled) setPending(p);
      } else {
        setPending([]);
      }
    })();
    const t = setInterval(async () => {
      if (!info?.isSafe) return;
      const p = await listPendingSafeTxs(CHAIN_ID, address);
      if (!cancelled) setPending(p);
    }, 30_000);
    return () => { cancelled = true; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  if (!isConnected || !info?.isSafe) return null;

  const url = safeAppUrl(CHAIN_ID, address!);
  const ready = pending.filter((t) => t.confirmations.length >= t.confirmationsRequired).length;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border hover:opacity-80 transition-opacity"
      style={{
        borderColor: "var(--clay)",
        background: "rgba(200,96,46,0.08)",
        color: "var(--clay)",
      }}
      title={`Safe v${info.version} · ${info.threshold}-of-${info.owners?.length} multisig · click to open in Safe app`}
    >
      🛡 Safe {info.threshold}-of-{info.owners?.length}
      {pending.length > 0 && (
        <span className="ml-2" style={{ color: ready > 0 ? "var(--moss)" : "var(--ink-soft)" }}>
          · {pending.length} pending{ready > 0 ? ` (${ready} ready)` : ""}
        </span>
      )}
    </a>
  );
}
