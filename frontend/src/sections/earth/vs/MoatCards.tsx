type Moat = {
  num: string;
  label: string;
  body: string;
  metric: string;
};

const MOATS: Moat[] = [
  {
    num: "01",
    label: "Originate, not bridge",
    body: "Verra banned tokenization in 2022; bridged carbon froze. CCM mints natively, so it can't be unilaterally turned off.",
    metric: "no upstream registry",
  },
  {
    num: "02",
    label: "Multi-VVB DAO",
    body: "Verification governance is M-of-N, stake-bonded, and slashable. Single VVB capture is mathematically expensive.",
    metric: "5-of-7 for CCM-A",
  },
  {
    num: "03",
    label: "Dual representation",
    body: "ERC-1155 source-of-truth + 1:1 ERC-20 wrapper enables both retire-first holders and DeFi-first traders without forks.",
    metric: "1:1 invariant onchain",
  },
  {
    num: "04",
    label: "Standard, not platform",
    body: "Apache 2.0 standard + MIT contracts mean integrators can fork without losing market access. Network effects compound.",
    metric: "Apache 2.0 + MIT",
  },
];

export default function MoatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {MOATS.map((m) => (
        <div
          key={m.num}
          className="border border-rule transition-all"
          style={{ background: "var(--paper-deep)", padding: "28px 24px" }}
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
            moat · {m.num}
          </div>
          <div
            className="font-display text-ink mb-3"
            style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.2 }}
          >
            {m.label}
          </div>
          <p
            className="font-body text-ink-soft mb-5"
            style={{ fontSize: 13, lineHeight: 1.55 }}
          >
            {m.body}
          </p>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft pt-3 border-t border-rule">
            {m.metric}
          </div>
        </div>
      ))}
    </div>
  );
}
