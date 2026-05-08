// Whitepaper — long-form, chapter sidebar + reading column.

const CHAPTERS = [
  { n: 1, title: 'The problem', sub: 'why a new standard' },
  { n: 2, title: 'CCM unit',    sub: 'definition · grades · SI prefixes' },
  { n: 3, title: 'Architecture', sub: 'eight-layer stack' },
  { n: 4, title: 'CCMine',      sub: 'mining mechanics' },
  { n: 5, title: 'Verification', sub: 'VVB and oracles' },
  { n: 6, title: '$CCM token', sub: 'supply, distribution, utility' },
  { n: 7, title: 'CCM × DeFi', sub: 'dual-representation primitives' },
  { n: 8, title: 'Token economy', sub: 'TGE, staking, accrual' },
  { n: 9, title: 'Smart contracts', sub: 'technical overview' },
  { n: 10, title: 'Governance', sub: 'veCCM and Foundation' },
  { n: 11, title: 'Roadmap',    sub: 'Phase 0 → 5' },
  { n: 12, title: 'Risks',      sub: 'regulatory · market · technical' },
  { n: 13, title: 'Conclusion', sub: '' },
  { n: 14, title: 'Appendix',   sub: 'glossary · references · license' },
];

const PageWhitepaper = () => (
  <window.SitePage active="whitepaper">
    {({ T, S, isDark }) => (
      <React.Fragment>
        {/* Cover */}
        <section style={{ padding: '120px 56px 80px' }}>
          <div style={{ ...S.meta, marginBottom: 80 }}>
            <span>Whitepaper</span> · <span>v1.0</span> · <span>May 2026</span> ·
            <span> CC BY 4.0</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 80, alignItems: 'flex-end' }}>
            <div>
              <h1 style={S.h1}>
                CCM Network<br/>
                <em style={S.italicMoss}>whitepaper.</em>
              </h1>
              <p style={{ ...S.bodyLg, maxWidth: 600, marginTop: 36 }}>
                The carbon credit standard. Verified. Onchain. DeFi-native.
                Thirty-nine pages, fourteen chapters, one unit.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
                <a style={window.btnPrimary(T)}>Download PDF · 4.2MB</a>
                <a style={window.btnGhost(T)}>View on GitHub</a>
              </div>
            </div>

            <div style={{ background: S.surface, border: `1px solid ${T.rule}`, padding: 28 }}>
              <div style={{ ...S.metaMoss, marginBottom: 14 }}>document</div>
              {[
                ['version',  '1.0'],
                ['pages',    '39'],
                ['chapters', '14'],
                ['language', 'EN · KO'],
                ['license',  'CC BY 4.0'],
                ['authors',  'CCM Foundation'],
              ].map(([k, v]) => <window.KV key={k} T={T} S={S} k={k} v={v} />)}
            </div>
          </div>
        </section>

        {/* Body — sidebar TOC + reading column */}
        <section style={{ padding: '64px 56px 96px', borderTop: `1px solid ${T.rule}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 80 }}>
            {/* TOC */}
            <aside style={{ position: 'sticky', top: 100, alignSelf: 'flex-start',
              maxHeight: 'calc(100vh - 120px)' }}>
              <div style={{ ...S.metaMoss, marginBottom: 18 }}>contents</div>
              <div style={{ display: 'grid', gap: 4 }}>
                {CHAPTERS.map(c => (
                  <a key={c.n} href={`#ch${c.n}`} style={{
                    textDecoration: 'none', color: T.ink, padding: '10px 0',
                    borderTop: `1px solid ${T.rule}`,
                    display: 'grid', gridTemplateColumns: '32px 1fr', gap: 8 }}>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
                      color: T.moss, paddingTop: 4 }}>§ {String(c.n).padStart(2, '0')}</span>
                    <div>
                      <div style={{ fontFamily: 'Fraunces', fontSize: 16,
                        letterSpacing: '-0.01em' }}>{c.title}</div>
                      {c.sub && (
                        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
                          color: T.inkSoft, marginTop: 2, letterSpacing: '0.06em' }}>{c.sub}</div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </aside>

            {/* Reading column */}
            <article>
              {/* Abstract */}
              <div style={{ paddingBottom: 56, marginBottom: 56,
                borderBottom: `1px solid ${T.rule}` }}>
                <div style={{ ...S.metaMoss, marginBottom: 18 }}>abstract</div>
                <p style={{ fontFamily: 'Source Serif 4', fontSize: 22,
                  lineHeight: 1.55, color: T.ink, fontStyle: 'italic',
                  letterSpacing: '-0.005em', maxWidth: 720 }}>
                  CCM Network is an open standard, verification, and DeFi network
                  for carbon credits. As <em>ppm</em> became the de-facto unit
                  for atmospheric CO₂, <em style={{ color: T.moss }}>ccm</em> aims
                  to become the de-facto unit for one verified, removed tonne.
                </p>
                <p style={{ ...S.body, marginTop: 24, maxWidth: 720, fontSize: 17 }}>
                  Its core is a Dual Representation: a CCM-NFT (ERC-1155) holding
                  the source-of-truth — vintage, grade, project, VVB signature —
                  and a fungible $CCM (ERC-20) wrapper for AMM, lending, and
                  payment. Together they make carbon onchain for the first time
                  with both provenance and liquidity.
                </p>
                <div style={{ ...S.meta, marginTop: 24, color: T.inkSoft }}>
                  keywords ·&nbsp;
                  carbon credit · tokenization · DeFi · ERC-1155 · ERC-20 ·
                  MRV · DePIN · VCM
                </div>
              </div>

              {/* Chapter 1 */}
              <ChapterIntro T={T} S={S} n={1} title="The problem" lead="A market with $50B in 2030 demand and four structural failures." />
              <p style={{ ...S.body, fontSize: 17, marginBottom: 18 }}>
                The voluntary carbon market is forecast at $50B by 2030 and $250B
                by 2050. Yet today, four structural failures prevent it from
                functioning as a real market.
              </p>
              <FailureGrid T={T} S={S} />

              {/* Chapter 2 */}
              <ChapterIntro T={T} S={S} n={2} title="CCM unit" lead="One ton CO₂e — verifiably removed, avoided, or reduced — registered onchain through the CCM Standard." />
              <DefinitionBlock T={T} S={S} />
              <GradeTable T={T} S={S} />
              <PrefixTable T={T} S={S} />

              {/* Chapter 3 */}
              <ChapterIntro T={T} S={S} n={3} title="Architecture" lead="Eight layers, one logic. NFT for truth, ERC-20 for liquidity, DeFi for compounding." />
              <StackTable T={T} S={S} />

              {/* Chapter 6 — invariant */}
              <ChapterIntro T={T} S={S} n={6} title="$CCM token" lead="5,000,000,000 hard cap. 40% to mining, 18% to the Foundation, 5% to public TGE." />
              <p style={{ ...S.body, fontSize: 17, marginBottom: 24 }}>
                Token supply is governed by an immutable invariant: the
                circulating $CCM is always backed 1:1 by NFTs locked in the wrap
                vault. There is no fractional reserve, no rebase, no algorithmic
                stabilizer.
              </p>
              <Callout T={T}>
                total_supply($CCM) ≡ Σ(NFT in vault) × tCO₂e per NFT
              </Callout>

              {/* Chapter 7 */}
              <ChapterIntro T={T} S={S} n={7} title="CCM × DeFi" lead="Eight DeFi primitives, all composing on the same wrap." />
              <PrimitiveGrid T={T} S={S} />

              {/* Continue marker */}
              <div style={{ marginTop: 56, padding: 32,
                background: T.paperDeep, border: `1px solid ${T.rule}` }}>
                <div style={{ ...S.metaMoss }}>continued</div>
                <div style={{ ...S.h3, marginTop: 10 }}>
                  Chapters 4, 5, 8–14 in the full PDF.
                </div>
                <p style={{ ...S.body, marginTop: 12, marginBottom: 24, maxWidth: 640 }}>
                  CCMine mechanics, VVB consensus, smart-contract appendix, governance,
                  roadmap, risks, glossary, references — all in the printable edition.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <a style={window.btnPrimary(T)}>Download full PDF →</a>
                </div>
              </div>
            </article>
          </div>
        </section>
      </React.Fragment>
    )}
  </window.SitePage>
);

const ChapterIntro = ({ T, S, n, title, lead }) => (
  <div id={`ch${n}`} style={{ paddingTop: 56, marginTop: 32,
    borderTop: `2px solid ${T.moss}`, marginBottom: 32 }}>
    <div style={{ ...S.metaMoss }}>§ {String(n).padStart(2, '0')} · chapter</div>
    <div style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 56,
      letterSpacing: '-0.025em', color: T.ink, marginTop: 14, lineHeight: 1.02 }}>
      {title}
    </div>
    <p style={{ fontFamily: 'Source Serif 4', fontStyle: 'italic',
      fontSize: 20, lineHeight: 1.5, color: T.moss, marginTop: 18,
      maxWidth: 720, marginBottom: 36 }}>{lead}</p>
  </div>
);

const FailureGrid = ({ T, S }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1,
    background: T.rule, border: `1px solid ${T.rule}`, marginBottom: 56 }}>
    {[
      ['01', 'Opacity',         'PDF-based ex-post reporting. Mint, transfer, retire are not verifiable in real time.'],
      ['02', 'Double counting', 'Berkeley 2024 found inflated baselines in ~40% of REDD+ projects.'],
      ['03', 'Illiquidity',     'Same-grade credits trade $4–80. Carbon is severed from DeFi rails.'],
      ['04', 'No grading',      'Permanence, additionality, MRV differ — but price does not.'],
    ].map(([n, h, b]) => (
      <div key={n} style={{ background: S.surface, padding: '28px 32px' }}>
        <div style={{ ...S.metaMoss, fontSize: 10 }}>FAIL · {n}</div>
        <div style={{ fontFamily: 'Fraunces', fontSize: 28,
          letterSpacing: '-0.02em', color: T.ink, marginTop: 14 }}>{h}</div>
        <div style={{ ...S.body, fontSize: 15, marginTop: 12 }}>{b}</div>
      </div>
    ))}
  </div>
);

const DefinitionBlock = ({ T, S }) => (
  <div style={{ background: T.paperDeep, border: `1px solid ${T.rule}`,
    borderLeft: `4px solid ${T.moss}`, padding: 32, marginBottom: 36 }}>
    <div style={{ ...S.metaMoss }}>definition · 2.1</div>
    <p style={{ fontFamily: 'Source Serif 4', fontSize: 22, lineHeight: 1.55,
      color: T.ink, fontStyle: 'italic', marginTop: 14, marginBottom: 0 }}>
      1 CCM ≡ 1 metric ton of CO₂-equivalent that has been verifiably removed,
      avoided, or reduced from the atmosphere, registered onchain through the
      CCM Standard.
    </p>
  </div>
);

const GRADES = [
  ['A', '1,000+ yr',  'strong', 'Tier-1', 'DAC · Mineralization · Ocean alkalinity'],
  ['B', '100+ yr',    'strong', 'Tier-1', 'Biochar · Enhanced weathering · Concrete'],
  ['C', '40–100 yr',  'medium', 'Tier-2', 'Afforestation · Soil C · Wetlands'],
  ['D', '<40 yr',     'weak',   'Tier-2', 'REDD+ · Methane avoidance · Cookstoves'],
];

const GradeTable = ({ T, S }) => (
  <div style={{ background: S.surface, border: `1px solid ${T.rule}`, marginBottom: 36 }}>
    <div style={{ display: 'grid',
      gridTemplateColumns: '60px 1fr 1fr 1fr 2fr',
      padding: '14px 24px', borderBottom: `1px solid ${T.rule}`,
      ...S.meta, fontSize: 10 }}>
      <span>grade</span><span>permanence</span><span>additionality</span>
      <span>MRV tier</span><span>categories</span>
    </div>
    {GRADES.map((row, i) => (
      <div key={row[0]} style={{ display: 'grid',
        gridTemplateColumns: '60px 1fr 1fr 1fr 2fr',
        padding: '20px 24px',
        borderBottom: i < GRADES.length - 1 ? `1px solid ${T.rule}` : 'none',
        alignItems: 'center' }}>
        <span style={{ fontFamily: 'Fraunces', fontSize: 28, color: T.ink }}>{row[0]}</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: T.ink }}>{row[1]}</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: T.ink }}>{row[2]}</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: T.ink }}>{row[3]}</span>
        <span style={{ fontFamily: 'Source Serif 4', fontSize: 15, color: T.inkSoft }}>{row[4]}</span>
      </div>
    ))}
  </div>
);

const PREFIXES = [
  ['μCCM', '1 g',                  'individual carbon footprint'],
  ['mCCM', '1 kg',                 'a flight ticket ≈ 200 mCCM'],
  ['CCM',  '1 ton',                'one verified credit'],
  ['kCCM', '1,000 ton',            'mid-size project'],
  ['MCCM', '1,000,000 ton',        'national NDC slice'],
  ['GCCM', '1,000,000,000 ton',    'planetary inventory'],
];

const PrefixTable = ({ T, S }) => (
  <div style={{ background: S.surface, border: `1px solid ${T.rule}`, marginBottom: 36 }}>
    {PREFIXES.map((row, i) => (
      <div key={row[0]} style={{ display: 'grid',
        gridTemplateColumns: '120px 200px 1fr',
        padding: '16px 24px',
        borderBottom: i < PREFIXES.length - 1 ? `1px solid ${T.rule}` : 'none',
        alignItems: 'center' }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 500, fontSize: 14, color: T.ink }}>{row[0]}</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: T.moss }}>{row[1]}</span>
        <span style={{ fontFamily: 'Source Serif 4', fontSize: 15, fontStyle: 'italic', color: T.inkSoft }}>{row[2]}</span>
      </div>
    ))}
  </div>
);

const STACK = [
  ['L8', 'Application',     'wallet · markets · ESG dashboard'],
  ['L7', 'DeFi Primitives', 'wrap · AMM · vault · index · insurance ★'],
  ['L6', 'Token Layer',     '$CCM ERC-20, veCCM'],
  ['L5', 'NFT Registry',    'CCM-NFT ERC-1155 · source of truth ★'],
  ['L4', 'Verification',    'VVB consensus · ZK proofs'],
  ['L3', 'Oracle / MRV',    'satellite · IoT · LiDAR'],
  ['L2', 'Mining (CCMine)', 'physical · verification · storage nodes'],
  ['L1', 'Settlement',      'Base / EVM L2'],
];

const StackTable = ({ T, S }) => (
  <div style={{ marginBottom: 36 }}>
    {STACK.map((row, i) => {
      const star = row[2].includes('★');
      return (
        <div key={row[0]} style={{ display: 'grid',
          gridTemplateColumns: '60px 200px 1fr',
          padding: '18px 0',
          borderBottom: `1px solid ${T.rule}`,
          alignItems: 'baseline',
          background: star ? T.paperDeep : 'transparent',
          paddingLeft: star ? 16 : 0,
          marginLeft: star ? -16 : 0,
          paddingRight: star ? 16 : 0 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
            color: T.moss, letterSpacing: '0.14em' }}>{row[0]}</span>
          <span style={{ fontFamily: 'Fraunces', fontSize: 22,
            color: T.ink, letterSpacing: '-0.01em' }}>{row[1]}</span>
          <span style={{ fontFamily: 'Source Serif 4', fontSize: 15, color: T.inkSoft }}>{row[2]}</span>
        </div>
      );
    })}
  </div>
);

const Callout = ({ T, children }) => (
  <div style={{ background: '#0a0d0a', color: '#f0eee9', padding: 28,
    fontFamily: 'IBM Plex Mono', fontSize: 14, letterSpacing: '0.04em',
    lineHeight: 1.7, marginBottom: 36, border: `1px solid ${T.moss}` }}>
    {children}
  </div>
);

const PRIMITIVES = [
  ['7.2', 'Wrap / Unwrap',      'NFT ⇆ $CCM at 1:1, FIFR self-correcting'],
  ['7.3', 'Grade Wrappers',     '$CCM-A / B / C / D pricing'],
  ['7.4', 'Vault Lending',      'NFT collateral · 30–70% LTV by grade'],
  ['7.5', 'Fractionalization',  '10K-ton NFT → 10K fractional units'],
  ['7.6', 'NFT Yield',          'hold-to-earn by grade × vintage'],
  ['7.7', 'Retire-to-Earn',     'ESG retire → 0–10% $CCM rebate'],
  ['7.8', 'Insurance Vault',    'auto-payout on VVB invalidation'],
  ['7.9', 'Index Baskets',      '$CCM-PRIME · -FOREST · -TECH'],
];

const PrimitiveGrid = ({ T, S }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1,
    background: T.rule, border: `1px solid ${T.rule}`, marginBottom: 56 }}>
    {PRIMITIVES.map(([n, h, b]) => (
      <div key={n} style={{ background: S.surface, padding: '24px 28px' }}>
        <div style={{ ...S.metaMoss, fontSize: 10 }}>§ {n}</div>
        <div style={{ fontFamily: 'Fraunces', fontSize: 22,
          letterSpacing: '-0.02em', color: T.ink, marginTop: 12 }}>{h}</div>
        <div style={{ ...S.body, fontSize: 15, marginTop: 8 }}>{b}</div>
      </div>
    ))}
  </div>
);

window.PageWhitepaper = PageWhitepaper;
