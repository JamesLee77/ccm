// Shared chrome for the additional ccm site pages.
// All pages inherit warm-paper light + dark inversion from biTokens.
// Read at render time so PageVariant's biTokens swap is honored.

const getSiteLight = () => window.biTokens;
const getSiteDark  = () => window.__BI_PALETTES['forest-dark'];

const sharedStylesFor = (T, isDark) => ({
  page: {
    width: '100%', minHeight: '100%',
    background: T.paper, color: T.ink,
    fontFamily: 'Inter, sans-serif',
    overflow: 'auto', position: 'relative',
  },
  nav: {
    position: 'sticky', top: 0, zIndex: 10,
    background: isDark ? 'rgba(10, 14, 12, 0.92)' : 'rgba(245, 243, 236, 0.92)',
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
  metaMoss: {
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    color: T.moss,
  },
  section: { padding: '120px 56px', borderTop: `1px solid ${T.rule}` },
  sectionLabel: {
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    color: T.moss, marginBottom: 32,
  },
  h1: {
    fontFamily: 'Fraunces, serif', fontWeight: 300,
    fontSize: 132, lineHeight: 0.92, letterSpacing: '-0.035em',
    margin: 0, fontVariationSettings: '"opsz" 144',
  },
  h2: {
    fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 64,
    letterSpacing: '-0.025em', lineHeight: 1.05, color: T.ink,
  },
  h3: {
    fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 32,
    letterSpacing: '-0.02em', lineHeight: 1.1, color: T.ink,
  },
  italicMoss: { fontStyle: 'italic', color: T.moss, fontWeight: 400 },
  body: {
    fontFamily: 'Source Serif 4, serif', fontSize: 18, lineHeight: 1.6,
    color: T.inkSoft,
  },
  bodyLg: {
    fontFamily: 'Source Serif 4, serif', fontSize: 22, lineHeight: 1.5,
    color: T.inkSoft,
  },
  surface: isDark ? T.paperDeep : '#fff',
});

// Shared site nav. `active` highlights the current page.
const SiteNav = ({ T, S, active = '', isDark, onToggle }) => {
  const items = [
    { id: 'standard',   label: 'Standard',    href: '#standard' },
    { id: 'ccmine',     label: 'CCMine',      href: '#ccmine' },
    { id: 'tokenomics', label: 'Tokenomics',  href: '#tokenomics' },
    { id: 'roadmap',    label: 'Roadmap',     href: '#roadmap' },
    { id: 'whitepaper', label: 'Whitepaper',  href: '#whitepaper' },
    { id: 'app',        label: 'Open App ↗',  href: '#app' },
  ];
  return (
    <div style={S.nav}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <window.Wordmark size={22} color={T.ink} mColor={T.moss} />
        <span style={{ ...S.meta, color: T.inkSoft }}>ccm.network</span>
      </div>
      <div style={S.navLinks}>
        {items.map(it => (
          <a key={it.id} href={it.href}
            style={{
              color: active === it.id ? T.moss : T.inkSoft,
              textDecoration: 'none',
              borderBottom: active === it.id ? `1px solid ${T.moss}` : '1px solid transparent',
              paddingBottom: 2,
            }}>{it.label}</a>
        ))}
      </div>
      <ThemeToggleShared dark={isDark} onToggle={onToggle} T={T} />
    </div>
  );
};

const ThemeToggleShared = ({ dark, onToggle, T }) => (
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
        <React.Fragment>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </React.Fragment>
      )}
    </svg>
    <span>{dark ? 'dark' : 'light'}</span>
  </button>
);

// Footer shared by every site page.
const SiteFooter = ({ T, S }) => (
  <footer style={{
    padding: '64px 56px 48px', borderTop: `1px solid ${T.rule}`,
    background: T.paperDeep,
  }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 48 }}>
      <div>
        <window.Wordmark size={32} color={T.ink} mColor={T.moss} />
        <div style={{ ...S.meta, marginTop: 18, lineHeight: 1.7 }}>
          CCM Foundation<br/>
          ccm.network · ccm.earth<br/>
          foundation@ccmnetwork.net
        </div>
      </div>
      {[
        { h: 'Network',   l: ['Standard', 'CCMine', 'Tokenomics', 'Roadmap'] },
        { h: 'Build',     l: ['Whitepaper', 'GitHub ↗', 'Smart contracts', 'Audit reports'] },
        { h: 'Foundation',l: ['About', 'VVB partners', 'Press kit', 'Contact'] },
      ].map(col => (
        <div key={col.h}>
          <div style={{ ...S.metaMoss, marginBottom: 14 }}>{col.h}</div>
          <div style={{ display: 'grid', gap: 8, fontFamily: 'IBM Plex Mono',
            fontSize: 13, color: T.inkSoft }}>
            {col.l.map(x => <a key={x} href="#" style={{ color: T.inkSoft, textDecoration: 'none' }}>{x}</a>)}
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${T.rule}`,
      display: 'flex', justifyContent: 'space-between', ...S.meta }}>
      <span>© 2026 CCM Foundation · CC BY 4.0</span>
      <span>Whitepaper v1.0 · May 2026</span>
    </div>
  </footer>
);

// Page shell — adds local light/dark state + theme toggle.
const SitePage = ({ active, children }) => {
  // Default light unless explicitly invoked from the dark Markets variant.
  // PageVariant swaps biTokens to lime/forest-dark so light reads the right one.
  const initialDark = window.biTokens && window.biTokens.label && window.biTokens.label.includes('Dark');
  const [isDark, setDark] = React.useState(!!initialDark);
  const T = isDark ? getSiteDark() : getSiteLight();
  const S = sharedStylesFor(T, isDark);
  return (
    <div style={S.page}>
      <SiteNav T={T} S={S} active={active} isDark={isDark}
        onToggle={() => setDark(d => !d)} />
      {typeof children === 'function' ? children({ T, S, isDark }) : children}
      <SiteFooter T={T} S={S} />
    </div>
  );
};

// Tiny abstract diagram primitives used across pages.
// All built from simple geometric SVG — no AI-slop pictography.

// Network diagram: central hub with N satellite nodes.
const NodeNetwork = ({ T, count = 7, size = 240, label = 'CCM' }) => (
  <svg width={size} height={size} viewBox="-120 -120 240 240" style={{ overflow: 'visible' }}>
    {Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * 88, y = Math.sin(a) * 88;
      return (
        <g key={i}>
          <line x1="0" y1="0" x2={x} y2={y} stroke={T.rule} strokeWidth="0.8" />
          <circle cx={x} cy={y} r="6" fill={T.paper} stroke={T.moss} strokeWidth="1.2" />
        </g>
      );
    })}
    <circle cx="0" cy="0" r="22" fill={T.ink} />
    <text x="0" y="4" textAnchor="middle" fontFamily="IBM Plex Mono"
      fontSize="9" letterSpacing="1.5" fill={T.paper}>{label}</text>
  </svg>
);

// A signal/measurement plot — sine over time with markers.
const SignalPlot = ({ T, w = 480, h = 120, accent }) => {
  const ac = accent || T.moss;
  const pts = Array.from({ length: 60 }).map((_, i) => {
    const x = (i / 59) * w;
    const y = h / 2 + Math.sin(i * 0.34) * (h * 0.28) + Math.cos(i * 0.11) * (h * 0.08);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <line x1="0" y1={h/2} x2={w} y2={h/2} stroke={T.rule} strokeWidth="0.6" strokeDasharray="2 4" />
      <path d={d} stroke={ac} strokeWidth="1.2" fill="none" />
      {pts.filter((_, i) => i % 8 === 0).map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2" fill={T.paper} stroke={ac} strokeWidth="1" />
      ))}
    </svg>
  );
};

window.sharedStylesFor = sharedStylesFor;
window.SiteNav = SiteNav;
window.SiteFooter = SiteFooter;
window.SitePage = SitePage;
window.NodeNetwork = NodeNetwork;
window.SignalPlot = SignalPlot;
