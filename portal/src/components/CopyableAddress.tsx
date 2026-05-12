import { useState } from "react";
import { shortAddress } from "../lib/format";

interface Props {
  address: string;
  /** Show the full address instead of the abbreviated form. */
  full?: boolean;
  /** Optional className for layout. */
  className?: string;
  /** Show an external explorer link icon (Base mainnet basescan.org). */
  withExplorer?: boolean;
}

export default function CopyableAddress({ address, full, className = "", withExplorer }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — older browsers without clipboard API
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <code className="font-mono text-xs bg-neutral-800/50 px-1.5 py-0.5 rounded">
        {full ? address : shortAddress(address)}
      </code>
      <button
        onClick={() => void copy()}
        title={copied ? "Copied!" : "Copy address"}
        aria-label="Copy address"
        className="text-neutral-500 hover:text-neutral-200 transition focus:outline-none focus:ring-1 focus:ring-green-500 rounded"
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
      {withExplorer && (
        <a
          href={`https://basescan.org/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open on BaseScan"
          aria-label="Open on BaseScan"
          className="text-neutral-500 hover:text-neutral-200 transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      )}
    </span>
  );
}
