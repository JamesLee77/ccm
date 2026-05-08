// Capital return cone — simple stacked summary by round/scenario.
type Row = {
  round: string;
  entry: string;
  bearY5: string;
  baseY5: string;
  bullY5: string;
};

const ROWS: Row[] = [
  { round: "Seed ($0.15)", entry: "0.15", bearY5: "2.7×", baseY5: "23×", bullY5: "100×" },
  { round: "Series A ($0.20)", entry: "0.20", bearY5: "2.0×", baseY5: "17.5×", bullY5: "75×" },
];

export default function CapitalReturns() {
  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          capital return cone · Y5 multiples
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          forward-looking · ignore taxes / vesting
        </div>
      </div>
      <p
        className="font-body text-ink-soft mt-2 mb-6"
        style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 720 }}
      >
        Multiples derived from the price scenarios. Seed has a longer cliff
        and lower entry, so its bull case is materially larger; both rounds
        share the same Bear floor.
      </p>
      <div
        className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-rule"
        style={{
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 16,
          padding: "12px 0",
        }}
      >
        <span>round · entry</span>
        <span style={{ color: "var(--clay)" }}>Bear · Y5</span>
        <span style={{ color: "var(--moss-2)" }}>Base · Y5</span>
        <span style={{ color: "var(--moss)" }}>Bull · Y5</span>
      </div>
      {ROWS.map((r, i) => (
        <div
          key={r.round}
          className="grid items-center"
          style={{
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 16,
            padding: "20px 0",
            borderBottom: i < ROWS.length - 1 ? "1px solid var(--rule)" : "none",
          }}
        >
          <div>
            <div
              className="font-display text-ink"
              style={{ fontSize: 16, fontWeight: 500 }}
            >
              {r.round}
            </div>
            <div
              className="font-mono text-ink-soft"
              style={{ fontSize: 11, marginTop: 4 }}
            >
              entry ${r.entry}
            </div>
          </div>
          <div className="font-display text-clay" style={{ fontSize: 22, fontWeight: 500 }}>
            {r.bearY5}
          </div>
          <div className="font-display text-ink" style={{ fontSize: 22, fontWeight: 500 }}>
            {r.baseY5}
          </div>
          <div className="font-display text-moss" style={{ fontSize: 22, fontWeight: 500 }}>
            {r.bullY5}
          </div>
        </div>
      ))}
    </div>
  );
}
