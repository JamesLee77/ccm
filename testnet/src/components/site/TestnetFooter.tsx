import Wordmark from "../brand/Wordmark";

export default function TestnetFooter() {
  return (
    <footer
      className="border-t border-rule mt-20"
      style={{ background: "var(--paper-deep)", padding: "48px 24px 32px" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Wordmark size={28} />
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase pl-3 border-l border-rule"
            style={{ color: "var(--ink-soft)", lineHeight: 1.4 }}
          >
            Testnet
            <br />
            Sandbox
          </span>
        </div>

        <div
          className="font-mono text-[11px] tracking-[0.04em] grid gap-2"
          style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}
        >
          <p>
            <span style={{ color: "var(--clay)" }}>TESTNET DISCLAIMER. </span>
            Base Sepolia · Chain ID 84532. Test tokens have no real value and
            cannot be moved to mainnet. There is no purchase or fundraising
            activity here. For the protocol overview,{" "}
            <a className="text-moss hover:underline" href="https://ccmnetwork.net">
              ccmnetwork.net
            </a>
            .
          </p>
          <p>
            <a
              className="text-moss hover:underline"
              href="https://sepolia.basescan.org"
              target="_blank"
              rel="noreferrer"
            >
              BaseScan (Sepolia)
            </a>
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <a href="https://ccmnetwork.net/terms" target="_blank" rel="noreferrer" className="hover:text-moss">Terms</a>
            <span style={{ color: "var(--rule)" }}>·</span>
            <a href="https://ccmnetwork.net/privacy" target="_blank" rel="noreferrer" className="hover:text-moss">Privacy</a>
            <span style={{ color: "var(--rule)" }}>·</span>
            <a href="https://ccmnetwork.net/disclaimer" target="_blank" rel="noreferrer" className="hover:text-moss">Risk disclosure</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
