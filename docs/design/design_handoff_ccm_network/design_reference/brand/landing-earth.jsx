// Earth-forward landing — the LEAD direction.
// Warm paper, moss accent, scrollable scientific cadence.
// Supports light + dark mode (light default; matches V1 Carbon · Forest Bright).

// Read tokens at render time so PageVariant's biTokens swap is honored.
const getEarthLight = () => window.biTokens;
const getEarthDark = () => window.__BI_PALETTES['forest-dark'];

const earthStylesFor = (T, isDark) => ({
  page: {
    width: '100%', minHeight: '100%',
    background: T.paper, color: T.ink,
    fontFamily: 'Inter, sans-serif',
    overflow: 'auto', position: 'relative',
    transition: 'background 0.3s, color 0.3s',
  },
  nav: {
    position: 'sticky', top: 0, zIndex: 10,
    background: isDark ? 'rgba(21, 24, 26, 0.92)' : 'rgba(240, 238, 233, 0.92)',
    backdropFilter: 'blur(8px)',
    borderBottom: `1px solid ${T.rule}`,
    padding: '20px 56px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  navLinks: {
    display: 'flex', gap: 28,
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: T.inkSoft,
  },
  meta: {
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: T.inkSoft,
  },
  section: { padding: '120px 56px', borderTop: `1px solid ${T.rule}` },
  sectionLabel: {
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    color: T.moss, marginBottom: 32,
  },
  surface: isDark ? T.paperDeep : '#fff',
});

const ThemeToggleEarth = ({ dark, onToggle, T }) => (
  <button onClick={onToggle} aria-label="Toggle theme"
    style={{ display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 11px', border: `1px solid ${T.rule}`,
      background: 'transparent', color: T.ink, cursor: 'pointer',
      fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
      letterSpacing: '0.14em', textTransform: 'uppercase' }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      {dark ? (
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      )}
    </svg>
    <span>{dark ? 'dark' : 'light'}</span>
  </button>
);

const Hero = ({ T, S }) => (
  <section style={{ padding: '120px 56px 96px', position: 'relative' }}>
    <div style={{ ...S.meta, marginBottom: 80 }}>
      <span>CCM Foundation</span> · <span>Whitepaper v1.0</span> · <span>May 2026</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 80,
      alignItems: 'flex-end' }}>
      <div>
        <h1 style={{
          fontFamily: 'Fraunces, serif', fontWeight: 300,
          fontSize: 132, lineHeight: 0.92, letterSpacing: '-0.035em',
          margin: 0, fontVariationSettings: '"opsz" 144',
        }}>
          measure<br/>
          <em style={{ color: T.moss, fontWeight: 400 }}>the air.</em>
        </h1>
        <p style={{
          fontFamily: 'Source Serif 4, serif', fontSize: 22, lineHeight: 1.5,
          color: T.inkSoft, maxWidth: 560, marginTop: 40,
        }}>
          CCM is a unit. One tonne of CO₂e — verified once, retired once,
          fluid in between. The CCM Network is the onchain infrastructure
          that lets it travel.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 48 }}>
          <a style={{
            background: T.ink, color: T.paper,
            padding: '16px 28px', textDecoration: 'none',
            fontFamily: 'IBM Plex Mono', fontSize: 12,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>Read the whitepaper →</a>
          <a style={{
            background: 'transparent', color: T.ink,
            padding: '16px 28px', textDecoration: 'none',
            border: `1px solid ${T.ink}`,
            fontFamily: 'IBM Plex Mono', fontSize: 12,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>View on GitHub</a>
        </div>
      </div>

      <div style={{ background: S.surface, border: `1px solid ${T.rule}`,
        padding: 32 }}>
        <div style={{ ...S.meta, color: T.moss, marginBottom: 18 }}>
          atmosphere · live readout
        </div>
        <div style={{ fontFamily: 'Fraunces', fontSize: 84, fontWeight: 300,
          letterSpacing: '-0.03em', lineHeight: 1, color: T.ink }}>
          422.8<span style={{ fontFamily: 'IBM Plex Mono', fontSize: 18,
            color: T.inkSoft, marginLeft: 10 }}>ppm</span>
        </div>
        <div style={{ fontFamily: 'Source Serif 4', fontStyle: 'italic',
          fontSize: 15, color: T.inkSoft, marginTop: 8, marginBottom: 32 }}>
          atmospheric CO₂, May 2026 · NOAA Mauna Loa
        </div>
        <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 20 }}>
          <div style={{ ...S.meta, color: T.moss, marginBottom: 12 }}>
            ccm network · cumulative
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'Fraunces', fontSize: 36, color: T.ink }}>1,284,003</div>
              <div style={{ ...S.meta, fontSize: 9 }}>ccm minted</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Fraunces', fontSize: 36, color: T.moss }}>327,489</div>
              <div style={{ ...S.meta, fontSize: 9 }}>ccm retired</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style={{ marginTop: 96, paddingTop: 16,
      borderTop: `1px solid ${T.rule}`, display: 'flex',
      justifyContent: 'space-between', ...S.meta }}>
      <span>↓ scroll</span>
      <span>§ 1 · the unit</span>
    </div>
  </section>
);

const Trinity = ({ T, S }) => (
  <section style={S.section}>
    <div style={S.sectionLabel}>§ 1 · trinity</div>
    <h2 style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 64,
      letterSpacing: '-0.025em', lineHeight: 1.05, maxWidth: 900, margin: '0 0 80px', color: T.ink }}>
      Three things, one logic:<br/>
      a <em style={{ color: T.moss, fontWeight: 400 }}>network</em>,
      a <em style={{ color: T.moss, fontWeight: 400 }}>unit</em>,
      a <em style={{ color: T.moss, fontWeight: 400 }}>token</em>.
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
      {[
        { n: '01', h: 'CCM Network', s: 'a layered protocol',
          b: 'Eight layers — from the IPCC-aligned standard down through MRV, oracles, VVB consensus, and an onchain registry — defining how a tonne of CO₂e becomes verifiable.' },
        { n: '02', h: 'CCM', s: 'one verified tonne',
          b: 'A single measurement: 1 ccm = 1 tCO₂e, born as an ERC-1155 NFT with vintage, grade, and provenance baked into its metadata.' },
        { n: '03', h: '$CCM', s: 'the fungible wrapper',
          b: 'An ERC-20 token, 1:1 backed by NFTs in a non-custodial vault. Wrap in for liquidity, unwrap out for retirement. The vault is the only source of truth.' },
      ].map(c => (
        <div key={c.n} style={{ background: S.surface, border: `1px solid ${T.rule}`,
          padding: '40px 32px', minHeight: 320, transition: 'transform 0.3s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ ...S.meta, color: T.moss }}>{c.n}</div>
          <div style={{ fontFamily: 'Fraunces', fontSize: 36, marginTop: 16,
            letterSpacing: '-0.02em', color: T.ink }}>{c.h}</div>
          <div style={{ fontFamily: 'Source Serif 4', fontStyle: 'italic',
            fontSize: 15, color: T.moss, marginTop: 4, marginBottom: 24 }}>{c.s}</div>
          <div style={{ fontFamily: 'Source Serif 4', fontSize: 16,
            lineHeight: 1.55, color: T.inkSoft }}>{c.b}</div>
        </div>
      ))}
    </div>
  </section>
);

const Problem = ({ T, S, isDark }) => (
  <section style={{ ...S.section,
    background: isDark ? '#0a0d0a' : T.ink,
    color: T.paper, border: 'none' }}>
    <div style={{ ...S.sectionLabel, color: T.moss }}>§ 2 · what broke</div>
    <h2 style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 64,
      letterSpacing: '-0.025em', lineHeight: 1.05, maxWidth: 900, margin: '0 0 64px',
      color: T.ink }}>
      The voluntary carbon market<br/>
      <em style={{ color: T.moss, fontWeight: 400 }}>has four failures.</em>
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
      background: '#2a2d2a' }}>
      {[
        ['Opacity', 'Provenance lost in PDF registries; spreadsheets traded by phone.'],
        ['Double-counting', 'Same tonne sold across registries with no shared ledger.'],
        ['Illiquidity', 'Long settlement, fragmented brokers, no native price discovery.'],
        ['No grading', 'A nature-based credit prices identically to a DAC tonne.'],
      ].map(([h, b], i) => (
        <div key={i} style={{ background: isDark ? T.paperDeep : T.ink, padding: '32px 28px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12,
            letterSpacing: '0.12em', color: T.moss, marginBottom: 12 }}>
            FAIL · {String(i+1).padStart(2,'0')}
          </div>
          <div style={{ fontFamily: 'Fraunces', fontSize: 32,
            letterSpacing: '-0.02em', marginBottom: 16, color: T.paper }}>{h}</div>
          <div style={{ fontFamily: 'Source Serif 4', fontSize: 14,
            color: T.inkSoft, lineHeight: 1.55 }}>{b}</div>
        </div>
      ))}
    </div>
  </section>
);

const WrapSim = ({ T, S, isDark }) => {
  const [amt, setAmt] = React.useState(100);
  return (
    <section style={S.section}>
      <div style={S.sectionLabel}>§ 3 · dual representation</div>
      <h2 style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 64,
        letterSpacing: '-0.025em', lineHeight: 1.05, maxWidth: 900, margin: '0 0 24px', color: T.ink }}>
        Provenance and liquidity,<br/>
        <em style={{ color: T.moss, fontWeight: 400 }}>without the tradeoff.</em>
      </h2>
      <p style={{ fontFamily: 'Source Serif 4', fontSize: 19, lineHeight: 1.5,
        color: T.inkSoft, maxWidth: 720, margin: '0 0 64px' }}>
        Every CCM exists in one of two forms: an ERC-1155 NFT — the
        source-of-truth — or an ERC-20 $CCM, fungible and AMM-ready. The
        wrap is 1:1, non-custodial, and reversible.
      </p>

      <div style={{ background: S.surface, border: `1px solid ${T.rule}`,
        padding: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          gap: 32, alignItems: 'center', marginBottom: 40 }}>
          <div style={{ border: `1px solid ${T.rule}`, padding: 24,
            background: T.paperDeep }}>
            <div style={{ ...S.meta, color: T.moss }}>CCM-NFT · ERC-1155</div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 64, fontWeight: 300,
              letterSpacing: '-0.03em', marginTop: 12, color: T.ink }}>{amt.toLocaleString()}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
              color: T.inkSoft, lineHeight: 1.7, marginTop: 16 }}>
              vintage 2026<br/>
              grade CCM-A · DAC<br/>
              project 0x7f…3a · vvb 5/7<br/>
              tCO₂e per token: 1
            </div>
          </div>

          <div style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono',
            fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: T.moss }}>
            <div style={{ fontSize: 28, color: T.ink, lineHeight: 1 }}>⇄</div>
            <div style={{ marginTop: 10 }}>wrap</div>
            <div style={{ marginTop: 4 }}>1 : 1</div>
          </div>

          <div style={{ border: `1px solid ${T.rule}`, padding: 24,
            background: isDark ? T.paperDeep : T.ink,
            color: T.paper }}>
            <div style={{ ...S.meta, color: T.moss }}>$CCM · ERC-20</div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 64, fontWeight: 300,
              letterSpacing: '-0.03em', marginTop: 12 }}>{amt.toLocaleString()}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
              color: '#bcbeb6', lineHeight: 1.7, marginTop: 16 }}>
              fungible<br/>
              AMM · Uniswap, Curve<br/>
              collateral · vault lending<br/>
              composable · 12 protocols
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            ...S.meta, marginBottom: 12 }}>
            <span>drag to wrap</span>
            <span>{amt} ccm = {amt} $CCM</span>
          </div>
          <input type="range" min="1" max="10000" value={amt}
            onChange={e => setAmt(+e.target.value)}
            style={{ width: '100%', accentColor: T.moss }} />
        </div>
      </div>
    </section>
  );
};

const Grades = ({ T, S }) => (
  <section style={S.section}>
    <div style={S.sectionLabel}>§ 4 · grading</div>
    <h2 style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 64,
      letterSpacing: '-0.025em', lineHeight: 1.05, maxWidth: 900, margin: '0 0 48px', color: T.ink }}>
      Not all tonnes are equal.<br/>
      <em style={{ color: T.moss, fontWeight: 400 }}>The standard says so.</em>
    </h2>
    <div style={{ background: S.surface, border: `1px solid ${T.rule}` }}>
      {[
        ['A', 'Direct Air Capture · Mineralization', '1000+ yr', '5-of-7', '#1A1D1A', '#F0EEE9'],
        ['B', 'Biochar · Enhanced Weathering', '100+ yr', '4-of-6', '#3D5A3A', '#F0EEE9'],
        ['C', 'Reforestation · Afforestation', '40+ yr', '4-of-6', '#6E8A5A', '#1A1D1A'],
        ['D', 'REDD+ · Legacy Methodologies', '10–40 yr', '3-of-5', '#C9C4B6', '#1A1D1A'],
      ].map(([g, m, dur, vvb, bg, fg], i) => (
        <div key={g} style={{ display: 'grid',
          gridTemplateColumns: '120px 2fr 1fr 1fr 1fr', alignItems: 'center',
          padding: '28px 32px',
          borderBottom: i < 3 ? `1px solid ${T.rule}` : 'none',
          transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = T.paperDeep}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div style={{ width: 64, height: 64, background: bg, color: fg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fraunces', fontSize: 32,
            border: g === 'D' ? `1px solid ${T.inkSoft}` : 'none' }}>{g}</div>
          <div style={{ fontFamily: 'Fraunces', fontSize: 22, color: T.ink }}>CCM-{g} · {m}</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12,
            color: T.inkSoft }}>{dur}</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12,
            color: T.inkSoft }}>vvb {vvb}</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12,
            color: T.moss, textAlign: 'right' }}>spec § 5.2</div>
        </div>
      ))}
    </div>
  </section>
);

const Roadmap = ({ T, S }) => (
  <section style={S.section}>
    <div style={S.sectionLabel}>§ 5 · roadmap</div>
    <h2 style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 64,
      letterSpacing: '-0.025em', lineHeight: 1.05, maxWidth: 900, margin: '0 0 64px', color: T.ink }}>
      Five phases.<br/>
      <em style={{ color: T.moss, fontWeight: 400 }}>One destination.</em>
    </h2>
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 30, left: 0, right: 0,
        height: 1, background: T.rule }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {[
          ['0', 'Foundation', 'done', 'Standard, contracts, whitepaper'],
          ['1', 'Mainnet', "26 Q3", 'Audit, TGE, AMM seed'],
          ['2', 'Mining + DeFi', "26 Q4", '5 pilot nodes, wrappers'],
          ['3', 'DeFi full', "27 H1", 'Vault, index, insurance, veCCM'],
          ['4', 'Scale', "27–28", '100+ nodes, multi-chain'],
          ['5', 'Standard', "28+", 'UNFCCC Art.6 adoption'],
        ].map(([n, h, when, b], i) => (
          <div key={n} style={{ paddingRight: 16, position: 'relative' }}>
            <div style={{ width: 14, height: 14,
              background: i < 1 ? T.moss : T.paper,
              border: `2px solid ${i < 1 ? T.moss : T.ink}`,
              borderRadius: '50%', marginBottom: 24, marginLeft: -1 }} />
            <div style={{ fontFamily: 'Fraunces', fontSize: 14,
              fontStyle: 'italic', color: T.moss }}>phase {n}</div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 22,
              marginTop: 4, color: T.ink }}>{h}</div>
            <div style={{ ...S.meta, marginTop: 8 }}>{when}</div>
            <div style={{ fontFamily: 'Source Serif 4', fontSize: 13,
              color: T.inkSoft, marginTop: 8, lineHeight: 1.5 }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = ({ T, S }) => (
  <section style={{ ...S.section, padding: '120px 56px 64px' }}>
    <div style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 96,
      letterSpacing: '-0.03em', lineHeight: 1, maxWidth: 1200, color: T.ink }}>
      The day <em style={{ color: T.moss, fontWeight: 400 }}>ccm</em> becomes
      an everyday unit, <br/>like ppm —<br/>
      <em style={{ color: T.moss, fontWeight: 400 }}>that</em> is the
      infrastructure we are building toward.
    </div>
    <div style={{ marginTop: 96, paddingTop: 32,
      borderTop: `1px solid ${T.rule}`,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
      {[
        ['Whitepaper', ['v1.0 · 39 pages', 'ccmnetwork.net/wp', 'PDF · CC BY 4.0']],
        ['Technical', ['GitHub', 'Docs', 'Audit reports']],
        ['Foundation', ['About', 'Governance', 'Treasury']],
        ['Contact', ['foundation@ccmnetwork.net', 'press@ccmnetwork.net', 'May 2026']],
      ].map(([h, ls]) => (
        <div key={h}>
          <div style={{ ...S.meta, color: T.moss, marginBottom: 14 }}>{h}</div>
          {ls.map(l => (
            <div key={l} style={{ fontFamily: 'Source Serif 4', fontSize: 14,
              color: T.inkSoft, marginBottom: 6 }}>{l}</div>
          ))}
        </div>
      ))}
    </div>
  </section>
);

const LandingEarth = () => {
  const [dark, setDark] = React.useState(false); // default light (V1 Bright)
  const T = dark ? getEarthDark() : getEarthLight();
  const S = earthStylesFor(T, dark);
  const props = { T, S, isDark: dark };
  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <window.Wordmark size={28} color={T.ink} />
        <div style={S.navLinks}>
          <span>Network</span><span>Standard</span><span>Token</span>
          <span>DeFi</span><span>Whitepaper</span><span>Docs</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggleEarth dark={dark} onToggle={() => setDark(d => !d)} T={T} />
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: T.ink, padding: '8px 16px',
            border: `1px solid ${T.ink}` }}>app →</div>
        </div>
      </nav>
      <Hero {...props} />
      <Trinity {...props} />
      <Problem {...props} />
      <WrapSim {...props} />
      <Grades {...props} />
      <Roadmap {...props} />
      <Footer {...props} />
    </div>
  );
};

window.LandingEarth = LandingEarth;
