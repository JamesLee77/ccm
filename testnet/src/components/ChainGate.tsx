import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";

/**
 * Chain gate — per architecture §3.2.
 *
 * If the wallet is connected and the chainId is anything other than Base
 * Sepolia (84532), display a full-screen non-dismissible modal with a
 * single "Switch to Base Sepolia" CTA. There is no path that lets a tx
 * proceed on the wrong chain because (a) wagmi config in this bundle
 * only knows about Base Sepolia and (b) every interactive page is wrapped
 * by this component.
 *
 * Disconnected state passes through (no chain to gate yet).
 */
export default function ChainGate({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const wrongChain = isConnected && chainId !== baseSepolia.id;

  return (
    <>
      {children}
      {wrongChain ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cg-title"
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.86)" }}
        >
          <div
            className="border max-w-md w-full mx-6 p-8"
            style={{
              background: "var(--tn-surface)",
              borderColor: "var(--tn-amber)",
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--tn-amber)",
                  color: "#000",
                  fontWeight: 800,
                }}
              >
                !
              </span>
              <h2
                id="cg-title"
                className="text-lg font-semibold tracking-tight"
                style={{ color: "var(--tn-amber-text)" }}
              >
                Wrong network
              </h2>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--tn-text-soft)" }}
            >
              This is the CCM Network <strong style={{ color: "var(--tn-text)" }}>testnet sandbox</strong>.
              Your wallet is connected to chain <code className="font-mono">{chainId}</code>,
              not Base Sepolia (<code className="font-mono">84532</code>).
            </p>
            <p
              className="text-sm leading-relaxed mt-3"
              style={{ color: "var(--tn-text-soft)" }}
            >
              Switch networks to continue. Tokens here have no real value;
              this is a public sandbox only.
            </p>

            <button
              type="button"
              onClick={() => switchChain({ chainId: baseSepolia.id })}
              disabled={isPending}
              className="mt-6 w-full font-mono uppercase tracking-[0.14em] text-sm px-4 py-3 transition-colors"
              style={{
                background: "var(--tn-amber)",
                color: "#000",
                border: 0,
                cursor: isPending ? "wait" : "pointer",
              }}
            >
              {isPending ? "Switching…" : "Switch to Base Sepolia"}
            </button>

            <p
              className="text-[11px] mt-5 font-mono tracking-[0.06em]"
              style={{ color: "var(--tn-text-soft)" }}
            >
              Need test ETH? Use a Base Sepolia faucet — see <a className="underline" style={{ color: "var(--tn-amber-text)" }} href="/about">About</a>.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
