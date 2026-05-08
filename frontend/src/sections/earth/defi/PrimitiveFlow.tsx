type Strategy = {
  num: string;
  title: string;
  body: string;
  steps: string[];
};

const STRATEGIES: Strategy[] = [
  {
    num: "01",
    title: "ESG buyer + retire",
    body: "Acquire CCM-A NFT directly, retire to receive a non-transferable certificate.",
    steps: ["Wrap to $CCM-A", "Buy on AMM", "Unwrap (Premium)", "Retire-to-Earn"],
  },
  {
    num: "02",
    title: "Operator cash-flow",
    body: "Smooth lumpy mint income with vault credit instead of immediate sell.",
    steps: ["Mint NFT", "Wrap → $CCM", "Vault → USDC", "Repay later"],
  },
  {
    num: "03",
    title: "Long-only ESG fund",
    body: "Acquire diversified vintage exposure via index basket; earn yield on idle NFTs.",
    steps: ["Buy $CCM-PRIME", "Stake basket", "NFT yield earn", "veCCM lock"],
  },
];

export default function PrimitiveFlow() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {STRATEGIES.map((s) => (
        <div
          key={s.num}
          className="border border-rule transition-all"
          style={{
            background: "var(--paper-deep)",
            padding: "28px 24px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--moss)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--rule)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-moss mb-3">
            strategy · {s.num}
          </div>
          <div
            className="font-display text-ink mb-3"
            style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.15 }}
          >
            {s.title}
          </div>
          <p
            className="font-body text-ink-soft mb-5"
            style={{ fontSize: 13, lineHeight: 1.55 }}
          >
            {s.body}
          </p>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {s.steps.map((step, i) => (
              <li
                key={step}
                className="grid items-baseline border-t border-rule"
                style={{
                  gridTemplateColumns: "32px 1fr",
                  gap: 10,
                  padding: "10px 0",
                }}
              >
                <span className="font-mono text-moss" style={{ fontSize: 11, letterSpacing: 1 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-ink" style={{ fontSize: 12 }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
