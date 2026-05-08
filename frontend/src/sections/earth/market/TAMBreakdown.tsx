type Segment = {
  id: string;
  name: string;
  pct: number;
  body: string;
  color: string;
  examples: string[];
};

const SEGMENTS: Segment[] = [
  {
    id: "tech",
    name: "Tech-based removal (CCM-A/B)",
    pct: 38,
    body: "DAC, mineralization, biochar — high-cost, high-permanence engineering.",
    color: "var(--moss)",
    examples: ["Climeworks", "Carbfix", "Charm Industrial"],
  },
  {
    id: "nature",
    name: "Nature-based removal (CCM-C)",
    pct: 32,
    body: "Reforestation, soil carbon, wetland restoration.",
    color: "var(--moss-2)",
    examples: ["Pachama", "Gold Standard ARR", "Verra ARR"],
  },
  {
    id: "avoid",
    name: "Avoidance (CCM-D)",
    pct: 18,
    body: "REDD+, methane avoidance, cookstove programs.",
    color: "var(--sky)",
    examples: ["Verra REDD+", "ART TREES", "Cookstove issuers"],
  },
  {
    id: "infra",
    name: "Infrastructure / fees",
    pct: 12,
    body: "Marketplaces, registries, MRV vendors, financial intermediaries.",
    color: "var(--clay)",
    examples: ["Verra", "Gold Standard", "ICVCM", "Pachama"],
  },
];

export default function TAMBreakdown() {
  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-5">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          TAM split · $50B 2030E
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          4 segments · grade-aligned
        </div>
      </div>

      {/* Stacked bar */}
      <div
        className="flex w-full overflow-hidden border border-rule mb-6"
        style={{ height: 48 }}
      >
        {SEGMENTS.map((s) => (
          <div
            key={s.id}
            className="font-mono text-[11px] tracking-[0.12em] uppercase text-paper flex items-center justify-center"
            style={{ flex: s.pct, background: s.color }}
            aria-label={`${s.name} ${s.pct}%`}
          >
            {s.pct}%
          </div>
        ))}
      </div>

      {/* Segment cards */}
      <div className="grid grid-cols-4 gap-4">
        {SEGMENTS.map((s) => (
          <div
            key={s.id}
            className="border border-rule"
            style={{ background: "var(--paper)", padding: "16px 20px" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                aria-hidden
                style={{ width: 10, height: 10, background: s.color, display: "inline-block" }}
              />
              <span
                className="font-display text-ink"
                style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em" }}
              >
                {s.name}
              </span>
            </div>
            <p
              className="font-body text-ink-soft mb-3"
              style={{ fontSize: 12, lineHeight: 1.5 }}
            >
              {s.body}
            </p>
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-moss border-t border-rule pt-2">
              examples
            </div>
            <ul
              className="font-mono text-ink-soft"
              style={{ fontSize: 11, listStyle: "none", margin: "4px 0 0", padding: 0 }}
            >
              {s.examples.map((e) => (
                <li key={e} style={{ padding: "2px 0" }}>{e}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
