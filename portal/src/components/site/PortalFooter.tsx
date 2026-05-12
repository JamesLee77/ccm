import Wordmark from "../brand/Wordmark";

export default function PortalFooter() {
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
            Investor
            <br />
            Portal
          </span>
        </div>

        <div
          className="font-mono text-[11px] tracking-[0.04em] grid gap-2"
          style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}
        >
          <div>CCM Foundation · Phase 0 · Base mainnet (chain ID 8453)</div>
          <div>
            KYC required. SAFT investors only. For the public sandbox, visit{" "}
            <a
              href="https://testnet.ccmnetwork.net"
              target="_blank"
              rel="noreferrer"
              className="text-moss hover:underline"
            >
              testnet.ccmnetwork.net
            </a>
            . For the protocol overview,{" "}
            <a
              href="https://ccmnetwork.net"
              target="_blank"
              rel="noreferrer"
              className="text-moss hover:underline"
            >
              ccmnetwork.net
            </a>
            .
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <a href="https://ccmnetwork.net/terms" target="_blank" rel="noreferrer" className="hover:text-moss">Terms</a>
            <span style={{ color: "var(--rule)" }}>·</span>
            <a href="https://ccmnetwork.net/privacy" target="_blank" rel="noreferrer" className="hover:text-moss">Privacy</a>
            <span style={{ color: "var(--rule)" }}>·</span>
            <a href="https://ccmnetwork.net/disclaimer" target="_blank" rel="noreferrer" className="hover:text-moss">Risk disclosure</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
