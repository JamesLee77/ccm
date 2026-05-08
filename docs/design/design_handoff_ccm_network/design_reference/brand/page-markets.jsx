// App / Markets — DeFi-native dashboard.
// Connected wallet view: balances, vault, wrap, markets, recent activity.

const PageMarkets = () => (
  <window.SitePage active="app">
    {({ T, S, isDark }) => (
      <React.Fragment>
        {/* App header strip — sub-nav */}
        <section style={{ padding: '20px 56px', borderTop: `1px solid ${T.rule}`,
          borderBottom: `1px solid ${T.rule}`, background: T.paperDeep,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 28, ...S.meta }}>
            {['markets', 'wrap', 'vault', 'index', 'mining', 'retire'].map((tab, i) => (
              <span key={tab} style={{
                color: i === 0 ? T.moss : T.inkSoft,
                borderBottom: i === 0 ? `1px solid ${T.moss}` : '1px solid transparent',
                paddingBottom: 2 }}>{tab}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...S.meta }}>
            <span>0x7f3a…2c81</span>
            <span style={{ background: T.moss, color: '#0a0d0a', padding: '4px 10px',
              fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.14em' }}>BASE</span>
          </div>
        </section>

        {/* Hero — portfolio + market */}
        <section style={{ padding: '56px 56px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
            {/* Portfolio */}
            <div style={{ background: S.surface, border: `1px solid ${T.rule}`, padding: 36 }}>
              <div style={{ ...S.metaMoss, marginBottom: 14 }}>portfolio · ccm equivalent</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                <span style={{ fontFamily: 'Fraunces', fontSize: 96, fontWeight: 300,
                  letterSpacing: '-0.035em', color: T.ink, lineHeight: 1 }}>
                  4,128
                </span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 18,
                  color: T.inkSoft }}>ccm</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14,
                  color: T.moss, marginLeft: 18 }}>+2.4% / 24h</span>
              </div>
              <div style={{ ...S.meta, marginTop: 8 }}>
                ≈ $14,448 USD · weighted average grade B+
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1, background: T.rule, marginTop: 32, border: `1px solid ${T.rule}` }}>
                {[
                  ['CCM-NFT',  '2,840', 'in wallet'],
                  ['$CCM',     '1,288', 'liquid'],
                  ['$CCM-PRIME', '180', 'index'],
                  ['veCCM',     '420',  'locked 4y'],
                ].map(([k, v, n]) => (
                  <div key={k} style={{ background: T.paper, padding: '20px 18px' }}>
                    <div style={{ ...S.meta, fontSize: 9 }}>{k}</div>
                    <div style={{ fontFamily: 'Fraunces', fontSize: 28, color: T.ink,
                      marginTop: 6, letterSpacing: '-0.02em' }}>{v}</div>
                    <div style={{ ...S.meta, fontSize: 9, marginTop: 4, color: T.moss }}>{n}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market */}
            <div style={{ background: S.surface, border: `1px solid ${T.rule}`, padding: 28 }}>
              <div style={{ ...S.metaMoss, marginBottom: 14 }}>market · $CCM/USDC</div>
              <div style={{ fontFamily: 'Fraunces', fontSize: 56, fontWeight: 300,
                letterSpacing: '-0.03em', color: T.ink, lineHeight: 1 }}>
                $3.50<span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14,
                  color: T.moss, marginLeft: 12 }}>+1.8%</span>
              </div>
              <div style={{ marginTop: 18 }}>
                <window.SignalPlot T={T} w={400} h={80} accent={T.moss} />
              </div>
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${T.rule}`,
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {[
                  ['24h vol', '$2.4M'],
                  ['liquidity', '$8.9M'],
                  ['holders', '12,847'],
                  ['TVL (DeFi)', '$201M'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ ...S.meta, fontSize: 9 }}>{k}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: T.ink, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Three-up: Wrap · Vault · Stake */}
        <section style={{ padding: '8px 56px 56px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <WrapCard T={T} S={S} isDark={isDark} />
            <VaultCard T={T} S={S} />
            <StakeCard T={T} S={S} isDark={isDark} />
          </div>
        </section>

        {/* Grade-specific markets */}
        <section style={{ padding: '8px 56px 56px' }}>
          <div style={{ ...S.sectionLabel, paddingLeft: 0 }}>grade markets · live</div>
          <div style={{ background: S.surface, border: `1px solid ${T.rule}` }}>
            <div style={{ display: 'grid',
              gridTemplateColumns: '80px 1.4fr 100px 100px 110px 110px 100px 100px',
              padding: '14px 28px', borderBottom: `1px solid ${T.rule}`,
              ...S.meta, fontSize: 10 }}>
              <span>grade</span><span>methodology</span><span>price</span>
              <span>24h</span><span>volume</span><span>supply</span><span>vvb</span><span></span>
            </div>
            {GRADE_ROWS.map((row, i) => (
              <div key={row.g} style={{ display: 'grid',
                gridTemplateColumns: '80px 1.4fr 100px 100px 110px 110px 100px 100px',
                padding: '20px 28px',
                borderBottom: i < GRADE_ROWS.length - 1 ? `1px solid ${T.rule}` : 'none',
                alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, background: row.bg, color: row.fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Fraunces', fontSize: 22 }}>{row.g}</div>
                <div>
                  <div style={{ fontFamily: 'Fraunces', fontSize: 18, color: T.ink,
                    letterSpacing: '-0.01em' }}>$CCM-{row.g}</div>
                  <div style={{ ...S.meta, fontSize: 10, marginTop: 2 }}>{row.method}</div>
                </div>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: T.ink }}>${row.price}</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13,
                  color: row.delta.startsWith('+') ? T.moss : T.clay }}>{row.delta}</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: T.inkSoft }}>{row.vol}</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: T.inkSoft }}>{row.supply}</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: T.inkSoft }}>{row.vvb}</span>
                <a style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
                  color: T.moss, letterSpacing: '0.12em', textTransform: 'uppercase',
                  textDecoration: 'none' }}>trade →</a>
              </div>
            ))}
          </div>
        </section>

        {/* Recent activity + Composability */}
        <section style={{ padding: '8px 56px 96px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
            {/* Activity */}
            <div style={{ background: S.surface, border: `1px solid ${T.rule}` }}>
              <div style={{ padding: '20px 28px', borderBottom: `1px solid ${T.rule}`,
                display: 'flex', justifyContent: 'space-between' }}>
                <span style={S.metaMoss}>your activity · 24h</span>
                <span style={{ ...S.meta, color: T.moss }}>view all →</span>
              </div>
              {ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: 'grid',
                  gridTemplateColumns: '110px 100px 1fr 100px',
                  padding: '14px 28px',
                  borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${T.rule}` : 'none',
                  alignItems: 'center', fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
                  <span style={{ ...S.meta, fontSize: 10 }}>{a.t}</span>
                  <span style={{ color: a.kind === 'wrap' ? T.moss :
                    a.kind === 'retire' ? T.clay : T.ink }}>{a.kind}</span>
                  <span style={{ color: T.ink }}>{a.txt}</span>
                  <span style={{ color: T.inkSoft, textAlign: 'right' }}>{a.amt}</span>
                </div>
              ))}
            </div>

            {/* Composability */}
            <div style={{ background: S.surface, border: `1px solid ${T.rule}`, padding: 28 }}>
              <div style={{ ...S.metaMoss, marginBottom: 14 }}>composability · live</div>
              <div style={{ ...S.h3, fontSize: 24, marginBottom: 18 }}>
                Your $CCM, on 12 protocols.
              </div>
              {[
                ['Uniswap V4',  '$CCM/USDC',     '$8.9M'],
                ['Curve',       '$CCM/USDC pool','$3.4M'],
                ['Aave',        'collateral',    '$1.2M'],
                ['Pendle',      'PT/YT split',   '$680K'],
                ['Yearn',       'auto-vault',    '$420K'],
                ['OpenSea',     'NFT trades',    '128 listings'],
              ].map(([p, k, v], i, arr) => (
                <div key={p} style={{ display: 'grid',
                  gridTemplateColumns: '1fr 1fr 110px',
                  padding: '14px 0',
                  borderBottom: i < arr.length - 1 ? `1px solid ${T.rule}` : 'none',
                  alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Fraunces', fontSize: 16, color: T.ink }}>{p}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: T.inkSoft }}>{k}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: T.ink, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </React.Fragment>
    )}
  </window.SitePage>
);

const GRADE_ROWS = [
  { g: 'A', method: 'DAC · Mineralization', price: '12.40', delta: '+2.4%', vol: '$840K', supply: '48,200', vvb: '5/7', bg: '#1A1D1A', fg: '#F0EEE9' },
  { g: 'B', method: 'Biochar · Enhanced weathering', price: '6.80', delta: '+1.1%', vol: '$1.2M', supply: '124,800', vvb: '4/6', bg: '#3D5A3A', fg: '#F0EEE9' },
  { g: 'C', method: 'Reforestation', price: '2.20', delta: '−0.4%', vol: '$960K', supply: '614,300', vvb: '4/6', bg: '#6E8A5A', fg: '#1A1D1A' },
  { g: 'D', method: 'REDD+ · Legacy', price: '0.42', delta: '−1.8%', vol: '$210K', supply: '496,700', vvb: '3/5', bg: '#C9C4B6', fg: '#1A1D1A' },
];

const ACTIVITY = [
  { t: '14:42 UTC', kind: 'wrap',   txt: 'wrapped 24 CCM-NFT (grade A · DAC)', amt: '+24 $CCM' },
  { t: '12:18 UTC', kind: 'stake',  txt: 'locked 100 $CCM as veCCM (4y)', amt: '+100 veCCM' },
  { t: '09:34 UTC', kind: 'trade',  txt: 'sold 50 $CCM-D for 21 USDC on Uniswap', amt: '−50 $CCM' },
  { t: 'Y · 22:01', kind: 'retire', txt: 'retired 12 CCM-NFT for ESG report Q1', amt: '−12 ccm' },
  { t: 'Y · 18:47', kind: 'mint',   txt: 'received 18 CCM-NFT from CCMine pool #4', amt: '+18 ccm' },
];

const WrapCard = ({ T, S, isDark }) => {
  const [amt, setAmt] = React.useState(50);
  return (
    <div style={{ background: S.surface, border: `1px solid ${T.rule}`, padding: 28 }}>
      <div style={{ ...S.metaMoss, marginBottom: 14 }}>wrap · § 7.2</div>
      <div style={{ ...S.h3, fontSize: 22, marginBottom: 18 }}>NFT → $CCM</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        gap: 14, alignItems: 'center', marginBottom: 24 }}>
        <div style={{ border: `1px solid ${T.rule}`, padding: 14, background: T.paperDeep }}>
          <div style={{ ...S.meta, fontSize: 9, color: T.moss }}>NFT-A</div>
          <div style={{ fontFamily: 'Fraunces', fontSize: 28, color: T.ink, marginTop: 4 }}>{amt}</div>
        </div>
        <span style={{ ...S.meta, color: T.moss, fontSize: 13 }}>⇄</span>
        <div style={{ border: `1px solid ${T.rule}`, padding: 14,
          background: isDark ? '#0a0d0a' : '#1A1D1A', color: T.paper }}>
          <div style={{ ...S.meta, fontSize: 9, color: T.moss }}>$CCM</div>
          <div style={{ fontFamily: 'Fraunces', fontSize: 28, color: T.paper, marginTop: 4 }}>{amt}</div>
        </div>
      </div>
      <input type="range" min="1" max="500" value={amt}
        onChange={e => setAmt(+e.target.value)}
        style={{ width: '100%', accentColor: T.moss, marginBottom: 8 }} />
      <div style={{ ...S.meta, fontSize: 9 }}>1 NFT-A = 1 $CCM · gas ≈ $0.04</div>
      <button style={{ ...window.btnPrimary(T), display: 'block', textAlign: 'center',
        marginTop: 20, width: '100%', border: 'none' }}>Confirm wrap →</button>
    </div>
  );
};

const VaultCard = ({ T, S }) => (
  <div style={{ background: S.surface, border: `1px solid ${T.rule}`, padding: 28 }}>
    <div style={{ ...S.metaMoss, marginBottom: 14 }}>vault · § 7.4</div>
    <div style={{ ...S.h3, fontSize: 22, marginBottom: 18 }}>NFT collateral</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      <div>
        <div style={{ ...S.meta, fontSize: 9 }}>collateral</div>
        <div style={{ fontFamily: 'Fraunces', fontSize: 26, color: T.ink, marginTop: 4 }}>$9,940</div>
      </div>
      <div>
        <div style={{ ...S.meta, fontSize: 9 }}>borrowed</div>
        <div style={{ fontFamily: 'Fraunces', fontSize: 26, color: T.clay, marginTop: 4 }}>$5,200</div>
      </div>
    </div>
    <div style={{ marginTop: 18 }}>
      <div style={{ ...S.meta, fontSize: 10, marginBottom: 6 }}>health · 1.84 (52% LTV)</div>
      <div style={{ height: 6, background: T.rule, position: 'relative' }}>
        <div style={{ width: '52%', height: '100%', background: T.moss }} />
        <div style={{ position: 'absolute', left: '70%', top: -2,
          width: 1, height: 10, background: T.clay }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        ...S.meta, fontSize: 9, marginTop: 6 }}>
        <span>0%</span><span style={{ color: T.clay }}>liq · 70%</span>
      </div>
    </div>
    <div style={{ marginTop: 22, padding: 14, background: T.paperDeep,
      border: `1px solid ${T.rule}` }}>
      <div style={{ ...S.meta, fontSize: 9 }}>borrowing rate</div>
      <div style={{ fontFamily: 'Fraunces', fontSize: 24, color: T.ink, marginTop: 4 }}>4.2%<span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: T.inkSoft, marginLeft: 6 }}>APR</span></div>
    </div>
    <button style={{ ...window.btnGhost(T), display: 'block', textAlign: 'center',
      marginTop: 16, width: '100%' }}>Manage position</button>
  </div>
);

const StakeCard = ({ T, S, isDark }) => (
  <div style={{ background: isDark ? '#0a0d0a' : T.ink, color: T.paper, padding: 28 }}>
    <div style={{ ...S.metaMoss, marginBottom: 14 }}>staking · § 8.2</div>
    <div style={{ ...S.h3, fontSize: 22, marginBottom: 18, color: T.paper }}>Price-elastic yield</div>
    <div>
      <div style={{ ...S.meta, fontSize: 9, color: '#bcbeb6' }}>current yield · price = 17.5× TGE</div>
      <div style={{ fontFamily: 'Fraunces', fontSize: 56, fontWeight: 300,
        color: T.moss, letterSpacing: '-0.03em', marginTop: 4, lineHeight: 1 }}>
        0.6<span style={{ fontFamily: 'IBM Plex Mono', fontSize: 16,
          color: '#bcbeb6', marginLeft: 8 }}>% / mo</span>
      </div>
    </div>
    <div style={{ marginTop: 22 }}>
      <div style={{ ...S.meta, fontSize: 9, color: '#bcbeb6' }}>pool remaining</div>
      <div style={{ height: 6, background: '#1f2422', marginTop: 6 }}>
        <div style={{ width: '34%', height: '100%', background: T.moss }} />
      </div>
      <div style={{ ...S.meta, fontSize: 9, color: '#bcbeb6', marginTop: 6 }}>
        68M / 200M $CCM left · sunset Q2 2028E
      </div>
    </div>
    <div style={{ marginTop: 22, padding: 14, background: '#0f1310',
      border: `1px solid ${T.rule}` }}>
      <div style={{ ...S.meta, fontSize: 9, color: '#bcbeb6' }}>your stake</div>
      <div style={{ fontFamily: 'Fraunces', fontSize: 26, color: T.paper, marginTop: 4 }}>1,288 $CCM</div>
      <div style={{ ...S.meta, fontSize: 9, color: T.moss, marginTop: 4 }}>
        +7.7 / month · auto-compounded
      </div>
    </div>
    <button style={{ ...window.btnPrimary(T), display: 'block', textAlign: 'center',
      marginTop: 16, width: '100%', background: T.moss, color: '#0a0d0a', border: 'none' }}>
      Add stake →
    </button>
  </div>
);

window.PageMarkets = PageMarkets;
