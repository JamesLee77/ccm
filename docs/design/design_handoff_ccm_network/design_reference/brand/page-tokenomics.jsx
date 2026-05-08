// Tokenomics — $CCM allocation, emission curve, TGE structure.

const PageTokenomics = () => (
  <window.SitePage active="tokenomics">
    {({ T, S, isDark }) => (
      <React.Fragment>
        {/* Hero */}
        <section style={{ padding: '120px 56px 96px' }}>
          <div style={{ ...S.meta, marginBottom: 64 }}>
            <span>§ Section 6 + 8</span> · <span>$CCM Token Economics</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 80, alignItems: 'flex-end' }}>
            <div>
              <h1 style={S.h1}>
                five billion,<br/>
                <em style={S.italicMoss}>hard cap.</em>
              </h1>
              <p style={{ ...S.bodyLg, maxWidth: 580, marginTop: 36 }}>
                $CCM is fungible exhaust of measured carbon. Supply is capped
                at 5,000,000,000 — enforced at the contract level by ERC20Capped.
                40% goes to miners over a decade. The rest funds verification,
                liquidity, and the standard.
              </p>
            </div>
            <div style={{ background: S.surface, border: `1px solid ${T.rule}`, padding: 28 }}>
              <div style={{ ...S.metaMoss, marginBottom: 14 }}>contract</div>
              {[
                ['standard', 'ERC-20 / Capped'],
                ['supply', '5,000,000,000'],
                ['decimals', '18'],
                ['network', 'Base · canonical'],
                ['mirror', 'Ethereum L1'],
              ].map(([k, v]) => <window.KV key={k} T={T} S={S} k={k} v={v} />)}
              <div style={{ ...S.meta, color: T.moss, marginTop: 14, fontSize: 10 }}>
                non-upgradeable · audited
              </div>
            </div>
          </div>
        </section>

        {/* Allocation — bar + table */}
        <section style={S.section}>
          <div style={S.sectionLabel}>§ 6.2 · allocation</div>
          <h2 style={{ ...S.h2, maxWidth: 900, marginBottom: 56 }}>
            Where the&nbsp;<em style={S.italicMoss}>five billion</em>&nbsp;goes.
          </h2>

          {/* Stacked bar */}
          <AllocationBar T={T} />

          {/* Table */}
          <div style={{ marginTop: 48, background: S.surface, border: `1px solid ${T.rule}` }}>
            <div style={{ display: 'grid',
              gridTemplateColumns: '20px 2fr 60px 100px 1fr',
              padding: '14px 32px', borderBottom: `1px solid ${T.rule}`,
              ...S.meta, fontSize: 10 }}>
              <span></span><span>category</span><span>%</span><span>tokens</span><span>vesting</span>
            </div>
            {ALLOCATION.map((row, i) => (
              <div key={row.k} style={{ display: 'grid',
                gridTemplateColumns: '20px 2fr 60px 100px 1fr',
                padding: '20px 32px', borderBottom: i < ALLOCATION.length - 1 ? `1px solid ${T.rule}` : 'none',
                alignItems: 'center' }}>
                <div style={{ width: 12, height: 12, background: row.color }} />
                <div>
                  <div style={{ fontFamily: 'Fraunces', fontSize: 18, color: T.ink,
                    letterSpacing: '-0.01em' }}>{row.k}</div>
                  <div style={{ ...S.meta, color: T.inkSoft, marginTop: 2 }}>{row.note}</div>
                </div>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: T.ink }}>{row.pct}%</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: T.ink }}>{row.tokens}</span>
                <span style={{ ...S.meta, color: T.inkSoft }}>{row.vest}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Mining emission */}
        <section style={{ ...S.section, background: T.paperDeep }}>
          <div style={S.sectionLabel}>§ 6.3 · mining emission</div>
          <h2 style={{ ...S.h2, maxWidth: 900, marginBottom: 24 }}>
            Front-loaded over&nbsp;<em style={S.italicMoss}>ten years.</em>
          </h2>
          <p style={{ ...S.body, maxWidth: 720, marginBottom: 56, fontSize: 18 }}>
            CCMine emission is concentrated in years 1–4 to bootstrap CapEx-heavy
            operators. By Y10 the schedule terminates and node revenue switches
            entirely to market-fee economics.
          </p>
          <EmissionCurve T={T} S={S} />
        </section>

        {/* TGE rounds */}
        <section style={S.section}>
          <div style={S.sectionLabel}>§ 8.1 · token generation event</div>
          <h2 style={{ ...S.h2, maxWidth: 900, marginBottom: 56 }}>
            $45M public raise.&nbsp;<em style={S.italicMoss}>5% of supply.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48 }}>
            {/* Rounds */}
            <div>
              {[
                { r: 'Seed', price: '$0.15', tok: '100M', raise: '$15.0M',
                  cliff: '6 mo', vest: '24 mo linear' },
                { r: 'Series A', price: '$0.20', tok: '150M', raise: '$30.0M',
                  cliff: '3 mo', vest: '18 mo linear' },
              ].map(r => (
                <div key={r.r} style={{ background: S.surface, border: `1px solid ${T.rule}`,
                  padding: 32, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontFamily: 'Fraunces', fontSize: 36, color: T.ink,
                      letterSpacing: '-0.02em' }}>{r.r}</div>
                    <div style={{ fontFamily: 'Fraunces', fontSize: 28, color: T.moss }}>{r.price}</div>
                  </div>
                  <div style={{ marginTop: 24, display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {[['tokens', r.tok], ['raise', r.raise], ['cliff', r.cliff], ['vest', r.vest]].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ ...S.meta, fontSize: 10 }}>{k}</div>
                        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14,
                          color: T.ink, marginTop: 6 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
                fontFamily: 'IBM Plex Mono', marginTop: 16 }}>
                {[['total tokens', '250M'], ['total raise', '$45.0M'], ['fdv at series A', '$1.0B']].map(([k, v]) => (
                  <div key={k} style={{ background: S.surface, border: `1px solid ${T.rule}`, padding: 18 }}>
                    <div style={{ ...S.meta, fontSize: 10 }}>{k}</div>
                    <div style={{ fontFamily: 'Fraunces', fontSize: 24, color: T.ink, marginTop: 6 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staking pool */}
            <div style={{ background: isDark ? '#0a0d0a' : T.ink, color: T.paper, padding: 36 }}>
              <div style={{ ...S.metaMoss }}>§ 8.2 · staking pool</div>
              <h3 style={{ ...S.h3, color: T.paper, marginTop: 14 }}>
                Price-elastic yield.
              </h3>
              <p style={{ ...S.body, color: '#bcbeb6', marginTop: 14, fontSize: 15 }}>
                The 200M staking pool pays a yield that compresses as price rises.
                Holders are protected at floor, sellers are taxed at peak.
              </p>
              <div style={{ background: '#0f1310', border: `1px solid ${T.rule}`,
                padding: 18, marginTop: 18, fontFamily: 'IBM Plex Mono', fontSize: 13,
                lineHeight: 1.8, color: T.paper }}>
                yield(t) = R₀<br/>
                &nbsp;&nbsp;× (P<sub>TGE</sub> / P<sub>t</sub>)<br/>
                &nbsp;&nbsp;× (pool<sub>left</sub> / pool<sub>init</sub>)
              </div>
              <div style={{ marginTop: 24 }}>
                {[
                  ['price = TGE',  '10% / mo',  '100%'],
                  ['price = 2× TGE', '5% / mo',  '50%'],
                  ['price = 5× TGE', '2% / mo',  '20%'],
                  ['price = 10× TGE','1% / mo',  '10%'],
                ].map(([k, y, w]) => (
                  <div key={k} style={{ display: 'grid',
                    gridTemplateColumns: '1fr 80px 100px',
                    alignItems: 'center', gap: 12, padding: '10px 0',
                    borderBottom: `1px solid ${T.rule}` }}>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13,
                      color: '#bcbeb6' }}>{k}</span>
                    <span style={{ fontFamily: 'Fraunces', fontSize: 18,
                      color: T.moss }}>{y}</span>
                    <div style={{ height: 4, background: '#1f2422' }}>
                      <div style={{ width: w, height: '100%', background: T.moss }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ ...S.meta, marginTop: 18, color: '#bcbeb6' }}>
                pool sunsets ~24–36mo · self-terminating
              </div>
            </div>
          </div>
        </section>

        {/* Price scenarios */}
        <section style={S.section}>
          <div style={S.sectionLabel}>§ 8.3 · price model · Y1–Y5</div>
          <h2 style={{ ...S.h2, maxWidth: 900, marginBottom: 56 }}>
            Three scenarios.&nbsp;<em style={S.italicMoss}>One unit.</em>
          </h2>
          <div style={{ background: S.surface, border: `1px solid ${T.rule}`, padding: 36 }}>
            <PriceChart T={T} S={S} isDark={isDark} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 32 }}>
              {[
                { tag: 'Bear', y5: '$0.40',  multi: '2×',  body: 'Slow VCM growth, regulatory friction, DeFi rails stay separate.', color: T.clay },
                { tag: 'Base', y5: '$3.50',  multi: '17.5×', body: 'VCM 6× growth · 5% market share · DeFi TVL $200M.', color: T.moss2 },
                { tag: 'Bull', y5: '$15.00', multi: '75×', body: 'VCM 8× growth · 10% market share · DeFi TVL $500M.', color: T.moss },
              ].map(c => (
                <div key={c.tag} style={{ borderTop: `2px solid ${c.color}`, paddingTop: 18 }}>
                  <div style={{ ...S.metaMoss, color: c.color }}>{c.tag} · Y5</div>
                  <div style={{ fontFamily: 'Fraunces', fontSize: 36, color: T.ink,
                    letterSpacing: '-0.02em', marginTop: 8 }}>{c.y5}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12,
                    color: T.inkSoft, marginTop: 4 }}>{c.multi} from TGE</div>
                  <div style={{ ...S.body, fontSize: 14, marginTop: 14 }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Utility */}
        <section style={{ ...S.section, background: T.paperDeep }}>
          <div style={S.sectionLabel}>§ 6.4 · utilities</div>
          <h2 style={{ ...S.h2, maxWidth: 900, marginBottom: 56 }}>
            Five jobs for&nbsp;<em style={S.italicMoss}>one token.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1,
            background: T.rule }}>
            {[
              ['01', 'Settlement', 'medium of exchange in CCM markets'],
              ['02', 'Staking',    'VVB and CCMiner identity bond'],
              ['03', 'Governance', 'lock for veCCM, vote on standard'],
              ['04', 'Discount',   'pay marketplace fees at –50%'],
              ['05', 'DeFi',       'NFT wrap, vault collateral, index'],
            ].map(([n, h, b]) => (
              <div key={n} style={{ background: T.paper, padding: '32px 24px', minHeight: 220 }}>
                <div style={{ ...S.metaMoss, fontSize: 10 }}>{n}</div>
                <div style={{ fontFamily: 'Fraunces', fontSize: 26, color: T.ink,
                  marginTop: 14, letterSpacing: '-0.02em' }}>{h}</div>
                <div style={{ ...S.body, fontSize: 14, marginTop: 16 }}>{b}</div>
              </div>
            ))}
          </div>
        </section>
      </React.Fragment>
    )}
  </window.SitePage>
);

// ── data + visuals ─────────────────────────────────

const ALLOCATION = [
  { k: 'Mining (CCMine)',     pct: 40, tokens: '2.0B',   vest: '10y emission · front-loaded', note: 'Proof of Carbon Removal rewards', color: '#3d5a3a' },
  { k: 'Foundation',          pct: 18, tokens: '900M',   vest: '4y vest · 1y cliff', note: 'standard, partnerships, audits',     color: '#6e8a5a' },
  { k: 'Strategic',           pct: 10, tokens: '500M',   vest: '4y vest · 1y cliff', note: 'long-term partner allocations',      color: '#9bb37e' },
  { k: 'Liquidity / AMM',     pct:  9, tokens: '450M',   vest: 'TGE unlock',         note: 'Uniswap, Curve seed liquidity',      color: '#c87a4a' },
  { k: 'Treasury',            pct:  8, tokens: '400M',   vest: 'DAO controlled',     note: 'reserve, buy-back, grants',          color: '#7ba9c4' },
  { k: 'Public TGE',          pct:  5, tokens: '250M',   vest: 'Seed + Series A',    note: 'cohort sale at $0.15 / $0.20',       color: '#a89373' },
  { k: 'Staking Pool',        pct:  5, tokens: '250M',   vest: 'price-elastic yield', note: 'cohort A · 24–36mo sunset',         color: '#c9c4b6' },
  { k: 'Team & Advisors',     pct:  5, tokens: '250M',   vest: '4y vest · 1y cliff', note: 'core contributors',                  color: '#3a3d36' },
];

const AllocationBar = ({ T }) => (
  <div>
    <div style={{ display: 'flex', height: 56, border: `1px solid ${T.rule}` }}>
      {ALLOCATION.map(row => (
        <div key={row.k} style={{ flex: row.pct, background: row.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#f0eee9',
          letterSpacing: '0.06em', borderRight: `1px solid ${T.paper}` }}>
          {row.pct}%
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', marginTop: 8 }}>
      {ALLOCATION.map(row => (
        <div key={row.k} style={{ flex: row.pct, fontFamily: 'IBM Plex Mono',
          fontSize: 9, letterSpacing: '0.08em', color: T.inkSoft,
          textTransform: 'uppercase', textAlign: 'center', padding: '0 4px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.k.split(' ')[0]}
        </div>
      ))}
    </div>
  </div>
);

const EmissionCurve = ({ T, S }) => {
  const data = [
    { yr: 'Y1',  amt: 300, cum: 300  },
    { yr: 'Y2',  amt: 300, cum: 600  },
    { yr: 'Y3',  amt: 250, cum: 850  },
    { yr: 'Y4',  amt: 250, cum: 1100 },
    { yr: 'Y5',  amt: 200, cum: 1300 },
    { yr: 'Y6',  amt: 200, cum: 1500 },
    { yr: 'Y7',  amt: 200, cum: 1700 },
    { yr: 'Y8',  amt: 100, cum: 1800 },
    { yr: 'Y9',  amt: 100, cum: 1900 },
    { yr: 'Y10', amt: 100, cum: 2000 },
  ];
  const w = 1080, h = 280, pad = 40;
  const maxBar = 320, maxCum = 2000;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 50}`} style={{ display: 'block' }}>
      {/* gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(g => (
        <line key={g} x1={pad} y1={pad + (h - pad * 2) * (1 - g)}
          x2={w - pad} y2={pad + (h - pad * 2) * (1 - g)}
          stroke={T.rule} strokeWidth="0.5" strokeDasharray="2 4" />
      ))}
      {/* bars */}
      {data.map((d, i) => {
        const bw = (w - pad * 2) / data.length;
        const x = pad + bw * i + 8;
        const bh = ((h - pad * 2) * d.amt) / maxBar;
        const y = h - pad - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw - 16} height={bh} fill={T.moss} opacity={0.85} />
            <text x={x + (bw - 16) / 2} y={h - pad + 18} textAnchor="middle"
              fontFamily="IBM Plex Mono" fontSize="11" fill={T.inkSoft}>{d.yr}</text>
            <text x={x + (bw - 16) / 2} y={y - 6} textAnchor="middle"
              fontFamily="IBM Plex Mono" fontSize="10" fill={T.ink}>{d.amt}M</text>
          </g>
        );
      })}
      {/* cumulative line */}
      <polyline points={data.map((d, i) => {
        const bw = (w - pad * 2) / data.length;
        const x = pad + bw * i + 8 + (bw - 16) / 2;
        const y = h - pad - ((h - pad * 2) * d.cum) / maxCum;
        return `${x},${y}`;
      }).join(' ')} stroke={T.clay} strokeWidth="1.6" fill="none" />
      {data.map((d, i) => {
        const bw = (w - pad * 2) / data.length;
        const x = pad + bw * i + 8 + (bw - 16) / 2;
        const y = h - pad - ((h - pad * 2) * d.cum) / maxCum;
        return <circle key={i} cx={x} cy={y} r="3" fill={T.paper} stroke={T.clay} strokeWidth="1.4" />;
      })}
      {/* legend */}
      <g transform={`translate(${pad}, ${h + 30})`}>
        <rect x="0" y="-8" width="12" height="12" fill={T.moss} />
        <text x="20" y="2" fontFamily="IBM Plex Mono" fontSize="11" fill={T.inkSoft}>annual emission (M $CCM)</text>
        <line x1="280" y1="-2" x2="312" y2="-2" stroke={T.clay} strokeWidth="1.6" />
        <text x="320" y="2" fontFamily="IBM Plex Mono" fontSize="11" fill={T.inkSoft}>cumulative</text>
      </g>
    </svg>
  );
};

const PriceChart = ({ T, S, isDark }) => {
  // log scale, TGE → Y5
  const xs = ['TGE', 'Y1', 'Y2', 'Y3', 'Y5'];
  const series = [
    { tag: 'Bear', color: T.clay,  vals: [0.20, 0.15, 0.18, 0.25, 0.40] },
    { tag: 'Base', color: T.moss2, vals: [0.20, 0.30, 0.55, 1.20, 3.50] },
    { tag: 'Bull', color: T.moss,  vals: [0.20, 0.50, 1.20, 4.00, 15.00] },
  ];
  const w = 1080, h = 320, pad = 50;
  const lo = 0.1, hi = 30;
  const yOf = v => pad + (h - pad * 2) * (1 - (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)));
  const xOf = i => pad + ((w - pad * 2) * i) / (xs.length - 1);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 30}`}>
      {[0.1, 1, 10, 100].map(v => v <= hi && (
        <g key={v}>
          <line x1={pad} y1={yOf(v)} x2={w - pad} y2={yOf(v)}
            stroke={T.rule} strokeWidth="0.5" strokeDasharray="2 4" />
          <text x={pad - 8} y={yOf(v) + 3} textAnchor="end"
            fontFamily="IBM Plex Mono" fontSize="10" fill={T.inkSoft}>${v}</text>
        </g>
      ))}
      {xs.map((x, i) => (
        <text key={x} x={xOf(i)} y={h - pad + 22} textAnchor="middle"
          fontFamily="IBM Plex Mono" fontSize="11" fill={T.inkSoft}>{x}</text>
      ))}
      {series.map(s => (
        <g key={s.tag}>
          <polyline points={s.vals.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ')}
            stroke={s.color} strokeWidth="1.8" fill="none" />
          {s.vals.map((v, i) => (
            <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3.5"
              fill={T.paper} stroke={s.color} strokeWidth="1.6" />
          ))}
          <text x={xOf(xs.length - 1) + 12} y={yOf(s.vals[s.vals.length - 1]) + 4}
            fontFamily="IBM Plex Mono" fontSize="11" fill={s.color}
            letterSpacing="0.1em">{s.tag.toUpperCase()}</text>
        </g>
      ))}
    </svg>
  );
};

window.PageTokenomics = PageTokenomics;
