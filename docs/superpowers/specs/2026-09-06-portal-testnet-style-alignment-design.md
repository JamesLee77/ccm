# portal + testnet — style alignment with ccmnetwork.net

**Date:** 2026-09-06 · **Follows:** `2026-09-06-site-home-redesign-design.md`
**Owner decision:** testnet gets the full site treatment; portal changes fonts only.

## testnet (`testnet/`, testnet.ccmnetwork.net)

- Copies of `Section` (tone), `SectionLabel`, `Heading`, `ChapterRail`, `lib/scroll.ts`,
  `hooks/useReducedMotion.ts` from `frontend/` (no shared package; apps deploy independently).
- Page = six full-bleed chapters with the fixed rail: §01 hero (`vision`), §02 network (deep),
  §03 oracle, §04 yield (deep), §05 activity, §06 playground (deep). Existing panels are reused
  unchanged inside the chapters; the 880px `.r-content` container is gone.
- `Nav` rebuilt on the SiteNav anatomy: sticky + blur, wordmark + clay "CCM TESTNET / BASE SEPOLIA"
  tagline, five mono in-page links, `ccmnetwork.net ↗` CTA, price badge, theme toggle, hamburger
  drawer below md. `AnchorNav` deleted. Orange testnet banner stays under the header.
- `RainbowKitThemed` (moss accent, no radius, follows the page theme) replaces the default
  RainbowKit provider.
- Hero: site `Heading` h1 (capped at 104px for the four-word headline), Inter lead, two CTAs
  (playground anchor, protocol page), instrument panel with display-font readouts.
- Big readouts (network state, oracle prices, yield rate) switch from inline JetBrains Mono to
  Space Grotesk 500; labels stay mono. Pulse dots stay: every number is on-chain.
- Footer: site layout — wordmark + three contract columns (core / oracles / dex, short addresses
  linking to Basescan) + cross-links.
- CSS: Inter imports, `--font-body`, body Inter with h1–h3/`.font-display` on Space Grotesk,
  `--band-deep`, ≥1280px 104px gutter (`main > section`, header inner, footer), vertical rail
  labels, hero min-height, mobile section paddings.
- i18n: `nav.site`, `hero.ctaPlay`, `hero.ctaProtocol`, `chapters.*` (label / pre / em / lead).

## portal (`portal/`, portal.ccmnetwork.net)

- `--font-body` → Inter; body font-family Inter; h1–h3 and `.font-display` stay Space Grotesk.
  Nothing else: nav, cards, RainbowKit theming and footer already match the site.

## Verification

FINAL_INTEGRATION per package: `npm run typecheck` + `npm run build` in `testnet/` and `portal/`,
then `/browse` screenshots of testnet (hero, §02, §03, §06, footer, mobile) and portal home.
Deploy both to Cloudflare Pages (`ccm-testnet`, `ccm-portal`, account `e824…`).
