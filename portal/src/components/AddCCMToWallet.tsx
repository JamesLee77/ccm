/**
 * "Add CCM to MetaMask" button.
 *
 * Uses EIP-747 `wallet_watchAsset` to pre-fill the token import dialog
 * with the correct symbol (CCM) and decimals (18). Eliminates the need
 * for users to manually paste the contract address or type values that
 * could be wrong (a 12-decimal mistake displays balance as "10 trillion").
 */
import { useState } from "react";
import { useAccount } from "wagmi";
import { CONTRACTS } from "../lib/contracts";
import { CTA } from "./site/primitives";

const ZERO = "0x0000000000000000000000000000000000000000";

type Status = "idle" | "pending" | "success" | "error";

export default function AddCCMToWallet() {
  const { isConnected, connector } = useAccount();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Don't render if no live mainnet contract (testnet build still uses
  // sandbox addresses; user can add those manually if needed).
  if (CONTRACTS.ccmTokenV1 === ZERO) return null;

  async function add() {
    setStatus("pending");
    setError(null);
    try {
      // Prefer the connected wallet's provider (works with MetaMask, Rabby,
      // Coinbase Wallet, etc.). Fall back to window.ethereum if the user
      // isn't connected through wagmi yet.
      const provider = (await connector?.getProvider?.()) as { request: (args: { method: string; params: unknown }) => Promise<unknown> } | undefined;
      const eth = provider ?? (window as unknown as { ethereum?: typeof provider }).ethereum;
      if (!eth?.request) {
        throw new Error("No injected wallet detected.");
      }
      const added = await eth.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: CONTRACTS.ccmTokenV1,
            symbol: "CCM",
            decimals: 18,
          },
        },
      });
      setStatus(added ? "success" : "error");
      if (!added) setError("Wallet declined to add the token.");
    } catch (e) {
      console.error(e);
      setStatus("error");
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  const label =
    status === "pending" ? "Adding…"
    : status === "success" ? "Added ✓"
    : status === "error" ? "Add CCM to MetaMask (retry)"
    : "Add CCM to MetaMask";

  return (
    <div className="flex flex-col items-start gap-2">
      <CTA
        label={label}
        onClick={add}
        disabled={!isConnected || status === "pending"}
        variant="ghost"
      />
      {error && (
        <div
          className="font-mono text-[10px] tracking-[0.12em]"
          style={{ color: "var(--ink-soft)" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
