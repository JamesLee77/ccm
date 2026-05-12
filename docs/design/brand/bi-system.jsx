// BI System spec page — the spine of the whole identity.
// Earth-forward, warm-paper foundation.

const biTokens = {
  paper: '#f5f3ec',
  paperDeep: '#ebe8de',
  ink: '#0c0f10',
  inkSoft: '#3a3f3c',
  moss: '#2dbf63',
  moss2: '#5fe089',
  clay: '#c8602e',
  sky: '#4a7d8c',
  rule: '#c9c5b8',
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

// ── Logo lockups ────────────────────────────────────────────
// ── Logo lockups ────────────────────────────────────────────
// Six wordmark variations — DIFFERENT DIRECTIONS, not micro-tweaks of
// "ccm + accent". Each one starts from a different metaphor about
// what the mark actually IS: a number, a chart line, a periodic
// element, a seal, an equation, a stencil.

// V1 · Number-led — the QUANTITY is the mark, "ccm" is metadata
// "1.0" set huge in Fraunces, "ccm" small in mono underneath
const WordmarkNumeric = ({ size = 96, color = biTokens.ink }) => (
  <svg width={size * 1.8} height={size} viewBox="0 0 180 100">
    <text x="0" y="74" fontFamily="Fraunces, serif" fontWeight="200"
      fontSize="96" fill={color} letterSpacing="-4"
      style={{ fontVariationSettings: '"opsz" 144' }}>1.0</text>
    <text x="2" y="94" fontFamily="IBM Plex Mono, monospace"
      fontSize="13" fill={biTokens.moss} letterSpacing="3"
      fontWeight="500">CCM · TCO₂E</text>
  </svg>
);

// V2 · Periodic element — atomic-style block, "Cc" with atomic
// number 6 (carbon) and atomic mass 1.00 (one tonne)
const WordmarkElement = ({ size = 96, color = biTokens.ink }) => (
  <svg width={size * 1.05} height={size} viewBox="0 0 105 100">
    <rect x="2" y="2" width="96" height="96" fill="none"
      stroke={color} strokeWidth="2" />
    <text x="10" y="22" fontFamily="IBM Plex Mono, monospace"
      fontSize="11" fill={biTokens.moss} fontWeight="500">06</text>
    <text x="50" y="64" textAnchor="middle" fontFamily="Fraunces, serif"
      fontWeight="300" fontSize="42" fill={color}
      style={{ fontVariationSettings: '"opsz" 144' }}>Cc</text>
    <text x="50" y="80" textAnchor="middle" fontFamily="IBM Plex Mono, monospace"
      fontSize="9" fill={color} letterSpacing="1">carbon</text>
    <text x="50" y="92" textAnchor="middle" fontFamily="IBM Plex Mono, monospace"
      fontSize="10" fill={biTokens.moss} fontWeight="500">1.00</text>
  </svg>
);

// V3 · Chart-line — measurement as a literal data signal. "ccm"
// emerges from a moss line that climbs and flattens (the trajectory
// of carbon retired). The line IS the brand.
const WordmarkSignal = ({ size = 96, color = biTokens.ink }) => (
  <svg width={size * 2.0} height={size} viewBox="0 0 200 100">
    <path d="M 0 78 L 40 76 L 60 64 L 80 30 L 200 22"
      stroke={biTokens.moss} strokeWidth="3.5" fill="none"
      strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="200" cy="22" r="5" fill={biTokens.moss} />
    <text x="0" y="98" fontFamily="IBM Plex Mono, monospace"
      fontSize="13" fill={color} letterSpacing="2.5"
      fontWeight="500">CCM</text>
  </svg>
);

// V4 · Stamp / seal — circular certification mark, "CCM" in caps
// at center, ring of metadata around. Reads like a notary seal.
const WordmarkSeal = ({ size = 96, color = biTokens.ink }) => {
  const R = 46;
  const text = "MEASURED · VERIFIED · RETIRED · ";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <path id="seal-arc" d={`M 50 50 m -${R} 0 a ${R} ${R} 0 1 1 ${R*2} 0 a ${R} ${R} 0 1 1 -${R*2} 0`} />
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="1" />
      <circle cx="50" cy="50" r="36" fill="none" stroke={color} strokeWidth="0.6" />
      <text fill={color} fontFamily="IBM Plex Mono, monospace"
        fontSize="6" letterSpacing="2">
        <textPath href="#seal-arc">{text + text}</textPath>
      </text>
      <text x="50" y="46" textAnchor="middle" fontFamily="Fraunces, serif"
        fontWeight="300" fontSize="22" fill={color} letterSpacing="-0.5"
        style={{ fontVariationSettings: '"opsz" 144' }}>CCM</text>
      <line x1="36" y1="54" x2="64" y2="54" stroke={biTokens.moss} strokeWidth="1" />
      <text x="50" y="68" textAnchor="middle" fontFamily="IBM Plex Mono, monospace"
        fontSize="6" fill={biTokens.moss} letterSpacing="1.5">1 tCO₂e</text>
    </svg>
  );
};

// V5 · Equation — the wordmark IS the definition: ccm = tCO₂e
// Bold typographic statement, sets brand and meaning together.
const WordmarkEquation = ({ size = 96, color = biTokens.ink }) => (
  <svg width={size * 3.5} height={size} viewBox="0 0 350 100">
    <text x="0" y="74" fontFamily="Fraunces, serif" fontWeight="300"
      fontSize="80" fill={color} letterSpacing="-2"
      style={{ fontVariationSettings: '"opsz" 144' }}>ccm</text>
    <text x="146" y="74" fontFamily="Fraunces, serif" fontWeight="200"
      fontSize="80" fill={biTokens.moss} letterSpacing="-2">=</text>
    <text x="200" y="74" fontFamily="IBM Plex Mono, monospace"
      fontWeight="300" fontSize="56" fill={color} letterSpacing="-1">1</text>
    <text x="232" y="74" fontFamily="IBM Plex Mono, monospace"
      fontWeight="500" fontSize="32" fill={color} letterSpacing="0">tCO₂e</text>
  </svg>
);

// V6 · Stencil / technical — all caps mono, military/industrial
// measurement device aesthetic. Crosshairs and tick brackets.
const WordmarkStencil = ({ size = 96, color = biTokens.ink }) => (
  <svg width={size * 2.4} height={size} viewBox="0 0 240 100">
    {/* L bracket */}
    <path d="M 4 4 L 4 96 L 14 96 M 4 4 L 14 4" stroke={biTokens.moss}
      strokeWidth="2" fill="none" />
    {/* R bracket */}
    <path d="M 236 4 L 236 96 L 226 96 M 236 4 L 226 4" stroke={biTokens.moss}
      strokeWidth="2" fill="none" />
    <text x="120" y="68" textAnchor="middle"
      fontFamily="IBM Plex Mono, monospace" fontWeight="600"
      fontSize="56" fill={color} letterSpacing="6">CCM</text>
    <text x="120" y="86" textAnchor="middle"
      fontFamily="IBM Plex Mono, monospace" fontSize="9"
      fill={biTokens.moss} letterSpacing="4">UNIT · ONE TONNE</text>
  </svg>
);

// Primary alias — points at chosen direction. Switch this to
// re-skin every page that consumes the wordmark.
const Wordmark = WordmarkNumeric;

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

const MeasureMark = ({ size = 120 }) => (
  // The unit mark — a measurement glyph reading "1 ccm"
  <svg width={size} height={size} viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="56" fill="none" stroke={biTokens.ink} strokeWidth="1.2" />
    {/* tick marks around the dial */}
    {Array.from({ length: 24 }).map((_, i) => {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const r1 = 52, r2 = i % 6 === 0 ? 44 : 48;
      return (
        <line key={i}
          x1={60 + Math.cos(a) * r1} y1={60 + Math.sin(a) * r1}
          x2={60 + Math.cos(a) * r2} y2={60 + Math.sin(a) * r2}
          stroke={biTokens.ink} strokeWidth={i % 6 === 0 ? 1.4 : 0.8} />
      );
    })}
    <text x="60" y="56" textAnchor="middle"
      fontFamily="IBM Plex Mono, monospace" fontSize="9"
      letterSpacing="2" fill={biTokens.inkSoft}>UNIT</text>
    <text x="60" y="80" textAnchor="middle"
      fontFamily="Fraunces, serif" fontSize="26" fontWeight="400"
      fill={biTokens.ink}>1 ccm</text>
  </svg>
);

const StackMark = ({ size = 120 }) => (
  // Compact app icon — c·c·m as three measured strata
  <svg width={size} height={size} viewBox="0 0 120 120">
    <rect x="0" y="0" width="120" height="120" rx="22" fill={biTokens.ink} />
    <g stroke={biTokens.paper} strokeWidth="1.2" fill="none">
      <path d="M28 44 Q42 36 56 44 T 92 44" />
      <path d="M28 64 Q42 56 56 64 T 92 64" />
      <path d="M28 84 Q42 76 56 84 T 92 84" />
    </g>
    <circle cx="92" cy="44" r="3" fill={biTokens.moss2} />
  </svg>
);

const LogoBlock = () => (
  <div style={biStyles.block}>
    <div style={biStyles.sectionLabel}>01 · Logo system</div>
    <h2 style={biStyles.h2}>
      Six different <em style={{ color: biTokens.moss }}>directions</em>.
    </h2>
    <p style={{ ...biStyles.body, maxWidth: 680, marginBottom: 48 }}>
      Six fundamentally different metaphors for what the mark IS — not
      decorations on top of "ccm", but different starting points: a
      number, a periodic element, a chart line, a notary seal, an
      equation, a technical stencil. Pick the direction first; refine
      the chosen one second.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 1, background: biTokens.rule, border: `1px solid ${biTokens.rule}`,
      marginBottom: 32 }}>
      {[
        ['V1 · numeric', WordmarkNumeric, 'quantity-led — the unit IS the mark'],
        ['V2 · element', WordmarkElement, 'periodic-table block, atomic notation'],
        ['V3 · signal', WordmarkSignal, 'measurement as a literal data line'],
        ['V4 · seal', WordmarkSeal, 'circular notary / certification mark'],
        ['V5 · equation', WordmarkEquation, 'the mark defines itself: ccm = 1 tCO₂e'],
        ['V6 · stencil', WordmarkStencil, 'industrial / technical-instrument feel'],
      ].map(([label, Mark, desc]) => (
        <div key={label} style={{ background: '#fff', padding: '48px 28px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'space-between', minHeight: 240, gap: 28 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center',
            justifyContent: 'center' }}>
            <Mark size={label === 'V4 · seal' ? 120 : 76} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: biTokens.moss }}>{label}</div>
            <div style={{ fontFamily: 'Source Serif 4', fontSize: 13,
              fontStyle: 'italic', color: biTokens.inkSoft, marginTop: 4 }}>
              {desc}
            </div>
          </div>
        </div>
      ))}
    </div>

    <div style={{ ...biStyles.body, fontSize: 13, color: biTokens.moss,
      fontFamily: 'IBM Plex Mono', letterSpacing: '0.08em',
      textTransform: 'uppercase', marginBottom: 24 }}>
      Currently primary → V1 · numeric
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
      <div style={{
        background: '#fff', border: `1px solid ${biTokens.rule}`,
        padding: 40, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', minHeight: 200,
      }}>
        <UnitLockup size={72} />
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: biTokens.inkSoft, marginTop: 28,
        }}>Unit lockup · 1 ccm = 1 tCO₂e</div>
      </div>
      <div style={{
        background: '#fff', border: `1px solid ${biTokens.rule}`,
        padding: 40, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', minHeight: 200,
      }}>
        <Wordmark size={72} />
        <div style={{ marginTop: 16 }}><URLLockup size={13} /></div>
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: biTokens.inkSoft, marginTop: 18,
        }}>URL lockup · footers, cards</div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
      <div style={{
        background: '#fff', border: `1px solid ${biTokens.rule}`,
        padding: 32, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', minHeight: 220,
      }}>
        <MeasureMark size={140} />
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: biTokens.inkSoft, marginTop: 24,
        }}>Unit dial · stamps & seals</div>
      </div>
      <div style={{
        background: biTokens.ink, padding: 32, display: 'flex',
        flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 220, color: biTokens.paper,
      }}>
        <Wordmark size={96} color={biTokens.paper} />
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: biTokens.paperDeep, marginTop: 32,
        }}>Reverse · dark surfaces</div>
      </div>
      <div style={{
        background: '#fff', border: `1px solid ${biTokens.rule}`,
        padding: 32, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', minHeight: 220,
      }}>
        <StackMark size={120} />
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: biTokens.inkSoft, marginTop: 24,
        }}>App icon · stacked strata</div>
      </div>
    </div>

    {/* Construction grid */}
    <div style={{ marginTop: 48, background: '#fff',
      border: `1px solid ${biTokens.rule}`, padding: 48 }}>
      <div style={{
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: biTokens.moss, marginBottom: 24,
      }}>Construction · 1c x-height grid</div>
      <svg width="800" height="200" viewBox="0 0 800 200">
        {/* baseline grid */}
        {[0, 40, 80, 120, 160, 200].map(y => (
          <line key={y} x1="0" y1={y} x2="800" y2={y}
            stroke={biTokens.rule} strokeWidth="0.5" strokeDasharray="2 4" />
        ))}
        {/* x-height markers */}
        <text x="0" y="50" fontFamily="IBM Plex Mono" fontSize="9"
          fill={biTokens.moss}>cap</text>
        <text x="0" y="135" fontFamily="IBM Plex Mono" fontSize="9"
          fill={biTokens.moss}>baseline</text>
        <text x="40" y="125" fontFamily="Fraunces" fontSize="120"
          fontWeight="300" fill={biTokens.ink} letterSpacing="-4"
          style={{ fontVariationSettings: '"opsz" 144' }}>ccm</text>
        {/* x measurement */}
        <line x1="40" y1="160" x2="98" y2="160" stroke={biTokens.clay} strokeWidth="1" />
        <text x="50" y="178" fontFamily="IBM Plex Mono" fontSize="9"
          fill={biTokens.clay}>1c</text>
      </svg>
    </div>

    {/* Misuse */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 24 }}>
      {[
        { label: 'Don\'t stretch', ok: false, sx: { transform: 'scaleX(1.4)' } },
        { label: 'Don\'t recolor', ok: false, color: '#a04ce0' },
        { label: 'Don\'t italicize', ok: false, italic: true },
      ].map((m, i) => (
        <div key={i} style={{
          background: '#fff', border: `1px solid ${biTokens.rule}`,
          padding: '32px 24px', position: 'relative',
        }}>
          <div style={{
            transform: m.sx?.transform, fontFamily: 'Fraunces',
            fontWeight: 300, fontSize: 40, color: m.color || biTokens.ink,
            fontStyle: m.italic ? 'italic' : 'normal', letterSpacing: -1,
          }}>ccm</div>
          <div style={{
            position: 'absolute', top: 12, right: 16,
            color: '#c14d3a', fontSize: 18,
          }}>✕</div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 10,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: biTokens.inkSoft, marginTop: 24,
          }}>{m.label}</div>
        </div>
      ))}
    </div>
  </div>
);

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
      <Swatch name="Paper" hex="#f5f3ec" label="surface · 0" />
      <Swatch name="Paper deep" hex="#ebe8de" label="surface · 1" />
      <Swatch name="Rule" hex="#c9c5b8" label="border · hairline" />
      <Swatch name="Ink soft" hex="#3a3f3c" label="text · body" />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
      <Swatch name="Ink" hex="#0c0f10" label="text · display" dark />
      <Swatch name="Moss" hex="#2dbf63" label="accent · primary" dark />
      <Swatch name="Moss light" hex="#5fe089" label="accent · soft" />
      <Swatch name="Clay" hex="#c8602e" label="accent · data" />
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
          { g: 'A', hex: '#0c0f10', sub: 'DAC · mineralization' },
          { g: 'B', hex: '#2dbf63', sub: 'biochar · weathering' },
          { g: 'C', hex: '#5fe089', sub: 'reforestation' },
          { g: 'D', hex: '#c9c5b8', sub: 'REDD+ · legacy' },
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
