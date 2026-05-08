// Scientific variation — reads as a working paper / standards body.
// Tighter, monochrome, technical. ICVCM / IPCC mood.

const sciT = {
  paper: '#fafaf7',
  paperDeep: '#eeece5',
  ink: '#0e0e0c',
  inkSoft: '#4a4a44',
  rule: '#cdcbc2',
  accent: '#8c1d18', // a single oxblood — citation marker
};

const sciStyles = {
  page: {
    width: '100%', minHeight: '100%', background: sciT.paper,
    color: sciT.ink, fontFamily: 'Source Sans 3, sans-serif',
    overflow: 'auto',
  },
  meta: {
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    color: sciT.inkSoft,
  },
  section: { padding: '80px 64px', borderTop: `1px solid ${sciT.rule}` },
};

const SciNav = () => (
  <nav style={{ borderBottom: `2px solid ${sciT.ink}`, padding: '24px 64px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: sciT.paper }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
      <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 24,
        fontWeight: 600, letterSpacing: '-0.01em' }}>CCM Network</div>
      <div style={{ ...sciStyles.meta, color: sciT.accent }}>Standard · v1.0</div>
    </div>
    <div style={{ display: 'flex', gap: 24, ...sciStyles.meta }}>
      <span>§ Standard</span><span>§ Architecture</span><span>§ Tokenomics</span>
      <span>§ Governance</span><span>References</span>
    </div>
  </nav>
);

const SciHero = () => (
  <section style={{ padding: '64px 64px 48px',
    borderBottom: `1px solid ${sciT.rule}` }}>
    <div style={{ ...sciStyles.meta, marginBottom: 32 }}>
      Whitepaper · v1.0 · May 2026 · CCM Foundation · CC BY 4.0
    </div>
    <h1 style={{
      fontFamily: 'Source Serif 4, serif', fontWeight: 600,
      fontSize: 72, lineHeight: 1.05, letterSpacing: '-0.02em',
      margin: '0 0 24px', maxWidth: 1100,
    }}>
      A standard, registry, and DeFi infrastructure
      for the verified tonne of CO₂e.
    </h1>
    <p style={{
      fontFamily: 'Source Serif 4', fontSize: 19, lineHeight: 1.6,
      color: sciT.inkSoft, maxWidth: 880, margin: '0 0 40px',
      fontStyle: 'italic',
    }}>
      The CCM Network defines the unit (1 ccm = 1 tCO₂e), the verification
      stack (multi-VVB consensus over MRV oracles), and the onchain primitives
      (NFT registry, ERC-20 wrapper, vault, index) required for carbon
      credit settlement at internet scale.
    </p>
    <div style={{ display: 'flex', gap: 12 }}>
      <a style={{ background: sciT.ink, color: sciT.paper, padding: '14px 24px',
        textDecoration: 'none', fontFamily: 'Source Sans 3', fontSize: 14,
        fontWeight: 600 }}>Download Whitepaper (PDF) ↓</a>
      <a style={{ border: `1px solid ${sciT.ink}`, color: sciT.ink,
        padding: '14px 24px', textDecoration: 'none',
        fontFamily: 'Source Sans 3', fontSize: 14, fontWeight: 600 }}>
        Read online →</a>
    </div>

    {/* Abstract block */}
    <div style={{ marginTop: 64, display: 'grid',
      gridTemplateColumns: '160px 1fr', gap: 32 }}>
      <div style={sciStyles.meta}>Abstract</div>
      <div style={{ fontFamily: 'Source Serif 4', fontSize: 16,
        lineHeight: 1.7, color: sciT.ink, columnCount: 2,
        columnGap: 32, columnRule: `1px solid ${sciT.rule}` }}>
        The voluntary carbon market suffers four structural failures:
        opacity, double-counting, illiquidity, and the absence of grade
        differentiation [1, 4]. This paper introduces the CCM Network — an
        open standard and protocol stack — that addresses each failure
        through (i) a unified onchain registry of verified tonnes
        (CCM-NFT), (ii) a 1:1 ERC-20 wrapper enabling DeFi composability,
        (iii) a multi-VVB consensus layer with optional ZK-attestation,
        and (iv) a four-tier grading system (CCM-A through CCM-D)
        differentiating durable removal from temporary avoidance.
      </div>
    </div>
  </section>
);

const SciTable = () => (
  <section style={sciStyles.section}>
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 32 }}>
      <div style={sciStyles.meta}>§ 1 · Comparative</div>
      <div>
        <h2 style={{ fontFamily: 'Source Serif 4', fontWeight: 600,
          fontSize: 28, margin: '0 0 24px' }}>
          Differentiation from prior onchain carbon protocols.
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse',
          fontFamily: 'Source Sans 3', fontSize: 13 }}>
          <thead>
            <tr style={{ borderTop: `2px solid ${sciT.ink}`,
              borderBottom: `1px solid ${sciT.ink}` }}>
              {['Property', 'Toucan (BCT)', 'Moss (MCO2)', 'KlimaDAO', 'CCM Network'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px 12px 0',
                  fontWeight: 600, fontSize: 11, letterSpacing: '0.06em',
                  textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Origination', 'Tokenize', 'Tokenize', 'Tokenize', 'Originate ✓'],
              ['NFT × ERC-20', 'ERC-20 only', 'ERC-20 only', 'ERC-20 only', 'Both, 1:1 wrap ✓'],
              ['Grade differentiation', 'Single pool', 'Single', '—', 'A · B · C · D ✓'],
              ['DeFi-native primitives', 'Limited', '—', 'Partial', '8 primitives ✓'],
              ['Verification governance', 'Verra (external)', 'External', 'External', 'Multi-VVB DAO ✓'],
              ['Bridge dependency', 'Frozen (Verra ban)', 'Yes', 'Yes', 'None — origination ✓'],
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${sciT.rule}` }}>
                {row.map((c, j) => (
                  <td key={j} style={{ padding: '14px 16px 14px 0',
                    fontWeight: j === 4 ? 600 : 400,
                    color: j === 4 ? sciT.ink : sciT.inkSoft,
                    background: j === 4 ? sciT.paperDeep : 'transparent' }}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ ...sciStyles.meta, marginTop: 16, fontStyle: 'italic',
          fontFamily: 'Source Serif 4', textTransform: 'none',
          letterSpacing: 0, fontSize: 13 }}>
          Table 1. Property comparison across major onchain carbon protocols, May 2026.
        </div>
      </div>
    </div>
  </section>
);

const SciArch = () => (
  <section style={sciStyles.section}>
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 32 }}>
      <div style={sciStyles.meta}>§ 2 · Architecture</div>
      <div>
        <h2 style={{ fontFamily: 'Source Serif 4', fontWeight: 600,
          fontSize: 28, margin: '0 0 24px' }}>
          The eight-layer stack.
        </h2>
        <p style={{ fontFamily: 'Source Serif 4', fontSize: 15,
          lineHeight: 1.7, color: sciT.inkSoft, margin: '0 0 32px',
          maxWidth: 720 }}>
          Each layer is independently auditable. Layers 1–2 codify the
          measurement standard; 3–4 perform attested measurement and
          consensus; 5–6 anchor results onchain; 7–8 expose composable
          DeFi and application surfaces.
        </p>

        {/* Stack */}
        <div style={{ border: `1px solid ${sciT.ink}` }}>
          {[
            ['L8', 'Application', 'Wallet, dashboard, ESG SDK, retire desk'],
            ['L7', 'DeFi Primitives', 'Wrap, vault, index, insurance, veCCM'],
            ['L6', 'Token', '$CCM ERC-20 · 5B hard cap · 1:1 backed'],
            ['L5', 'NFT Registry', 'CCM-NFT ERC-1155 · vintage · grade · provenance'],
            ['L4', 'VVB Consensus', 'M-of-N validation · stake · slash · ZK option'],
            ['L3', 'MRV Oracle', 'Sentinel-2 · Planet Labs · IoT · LiDAR'],
            ['L2', 'Methodology', 'Per-grade rules: DAC, biochar, NbS, REDD+'],
            ['L1', 'CCM Standard', '1 ccm = 1 tCO₂e · IPCC-aligned · public domain'],
          ].map(([l, h, b], i) => (
            <div key={l} style={{ display: 'grid',
              gridTemplateColumns: '60px 200px 1fr', alignItems: 'center',
              padding: '14px 20px',
              borderBottom: i < 7 ? `1px solid ${sciT.rule}` : 'none',
              background: i % 2 ? sciT.paper : sciT.paperDeep }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
                fontWeight: 600, color: sciT.accent }}>{l}</div>
              <div style={{ fontFamily: 'Source Serif 4', fontSize: 16,
                fontWeight: 600 }}>{h}</div>
              <div style={{ fontFamily: 'Source Sans 3', fontSize: 13,
                color: sciT.inkSoft }}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ ...sciStyles.meta, marginTop: 16, fontStyle: 'italic',
          fontFamily: 'Source Serif 4', textTransform: 'none',
          letterSpacing: 0, fontSize: 13 }}>
          Figure 2.1. CCM Network protocol stack, L1–L8.
        </div>
      </div>
    </div>
  </section>
);

const SciTokenomics = () => (
  <section style={sciStyles.section}>
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 32 }}>
      <div style={sciStyles.meta}>§ 3 · Tokenomics</div>
      <div>
        <h2 style={{ fontFamily: 'Source Serif 4', fontWeight: 600,
          fontSize: 28, margin: '0 0 24px' }}>
          Allocation: 5,000,000,000 $CCM, hard-capped.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr',
          gap: 32, alignItems: 'flex-start' }}>
          {/* Bar chart */}
          <div style={{ border: `1px solid ${sciT.rule}`,
            background: '#fff', padding: 28 }}>
            {[
              ['Mining (CCMine)', 40, sciT.ink],
              ['Foundation', 18, '#3a3a36'],
              ['Strategic', 10, '#6a6a62'],
              ['Liquidity / AMM', 9, '#8b8b82'],
              ['Treasury', 8, '#a8a89e'],
              ['Public TGE', 5, '#bcbcb2'],
              ['Staking', 5, '#cdcdc4'],
              ['Team', 5, '#dedcd2'],
            ].map(([h, p, c]) => (
              <div key={h} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  fontFamily: 'Source Sans 3', fontSize: 13,
                  fontWeight: 500, marginBottom: 4 }}>
                  <span>{h}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono',
                    color: sciT.inkSoft }}>{p}%</span>
                </div>
                <div style={{ background: sciT.paperDeep, height: 6 }}>
                  <div style={{ background: c, height: '100%',
                    width: `${p * 2.5}%`, transition: 'width 0.6s' }} />
                </div>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontFamily: 'Source Serif 4', fontSize: 15,
              lineHeight: 1.7, color: sciT.inkSoft, margin: 0 }}>
              Mining rewards (40%, 2.0B) emit on a ten-year decelerating
              schedule, front-loaded to subsidize CapEx-heavy DAC and
              mineralization operators. Foundation (18%) funds standards
              advocacy, VVB certification, and external audit. Public TGE
              is limited to 5% across Seed and Series A rounds, with
              vesting cliffs of 6 and 3 months respectively.
            </p>
            <div style={{ marginTop: 24, padding: 20,
              background: sciT.paperDeep, border: `1px solid ${sciT.rule}` }}>
              <div style={{ ...sciStyles.meta, color: sciT.accent }}>TGE · raise</div>
              <div style={{ fontFamily: 'Source Serif 4', fontSize: 36,
                fontWeight: 600, marginTop: 6 }}>$45.0M</div>
              <div style={sciStyles.meta}>Seed $0.15 · Series A $0.20</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SciCitations = () => (
  <section style={sciStyles.section}>
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 32 }}>
      <div style={sciStyles.meta}>References</div>
      <div style={{ fontFamily: 'Source Serif 4', fontSize: 13,
        lineHeight: 1.7, color: sciT.inkSoft, columnCount: 2,
        columnGap: 32 }}>
        <div>[1] IPCC. (2023). Climate Change 2023: Synthesis Report. Geneva.</div>
        <div>[2] ICVCM. (2023). Core Carbon Principles. London.</div>
        <div>[3] Verra. (2024). VCS Standard v4.7. Washington DC.</div>
        <div>[4] West, T. et al. (2023). "Action needed to make carbon offsets…". Science, 381(6660).</div>
        <div>[5] McKinsey. (2024). Voluntary carbon market: 2030 outlook.</div>
        <div>[6] Anders, F. et al. (2024). "Onchain carbon credits: A taxonomy". Nat. Clim. Change, 14.</div>
        <div>[7] World Bank. (2024). State and Trends of Carbon Pricing.</div>
        <div>[8] UNFCCC. (2024). Article 6.4 Mechanism Methodology Standards.</div>
      </div>
    </div>
    <div style={{ marginTop: 80, paddingTop: 24,
      borderTop: `1px solid ${sciT.rule}`, display: 'flex',
      justifyContent: 'space-between', ...sciStyles.meta }}>
      <span>CCM Foundation · ADGM Reg. · Whitepaper v1.0</span>
      <span>foundation@ccmnetwork.net · github.com/ccm-network</span>
    </div>
  </section>
);

const LandingSci = () => (
  <div style={sciStyles.page}>
    <SciNav />
    <SciHero />
    <SciTable />
    <SciArch />
    <SciTokenomics />
    <SciCitations />
  </div>
);

window.LandingSci = LandingSci;
