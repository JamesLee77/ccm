type Mode = {
  id: string;
  num: string;
  label: string;
  body: string;
  fee: string;
  use: string;
  icon: React.ReactNode;
};

const MODES: Mode[] = [
  {
    id: "standard",
    num: "01",
    label: "Standard · FIFR",
    body: "First-in, first-retired. Unwrap pulls the oldest vintage and lowest grade first; high-grade NFTs accrete in the vault.",
    fee: "0% premium",
    use: "Default for retire and conversion.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x={6} y={6} width={20} height={20} rx={1} />
        <path d="M11 12h10M11 16h10M11 20h10" />
      </g>
    ),
  },
  {
    id: "premium",
    num: "02",
    label: "Premium",
    body: "Force the unwrap to the latest vintage with the highest grade. Used by ESG buyers needing top-of-stack provenance.",
    fee: "+1–5% premium",
    use: "Corporate ESG reports.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" />
      </g>
    ),
  },
  {
    id: "specific",
    num: "03",
    label: "Specific tokenId",
    body: "Caller specifies the NFT to unwrap. Useful when re-acquiring a project the holder previously owned.",
    fee: "Oracle price spread",
    use: "Project re-purchase.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={14} cy={14} r={8} />
        <path d="M20 20l6 6" />
      </g>
    ),
  },
];

export default function WrapModes() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {MODES.map((m) => (
        <div
          key={m.id}
          className="border border-rule transition-all"
          style={{
            background: "var(--paper-deep)",
            padding: "28px 24px",
            cursor: "default",
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
          <div className="flex items-start justify-between mb-3">
            <div className="text-moss" style={{ width: 32, height: 32 }}>
              <svg viewBox="0 0 32 32" width="32" height="32">
                {m.icon}
              </svg>
            </div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-moss">
              {m.num}
            </div>
          </div>
          <div
            className="font-display text-ink mt-3 mb-2"
            style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em" }}
          >
            {m.label}
          </div>
          <div
            className="font-body text-ink-soft mb-5"
            style={{ fontSize: 14, lineHeight: 1.55 }}
          >
            {m.body}
          </div>
          <div
            className="grid pt-4 border-t border-rule"
            style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-1">
                fee
              </div>
              <div className="font-mono text-ink" style={{ fontSize: 12 }}>
                {m.fee}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-1">
                used for
              </div>
              <div className="font-mono text-ink" style={{ fontSize: 12 }}>
                {m.use}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
