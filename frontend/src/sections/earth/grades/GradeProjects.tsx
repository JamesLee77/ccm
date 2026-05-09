type Project = {
  grade: string;
  name: string;
  category: string;
  yield: string;
  vintage: string;
};

const PROJECTS: Project[] = [
  { grade: "CCM-A", name: "Hellisheiði DAC", category: "DAC + injection (Iceland)", yield: "8,400 t/y", vintage: "2026" },
  { grade: "CCM-A", name: "Wallaroo mineralisation", category: "Olivine accelerated weathering", yield: "3,200 t/y", vintage: "2026" },
  { grade: "CCM-B", name: "Pyrolyzed forestry residue", category: "Biochar (Pacific NW)", yield: "12,000 t/y", vintage: "2026" },
  { grade: "CCM-B", name: "Building cement carbonation", category: "Concrete sequestration", yield: "5,600 t/y", vintage: "2026" },
  { grade: "CCM-C", name: "Atlantic Forest reforestation", category: "ARR (Brazil)", yield: "44,000 t/y", vintage: "2026" },
  { grade: "CCM-C", name: "Korea coastal blue-carbon", category: "Mangrove + saltmarsh", yield: "9,800 t/y", vintage: "2026" },
  { grade: "CCM-D", name: "Mai Ndombe REDD+", category: "Avoided deforestation (DRC)", yield: "780,000 t/y", vintage: "2024" },
  { grade: "CCM-D", name: "Cookstove · Sub-Saharan", category: "Avoided fuelwood emissions", yield: "210,000 t/y", vintage: "2024" },
];

export default function GradeProjects() {
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
            gridTemplateColumns: "80px 1.4fr 1.6fr 100px 80px",
            gap: 16,
            padding: "16px 24px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <span className="text-moss">grade</span>
          <span>project</span>
          <span>category</span>
          <span>yield</span>
          <span>vintage</span>
        </div>
        {PROJECTS.map((p, i) => (
          <div
            key={p.name}
            className="grid items-baseline transition-colors hover:bg-paper"
            style={{
              gridTemplateColumns: "80px 1.4fr 1.6fr 100px 80px",
              gap: 16,
              padding: "16px 24px",
              borderBottom: i < PROJECTS.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <span className="font-mono text-moss" style={{ fontSize: 12, letterSpacing: 1.2 }}>
              {p.grade}
            </span>
            <span
              className="font-display text-ink"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {p.name}
            </span>
            <span className="font-body text-ink-soft" style={{ fontSize: 13 }}>
              {p.category}
            </span>
            <span className="font-mono text-ink" style={{ fontSize: 12 }}>
              {p.yield}
            </span>
            <span className="font-mono text-ink-soft" style={{ fontSize: 12 }}>
              {p.vintage}
            </span>
          </div>
        ))}
      </div>
      {/* Mobile: stacked project cards */}
      <div
        className="md:hidden border border-rule"
        style={{ background: "var(--paper-deep)" }}
      >
        {PROJECTS.map((p, i) => (
          <div
            key={p.name}
            style={{
              padding: "16px 20px",
              borderBottom: i < PROJECTS.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-moss" style={{ fontSize: 11, letterSpacing: 1.2 }}>
                {p.grade}
              </span>
              <span className="ml-auto font-mono text-ink-soft" style={{ fontSize: 11 }}>
                {p.vintage}
              </span>
            </div>
            <div
              className="font-display text-ink mb-1"
              style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}
            >
              {p.name}
            </div>
            <div className="font-body text-ink-soft mb-2" style={{ fontSize: 13, lineHeight: 1.4 }}>
              {p.category}
            </div>
            <div className="font-mono text-ink" style={{ fontSize: 12 }}>
              {p.yield}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
