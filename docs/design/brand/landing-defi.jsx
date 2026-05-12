// App surface — same Earth BI system, used as a working dashboard.
// Paper / ink / moss tokens, Fraunces display, IBM Plex Mono for data.
// Supports light + dark mode (dark = inverted Earth: ink-paper, moss preserved).

const lightTokens = window.biTokens;
const darkTokens = {
  paper:     '#15181a',
  paperDeep: '#1d2123',
  rule:      '#2c3134',
  inkSoft:   '#9ca39a',
  ink:       '#f5f3ec',
  moss:      '#8eb47a',
  moss2:     '#5fe089',
  clay:      '#d99467',
};

const stylesFor = (T, isDark) => ({
  page: {
    width: '100%', minHeight: '100%', background: T.paper,
    color: T.ink, fontFamily: 'Inter, sans-serif',
    overflow: 'auto', transition: 'background 0.3s, color 0.3s',
  },
  meta: {
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: T.inkSoft,
  },
  surface: isDark ? T.paperDeep : '#fff',
  panel: {
    background: isDark ? T.paperDeep : '#fff',
    border: `1px solid ${T.rule}`,
  },
});

const Ticker = ({ T, S, isDark }) => {
  const items = [
    ['$CCM', '0.213', '+4.2%'],
    ['$CCM-A', '0.421', '+1.7%'],
    ['$CCM-B', '0.198', '−0.6%'],
    ['$CCM-C', '0.092', '+2.1%'],
    ['$CCM-D', '0.041', '−3.4%'],
    ['$CCM-PRIME', '0.387', '+1.2%'],
    ['VAULT TVL', '$24.8M', '+0.4%'],
    ['MINTED', '1,284,003', '+822 / 24h'],
    ['RETIRED', '327,489', '+148 / 24h'],
  ];
  return (
    <div style={{ background: T.paperDeep,
      borderBottom: `1px solid ${T.rule}`,
      padding: '10px 0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 56, whiteSpace: 'nowrap',
        animation: 'apptickr 50s linear infinite',
        fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
        {[...items, ...items].map(([n, v, d], i) => (
          <div key={i} style={{ display: 'flex', gap: 10 }}>
            <span style={{ color: T.inkSoft }}>{n}</span>
            <span style={{ color: T.ink }}>{v}</span>
            <span style={{ color: d.startsWith('+') ? T.moss : (isDark ? '#e89880' : '#a8412e') }}>{d}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes apptickr { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
};

// Sun / moon toggle button
const ThemeToggle = ({ dark, onToggle, T }) => (
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

const AppNav = ({ T, S, dark, onToggle }) => (
  <nav style={{ padding: '18px 48px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    borderBottom: `1px solid ${T.rule}`, background: T.paper }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <window.Wordmark size={24} color={T.ink} />
      <span style={{ ...S.meta, color: T.moss }}>app · v1.0</span>
    </div>
    <div style={{ display: 'flex', gap: 28, ...S.meta }}>
      <span style={{ color: T.ink, borderBottom: `1px solid ${T.ink}`,
        paddingBottom: 4 }}>Vault</span>
      <span>Mint</span><span>Wrap</span><span>Index</span>
      <span>veCCM</span><span>Retire</span>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <ThemeToggle dark={dark} onToggle={onToggle} T={T} />
      <span style={{ ...S.meta, padding: '8px 12px',
        border: `1px solid ${T.rule}`, background: S.surface,
        color: T.ink }}>0x7f3a…b212</span>
      <span style={{ ...S.meta, padding: '8px 12px',
        background: T.ink, color: T.paper, fontWeight: 500 }}>Base</span>
    </div>
  </nav>
);

const AppHero = ({ T, S }) => (
  <section style={{ padding: '64px 48px 48px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12,
      marginBottom: 24 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%',
        background: T.moss, boxShadow: `0 0 10px ${T.moss}66` }} />
      <span style={{ ...S.meta, color: T.moss }}>
        live · base mainnet · block #18,421,002
      </span>
    </div>
    <h1 style={{
      fontFamily: 'Fraunces, serif', fontWeight: 300,
      fontSize: 88, lineHeight: 0.96, letterSpacing: '-0.035em',
      margin: '0 0 24px', maxWidth: 1100,
      fontVariationSettings: '"opsz" 144',
    }}>
      The carbon credit, <br/>
      <em style={{ color: T.moss, fontWeight: 400 }}>as a working surface.</em>
    </h1>
    <p style={{ fontFamily: 'Source Serif 4', fontSize: 18, lineHeight: 1.55,
      color: T.inkSoft, maxWidth: 700, margin: '0 0 40px' }}>
      Mint, wrap, vault, index, retire — eight onchain primitives over a
      single non-custodial registry. Base mainnet, MIT-licensed,
      audit-passed.
    </p>
    <div style={{ display: 'flex', gap: 12 }}>
      <a style={{ background: T.ink, color: T.paper, padding: '14px 24px',
        textDecoration: 'none', fontFamily: 'IBM Plex Mono', fontSize: 12,
        letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Open vault →
      </a>
      <a style={{ border: `1px solid ${T.ink}`, color: T.ink,
        padding: '14px 24px', textDecoration: 'none',
        fontFamily: 'IBM Plex Mono', fontSize: 12,
        letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        github.com/ccm-network ↗
      </a>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 1, marginTop: 64, background: T.rule,
      border: `1px solid ${T.rule}` }}>
      {[
        ['$CCM', '0.213', 'usd · uniswap', '+4.2%'],
        ['Vault TVL', '$24.8M', 'across 4 grades', '+0.4%'],
        ['$CCM staked', '142.6M', '57% of float', '—'],
        ['ccm minted', '1.28M', 'tCO₂e equiv.', '+822/24h'],
      ].map(([h, v, sub, d]) => (
        <div key={h} style={{ background: S.surface, padding: '24px 22px' }}>
          <div style={S.meta}>{h}</div>
          <div style={{ fontFamily: 'Fraunces', fontSize: 44, fontWeight: 300,
            letterSpacing: '-0.02em', color: T.ink, marginTop: 8 }}>{v}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            ...S.meta, marginTop: 8 }}>
            <span>{sub}</span>
            <span style={{ color: d.startsWith('+') ? T.moss : T.inkSoft }}>{d}</span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const Primitives = ({ T, S, isDark }) => (
  <section style={{ padding: '64px 48px',
    borderTop: `1px solid ${T.rule}` }}>
    <div style={{ ...S.meta, color: T.moss, marginBottom: 20 }}>
      § 7 · primitives
    </div>
    <h2 style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 48,
      letterSpacing: '-0.025em', lineHeight: 1.05, margin: '0 0 48px',
      maxWidth: 900 }}>
      Eight modules, <em style={{ color: T.moss, fontWeight: 400 }}>composable
      end-to-end.</em>
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 1, background: T.rule, border: `1px solid ${T.rule}` }}>
      {[
        ['7.2', 'Wrap', 'NFT ⇄ ERC-20', '1:1 non-custodial vault'],
        ['7.3', 'Grade Wrappers', '$CCM-A · B · C · D', 'per-grade liquidity'],
        ['7.4', 'Vault Lending', 'NFT collateral', 'LTV 30–70% by grade'],
        ['7.5', 'Fractional', 'Split & merge', '90% threshold to merge'],
        ['7.6', 'NFT Yield', 'Hold-to-Earn', 'grade × vintage rate'],
        ['7.7', 'Retire-to-Earn', 'Burn rebate', '0–10% in $CCM'],
        ['7.8', 'Insurance', 'Dispute coverage', '0.5–3% premium / yr'],
        ['7.9', 'Index', 'PRIME · FOREST · TECH', 'rebalanced ETF-like'],
      ].map(([n, h, sub, desc]) => (
        <div key={n} style={{ background: S.surface, padding: '24px 22px',
          minHeight: 200, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = T.paperDeep}
          onMouseLeave={e => e.currentTarget.style.background = S.surface}>
          <div style={{ ...S.meta, color: T.moss }}>§ {n}</div>
          <div style={{ fontFamily: 'Fraunces', fontSize: 24, fontWeight: 400,
            letterSpacing: '-0.01em', marginTop: 12, color: T.ink }}>{h}</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
            color: T.moss, marginTop: 4 }}>{sub}</div>
          <div style={{ fontFamily: 'Source Serif 4', fontSize: 14,
            color: T.inkSoft, lineHeight: 1.5, marginTop: 14 }}>{desc}</div>
        </div>
      ))}
    </div>
  </section>
);

const CodePanel = ({ T, S, isDark }) => (
  <section style={{ padding: '64px 48px',
    borderTop: `1px solid ${T.rule}`,
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
    <div>
      <div style={{ ...S.meta, color: T.moss, marginBottom: 20 }}>
        contracts · § 9
      </div>
      <h2 style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 44,
        letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 20px' }}>
        Read the code, <em style={{ color: T.moss, fontWeight: 400 }}>not a press release.</em>
      </h2>
      <p style={{ fontFamily: 'Source Serif 4', fontSize: 16, lineHeight: 1.55,
        color: T.inkSoft, margin: '0 0 24px' }}>
        Non-upgradeable. MIT-licensed. Two external audits. Live on Base
        with 48-hour multisig timelocks on every admin action.
      </p>
      <div style={S.panel}>
        {[
          ['CCMToken.sol', 'ERC-20 · 5B cap'],
          ['CCMCreditNFT.sol', 'ERC-1155 · vintage·grade'],
          ['CCMWrapper.sol', '1:1 wrap / unwrap'],
          ['CCMVault.sol', 'NFT collateral lending'],
          ['CCMIndex.sol', 'basket rebalancer'],
          ['CCMVotingEscrow.sol', 'veCCM (Curve model)'],
        ].map(([f, d], i) => (
          <div key={f} style={{ display: 'flex', justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: i < 5 ? `1px solid ${T.rule}` : 'none',
            fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
            <span style={{ color: T.moss }}>{f}</span>
            <span style={{ color: T.inkSoft }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{
      background: isDark ? '#0a0d0a' : T.ink,
      padding: '32px 28px',
      fontFamily: 'IBM Plex Mono', fontSize: 13, lineHeight: 1.7,
      color: lightTokens.paper,
      border: isDark ? `1px solid ${T.rule}` : 'none',
    }}>
      <div style={{ ...S.meta, color: '#8aa380', marginBottom: 16 }}>
        // CCMWrapper.sol · § 7.2
      </div>
      <div>
        <span style={{ color: '#c8602e' }}>function</span>{' '}
        <span style={{ color: '#a8c89a' }}>wrap</span>(
        <span style={{ color: lightTokens.paper }}>uint256 tokenId, uint256 amount</span>
        ) <span style={{ color: '#c8602e' }}>external</span> {'{'}<br/>
        {'  '}ccmNFT.<span style={{ color: '#a8c89a' }}>safeTransferFrom</span>(<br/>
        {'    '}msg.sender, <span style={{ color: '#c8602e' }}>address</span>(vault),<br/>
        {'    '}tokenId, amount, <span style={{ color: '#e6b89a' }}>""</span><br/>
        {'  '});<br/>
        {'  '}ccmToken.<span style={{ color: '#a8c89a' }}>mint</span>(<br/>
        {'    '}msg.sender, amount * <span style={{ color: '#c8602e' }}>1e18</span><br/>
        {'  '}); <span style={{ color: '#7a8a72' }}>{'// 1 NFT = 1 $CCM'}</span><br/>
        {'  '}<span style={{ color: '#c8602e' }}>emit</span> Wrapped(msg.sender, tokenId, amount);<br/>
        {'}'}
      </div>
    </div>
  </section>
);

const AppCTA = ({ T, S }) => (
  <section style={{ padding: '96px 48px',
    borderTop: `1px solid ${T.rule}` }}>
    <h2 style={{ fontFamily: 'Fraunces', fontWeight: 300, fontSize: 72,
      letterSpacing: '-0.03em', lineHeight: 1.0, margin: '0 0 32px',
      maxWidth: 1000 }}>
      The vault is open.<br/>
      <em style={{ color: T.moss, fontWeight: 400 }}>Wrap a tonne.</em>
    </h2>
    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
      <a style={{ background: T.ink, color: T.paper, padding: '16px 28px',
        textDecoration: 'none', fontFamily: 'IBM Plex Mono', fontSize: 12,
        letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Connect wallet →
      </a>
      <a style={{ border: `1px solid ${T.ink}`, color: T.ink,
        padding: '16px 28px', textDecoration: 'none',
        fontFamily: 'IBM Plex Mono', fontSize: 12,
        letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Read the docs
      </a>
    </div>
    <div style={{ marginTop: 80, paddingTop: 24,
      borderTop: `1px solid ${T.rule}`, display: 'flex',
      justifyContent: 'space-between', ...S.meta }}>
      <span>ccm foundation · adgm · v1.0</span>
      <span>foundation@ccmnetwork.net</span>
    </div>
  </section>
);

const LandingDefi = () => {
  const [dark, setDark] = React.useState(true);
  const T = dark ? darkTokens : lightTokens;
  const S = stylesFor(T, dark);
  const props = { T, S, isDark: dark };
  return (
    <div style={S.page}>
      <AppNav {...props} dark={dark} onToggle={() => setDark(d => !d)} />
      <Ticker {...props} />
      <AppHero {...props} />
      <Primitives {...props} />
      <CodePanel {...props} />
      <AppCTA {...props} />
    </div>
  );
};

window.LandingDefi = LandingDefi;
