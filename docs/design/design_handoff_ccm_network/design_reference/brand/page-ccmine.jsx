// CCMine — mining node onboarding page.
// Speaks to physical, verification, and storage operators.

const PageCCMine = () => (
  <window.SitePage active="ccmine">
    {({ T, S, isDark }) => (
      <React.Fragment>
        {/* Hero */}
        <section style={{ padding: '120px 56px 96px' }}>
          <div style={{ ...S.meta, marginBottom: 64 }}>
            <span>§ Section 4 · CCMine</span> · <span>Proof of Carbon Removal</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 80, alignItems: 'flex-end' }}>
            <div>
              <h1 style={S.h1}>
                mine the&nbsp;
                <em style={S.italicMoss}>tonne,</em><br/>
                not the hash.
              </h1>
              <p style={{ ...S.bodyLg, maxWidth: 580, marginTop: 36 }}>
                CCMine replaces SHA-256 with <em style={{ color: T.moss }}>Proof of Carbon
                Removal</em>. Operators run physical removal, attest with sensors,
                or store registry data — and mint CCM-NFTs that wrap 1:1 into $CCM.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
                <a style={btnPrimary(T)}>Apply as a node →</a>
                <a style={btnGhost(T)}>Read § 4 in whitepaper</a>
              </div>
            </div>

            <div style={{ background: S.surface, border: `1px solid ${T.rule}`, padding: 28 }}>
              <div style={{ ...S.metaMoss, marginBottom: 14 }}>network · live</div>
              <KV T={T} S={S} k="active nodes" v="38" />
              <KV T={T} S={S} k="ccm minted (24h)" v="4,082" />
              <KV T={T} S={S} k="ccm minted (cum.)" v="1,284,003" />
              <KV T={T} S={S} k="vvb signers" v="11" />
              <KV T={T} S={S} k="emission rate (yr)" v="300M $CCM" last />
              <div style={{ marginTop: 18 }}>
                <window.SignalPlot T={T} w={296} h={64} />
              </div>
            </div>
          </div>
        </section>

        {/* Three miner types */}
        <section style={S.section}>
          <div style={S.sectionLabel}>§ 4.1 · three roles</div>
          <h2 style={{ ...S.h2, maxWidth: 900, marginBottom: 56 }}>
            One network,&nbsp;
            <em style={S.italicMoss}>three node types.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { tag: 'physical', title: 'Physical Miner', sub: 'remove the carbon',
                body: 'DAC plants, mineralization sites, biochar kilns, afforestation operators. The capital-intensive layer — you produce the tonne.',
                stats: [['CapEx', 'high'], ['cycle', '6–24mo'], ['margin', '15–35%']] },
              { tag: 'verification', title: 'Verification Miner', sub: 'attest the data',
                body: 'Run sensor and oracle nodes that sign Sentinel-2, IoT, LiDAR feeds. Stake $CCM, attest, earn fee share — slashed on bad signatures.',
                stats: [['CapEx', 'low'], ['cycle', 'continuous'], ['margin', '5–12%']] },
              { tag: 'storage', title: 'Storage Miner', sub: 'hold the registry',
                body: 'Provide IPFS / Arweave persistence for the registry mirror. Cheapest entry; rewarded per byte-month + retrieval proof.',
                stats: [['CapEx', 'minimal'], ['cycle', 'continuous'], ['margin', '2–6%']] },
            ].map((c) => (
              <div key={c.tag} style={{ background: S.surface, border: `1px solid ${T.rule}`,
                padding: 32, display: 'flex', flexDirection: 'column' }}>
                <div style={S.metaMoss}>{c.tag}</div>
                <div style={{ ...S.h3, marginTop: 14 }}>{c.title}</div>
                <div style={{ fontFamily: 'Source Serif 4', fontStyle: 'italic',
                  fontSize: 15, color: T.moss, marginTop: 4 }}>{c.sub}</div>
                <div style={{ ...S.body, marginTop: 24, marginBottom: 32 }}>{c.body}</div>
                <div style={{ marginTop: 'auto', borderTop: `1px solid ${T.rule}`, paddingTop: 16 }}>
                  {c.stats.map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                      ...S.meta, padding: '4px 0' }}>
                      <span>{k}</span><span style={{ color: T.ink }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section style={{ ...S.section, background: T.paperDeep }}>
          <div style={S.sectionLabel}>§ 4.2 · end-to-end</div>
          <h2 style={{ ...S.h2, maxWidth: 900, marginBottom: 64 }}>
            From an emission removed,<br/>
            <em style={S.italicMoss}>to a wrapped $CCM.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
            background: T.rule, padding: 1 }}>
            {[
              ['01', 'Remove', 'DAC, biochar, planted hectare'],
              ['02', 'Sense',  'satellite, LiDAR, IoT'],
              ['03', 'Verify', 'M-of-N VVB consensus'],
              ['04', 'Mint',   'ERC-1155 NFT issued'],
              ['05', 'Hold',   'NFT direct in wallet'],
              ['06', 'Wrap',   '1:1 → $CCM ERC-20'],
              ['07', 'Deploy', 'AMM, vault, retire'],
            ].map(([n, h, b], i) => (
              <div key={n} style={{ background: T.paper, padding: '28px 18px', minHeight: 200 }}>
                <div style={{ ...S.metaMoss, fontSize: 10 }}>{n}</div>
                <div style={{ fontFamily: 'Fraunces', fontSize: 24, color: T.ink,
                  marginTop: 14, letterSpacing: '-0.02em' }}>{h}</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
                  color: T.inkSoft, lineHeight: 1.55, marginTop: 16 }}>{b}</div>
                {i < 6 && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16,
                  color: T.moss, marginTop: 18 }}>→</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, fontFamily: 'IBM Plex Mono', fontSize: 11,
            color: T.inkSoft, letterSpacing: '0.06em' }}>
            invariant: total_supply($CCM) ≡ Σ(NFT in vault) × tCO₂e per NFT
          </div>
        </section>

        {/* Network diagram + economics */}
        <section style={S.section}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 80, alignItems: 'center' }}>
            <div>
              <window.NodeNetwork T={T} count={11} size={420} label="ccm" />
            </div>
            <div>
              <div style={S.sectionLabel}>§ 4.5 · operator economics</div>
              <h2 style={{ ...S.h2, marginBottom: 32 }}>
                Revenue is&nbsp;<em style={S.italicMoss}>simple.</em>
              </h2>
              <div style={{ background: S.surface, border: `1px solid ${T.rule}`,
                padding: 28, fontFamily: 'IBM Plex Mono', fontSize: 14,
                lineHeight: 1.9, color: T.ink }}>
                revenue = $CCM<sub>price</sub> × mint<sub>volume</sub><br/>
                <span style={{ color: T.inkSoft }}>&nbsp; − op_cost − vvb_fee − net_fee(5%)</span>
              </div>
              <div style={{ marginTop: 24 }}>
                {[
                  ['veCCM stakers',     '60%'],
                  ['Foundation treasury','25%'],
                  ['VVB network',       '10%'],
                  ['Oracle nodes',       '5%'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'grid',
                    gridTemplateColumns: '1fr auto 60px', alignItems: 'center', gap: 16,
                    padding: '14px 0', borderBottom: `1px solid ${T.rule}` }}>
                    <span style={{ ...S.body, color: T.ink, fontFamily: 'Source Serif 4',
                      fontSize: 17 }}>{k}</span>
                    <div style={{ width: 120, height: 8, background: T.rule, position: 'relative' }}>
                      <div style={{ width: v, height: '100%', background: T.moss }} />
                    </div>
                    <span style={{ ...S.meta, color: T.ink, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ ...S.meta, marginTop: 18 }}>
                of the 5% protocol fee on every node payout
              </div>
            </div>
          </div>
        </section>

        {/* Apply CTA */}
        <section style={{ ...S.section, background: isDark ? '#0a0d0a' : T.ink, color: T.paper, border: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <div style={{ ...S.metaMoss }}>onboarding</div>
              <h2 style={{ ...S.h2, color: T.paper, marginTop: 14 }}>
                Apply, stake,<br/><em style={S.italicMoss}>start mining.</em>
              </h2>
              <p style={{ ...S.bodyLg, color: '#bcbeb6', maxWidth: 520, marginTop: 24 }}>
                CCMine clients are open-source. Foundation operates a small concierge
                pool for the first 50 physical miners — covers VVB introductions,
                hardware specs, treasury setup.
              </p>
            </div>
            <div style={{ background: '#0f1310', border: `1px solid ${T.rule}`, padding: 28 }}>
              {[
                ['01', 'Select role', 'physical / verification / storage'],
                ['02', 'Stake $CCM', 'minimum 25,000 (verification only)'],
                ['03', 'Run client', 'github.com/ccm-network/ccmine'],
                ['04', 'First mint',  '6–24 weeks depending on category'],
              ].map(([n, h, b]) => (
                <div key={n} style={{ display: 'grid', gridTemplateColumns: '40px 1fr',
                  gap: 16, padding: '16px 0', borderBottom: `1px solid ${T.rule}` }}>
                  <span style={{ ...S.metaMoss }}>{n}</span>
                  <div>
                    <div style={{ fontFamily: 'Fraunces', fontSize: 20, color: T.paper }}>{h}</div>
                    <div style={{ ...S.meta, color: '#bcbeb6', marginTop: 4 }}>{b}</div>
                  </div>
                </div>
              ))}
              <a style={{ ...btnPrimary(T), marginTop: 24, background: T.moss, color: '#0a0d0a',
                display: 'inline-block' }}>Open onboarding form →</a>
            </div>
          </div>
        </section>
      </React.Fragment>
    )}
  </window.SitePage>
);

const KV = ({ T, S, k, v, last }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between',
    padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${T.rule}` }}>
    <span style={{ ...S.meta }}>{k}</span>
    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: T.ink }}>{v}</span>
  </div>
);

const btnPrimary = (T) => ({
  background: T.ink, color: T.paper, padding: '16px 28px',
  textDecoration: 'none', fontFamily: 'IBM Plex Mono', fontSize: 12,
  letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
});
const btnGhost = (T) => ({
  background: 'transparent', color: T.ink, padding: '16px 28px',
  textDecoration: 'none', border: `1px solid ${T.ink}`,
  fontFamily: 'IBM Plex Mono', fontSize: 12,
  letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
});

window.PageCCMine = PageCCMine;
window.btnPrimary = btnPrimary;
window.btnGhost = btnGhost;
window.KV = KV;
