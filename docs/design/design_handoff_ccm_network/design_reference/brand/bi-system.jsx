// BI System spec page — the spine of the whole identity.
// Earth-forward, warm-paper foundation.

const biTokens = {
  paper: '#f0eee9',
  paperDeep: '#e6e2d8',
  ink: '#1a1d1a',
  inkSoft: '#3a3d36',
  moss: '#3d5a3a',
  moss2: '#6e8a5a',
  clay: '#c87a4a',
  sky: '#7ba9c4',
  rule: '#c9c4b6',
};

const biStyles = {
  page: {
    width: '100%', minHeight: '100%', background: biTokens.paper,
    color: biTokens.ink, fontFamily: 'Inter, sans-serif',
    padding: '64px 80px 96px', position: 'relative',
  },
  metaRow: {
    display: 'flex', justifyContent: 'space-between',
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: biTokens.inkSoft, paddingBottom: 18,
    borderBottom: `1px solid ${biTokens.rule}`,
  },
  h1: {
    fontFamily: 'Fraunces, serif', fontWeight: 300,
    fontSize: 96, lineHeight: 0.95, letterSpacing: '-0.03em',
    margin: '36px 0 8px', fontVariationSettings: '"opsz" 144',
  },
  h1Italic: { fontStyle: 'italic', color: biTokens.moss, fontWeight: 400 },
  lead: {
    fontFamily: 'Source Serif 4, serif', fontSize: 22, lineHeight: 1.5,
    color: biTokens.inkSoft, maxWidth: 720, marginTop: 18, marginBottom: 64,
  },
  sectionLabel: {
    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    color: biTokens.moss, marginBottom: 16,
  },
  h2: {
    fontFamily: 'Fraunces, serif', fontWeight: 400,
    fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em',
    margin: '0 0 32px',
  },
  body: {
    fontFamily: 'Source Serif 4, serif', fontSize: 16, lineHeight: 1.6,
    color: biTokens.inkSoft,
  },
  block: { marginBottom: 96, paddingTop: 32, borderTop: `1px solid ${biTokens.rule}` },
};

// ── Wordmark system ────────────────────────────────────────
//
// All four wordmarks below are CUSTOM-DRAWN — built from SVG paths
// at a single canonical size (UNIT box = 100 tall × 240 wide), then
// scaled to whatever consumer size is requested. The letters are
// not Fraunces text; they are humanist-mono glyphs purpose-drawn
// for this brand. Stroke-width, x-height, and bowl geometry are
// tuned to feel like an instrument typeface — narrow apertures,
// flat terminals, no decorative serifs.
//
// "u" — letterforms drawn at units; consumer scales by `size`.
//   - x-height: 56u (top 22 → bottom 78 inside the 100u box)
//   - stroke:   10u
//   - cap:      72u (used by V2 small-cap variant)
//
// Geometry detail: the lowercase c and m are built from arcs cut
// open at 16°/164° (roughly the 4-o'clock / 8-o'clock positions
// when read as a clock face). This signature opening — narrower
// than a typical c — references a measurement gauge needle
// passing through the gap. The m's shoulders are flat-topped
// (not rounded) so the wordmark reads more like a precision tool
// than a soft display face.

// Helper · the canonical lowercase c, drawn as a single path.
// `cx,cy` = bowl center; `r` = outer radius; `s` = stroke width.
const lcC = (cx, cy, r, s) => {
  const ri = r - s;
  // Open at ~12° from horizontal on the right side. Outer arc
  // sweeps counter-clockwise from top-right to bottom-right;
  // inner arc returns clockwise. Closed shape, no stroke needed.
  const a1 = (-12 * Math.PI) / 180;   // outer start (upper right)
  const a2 = (12 * Math.PI) / 180;    // outer end   (lower right)
  const ox1 = cx + r * Math.cos(Math.PI - a1);
  const oy1 = cy + r * Math.sin(Math.PI - a1);
  // Outer goes the long way around: from upper-right opening,
  // counter-clockwise through 9 o'clock, to lower-right opening.
  const ox2 = cx + r * Math.cos(Math.PI + a2 - Math.PI*2 + Math.PI*2);
  // Simpler: just describe the two arc endpoints directly.
  const θ1 = -Math.PI / 2 + (Math.PI - 0.21);   // upper right opening
  const θ2 =  Math.PI / 2 - (Math.PI - 0.21);   // lower right opening — but this maps to other side
  // Build with explicit angles instead.
  const open = 0.34;  // opening half-angle in radians ≈ 19°
  const oxA = cx + r * Math.cos(-open);
  const oyA = cy + r * Math.sin(-open);
  const oxB = cx + r * Math.cos(open);
  const oyB = cy + r * Math.sin(open);
  const ixA = cx + ri * Math.cos(-open);
  const iyA = cy + ri * Math.sin(-open);
  const ixB = cx + ri * Math.cos(open);
  const iyB = cy + ri * Math.sin(open);
  // outer arc: A → B going the long way (sweep=0, large=1)
  // inner arc: B → A going short way (sweep=1, large=1)
  return `M ${oxA} ${oyA} A ${r} ${r} 0 1 0 ${oxB} ${oyB} L ${ixB} ${iyB} A ${ri} ${ri} 0 1 1 ${ixA} ${iyA} Z`;
};

// Helper · the lowercase m built from a stem and two bowls.
// Pure m letterform: each bowl is an ellipse narrower than tall
// (rx ≈ 0.78·r) so the m reads as "m" not as stacked c's. Total
// width ≈ 3.4r — closer to true type proportions where m is
// ~1.5× the width of c.
const lcM_paths = (x0, yC, r, s) => {
  // bowl horizontal radius (narrower than vertical for proper m proportion)
  const rx = r * 0.78;
  // x positions of the three stems' left edges
  const x1 = x0;                       // left stem
  const x2 = x0 + rx * 2;              // middle stem
  const x3 = x0 + rx * 4;              // right stem
  return [
    // left stem (full height of x-height)
    `M ${x1} ${yC - r} L ${x1 + s} ${yC - r} L ${x1 + s} ${yC + r} L ${x1} ${yC + r} Z`,
    // first bowl shoulder + middle stem
    `M ${x1 + s} ${yC - r} L ${x1 + rx} ${yC - r}
     A ${rx} ${r} 0 0 1 ${x2} ${yC} L ${x2} ${yC + r}
     L ${x2 - s} ${yC + r} L ${x2 - s} ${yC}
     A ${rx - s} ${r - s} 0 0 0 ${x1 + rx} ${yC - r + s}
     L ${x1 + s} ${yC - r + s} Z`,
    // second bowl shoulder + right stem
    `M ${x2} ${yC - r} L ${x2 + rx} ${yC - r}
     A ${rx} ${r} 0 0 1 ${x3} ${yC} L ${x3} ${yC + r}
     L ${x3 - s} ${yC + r} L ${x3 - s} ${yC}
     A ${rx - s} ${r - s} 0 0 0 ${x2 + rx} ${yC - r + s}
     L ${x2} ${yC - r + s} Z`,
  ];
};

// V1 · ccm — the PRIMARY direction. Custom lowercase wordmark
// where the m draws in moss while the c·c stay ink. The m sits
// slightly detached from c·c — a small physical gap that reads as
// "carbon → measured": same word, but the measured tonne has been
// pulled out, named, accounted for.
const WordmarkPrimary = ({
  size = 96,
  color = biTokens.ink,
  mColor,                       // the m's color — defaults to moss accent
  accent = biTokens.moss,
}) => {
  const mFill = mColor ?? biTokens.moss;
  // Canvas: 220u wide × 100u tall.
  // c bowls at x=46, 116; m at x=158 — single word, attached.
  const r = 28, s = 10, yC = 50;
  const mX = 158;
  const mPaths = lcM_paths(mX, yC, r, s);
  return (
    <svg width={size * 2.56} height={size} viewBox="0 0 256 100"
      style={{ overflow: 'visible' }}>
      {/* c #1 — ink */}
      <path d={lcC(46, yC, r, s)} fill={color} />
      {/* c #2 — ink */}
      <path d={lcC(116, yC, r, s)} fill={color} />
      {/* m — moss, drawn as 3 paths so we can tint together */}
      <g fill={mFill}>
        {mPaths.map((d, i) => <path key={i} d={d} />)}
      </g>
    </svg>
  );
};

// V2 · ccm with serif initial — humanist hybrid. Lowercase mono
// body + a SINGLE Fraunces-style entry on the first c (a small
// flick/teardrop terminal at top-right) to add literary warmth
// without going full serif. m carries the moss accent.
const WordmarkHumanist = ({
  size = 96,
  color = biTokens.ink,
  mColor,
  accent = biTokens.moss,
}) => {
  const mFill = mColor ?? biTokens.moss;
  const r = 28, s = 10, yC = 50;
  const mX = 158;
  const mPaths = lcM_paths(mX, yC, r, s);
  return (
    <svg width={size * 2.56} height={size} viewBox="0 0 256 100">
      <path d={lcC(46, yC, r, s)} fill={color} />
      {/* small flick terminal at the top opening of c #1 */}
      <path d={`M ${46 + r * 0.95} ${yC - r * 0.18}
                Q ${46 + r * 1.18} ${yC - r * 0.45} ${46 + r * 1.05} ${yC - r * 0.65}
                L ${46 + r * 0.85} ${yC - r * 0.5}
                Z`} fill={color} />
      <path d={lcC(116, yC, r, s)} fill={color} />
      <g fill={mFill}>
        {mPaths.map((d, i) => <path key={i} d={d} />)}
      </g>
    </svg>
  );
};

// V3 · ccm | tCO₂e — wordmark + measurement equivalence in a
// single horizontal lockup. The pipe is a thin rule, not a literal
// "=". Reads "ccm, that is, one tonne of CO₂e."
const WordmarkLedger = ({
  size = 96,
  color = biTokens.ink,
  mColor,
  accent = biTokens.moss,
}) => {
  const mFill = mColor ?? biTokens.moss;
  const r = 22, s = 8, yC = 50;
  // attached: c·c·m as one word, then divider, then equivalence.
  const mX = 122;
  const rxLedger = r * 0.78;            // matches lcM_paths
  const mPaths = lcM_paths(mX, yC, r, s);
  const dividerX = mX + rxLedger * 4 + 16;  // m extends to ~191, divider at ~207
  return (
    <svg width={size * 4.4} height={size} viewBox="0 0 440 100">
      <path d={lcC(36, yC, r, s)} fill={color} />
      <path d={lcC(90, yC, r, s)} fill={color} />
      <g fill={mFill}>
        {mPaths.map((d, i) => <path key={i} d={d} />)}
      </g>
      {/* divider rule */}
      <line x1={dividerX} y1={yC - r - 6} x2={dividerX} y2={yC + r + 6}
        stroke={biTokens.rule} strokeWidth="1" />
      <text x={dividerX + 14} y={yC + 6}
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="400" fontSize="20" letterSpacing="0.5"
        fill={biTokens.inkSoft}>1 tCO₂e</text>
      <text x={dividerX + 14} y={yC - r - 4}
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="500" fontSize="9" letterSpacing="2"
        fill={accent}>UNIT</text>
    </svg>
  );
};

// V4 · monogram — the C-bowl monogram. Two concentric arcs forming
// nested c's, with a moss m-bar inside. Reads as initials at small
// sizes (favicon, app icon, social avatar). The m-bar carries the
// same moss as V1's full m — keeping the narrative consistent.
const WordmarkMonogram = ({
  size = 96,
  color = biTokens.ink,
  mColor,
  accent = biTokens.moss,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d={lcC(50, 50, 42, 8)} fill={color} />
    <path d={lcC(50, 50, 26, 7)} fill={color} />
    <rect x={42} y={47} width={16} height={6} fill={mColor ?? accent} />
  </svg>
);

// V5 · gradient · carbon → measured. The narrative direction.
// Three glyphs colored across a transition: c (ink/carbon as-emitted),
// c (mid-tone, in-progress), m (moss/measured-and-removed). Same
// custom letterforms as V1 — only the per-glyph fill changes. This
// is the strongest reading of "탄소 → 감축" within the wordmark.
const WordmarkProgression = ({
  size = 96,
  c1Color = biTokens.ink,
  c2Color,
  mColor,
  accent = biTokens.moss,
}) => {
  const c2 = c2Color ?? '#26392a';
  const mFill = mColor ?? biTokens.moss;
  const r = 28, s = 10, yC = 50;
  const mX = 158;
  const mPaths = lcM_paths(mX, yC, r, s);
  return (
    <svg width={size * 2.56} height={size} viewBox="0 0 256 100">
      <path d={lcC(46, yC, r, s)} fill={c1Color} />
      <path d={lcC(116, yC, r, s)} fill={c2} />
      <g fill={mFill}>
        {mPaths.map((d, i) => <path key={i} d={d} />)}
      </g>
    </svg>
  );
};

// Primary alias — points at chosen direction. Switch this to
// re-skin every page that consumes the wordmark.
const Wordmark = WordmarkPrimary;

// URL lockup — used in footers, business cards, anywhere the domain
// itself needs to appear. Plex Mono, never set in Fraunces, so it
// reads as metadata not as the brand.
const URLLockup = ({ size = 14, color = biTokens.inkSoft }) => (
  <span style={{
    fontFamily: 'IBM Plex Mono, monospace', fontSize: size,
    letterSpacing: '0.08em', color, fontWeight: 400,
  }}>ccmnetwork.net</span>
);

// Unit-mark lockup — "1 ccm" pairs the wordmark with its unit count,
// reinforcing the ppm/kg metaphor. For stamps, certificates, retire
// receipts. Always set baseline-aligned with a thin rule between.
const UnitLockup = ({ size = 96, color = biTokens.ink }) => (
  <svg width={size * 3.2} height={size} viewBox="0 0 320 100">
    <text x="0" y="78" fontFamily="IBM Plex Mono, monospace"
      fontSize="56" fill={color} fontWeight="300" letterSpacing="-1">1</text>
    <line x1="58" y1="22" x2="58" y2="86" stroke={color} strokeWidth="0.8"
      opacity="0.4" />
    <text x="76" y="78" fontFamily="Fraunces, serif" fontWeight="300"
      fontSize="96" fill={color} letterSpacing="-3"
      style={{ fontVariationSettings: '"opsz" 144' }}>ccm</text>
    <circle cx="228" cy="73" r="8" fill={biTokens.moss} />
    <text x="252" y="78" fontFamily="IBM Plex Mono, monospace"
      fontSize="14" fill={biTokens.moss} letterSpacing="1">tCO₂e</text>
  </svg>
);

// Unit dial — measurement-instrument circular mark, with the
// custom monogram glyph at center (consistent with wordmark).
const MeasureMark = ({ size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="56" fill="none" stroke={biTokens.ink} strokeWidth="1.2" />
    {Array.from({ length: 60 }).map((_, i) => {
      const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const major = i % 5 === 0;
      const r1 = 54, r2 = major ? 48 : 51;
      return (
        <line key={i}
          x1={60 + Math.cos(a) * r1} y1={60 + Math.sin(a) * r1}
          x2={60 + Math.cos(a) * r2} y2={60 + Math.sin(a) * r2}
          stroke={biTokens.ink} strokeWidth={major ? 1.2 : 0.6} />
      );
    })}
    {/* needle pointing at "1" position (12 o'clock) */}
    <line x1="60" y1="60" x2="60" y2="22" stroke={biTokens.moss} strokeWidth="1.5" />
    <circle cx="60" cy="60" r="3" fill={biTokens.moss} />
    {/* "1 ccm" centered below dial axis */}
    <text x="60" y="86" textAnchor="middle"
      fontFamily="IBM Plex Mono, monospace" fontSize="10"
      fontWeight="500" letterSpacing="2" fill={biTokens.inkSoft}>1 CCM</text>
    <text x="60" y="100" textAnchor="middle"
      fontFamily="IBM Plex Mono, monospace" fontSize="7"
      letterSpacing="1.5" fill={biTokens.moss}>tCO₂e</text>
  </svg>
);

// App icon — monogram on ink ground, soft-corner square.
const StackMark = ({ size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120">
    <rect x="0" y="0" width="120" height="120" rx="22" fill={biTokens.ink} />
    {/* nested c's, scaled up version of WordmarkMonogram */}
    <g transform="translate(60 60) scale(0.62)">
      <path d={lcC(0, 0, 42, 8)} fill={biTokens.paper} />
      <path d={lcC(0, 0, 26, 7)} fill={biTokens.paper} />
      <rect x="-8" y="-3" width="16" height="6" fill={biTokens.moss2} />
    </g>
  </svg>
);

const LogoBlock = () => {
  const T = biTokens;
  // Construction display — render the canonical V1 wordmark
  // overlaid on a 5×24 unit grid so the proportions are visible.
  const ConstructionGrid = () => (
    <svg width="100%" viewBox="0 0 480 200" style={{ display: 'block' }}>
      {/* horizontal x-height + baseline guides */}
      {[
        { y: 22, label: 'cap / x-height top' },
        { y: 78, label: 'baseline' },
      ].map(g => (
        <g key={g.label}>
          <line x1="0" y1={g.y * 2} x2="480" y2={g.y * 2}
            stroke={T.clay} strokeWidth="0.6" />
          <text x="2" y={g.y * 2 - 4} fontFamily="IBM Plex Mono"
            fontSize="8" fill={T.clay} letterSpacing="0.5">{g.label}</text>
        </g>
      ))}
      {/* faint unit grid */}
      {Array.from({ length: 25 }).map((_, i) => (
        <line key={i} x1={i * 20} y1={0} x2={i * 20} y2={200}
          stroke={T.rule} strokeWidth="0.4" opacity="0.6" />
      ))}
      {/* the actual mark, scaled 2× */}
      <g transform="translate(0 0) scale(2 2)">
        <WordmarkPrimary size={100} color={T.ink} accent={T.moss} />
      </g>
      {/* x-measure callout — ½c clearspace */}
      <line x1="0" y1="180" x2="56" y2="180"
        stroke={T.moss} strokeWidth="1" />
      <text x="2" y="194" fontFamily="IBM Plex Mono" fontSize="9"
        fill={T.moss}>x = ½c clearspace</text>
    </svg>
  );

  return (
    <div style={biStyles.block}>
      <div style={biStyles.sectionLabel}>01 · Wordmark</div>
      <h2 style={biStyles.h2}>
        Two carbons in ink, one measured in
        <em style={{ color: T.moss }}> moss</em>.
      </h2>
      <p style={{ ...biStyles.body, maxWidth: 680, marginBottom: 48 }}>
        The wordmark is not a typeface. It is purpose-drawn from circular
        bowls and flat-topped m-shoulders — narrow apertures, instrument
        cadence, no decorative serifs. The two c's stay in ink (carbon as
        emitted, carbon as recorded); the m draws in moss (carbon
        measured, verified, removed). The transition lives inside the
        mark itself.
      </p>

      {/* Four directions — primary first, larger */}
      <div style={{ background: T.rule, border: `1px solid ${T.rule}`,
        display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 1,
        marginBottom: 16 }}>
        {/* Primary — full-width feature */}
        <div style={{ gridColumn: '1 / 3', background: '#fff',
          padding: '64px 48px 40px', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 20, left: 32,
            fontFamily: 'IBM Plex Mono', fontSize: 10,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: T.moss }}>V1 · primary · ccm¹</div>
          <div style={{
            position: 'absolute', top: 20, right: 32, textAlign: 'right',
            fontFamily: 'IBM Plex Mono', fontSize: 10,
            letterSpacing: '0.1em', color: T.inkSoft }}>
            custom · 240×100 unit box
          </div>
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'center', minHeight: 200 }}>
            <WordmarkPrimary size={130} />
          </div>
          <div style={{
            marginTop: 32, paddingTop: 16, borderTop: `1px solid ${T.rule}`,
            display: 'grid', gridTemplateColumns: '1.6fr 1fr',
            gap: 32, alignItems: 'flex-start' }}>
            <div style={{ fontFamily: 'Source Serif 4', fontStyle: 'italic',
              fontSize: 14, color: T.inkSoft, lineHeight: 1.55 }}>
              Lowercase ccm, set as a single word. The two c's are
              ink, the m is moss: black carbon transformed into a
              measured tonne in the same breath. Custom letterforms —
              narrow proportions, shared 10u stroke, identical bowl
              radius — so the word reads as one instrument, with the
              meaning carried only by color.
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
              color: T.inkSoft, letterSpacing: '0.06em', lineHeight: 1.9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, background: T.ink,
                  display: 'inline-block' }} />
                c · c — emitted, recorded
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, background: T.moss,
                  display: 'inline-block' }} />
                m — measured, verified
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, background: T.paper,
                  border: `1px solid ${T.rule}`, display: 'inline-block' }} />
                shared stroke · bowl radius
              </div>
            </div>
          </div>
        </div>

        {/* Three secondary lockups */}
        {[
          {
            label: 'V2 · humanist',
            mark: <WordmarkHumanist size={72} />,
            desc: 'A subtle Fraunces-style flick on the first c, a moss dot beneath the m. For editorial — whitepaper, articles, long-form.',
          },
          {
            label: 'V3 · ledger',
            mark: <WordmarkLedger size={48} />,
            desc: 'Wordmark | 1 tCO₂e — the equivalence stated alongside the mark. For receipts, certificates, legal surfaces.',
          },
          {
            label: 'V4 · monogram',
            mark: <WordmarkMonogram size={84} />,
            desc: 'Nested c-arcs with an m-bar. The ccm reduced to its smallest legible state. Favicon, app icon, social avatar.',
          },
        ].map(v => (
          <div key={v.label} style={{ gridColumn: 'span 1', background: '#fff',
            padding: '40px 32px 28px', display: 'flex',
            flexDirection: 'column', minHeight: 280, position: 'relative' }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: T.moss, marginBottom: 24 }}>{v.label}</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '20px 0' }}>{v.mark}</div>
            <div style={{ fontFamily: 'Source Serif 4', fontStyle: 'italic',
              fontSize: 13, color: T.inkSoft, lineHeight: 1.5,
              paddingTop: 16, borderTop: `1px solid ${T.rule}` }}>
              {v.desc}
            </div>
          </div>
        ))}
        {/* V5 · progression — replaces the filler with the narrative variant */}
        <div style={{ background: T.paperDeep, padding: '40px 32px',
          display: 'flex', flexDirection: 'column',
          minHeight: 280, position: 'relative' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: T.moss, marginBottom: 24 }}>V5 · progression</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '20px 0' }}>
            <WordmarkProgression size={64} />
          </div>
          <div style={{ fontFamily: 'Source Serif 4', fontStyle: 'italic',
            fontSize: 13, color: T.inkSoft, lineHeight: 1.5,
            paddingTop: 16, borderTop: `1px solid ${T.rule}` }}>
            The c·c·m gradient — emitted, recorded, removed — exposed in
            three steps. For hero moments, motion intros, OG cards.
          </div>
        </div>
      </div>

      {/* Featured study — the carbon→measured progression, in detail */}
      <div style={{ marginTop: 16, background: '#fff',
        border: `1px solid ${T.rule}`, padding: '56px 56px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: T.moss, marginBottom: 8 }}>
              Carbon → Measured
            </div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 32,
              fontWeight: 400, color: T.ink, letterSpacing: '-0.015em',
              maxWidth: 720, lineHeight: 1.15 }}>
              The mark itself is the journey:
              from <em style={{ color: T.ink }}>emitted</em> carbon to a
              <em style={{ color: T.moss }}> verified tonne</em>.
            </div>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
            letterSpacing: '0.1em', color: T.inkSoft,
            textAlign: 'right', maxWidth: 200 }}>
            same letterforms<br/>only the per-glyph fill changes
          </div>
        </div>

        {/* Big featured rendering */}
        <div style={{ background: T.paperDeep, padding: '64px 48px 56px',
          display: 'flex', justifyContent: 'center' }}>
          <WordmarkProgression size={170} />
        </div>

        {/* Phase legend underneath */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1, background: T.rule, marginTop: 24,
          border: `1px solid ${T.rule}` }}>
          {[
            {
              glyph: 'c',
              swatch: T.ink,
              phase: 'PHASE 01 · Emitted',
              caption: 'Carbon as it leaves the chimney. Untraced, ungraded, off-balance-sheet.',
            },
            {
              glyph: 'c',
              swatch: '#26392a',
              phase: 'PHASE 02 · Recorded',
              caption: 'A measurement is taken. Sensors, MRV, satellite — the tonne enters a record.',
            },
            {
              glyph: 'm',
              swatch: T.moss,
              phase: 'PHASE 03 · Verified',
              caption: 'VVB consensus signs. The tonne becomes 1 ccm: traceable, retireable, fluid.',
            },
          ].map((p, i) => (
            <div key={i} style={{ background: '#fff', padding: '32px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center',
                gap: 12, marginBottom: 16 }}>
                <span style={{ width: 14, height: 14, background: p.swatch,
                  display: 'inline-block' }} />
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
                  letterSpacing: '0.14em', color: T.moss }}>{p.phase}</span>
              </div>
              <div style={{ fontFamily: 'Fraunces', fontSize: 56,
                fontWeight: 300, color: p.swatch, lineHeight: 1,
                letterSpacing: '-0.04em', marginBottom: 16,
                fontVariationSettings: '"opsz" 144' }}>{p.glyph}</div>
              <div style={{ fontFamily: 'Source Serif 4',
                fontSize: 14, color: T.inkSoft, lineHeight: 1.55 }}>
                {p.caption}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reverse + URL + on-deep contexts — three application cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 16, marginTop: 16 }}>
        <div style={{ background: T.ink, padding: '40px 32px', minHeight: 200,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between' }}>
          <WordmarkPrimary size={72} color={T.paper} accent={T.moss2} />
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: T.paperDeep, marginTop: 32 }}>
            Reverse · dark surfaces
          </div>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${T.rule}`,
          padding: '40px 32px', minHeight: 200, display: 'flex',
          flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <WordmarkPrimary size={48} />
            <div style={{ marginTop: 18 }}><URLLockup size={12} /></div>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: T.inkSoft, marginTop: 24 }}>
            URL lockup · footers, cards
          </div>
        </div>
        <div style={{ background: T.paperDeep, padding: '40px 32px',
          minHeight: 200, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center' }}>
          <StackMark size={108} />
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: T.inkSoft, marginTop: 28 }}>
            App icon · monogram
          </div>
        </div>
      </div>

      {/* Construction grid */}
      <div style={{ marginTop: 16, background: '#fff',
        border: `1px solid ${T.rule}`, padding: '40px 48px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: T.moss, marginBottom: 6 }}>
              Construction
            </div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 28,
              fontWeight: 400, color: T.ink, letterSpacing: '-0.01em' }}>
              Bowl r = 28u · stroke = 10u · x-height = 56u
            </div>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
            color: T.inkSoft, letterSpacing: '0.08em',
            textTransform: 'uppercase', textAlign: 'right' }}>
            unit box · 240u × 100u
          </div>
        </div>
        <ConstructionGrid />
      </div>

      {/* Clearspace + minimum size */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', border: `1px solid ${T.rule}`,
          padding: '40px 32px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: T.moss, marginBottom: 24 }}>
            Clearspace
          </div>
          <svg width="100%" viewBox="0 0 360 160">
            {/* clearspace boundary */}
            <rect x="20" y="40" width="320" height="80"
              fill="none" stroke={T.clay} strokeWidth="0.8"
              strokeDasharray="3 3" />
            {/* x indicators */}
            <line x1="2" y1="80" x2="20" y2="80" stroke={T.clay} strokeWidth="0.8" />
            <line x1="340" y1="80" x2="358" y2="80" stroke={T.clay} strokeWidth="0.8" />
            <line x1="180" y1="22" x2="180" y2="40" stroke={T.clay} strokeWidth="0.8" />
            <line x1="180" y1="120" x2="180" y2="138" stroke={T.clay} strokeWidth="0.8" />
            <text x="6" y="74" fontFamily="IBM Plex Mono" fontSize="9"
              fill={T.clay}>x</text>
            <g transform="translate(60 50) scale(0.8)">
              <WordmarkPrimary size={75} />
            </g>
          </svg>
          <div style={{ fontFamily: 'Source Serif 4', fontStyle: 'italic',
            fontSize: 13, color: T.inkSoft, marginTop: 16 }}>
            Minimum clearspace on all sides equals one bowl-radius (½c).
            Never crowd the mark with type or rules.
          </div>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${T.rule}`,
          padding: '40px 32px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: T.moss, marginBottom: 24 }}>
            Minimum size
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end',
            gap: 32, paddingTop: 8 }}>
            {[
              { px: 18, label: '18px · favicon · monogram only',
                el: <WordmarkMonogram size={18} /> },
              { px: 28, label: '28px · nav bar minimum',
                el: <WordmarkPrimary size={28} /> },
              { px: 56, label: '56px · canonical',
                el: <WordmarkPrimary size={56} /> },
            ].map(s => (
              <div key={s.px} style={{ display: 'flex',
                flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
                {s.el}
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9,
                  letterSpacing: '0.1em', color: T.inkSoft,
                  textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Misuse */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: T.moss, marginBottom: 16 }}>Misuse</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16 }}>
          {[
            { label: "Don't stretch", style: { transform: 'scaleX(1.5)', transformOrigin: 'left center' } },
            { label: "Don't recolor", overrideColor: '#a04ce0' },
            { label: "Don't outline", outline: true },
            { label: "Don't drop-shadow", style: { filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' } },
          ].map((m, i) => (
            <div key={i} style={{ background: '#fff',
              border: `1px solid ${T.rule}`, padding: '36px 24px 24px',
              position: 'relative', minHeight: 140 }}>
              <div style={{ position: 'absolute', top: 12, right: 14,
                width: 20, height: 20, border: `1px solid #c14d3a`,
                color: '#c14d3a', fontSize: 12, display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}>✕</div>
              <div style={{ display: 'flex', alignItems: 'center',
                height: 50, ...m.style }}>
                {m.outline ? (
                  <svg width={120} height={50} viewBox="0 0 240 100">
                    <text x="0" y="74" fontFamily="serif" fontSize="80"
                      fontWeight="200" fill="none" stroke={T.ink}
                      strokeWidth="1.5">ccm</text>
                  </svg>
                ) : (
                  <WordmarkPrimary size={42} color={m.overrideColor || T.ink}
                    accent={m.overrideColor ? '#a04ce0' : T.moss} />
                )}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: T.inkSoft, marginTop: 24 }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Color palette ───────────────────────────────────────────
const Swatch = ({ name, hex, label, dark }) => (
  <div>
    <div style={{
      background: hex, height: 140, marginBottom: 12,
      border: dark ? 'none' : `1px solid ${biTokens.rule}`,
      display: 'flex', alignItems: 'flex-end', padding: 16,
      color: dark ? biTokens.paper : biTokens.ink,
      fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
      letterSpacing: '0.1em', textTransform: 'uppercase',
    }}>{label}</div>
    <div style={{ fontFamily: 'Fraunces', fontSize: 18, marginBottom: 4 }}>{name}</div>
    <div style={{
      fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
      color: biTokens.inkSoft, textTransform: 'uppercase',
    }}>{hex}</div>
  </div>
);

const ColorBlock = () => (
  <div style={biStyles.block}>
    <div style={biStyles.sectionLabel}>02 · Color</div>
    <h2 style={biStyles.h2}>
      Aged paper, deep ink, and a forest moss that
      <em style={{ color: biTokens.moss }}> stays out of the way</em>.
    </h2>
    <p style={{ ...biStyles.body, maxWidth: 680, marginBottom: 48 }}>
      The system is essentially two-color — paper and ink — with a single
      living accent. Restraint here is the brand: anything more saturated
      reads as a marketing site, not infrastructure. Clay and sky are
      used sparingly, only as data accents and grade indicators.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
      <Swatch name="Paper" hex="#F0EEE9" label="surface · 0" />
      <Swatch name="Paper deep" hex="#E6E2D8" label="surface · 1" />
      <Swatch name="Rule" hex="#C9C4B6" label="border · hairline" />
      <Swatch name="Ink soft" hex="#3A3D36" label="text · body" />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
      <Swatch name="Ink" hex="#1A1D1A" label="text · display" dark />
      <Swatch name="Moss" hex="#3D5A3A" label="accent · primary" dark />
      <Swatch name="Moss light" hex="#6E8A5A" label="accent · soft" />
      <Swatch name="Clay" hex="#C87A4A" label="accent · data" />
    </div>

    {/* Grade chips */}
    <div style={{
      background: '#fff', border: `1px solid ${biTokens.rule}`, padding: 40,
    }}>
      <div style={{
        fontFamily: 'IBM Plex Mono', fontSize: 11,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: biTokens.moss, marginBottom: 24,
      }}>Grade tokens · A · B · C · D</div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {[
          { g: 'A', hex: '#1A1D1A', sub: 'DAC · mineralization' },
          { g: 'B', hex: '#3D5A3A', sub: 'biochar · weathering' },
          { g: 'C', hex: '#6E8A5A', sub: 'reforestation' },
          { g: 'D', hex: '#C9C4B6', sub: 'REDD+ · legacy' },
        ].map(c => (
          <div key={c.g} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, background: c.hex,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: ['A', 'B', 'C'].includes(c.g) ? biTokens.paper : biTokens.ink,
              fontFamily: 'Fraunces', fontSize: 26,
              border: c.g === 'D' ? `1px solid ${biTokens.inkSoft}` : 'none',
            }}>{c.g}</div>
            <div>
              <div style={{ fontFamily: 'Fraunces', fontSize: 16 }}>CCM-{c.g}</div>
              <div style={{
                fontFamily: 'IBM Plex Mono', fontSize: 10, color: biTokens.inkSoft,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Type system ─────────────────────────────────────────────
const TypeBlock = () => (
  <div style={biStyles.block}>
    <div style={biStyles.sectionLabel}>03 · Typography</div>
    <h2 style={biStyles.h2}>
      Three voices: a serif for the<em style={{ color: biTokens.moss }}> idea</em>,
      a sans for the body, a mono for the<em style={{ color: biTokens.moss }}> measurement</em>.
    </h2>

    {/* Fraunces specimen */}
    <div style={{
      background: '#fff', border: `1px solid ${biTokens.rule}`,
      padding: '56px 56px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontFamily: 'IBM Plex Mono', fontSize: 11,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: biTokens.moss, marginBottom: 32,
      }}>
        <span>Display · Fraunces</span>
        <span>variable · opsz 9–144</span>
      </div>
      <div style={{
        fontFamily: 'Fraunces', fontWeight: 300, fontSize: 140, lineHeight: 0.95,
        letterSpacing: '-0.04em', color: biTokens.ink,
        fontVariationSettings: '"opsz" 144',
      }}>
        Aa Mm <em style={{ color: biTokens.moss, fontWeight: 400 }}>1.5°</em>
      </div>
      <div style={{
        fontFamily: 'IBM Plex Mono', fontSize: 11, color: biTokens.inkSoft,
        letterSpacing: '0.08em', marginTop: 24,
      }}>
        300 · 400 · 500 · italic — used at sizes ≥ 32px only
      </div>
    </div>

    {/* Inter & mono */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{
        background: '#fff', border: `1px solid ${biTokens.rule}`, padding: 40,
      }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: biTokens.moss, marginBottom: 20,
        }}>Body · Inter</div>
        <div style={{ fontFamily: 'Inter', fontWeight: 400,
          fontSize: 17, lineHeight: 1.6, color: biTokens.ink,
        }}>
          A carbon credit measurement — one tonne of CO₂e, verified once,
          retired exactly once. The CCM Network treats this unit as a
          first-class onchain primitive: born as an NFT with provenance,
          fluid as an ERC-20 in markets.
        </div>
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11,
          color: biTokens.inkSoft, letterSpacing: '0.08em', marginTop: 20,
        }}>400 · 500 · 600</div>
      </div>
      <div style={{
        background: '#fff', border: `1px solid ${biTokens.rule}`, padding: 40,
      }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: biTokens.moss, marginBottom: 20,
        }}>Measurement · IBM Plex Mono</div>
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 16, lineHeight: 1.5,
          color: biTokens.ink,
        }}>
          1 ccm = 1 tCO₂e<br/>
          5,000,000,000 hard cap<br/>
          §7.2 wrap(tokenId, amount)<br/>
          M-of-N · 5/7 · CCM-A
        </div>
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11,
          color: biTokens.inkSoft, letterSpacing: '0.08em', marginTop: 20,
        }}>400 · 500 — data, code, footnotes</div>
      </div>
    </div>

    {/* Type scale */}
    <div style={{
      background: '#fff', border: `1px solid ${biTokens.rule}`,
      padding: 40, marginTop: 16,
    }}>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: biTokens.moss, marginBottom: 24,
      }}>Scale · 1.250 minor third</div>
      {[
        { label: 'Display · Fraunces 96', size: 96, family: 'Fraunces', wt: 300, t: 'measure the air' },
        { label: 'Heading · Fraunces 48', size: 48, family: 'Fraunces', wt: 400, t: 'A unit for the atmosphere' },
        { label: 'Title · Fraunces 28', size: 28, family: 'Fraunces', wt: 400, t: 'Trinity — Network, Unit, Token' },
        { label: 'Lead · Source Serif 22', size: 22, family: 'Source Serif 4', wt: 400, t: 'CCM Network is the carbon-credit infrastructure for onchain settlement.' },
        { label: 'Body · Inter 16', size: 16, family: 'Inter', wt: 400, t: 'Each measurement is verified by a multi-VVB consensus and minted as an ERC-1155 NFT.' },
        { label: 'Caption · Plex Mono 12', size: 12, family: 'IBM Plex Mono', wt: 400, t: '§ 7.2.3  Standard mode unwrap is FIFR.' },
      ].map((s, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '180px 1fr',
          alignItems: 'baseline', gap: 32, padding: '12px 0',
          borderBottom: i < 5 ? `1px solid ${biTokens.rule}` : 'none',
        }}>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 10,
            color: biTokens.inkSoft, letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>{s.label}</div>
          <div style={{
            fontFamily: s.family, fontWeight: s.wt, fontSize: s.size,
            color: biTokens.ink, lineHeight: 1.1,
          }}>{s.t}</div>
        </div>
      ))}
    </div>
  </div>
);

// ── Voice ───────────────────────────────────────────────────
const VoiceBlock = () => (
  <div style={biStyles.block}>
    <div style={biStyles.sectionLabel}>04 · Voice</div>
    <h2 style={biStyles.h2}>
      Like a measurement instrument:<em style={{ color: biTokens.moss }}> precise,
      quiet, unhurried</em>.
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
      {[
        { do: true, t: 'CCM is a unit. One tonne of CO₂e, verified once, retired once.' },
        { do: false, t: 'CCM is the world\'s most revolutionary climate fintech!' },
        { do: true, t: 'The wrap is 1:1 and non-custodial. The vault holds no opinion.' },
        { do: false, t: 'Unleash next-gen liquidity for tomorrow\'s climate economy.' },
      ].map((v, i) => (
        <div key={i} style={{
          background: '#fff', border: `1px solid ${v.do ? biTokens.moss : '#c14d3a'}`,
          borderLeftWidth: 3, padding: '24px 28px',
        }}>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 10,
            color: v.do ? biTokens.moss : '#c14d3a',
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12,
          }}>{v.do ? '✓ in voice' : '✕ off voice'}</div>
          <div style={{ fontFamily: 'Source Serif 4', fontSize: 18,
            fontStyle: 'italic', lineHeight: 1.45, color: biTokens.ink }}>
            "{v.t}"
          </div>
        </div>
      ))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {[
        ['Lowercased', 'ccm, not CCM, when used as a unit.'],
        ['Footnoted', 'Cite the spec — § 7.2 — as in scientific writing.'],
        ['Plain numbers', '5B, not 5,000,000,000, in display copy.'],
        ['No hype', 'Never "revolutionize", "unlock", "the future of".'],
      ].map(([h, b], i) => (
        <div key={i} style={{
          background: biTokens.paperDeep, padding: '24px 24px',
        }}>
          <div style={{ fontFamily: 'Fraunces', fontSize: 20, marginBottom: 8 }}>{h}</div>
          <div style={{ fontFamily: 'Source Serif 4', fontSize: 14,
            color: biTokens.inkSoft, lineHeight: 1.5 }}>{b}</div>
        </div>
      ))}
    </div>
  </div>
);

// ── Page ────────────────────────────────────────────────────
const BISystemPage = () => (
  <div style={biStyles.page}>
    <div style={biStyles.metaRow}>
      <span>CCM Foundation · Brand Identity v1.0</span>
      <span>May 2026 · §0 of guideline</span>
    </div>

    <h1 style={biStyles.h1}>
      A unit deserves<br />
      <span style={biStyles.h1Italic}>its own voice.</span>
    </h1>
    <p style={biStyles.lead}>
      The brand for CCM Network is built on the same logic as the protocol:
      one unit, measured carefully, expressed once. Earth-forward warmth,
      scientific restraint, and a quiet onchain confidence — all from the
      same foundation.
    </p>

    <LogoBlock />
    <ColorBlock />
    <TypeBlock />
    <VoiceBlock />

    <div style={{ marginTop: 64, paddingTop: 24,
      borderTop: `1px solid ${biTokens.rule}`,
      display: 'flex', justifyContent: 'space-between',
      fontFamily: 'IBM Plex Mono', fontSize: 11,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: biTokens.inkSoft }}>
      <span>End of section · BI v1.0</span>
      <span>foundation@ccmnetwork.net</span>
    </div>
  </div>
);

window.BISystemPage = BISystemPage;
window.biTokens = biTokens;
window.Wordmark = Wordmark;
window.MeasureMark = MeasureMark;
window.StackMark = StackMark;
