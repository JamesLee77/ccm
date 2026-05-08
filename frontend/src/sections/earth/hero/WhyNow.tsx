type Reason = {
  num: string;
  title: string;
  body: string;
  metric: string;
};

const REASONS: Reason[] = [
  {
    num: "01",
    title: "Climate clock",
    body: "Net-zero by 2050 needs ~10× current voluntary market scale. Without cheap, verifiable units, the gap stays open.",
    metric: "$50B by 2030 forecast",
  },
  {
    num: "02",
    title: "Trust collapsing",
    body: "Berkeley flagged ~40% inflated baselines; Verra blocked tokenization; standards bodies rewrote rules mid-flight.",
    metric: "+90% scrutiny since 2023",
  },
  {
    num: "03",
    title: "Onchain matures",
    body: "L2 gas under $0.01, ZK provers production-ready, real-world oracle networks live. Carbon was the missing primitive.",
    metric: "Base · 2.4 Gtps capacity",
  },
];

export default function WhyNow() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {REASONS.map((r) => (
        <div
          key={r.num}
          className="border border-rule transition-all"
          style={{
            background: "var(--paper-deep)",
            padding: "32px 28px",
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
            why · {r.num}
          </div>
          <div
            className="font-display text-ink mb-4"
            style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            {r.title}
          </div>
          <p
            className="font-body text-ink-soft"
            style={{ fontSize: 14, lineHeight: 1.55 }}
          >
            {r.body}
          </p>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mt-5 pt-4 border-t border-rule">
            {r.metric}
          </div>
        </div>
      ))}
    </div>
  );
}
