type Policy = {
  id: string;
  num: string;
  label: string;
  body: string;
  metric: string;
  icon: React.ReactNode;
};

const POLICIES: Policy[] = [
  {
    id: "non-upgradeable",
    num: "01",
    label: "Non-upgradeable",
    body: "All contracts deploy without upgrade proxies. What you audit is what runs in production — forever.",
    metric: "0 admin keys to upgrade logic",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x={6} y={12} width={20} height={14} rx={1} />
        <path d="M10 12V8a6 6 0 0 1 12 0v4" />
      </g>
    ),
  },
  {
    id: "audits",
    num: "02",
    label: "External audits",
    body: "Pre-mainnet audit by Trail of Bits / OpenZeppelin / Quantstamp. Findings published; remediation gated.",
    metric: "≥1 firm · public reports",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4l9 5v7c0 5-4 9-9 11-5-2-9-6-9-11V9z" />
        <path d="M12 16l3 3 6-6" />
      </g>
    ),
  },
  {
    id: "multisig",
    num: "03",
    label: "Multi-sig admin",
    body: "Every admin role lives behind a 3-of-5 Gnosis Safe. No single signer can move funds or pause.",
    metric: "3 / 5 Gnosis Safe",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={11} cy={12} r={3.5} />
        <circle cx={21} cy={12} r={3.5} />
        <path d="M5 25c0-3 3-5 6-5s6 2 6 5" />
        <path d="M15 25c0-3 3-5 6-5s6 2 6 5" />
      </g>
    ),
  },
  {
    id: "timelock",
    num: "04",
    label: "48h timelock",
    body: "Privileged actions only execute after a 48-hour public delay. Time enough for the community to react.",
    metric: "48 hours · transparent queue",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={16} cy={16} r={10} />
        <path d="M16 10v6l4 3" />
      </g>
    ),
  },
  {
    id: "bounty",
    num: "05",
    label: "Bug bounty",
    body: "Immunefi bounty live from launch. Critical class capped at $500K — independent of foundation discretion.",
    metric: "Up to $500K · Immunefi",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 6c-3 0-5 2-5 5v2h10v-2c0-3-2-5-5-5z" />
        <path d="M11 13c-3 1-5 4-5 7" />
        <path d="M21 13c3 1 5 4 5 7" />
        <path d="M16 13v14M9 19h14" />
      </g>
    ),
  },
];

export default function SecurityCards() {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}
    >
      {POLICIES.map((p) => (
        <div
          key={p.id}
          className="border border-rule transition-all"
          style={{
            background: "var(--paper-deep)",
            padding: "24px 20px",
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
            <div className="text-moss" style={{ width: 28, height: 28 }}>
              <svg viewBox="0 0 32 32" width="28" height="28">
                {p.icon}
              </svg>
            </div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-moss">
              {p.num}
            </div>
          </div>
          <div
            className="font-display text-ink mt-3 mb-2"
            style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}
          >
            {p.label}
          </div>
          <div
            className="font-body text-ink-soft mb-4"
            style={{ fontSize: 13, lineHeight: 1.55 }}
          >
            {p.body}
          </div>
          <div
            className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft pt-3 border-t border-rule"
          >
            {p.metric}
          </div>
        </div>
      ))}
    </div>
  );
}
