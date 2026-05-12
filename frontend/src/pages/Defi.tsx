import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import SignalPlot from "../components/brand/SignalPlot";
import ThemeProvider from "../components/site/ThemeProvider";
import SiteNav from "../components/site/SiteNav";
import SiteFooter from "../components/site/SiteFooter";
import { PageHero } from "../components/site/PageSection";

// ---------------------------------------------------------------------------
// Glyphs — 28×28, viewBox 32. stroke=currentColor so the parent's text color
// (moss accent) drives the icon hue.
// ---------------------------------------------------------------------------

type GlyphProps = { size?: number };

const G = {
  wrap: ({ size = 28 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={6} width={9} height={9} rx={1} />
      <circle cx={24.5} cy={22.5} r={4.5} />
      <path d="M13 9.5h11M24 9.5l-3-3M24 9.5l-3 3" />
      <path d="M19 22.5H8M8 22.5l3 3M8 22.5l3-3" />
    </svg>
  ),
  grade: ({ size = 28 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={4} y={5} width={24} height={4} rx={1} />
      <rect x={4} y={11} width={20} height={4} rx={1} />
      <rect x={4} y={17} width={14} height={4} rx={1} />
      <rect x={4} y={23} width={8} height={4} rx={1} />
    </svg>
  ),
  vault: ({ size = 28 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={4} y={6} width={24} height={20} rx={1.5} />
      <circle cx={20} cy={16} r={4} />
      <path d="M20 12v-1.5M20 21.5V20M16 16h-1.5M25.5 16H24" />
      <path d="M7 9v3M7 24v-3" />
    </svg>
  ),
  fraction: ({ size = 28 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={4} y={4} width={10} height={10} rx={1} />
      <rect x={18} y={4} width={10} height={10} rx={1} />
      <rect x={4} y={18} width={10} height={10} rx={1} />
      <rect x={18} y={18} width={10} height={10} rx={1} />
    </svg>
  ),
  yield: ({ size = 28 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 24c5 0 7-4 11-4s4 4 9 4" />
      <path d="M24 16l4-4-4-4" />
      <path d="M28 12h-7" />
      <circle cx={9} cy={8} r={2.4} />
    </svg>
  ),
  retire: ({ size = 28 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 27c-5 0-8-4-8-8 0-4 3-6 4-9 0 3 3 4 3 7 1-2 3-3 3-6 3 3 6 5 6 9 0 4-3 7-8 7z" />
      <circle cx={16} cy={20} r={2} />
    </svg>
  ),
  insurance: ({ size = 28 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4l10 4v8c0 6-4 10-10 12-6-2-10-6-10-12V8z" />
      <path d="M11 16l3.5 3.5L21 13" />
    </svg>
  ),
  index: ({ size = 28 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11h22l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
      <path d="M11 11l2-5h6l2 5" />
      <circle cx={12} cy={18} r={1.4} />
      <circle cx={16} cy={18} r={1.4} />
      <circle cx={20} cy={18} r={1.4} />
    </svg>
  ),
  // Strategy step pictograms
  hold: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={5} y={9} width={14} height={14} rx={1} />
      <rect x={9} y={5} width={14} height={14} rx={1} />
      <rect x={13} y={13} width={14} height={14} rx={1} />
    </svg>
  ),
  borrow: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={16} cy={16} r={9} />
      <path d="M14 11h5a2 2 0 010 4h-5v0a2 2 0 010 4h5" />
      <path d="M16 9v2M16 21v2" />
    </svg>
  ),
  deploy: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 24c4 0 6-4 10-8s8-8 12-8" />
      <path d="M27 8h-4M27 8v4" />
    </svg>
  ),
  repay: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M27 16a11 11 0 11-3.5-8" />
      <path d="M27 5v6h-6" />
    </svg>
  ),
  buy: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7h3l3 14h14l2-10H10" />
      <circle cx={13} cy={26} r={1.6} />
      <circle cx={23} cy={26} r={1.6} />
    </svg>
  ),
  unwrap: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={16} cy={16} r={9} />
      <path d="M16 7v18M11 12l-3 4 3 4M21 12l3 4-3 4" />
    </svg>
  ),
  rewrap: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={6} y={6} width={20} height={20} rx={2} />
      <path d="M11 11l10 10M21 11L11 21" />
    </svg>
  ),
  sell: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 24h22" />
      <path d="M9 22V14M14 22V8M19 22V12M24 22V16" />
      <path d="M5 7l4 4 5-7 5 5 4-3" />
    </svg>
  ),
  mandate: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={6} y={5} width={20} height={22} rx={1.5} />
      <path d="M11 12h10M11 17h10M11 22h6" />
    </svg>
  ),
  rebate: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={16} cy={16} r={10} />
      <path d="M11 12l10 10M11 22L21 12" />
      <path d="M21 6v3M27 11h-3" />
    </svg>
  ),
  stake: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={7} y={14} width={18} height={13} rx={1.5} />
      <path d="M11 14V9a5 5 0 0110 0v5" />
      <circle cx={16} cy={20} r={1.6} />
    </svg>
  ),
  govern: ({ size = 24 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={6} y={6} width={20} height={20} rx={1.5} />
      <path d="M11 17l3.5 3.5L22 13" />
    </svg>
  ),
};

type GlyphKey = keyof typeof G;

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

type Primitive = {
  num: string;
  glyph: GlyphKey;
  title: string;
  body: string;
  detail: string;
};

const PRIMITIVES: Primitive[] = [
  {
    num: "7.2",
    glyph: "wrap",
    title: "Wrap / Unwrap",
    body: "NFT ⇆ $CCM 1:1, FIFR self-correcting.",
    detail:
      "Source-of-truth NFTs convert to fungible $CCM via a non-custodial vault. First-In-First-Redeemed ensures unwrap delivers the lowest-grade NFTs first, so the floating pool quality never drifts.",
  },
  {
    num: "7.3",
    glyph: "grade",
    title: "Grade Wrappers",
    body: "$CCM-A / B / C / D — grade-specific price discovery.",
    detail:
      "Per-grade ERC-20 wrappers let buyers acquire exposure to a specific quality tier (DAC, biochar, reforestation, REDD+) without forcing a blended pool. Each wrapper has its own AMM pair.",
  },
  {
    num: "7.4",
    glyph: "vault",
    title: "Vault Lending",
    body: "NFT collateral for USDC. Grade-tiered LTV 30–70%.",
    detail:
      "Pledge a CCM-NFT, borrow USDC against it. LTV scales with grade — DAC tonnes get up to 70%, REDD+ tonnes capped at 30%. Liquidations run a Dutch auction over 24h.",
  },
  {
    num: "7.5",
    glyph: "fraction",
    title: "Fractionalization",
    body: "Split a 10K-tonne NFT into 10K fractionals.",
    detail:
      "Large industrial offsets become liquid. The original NFT locks in a vault and mints fractional ERC-20s; reassembly requires reacquiring the full set, preserving traceability.",
  },
  {
    num: "7.6",
    glyph: "yield",
    title: "NFT Yield",
    body: "Hold-to-Earn weighted by grade and vintage.",
    detail:
      "Stake an NFT and earn $CCM emission proportional to its grade weight (A=4×, B=2×, C=1×, D=0.5×) and vintage age. Capital-efficient ESG positioning without retirement.",
  },
  {
    num: "7.7",
    glyph: "retire",
    title: "Retire-to-Earn",
    body: "0–10% $CCM rebate on ESG retirement.",
    detail:
      "Permanent retirement burns the NFT and awards a $CCM rebate that scales with the corporate buyer's commitment cadence. Aligns long-term offset programs with token-economic incentives.",
  },
  {
    num: "7.8",
    glyph: "insurance",
    title: "Insurance Vault",
    body: "Auto-payout on VVB validation failure.",
    detail:
      "If a credit's underlying VVB consensus is later invalidated (fraud, methodology revision), the Insurance Vault pays out holders pro-rata. Funded by issuance fees and DeFi protocol revenue.",
  },
  {
    num: "7.9",
    glyph: "index",
    title: "Index Baskets",
    body: "$CCM-PRIME · $CCM-FOREST · $CCM-TECH.",
    detail:
      "Curated basket tokens — PRIME (top-grade weighted), FOREST (nature-based), TECH (engineered removal). Rebalanced on a timelock. The carbon-market analogue of an ETF.",
  },
];

type Step = { glyph: GlyphKey; title: string; sub: string };
type Strategy = {
  id: string;
  title: string;
  steps: Step[];
  output: string;
};

const STRATEGIES: Strategy[] = [
  {
    id: "carbon-loan",
    title: "Carbon-collateralized loan",
    steps: [
      { glyph: "hold", title: "100 CCM-A", sub: "DAC · vintage 2026" },
      { glyph: "borrow", title: "Pledge to Vault", sub: "→ 35K USDC at 70% LTV" },
      { glyph: "deploy", title: "Deploy USDC", sub: "delta-neutral yield" },
      { glyph: "repay", title: "Repay & reclaim", sub: "NFTs returned at maturity" },
    ],
    output: "Capital efficiency without retirement, ESG inventory intact.",
  },
  {
    id: "grade-arb",
    title: "Grade arbitrage",
    steps: [
      { glyph: "buy", title: "Buy 10K $CCM", sub: "blended · Uniswap" },
      { glyph: "unwrap", title: "Unwrap (FIFR)", sub: "delivers lowest-grade NFTs" },
      { glyph: "rewrap", title: "Re-wrap to $CCM-A", sub: "top-grade only" },
      { glyph: "sell", title: "Sell into $CCM-A AMM", sub: "captures grade premium" },
    ],
    output: "Captures the implicit grade premium when blended pools mis-price.",
  },
  {
    id: "retire-rebate",
    title: "Corporate retirement program",
    steps: [
      { glyph: "mandate", title: "50K tCO₂e/yr mandate", sub: "long-term retire" },
      { glyph: "rebate", title: "Retire-to-Earn", sub: "8% $CCM rebate accrues" },
      { glyph: "stake", title: "veCCM lock-and-vote", sub: "stake the rebate" },
      { glyph: "govern", title: "Governance + 50% fee discount", sub: "treasury yield" },
    ],
    output: "Compliance + treasury yield + governance, single instrument.",
  },
];

const PROTOCOLS = [
  { name: "Uniswap", role: "AMM · grade pairs" },
  { name: "Curve", role: "Stable carbon pools" },
  { name: "Aave", role: "Vault lending integration" },
  { name: "Pendle", role: "Yield tokenization" },
  { name: "OpenSea", role: "NFT secondary market" },
  { name: "Sudoswap", role: "NFT AMM · fractionals" },
];

const STATUS = [
  { metric: "TVL (target Y1)", value: "$50M" },
  { metric: "Grade pairs live (target)", value: "4" },
  { metric: "Vault LTV range", value: "30–70%" },
  { metric: "Insurance Vault seed", value: "5% of issuance fee" },
];

// ---------------------------------------------------------------------------
// Step block — pictogram + title + sublabel + connector line below.
// ---------------------------------------------------------------------------

function StepBlock({
  step,
  isLast,
}: {
  step: Step;
  isLast: boolean;
}) {
  const Glyph = G[step.glyph];
  return (
    <div className="relative" style={{ paddingLeft: 56, minHeight: 56 }}>
      <div
        className="text-moss"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 40,
          height: 40,
          border: "1px solid var(--rule)",
          background: "var(--paper)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-hidden
      >
        <Glyph size={22} />
      </div>
      {!isLast ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 19.5,
            top: 40,
            bottom: -16,
            width: 1,
            background: "var(--rule)",
          }}
        />
      ) : null}
      <div
        className="font-display text-ink"
        style={{
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "-0.005em",
          lineHeight: 1.25,
        }}
      >
        {step.title}
      </div>
      <div
        className="font-mono text-ink-soft mt-1"
        style={{ fontSize: 11, lineHeight: 1.45, letterSpacing: "0.02em" }}
      >
        {step.sub}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function DefiContent() {
  const { t } = useTranslation("defi");
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <SiteNav />
      <main className="flex-1">
        <PageHero
          pre={t("h1Pre")}
          em={t("h1Em")}
          lead={t("lead")}
          right={<SignalPlot w={520} h={140} />}
        />

        {/* Eight primitives grid */}
        <section
          className="border-t border-rule px-6 py-20 md:px-14 md:py-24"
        >
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-10">
            Eight primitives · composable from day one
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 1,
              background: "var(--rule)",
              border: "1px solid var(--rule)",
            }}
          >
            {PRIMITIVES.map((p) => {
              const Glyph = G[p.glyph];
              return (
                <article
                  key={p.num}
                  className="transition-colors hover:bg-paper"
                  style={{
                    background: "var(--paper-deep)",
                    padding: "32px 28px",
                    minHeight: 280,
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="text-moss"
                      style={{
                        width: 40,
                        height: 40,
                        border: "1px solid var(--rule)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-hidden
                    >
                      <Glyph size={22} />
                    </div>
                    <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-moss">
                      §&nbsp;{p.num}
                    </div>
                  </div>
                  <h3
                    className="font-display text-ink mb-3"
                    style={{
                      fontSize: 22,
                      fontWeight: 400,
                      letterSpacing: "-0.015em",
                      lineHeight: 1.15,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="font-body text-ink mb-4"
                    style={{ fontSize: 14, lineHeight: 1.45 }}
                  >
                    {p.body}
                  </p>
                  <p
                    className="font-body text-ink-soft"
                    style={{ fontSize: 13, lineHeight: 1.55 }}
                  >
                    {p.detail}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Example strategies — flow diagrams */}
        <section
          className="border-t border-rule px-6 py-20 md:px-14 md:py-24"
        >
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-6">
            Example strategies
          </div>
          <h2
            className="font-display"
            style={{
              fontWeight: 300,
              fontSize: "clamp(32px, 5vw, 60px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              margin: 0,
              maxWidth: 760,
            }}
          >
            Worked examples,{" "}
            <em className="italic-moss">not theoretical primitives.</em>
          </h2>
          <div
            className="grid mt-12"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {STRATEGIES.map((s) => (
              <div
                key={s.id}
                style={{
                  border: "1px solid var(--rule)",
                  background: "var(--paper-deep)",
                  padding: "28px 26px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3
                  className="font-display text-ink mb-7"
                  style={{
                    fontSize: 19,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {s.title}
                </h3>
                <div className="grid gap-7" style={{ marginBottom: 20 }}>
                  {s.steps.map((step, i) => (
                    <StepBlock
                      key={i}
                      step={step}
                      isLast={i === s.steps.length - 1}
                    />
                  ))}
                </div>
                <div
                  className="mt-auto"
                  style={{ paddingTop: 16, borderTop: "1px solid var(--rule)" }}
                >
                  <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-moss mb-2">
                    outcome
                  </div>
                  <p
                    className="font-body text-ink"
                    style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}
                  >
                    {s.output}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* External protocols */}
        <section
          className="border-t border-rule px-6 py-20 md:px-14 md:py-24"
        >
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-6">
            External protocols
          </div>
          <h2
            className="font-display"
            style={{
              fontWeight: 300,
              fontSize: "clamp(32px, 5vw, 60px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              margin: 0,
              maxWidth: 760,
            }}
          >
            Standard ERC-20 / ERC-1155.{" "}
            <em className="italic-moss">No proprietary interfaces.</em>
          </h2>
          <div
            className="grid mt-12"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 1,
              background: "var(--rule)",
              border: "1px solid var(--rule)",
            }}
          >
            {PROTOCOLS.map((p) => (
              <div
                key={p.name}
                style={{
                  background: "var(--paper-deep)",
                  padding: "24px 24px",
                }}
              >
                <div
                  className="font-display text-ink"
                  style={{
                    fontSize: 22,
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {p.name}
                </div>
                <div
                  className="font-mono text-ink-soft mt-2"
                  style={{ fontSize: 12, letterSpacing: "0.04em" }}
                >
                  {p.role}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Status / live numbers */}
        <section
          className="border-t border-rule px-6 py-20 md:px-14 md:py-24"
        >
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-10">
            Status · forward-looking targets
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 1,
              background: "var(--rule)",
              border: "1px solid var(--rule)",
            }}
          >
            {STATUS.map((s) => (
              <div
                key={s.metric}
                style={{
                  background: "var(--paper-deep)",
                  padding: "32px 28px",
                }}
              >
                <div
                  className="font-mono text-ink-soft"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {s.metric}
                </div>
                <div
                  className="font-display text-ink mt-3"
                  style={{
                    fontSize: 36,
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          className="border-t border-rule px-6 py-20 md:px-14 md:py-24"
        >
          <h2
            className="font-display"
            style={{
              fontWeight: 300,
              fontSize: "clamp(28px, 4.5vw, 56px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              margin: 0,
              maxWidth: 760,
            }}
          >
            Plug in.{" "}
            <em className="italic-moss">From day one.</em>
          </h2>
          <div className="flex flex-wrap gap-4 mt-10">
            <Link
              to="/whitepaper#defi"
              className="font-mono text-[12px] tracking-[0.14em] uppercase border border-moss text-moss hover:bg-moss hover:text-paper transition-colors"
              style={{ padding: "12px 20px" }}
            >
              Read whitepaper §8 →
            </Link>
            <a
              href="https://testnet.ccmnetwork.net"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[12px] tracking-[0.14em] uppercase border border-rule text-ink-soft hover:text-ink transition-colors"
              style={{ padding: "12px 20px" }}
            >
              Try testnet ↗
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

/**
 * /defi — DeFi-native landing. Dark-only by design (per handoff Markets/DeFi
 * pages). Wraps in ThemeProvider with force="dark" so the theme toggle is
 * disabled and the [data-theme] attribute is locked.
 */
export default function Defi() {
  return (
    <ThemeProvider force="dark">
      <DefiContent />
    </ThemeProvider>
  );
}
