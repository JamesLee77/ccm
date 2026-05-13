/**
 * Testnet banner — top sticky strip per architecture §3.3, §6.4.
 *
 * Always visible. Not dismissible — the cost of one extra row of header
 * is much smaller than the cost of a user mistaking the sandbox for
 * production.
 */
export default function TestnetBanner() {
  return (
    <div
      role="alert"
      className="w-full text-center font-mono text-[11px] tracking-[0.14em] uppercase"
      style={{
        background: "var(--tn-warn-bg)",
        color: "var(--tn-amber-text)",
        borderBottom: "1px solid var(--tn-warn-border)",
        padding: "8px 12px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      ⚠ Testnet sandbox · Base Sepolia · tokens have <strong>no real value</strong>
    </div>
  );
}
