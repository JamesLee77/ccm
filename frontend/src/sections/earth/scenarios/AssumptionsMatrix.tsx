type Driver = {
  id: string;
  label: string;
  bear: string;
  base: string;
  bull: string;
};

const DRIVERS: Driver[] = [
  { id: "vcm", label: "VCM growth (vs 2024)", bear: "1.5×", base: "6×", bull: "8×" },
  { id: "share", label: "CCM market share", bear: "1%", base: "5%", bull: "10%" },
  { id: "tvl", label: "DeFi TVL", bear: "$30M", base: "$200M", bull: "$500M" },
  { id: "veccm", label: "veCCM staking ratio", bear: "10%", base: "30%", bull: "45%" },
  { id: "fee", label: "Avg marketplace fee capture", bear: "0.4%", base: "1.0%", bull: "1.6%" },
  { id: "burn", label: "Annual burn (% of supply)", bear: "0.2%", base: "0.8%", bull: "1.4%" },
];

const COLS = [
  { id: "label", label: "Driver" },
  { id: "bear", label: "Bear", color: "var(--clay)" },
  { id: "base", label: "Base", color: "var(--moss-2)" },
  { id: "bull", label: "Bull", color: "var(--moss)" },
];

export default function AssumptionsMatrix() {
  return (
    <>
      {/* Desktop: full table */}
      <div
        className="border border-rule hidden md:block"
        style={{ background: "var(--paper-deep)" }}
      >
        <div
          className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
          style={{
            gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
            gap: 16,
            padding: "16px 24px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          {COLS.map((c) => (
            <span key={c.id} style={c.color ? { color: c.color } : undefined}>
              {c.label}
            </span>
          ))}
        </div>
        {DRIVERS.map((d, i) => (
          <div
            key={d.id}
            className="grid items-center"
            style={{
              gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
              gap: 16,
              padding: "18px 24px",
              borderBottom: i < DRIVERS.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <span
              className="font-display text-ink"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {d.label}
            </span>
            <span className="font-mono text-clay" style={{ fontSize: 14 }}>
              {d.bear}
            </span>
            <span className="font-mono text-ink" style={{ fontSize: 14 }}>
              {d.base}
            </span>
            <span className="font-mono text-moss" style={{ fontSize: 14 }}>
              {d.bull}
            </span>
          </div>
        ))}
      </div>
      {/* Mobile: bear/base/bull stacked per driver */}
      <div
        className="md:hidden border border-rule"
        style={{ background: "var(--paper-deep)" }}
      >
        {DRIVERS.map((d, i) => (
          <div
            key={d.id}
            style={{
              padding: "16px 20px",
              borderBottom: i < DRIVERS.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <div
              className="font-display text-ink mb-3"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {d.label}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="font-mono text-[10px] tracking-[0.12em] uppercase mb-1"
                  style={{ color: "var(--clay)" }}
                >
                  Bear
                </div>
                <div className="font-mono text-clay" style={{ fontSize: 14 }}>
                  {d.bear}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="font-mono text-[10px] tracking-[0.12em] uppercase mb-1"
                  style={{ color: "var(--moss-2)" }}
                >
                  Base
                </div>
                <div className="font-mono text-ink" style={{ fontSize: 14 }}>
                  {d.base}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-moss mb-1">
                  Bull
                </div>
                <div className="font-mono text-moss" style={{ fontSize: 14 }}>
                  {d.bull}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
