// Roadmap — Phase 0 → Phase 5 with horizontal timeline.

const PHASES = [
  { id: 0, when: 'done',      tag: 'Foundation',
    head: 'Standard drafted', body: 'CCM Standard v1.0 + core contracts + whitepaper.',
    items: ['CCM Standard v1.0 draft', 'Core contracts (5)', 'Whitepaper v1.0', 'Foundation registered (ADGM)'] },
  { id: 1, when: '2026 Q3',    tag: 'Mainnet',
    head: 'Audit, TGE, AMM',     body: 'Base mainnet deploy, public TGE, $CCM/USDC liquidity.',
    items: ['External audit (Trail of Bits)', 'Base mainnet deploy', 'TGE: Seed + Series A', 'Uniswap + Curve seed', 'Foundation operational'] },
  { id: 2, when: '2026 Q4',    tag: 'Mining + DeFi',
    head: 'First five nodes',    body: '5 pilot CCMiners, 5 VVBs, first NFTs, wrap layer live.',
    items: ['5 pilot CCMine nodes', 'VVB onboarding × 5', 'Sentinel-2 oracle', 'First CCM-A + CCM-C mints', 'CCMWrapper + GradeWrapper', 'NFTStaking deployed'] },
  { id: 3, when: '2027 H1',    tag: 'DeFi full',
    head: 'Vault, index, vote',  body: 'Lending vault, $CCM-PRIME index, insurance, veCCM governance.',
    items: ['CCMVault — NFT lending', 'CCMIndex — $CCM-PRIME', 'CCMInsurance — dispute pool', 'veCCM governance launch', 'Aave + Curve listings'] },
  { id: 4, when: '2027–28',    tag: 'Scale',
    head: '100+ nodes',          body: 'Multi-chain, multi-language, dispute layer mainnet.',
    items: ['100+ CCMine nodes', '20+ VVB partners', 'Optimism + Arbitrum bridge', 'Dispute mainnet', '$CCM-FOREST + $CCM-TECH', 'EN/KO/JA/ZH localisation'] },
  { id: 5, when: '2028+',      tag: 'Standard',
    head: 'UNFCCC adoption',     body: 'Article 6.4 alignment, ISO TC 207, 1,000 ESG buyers.',
    items: ['UNFCCC Article 6 negotiation', 'ISO TC 207 working group', 'A6.4ER ↔ CCM bridge', '1,000+ enterprise ESG buyers', 'Foundation → DAO transition'] },
];

const PageRoadmap = () => (
  <window.SitePage active="roadmap">
    {({ T, S, isDark }) => (
      <React.Fragment>
        {/* Hero */}
        <section style={{ padding: '120px 56px 96px' }}>
          <div style={{ ...S.meta, marginBottom: 64 }}>
            <span>§ Section 11</span> · <span>Phase 0 → Phase 5</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 80, alignItems: 'flex-end' }}>
            <h1 style={S.h1}>
              the standard,<br/>
              <em style={S.italicMoss}>year by year.</em>
            </h1>
            <p style={{ ...S.bodyLg, maxWidth: 480 }}>
              Six phases between the whitepaper and the day CCM is read into UNFCCC
              Article 6 settlements. Each phase is gated on a verifiable outcome,
              not a calendar.
            </p>
          </div>
        </section>

        {/* Horizontal timeline strip */}
        <section style={{ padding: '64px 56px 0', borderTop: `1px solid ${T.rule}` }}>
          <TimelineStrip T={T} S={S} />
        </section>

        {/* Phase detail cards */}
        <section style={{ padding: '64px 56px 96px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {PHASES.map(p => (
              <PhaseCard key={p.id} T={T} S={S} isDark={isDark} p={p} />
            ))}
          </div>
        </section>

        {/* Sequencing logic */}
        <section style={{ ...S.section, background: T.paperDeep }}>
          <div style={S.sectionLabel}>§ 11.x · sequencing logic</div>
          <h2 style={{ ...S.h2, maxWidth: 900, marginBottom: 56 }}>
            Why this&nbsp;<em style={S.italicMoss}>order.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { h: 'Standard before chain.', b: 'A standard with no MRV teeth is just a logo. Phase 0 ships the methodology before any contract sees mainnet.' },
              { h: 'Wrap before vault.',     b: 'Liquidity primitives compose. Wrap is the dependency for AMM, vault, index — so Phase 2 ships it before Phase 3 leverages it.' },
              { h: 'Bridges last.',          b: 'Multi-chain attracts arbitrage exploits. We harden L1 settlement and dispute on Base before bridging anywhere.' },
            ].map(c => (
              <div key={c.h} style={{ borderTop: `2px solid ${T.moss}`, paddingTop: 18 }}>
                <div style={{ ...S.h3, fontSize: 24 }}>{c.h}</div>
                <div style={{ ...S.body, marginTop: 14 }}>{c.b}</div>
              </div>
            ))}
          </div>
        </section>
      </React.Fragment>
    )}
  </window.SitePage>
);

const TimelineStrip = ({ T, S }) => {
  const w = 1168, h = 220, pad = 40;
  const xOf = i => pad + ((w - pad * 2) * i) / (PHASES.length - 1);
  const baseline = h - 80;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {/* baseline */}
      <line x1={pad} y1={baseline} x2={w - pad} y2={baseline}
        stroke={T.rule} strokeWidth="1" />
      {/* mossy filled segment for done */}
      <line x1={pad} y1={baseline} x2={xOf(0.5)} y2={baseline}
        stroke={T.moss} strokeWidth="1.6" />

      {PHASES.map((p, i) => {
        const x = xOf(i);
        const isDone = p.when === 'done';
        return (
          <g key={p.id}>
            {/* tick */}
            <line x1={x} y1={baseline - 16} x2={x} y2={baseline + 16}
              stroke={isDone ? T.moss : T.rule} strokeWidth="1.2" />
            <circle cx={x} cy={baseline} r="6"
              fill={isDone ? T.moss : T.paper}
              stroke={isDone ? T.moss : T.rule} strokeWidth="1.4" />
            {/* label */}
            <text x={x} y={baseline - 36} textAnchor="middle"
              fontFamily="IBM Plex Mono" fontSize="10" letterSpacing="2"
              fill={T.moss}>P{p.id}</text>
            <text x={x} y={baseline + 36} textAnchor="middle"
              fontFamily="Fraunces" fontSize="20" fill={T.ink}
              letterSpacing="-0.01em">{p.tag}</text>
            <text x={x} y={baseline + 56} textAnchor="middle"
              fontFamily="IBM Plex Mono" fontSize="11" fill={T.inkSoft}>{p.when}</text>
          </g>
        );
      })}
    </svg>
  );
};

const PhaseCard = ({ T, S, isDark, p }) => {
  const isDone = p.when === 'done';
  return (
    <div style={{ background: S.surface, border: `1px solid ${T.rule}`,
      padding: 36, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ ...S.metaMoss }}>Phase {p.id} · {p.when}</div>
        {isDone && (
          <div style={{ background: T.moss, color: '#0a0d0a', padding: '4px 10px',
            fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.14em' }}>
            DONE
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 44,
        letterSpacing: '-0.02em', color: T.ink, marginTop: 18, lineHeight: 1.05 }}>
        {p.head}
      </div>
      <div style={{ ...S.body, marginTop: 12 }}>{p.body}</div>
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${T.rule}` }}>
        {p.items.map(it => (
          <div key={it} style={{ display: 'grid', gridTemplateColumns: '20px 1fr',
            gap: 12, padding: '8px 0', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12,
              color: isDone ? T.moss : T.inkSoft }}>{isDone ? '✓' : '·'}</span>
            <span style={{ fontFamily: 'Source Serif 4', fontSize: 16, color: T.ink }}>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

window.PageRoadmap = PageRoadmap;
