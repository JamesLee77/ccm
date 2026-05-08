type Role = {
  id: string;
  label: string;
  body: string;
  metric: string;
  /** Inline pictogram in 32x32 viewBox. */
  icon: React.ReactNode;
};

const ROLES: Role[] = [
  {
    id: "physical",
    label: "Physical",
    body: "Operate DAC, mineralization plants, biochar kilns, or new afforestation directly. Mints scale with verified tonnes reduced.",
    metric: "Stake 5,000 $CCM · payout per epoch",
    icon: (
      // gauge dial: arc + pointer
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 24a11 11 0 0 1 22 0" />
        <line x1={16} y1={24} x2={22} y2={11} />
        <circle cx={16} cy={24} r={2} fill="currentColor" stroke="none" />
        <line x1={5} y1={24} x2={3} y2={24} />
        <line x1={27} y1={24} x2={29} y2={24} />
      </g>
    ),
  },
  {
    id: "verification",
    label: "Verification",
    body: "Run an oracle node attesting satellite, IoT, and LiDAR readings. Stake-bonded; slashed on misattestation.",
    metric: "Stake 2,000 $CCM · 10% of fees",
    icon: (
      // chevron stack
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 13l10-7 10 7" />
        <path d="M6 19l10-7 10 7" />
        <path d="M6 25l10-7 10 7" />
      </g>
    ),
  },
  {
    id: "storage",
    label: "Storage",
    body: "Provide distributed registry storage on IPFS or Arweave. Cheap to start; contributes to censorship resistance.",
    metric: "Stake 500 $CCM · per-byte rewards",
    icon: (
      // stacked discs
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx={16} cy={8} rx={10} ry={3} />
        <path d="M6 8v6c0 1.7 4.5 3 10 3s10-1.3 10-3V8" />
        <path d="M6 14v6c0 1.7 4.5 3 10 3s10-1.3 10-3v-6" />
        <path d="M6 20v4c0 1.7 4.5 3 10 3s10-1.3 10-3v-4" />
      </g>
    ),
  },
];

export default function RoleCards() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {ROLES.map((role) => (
        <div
          key={role.id}
          className="border border-rule transition-all"
          style={{
            background: "var(--paper-deep)",
            padding: "32px 28px",
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
          <div className="text-moss" style={{ width: 32, height: 32 }}>
            <svg viewBox="0 0 32 32" width="32" height="32">
              {role.icon}
            </svg>
          </div>
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mt-5 mb-2">
            {role.label}
          </div>
          <div
            className="font-body text-ink"
            style={{ fontSize: 16, lineHeight: 1.55 }}
          >
            {role.body}
          </div>
          <div
            className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft mt-5 pt-4 border-t border-rule"
          >
            {role.metric}
          </div>
        </div>
      ))}
    </div>
  );
}
