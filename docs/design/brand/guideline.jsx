// One-page brand guideline — condensed reference card.

const guideStyles = {
  page: {
    width: '100%', minHeight: '100%', background: window.biTokens.paper,
    color: window.biTokens.ink, fontFamily: 'Inter, sans-serif',
    padding: '56px 64px', display: 'grid',
    gridTemplateColumns: '1.2fr 1fr', gridTemplateRows: 'auto 1fr',
    gap: 40,
  },
  meta: {
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: window.biTokens.inkSoft,
  },
};

const BrandGuideline = () => {
  const T = window.biTokens;
  return (
    <div style={guideStyles.page}>
      {/* Header band */}
      <div style={{ gridColumn: '1 / 3', display: 'flex',
        justifyContent: 'space-between', alignItems: 'flex-end',
        paddingBottom: 24, borderBottom: `1px solid ${T.rule}` }}>
        <div>
          <div style={guideStyles.meta}>CCM Foundation · 2026</div>
          <div style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 56,
            letterSpacing: '-0.02em', marginTop: 8 }}>
            Brand guideline <em style={{ color: T.moss, fontWeight: 400 }}>at a glance.</em>
          </div>
        </div>
        <div style={{ ...guideStyles.meta, textAlign: 'right', lineHeight: 1.6 }}>
          v1.0 · May 2026<br/>foundation@ccmnetwork.net
        </div>
      </div>

      {/* Left column */}
      <div>
        {/* Wordmark hero */}
        <div style={{ background: '#fff', border: `1px solid ${T.rule}`,
          padding: '48px 32px', marginBottom: 16 }}>
          <window.Wordmark size={88} />
          <div style={{ ...guideStyles.meta, marginTop: 24 }}>
            primary lockup · clearspace = 1c
          </div>
        </div>

        {/* Marks row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.ink, padding: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
            <window.Wordmark size={44} color={T.paper} />
          </div>
          <div style={{ background: '#fff', border: `1px solid ${T.rule}`,
            padding: 24, display: 'flex', alignItems: 'center',
            justifyContent: 'center', minHeight: 140 }}>
            <window.StackMark size={84} />
          </div>
        </div>

        {/* Color strip */}
        <div style={{ display: 'flex', height: 80, marginBottom: 8 }}>
          {[
            ['#0c0f10', 'Ink', '#f5f3ec'],
            ['#2dbf63', 'Moss', '#f5f3ec'],
            ['#5fe089', 'Moss·L', '#0c0f10'],
            ['#c8602e', 'Clay', '#0c0f10'],
            ['#ebe8de', 'Paper·D', '#0c0f10'],
            ['#f5f3ec', 'Paper', '#0c0f10'],
          ].map(([hex, n, fg]) => (
            <div key={hex} style={{
              flex: 1, background: hex, color: fg,
              fontFamily: 'IBM Plex Mono', fontSize: 9,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '10px 12px', display: 'flex',
              flexDirection: 'column', justifyContent: 'space-between',
              border: hex === '#f5f3ec' ? `1px solid ${T.rule}` : 'none',
            }}>
              <span>{n}</span><span>{hex}</span>
            </div>
          ))}
        </div>
        <div style={guideStyles.meta}>palette · 6-step warm neutral + moss accent</div>

        {/* Type pairing */}
        <div style={{ background: '#fff', border: `1px solid ${T.rule}`,
          padding: '32px 28px', marginTop: 24 }}>
          <div style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 56,
            lineHeight: 0.95, letterSpacing: '-0.03em', color: T.ink }}>
            measure <em style={{ color: T.moss, fontWeight: 400 }}>the air.</em>
          </div>
          <div style={{ fontFamily: 'Source Serif 4', fontSize: 15,
            lineHeight: 1.55, color: T.inkSoft, marginTop: 16, maxWidth: 460 }}>
            One CCM is one tonne of CO₂e — verified once, retired once. The
            wrap is 1:1 and non-custodial; the vault holds no opinion.
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12,
            color: T.ink, marginTop: 16 }}>
            § 7.2  wrap(tokenId, amount) → mint $CCM
          </div>
          <div style={{ ...guideStyles.meta, marginTop: 20,
            paddingTop: 14, borderTop: `1px solid ${T.rule}` }}>
            Fraunces 300 · Source Serif 4 · IBM Plex Mono
          </div>
        </div>
      </div>

      {/* Right column */}
      <div>
        {/* Voice rules */}
        <div style={{ background: '#fff', border: `1px solid ${T.rule}`,
          padding: 28, marginBottom: 16 }}>
          <div style={{ ...guideStyles.meta, color: T.moss, marginBottom: 16 }}>Voice</div>
          {[
            ['Precise', 'Numbers as numbers. Spec citations welcome.'],
            ['Quiet', 'No exclamation. No hype verbs. No emoji.'],
            ['Lowercased', 'ccm is a unit, like ppm. Not CCM, not Ccm.'],
            ['Footnoted', 'Where claims live in the whitepaper, link the section.'],
          ].map(([h, b]) => (
            <div key={h} style={{ display: 'flex', gap: 16,
              padding: '10px 0', borderBottom: `1px solid ${T.rule}` }}>
              <div style={{ fontFamily: 'Fraunces', fontSize: 17,
                fontStyle: 'italic', color: T.moss, width: 110, flexShrink: 0 }}>{h}</div>
              <div style={{ fontFamily: 'Source Serif 4', fontSize: 13,
                color: T.inkSoft, lineHeight: 1.5 }}>{b}</div>
            </div>
          ))}
        </div>

        {/* Grade chips */}
        <div style={{ background: '#fff', border: `1px solid ${T.rule}`,
          padding: 28, marginBottom: 16 }}>
          <div style={{ ...guideStyles.meta, color: T.moss, marginBottom: 16 }}>
            Grade tokens
          </div>
          {[
            ['A', '#0c0f10', '#f5f3ec', 'DAC · mineralization · highest durability'],
            ['B', '#2dbf63', '#f5f3ec', 'biochar · enhanced weathering'],
            ['C', '#5fe089', '#0c0f10', 'reforestation · afforestation'],
            ['D', '#c9c5b8', '#0c0f10', 'REDD+ · legacy methodologies'],
          ].map(([g, bg, fg, sub]) => (
            <div key={g} style={{ display: 'flex', alignItems: 'center',
              gap: 14, padding: '10px 0',
              borderBottom: g !== 'D' ? `1px solid ${T.rule}` : 'none' }}>
              <div style={{ width: 40, height: 40, background: bg, color: fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fraunces', fontSize: 20,
                border: g === 'D' ? `1px solid ${T.inkSoft}` : 'none' }}>{g}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Fraunces', fontSize: 16 }}>CCM-{g}</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
                  color: T.inkSoft, letterSpacing: '0.06em', marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Spacing & motifs */}
        <div style={{ background: T.paperDeep, padding: 28 }}>
          <div style={{ ...guideStyles.meta, color: T.moss, marginBottom: 16 }}>
            Motifs · use sparingly
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12 }}>
            {/* hairline rules */}
            <div style={{ background: '#fff', padding: 16, height: 90,
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
              {[1, 1, 1, 2, 1, 1].map((w, i) => (
                <div key={i} style={{ height: w, background: T.ink }} />
              ))}
              <div style={{ ...guideStyles.meta, marginTop: 6, fontSize: 9 }}>strata</div>
            </div>
            {/* tick scale */}
            <div style={{ background: '#fff', padding: 16, height: 90,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
                {[6, 9, 14, 11, 18, 15, 22, 28, 24, 32, 38, 30].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: h, background: i % 3 === 0 ? T.moss : T.ink }} />
                ))}
              </div>
              <div style={{ ...guideStyles.meta, fontSize: 9 }}>measurement</div>
            </div>
            {/* dial */}
            <div style={{ background: '#fff', padding: 16, height: 90,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <window.MeasureMark size={68} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.BrandGuideline = BrandGuideline;
