# ccmnetwork.net Home Redesign — Design Spec

**Date:** 2026-09-06
**Scope:** `frontend/` only (Cloudflare Pages project `ccm-site`, live at ccmnetwork.net)
**Status:** Approved in brainstorming; awaiting owner review of this document

## 1. Goal

Turn the home page from a 15-section, ~41,500px long-scroll specification into an
8-chapter overview of roughly 9–10k px, with one signature visual per chapter and a
"Go deeper" link into full detail pages. Keep the existing brand (dark default, warm
paper light theme, moss accent, hairline cards) and reuse the existing section and
widget components; the work is re-composition, not a rewrite.

Decisions taken during brainstorming (owner answers, 2026-09-06):

| Question | Decision |
|---|---|
| Scope | Home page of ccmnetwork.net only. Portal / testnet / admin untouched. |
| Home structure | Compress home; move full sections to sub-pages. |
| Typography | Body copy switches to a sans-serif (Inter). Display stays Space Grotesk. Mono only for labels, numbers, captions, code. |
| "LIVE" widgets | Replace simulated numbers with real Base Sepolia testnet values where a chain analogue exists, labelled TESTNET. Everything else loses the live pulse and is labelled `MODEL · ILLUSTRATIVE`. |
| Approach | A: re-compose existing sections + rhythm system, pushed further into "one signature visual per chapter". |
| Site is pre-launch | Bolder structural changes are allowed; no obligation to preserve current URLs beyond cheap redirects. |

## 2. Current state (baseline, captured 2026-09-06)

- Home = `pages/Earth.tsx` rendering 15 `sections/earth/*` sections in order:
  vision, market, trinity, problem, wrap, grades, arch, mining, tokenomics, scenarios,
  defi, vs, roadmap, risks, manifesto. Measured height 41,574px at 1440px wide.
- Nav: CCMINE · TOKENOMICS · ROADMAP (in-page anchors) · DEFI · WHITEPAPER + "Try testnet ↗".
- Every section follows the same pattern (mono label → big heading → bordered card
  grids). No background rhythm between sections. No in-page progress indicator
  (`AnchorNav.tsx` exists but is not rendered).
- `--font-body` is JetBrains Mono, so long paragraphs are monospaced.
- Ten widgets show a pulsing "live" dot with ticking, hard-coded numbers
  (`NetworkSnapshot`, `VaultLedger`, `LiveMetrics`, `CostsLive`, `GradePriceLive`,
  `MarketLive`, `AdoptionLive`, `TVLLive`, `ValueAccrualLive`, `InsuranceLedger`,
  `LiveProgress`, `CommunityLive`). None reads a chain.
- Mobile: hero `AtmosphericTimeline` axis labels render below legible size.
- Mobile CSS overrides in `index.css` key off `section[id]` and inline
  `grid-template-columns` strings; they must keep working on sub-pages.

## 3. Information architecture

### 3.1 Home (`pages/Home.tsx`, replaces `Earth.tsx`)

Eight chapters. Each chapter is one `<section id>` rendered through a new `Chapter`
component: `§ 0N · label` index, display heading, one lead paragraph, exactly one
signature visual, and (except 01 and 08) a "Go deeper →" link.

| § | `id` | Tone | Signature visual (existing component) | Deeper link |
|---|---|---|---|---|
| 01 | `vision` | paper | Full-viewport hero: h1 "measure / the air.", lead, two CTAs (Read the whitepaper → `/whitepaper`, Try testnet ↗ external), right-hand instrument panel (NOAA ppm readout + testnet cumulative readout) | — |
| 02 | `problem` | inverted | Four-failure grid (the inverted block already inside `Problem.tsx`, extracted to `problem/FailureGrid.tsx`) | `/market` |
| 03 | `trinity` | paper | Three Network / Unit / Token cards (extracted from `Trinity.tsx` to `trinity/TrinityCards.tsx`) | `/protocol` |
| 04 | `wrap` | deep | Wrap Studio slider (extracted from `WrapSim.tsx` to `wrap/WrapStudio.tsx`) + `VaultLedger` (testnet-backed) | `/protocol#wrap` |
| 05 | `grades` | paper | Grade table A–D, desktop + mobile variants (extracted from `Grades.tsx` to `grades/GradeTable.tsx`) | `/protocol#grades` |
| 06 | `tokenomics` | deep | `AllocationRing` + hover-synced allocation table (extracted from `Tokenomics.tsx` to `tokenomics/AllocationPanel.tsx`) | `/token` |
| 07 | `roadmap` | paper | `PhaseTrack` + `PhaseDetail` (already exported) | `/roadmap` |
| 08 | `manifesto` | inverted | Closing statement + `PathwayCards` + `DocumentsLibrary` + `ContactPanel` | — |

Extraction rule: the four "extracted" widgets are moved out of their section file into
their own file with no behavioural change; the original section file then imports the
new file. This lets home and the sub-page render the same component without
duplication.

Removed from the site entirely: `NetworkSnapshot` (hero readout replaces it),
`CommunityLive` (fabricated community metrics), the home `Defi` section
(`/defi` already carries the full content; `sections/earth/Defi.tsx` and its
`defi/` folder are deleted after confirming `/defi` does not import them).

### 3.2 Sub-pages (new routes, full existing sections, unchanged)

Each sub-page uses the shared `Layout`, opens with `PageHero` (already in
`PageSection.tsx`), renders the existing full sections in order, and shows the chapter
rail.

| Route | Page file | Sections (existing components) |
|---|---|---|
| `/market` | `pages/Market.tsx` | new `MarketContext` wrapper (AtmosphericTimeline + WhyNow), `Market`, `Problem`, `Vs` |
| `/protocol` | `pages/Protocol.tsx` | `Trinity`, `WrapSim`, `Grades`, `Architecture`, `Mining`, `Risks` |
| `/token` | `pages/Token.tsx` | `Tokenomics`, `Scenarios` |
| `/roadmap` | `pages/RoadmapPage.tsx` | `Roadmap` |
| `/defi` | unchanged | unchanged |
| `/whitepaper`, `/terms`, `/privacy`, `/disclaimer` | unchanged | unchanged |

Section `id`s are unique per page, so `#wrap`, `#grades`, `#mining` deep links work
via the existing `useScrollToHash`. Home and `/protocol` both contain `#wrap`,
`#grades`, `#trinity`; that is fine because they are different documents.

### 3.3 Navigation

- Top nav: `MARKET · PROTOCOL · TOKEN · DEFI · WHITEPAPER` + `Try testnet ↗`. All five
  are real routes (`NavLink` with active state); the `anchor` flag in `SiteNav` goes
  away.
- Redirects in `App.tsx`: `/ccmine → /protocol#mining`, `/tokenomics → /token`.
  `/roadmap` becomes a real page. `/markets → testnet` external redirect stays.
- Footer "network" column: Overview `/`, Market `/market`, Protocol `/protocol`,
  Token `/token`, DeFi `/defi`, Roadmap `/roadmap`.
- i18n `nav` namespace gains `market`, `protocol`, `token`; `ccmine`/`roadmap` keys
  are dropped from nav (footer uses literals today and keeps doing so).

### 3.4 Chapter rail

New `components/site/ChapterRail.tsx`, replacing `AnchorNav.tsx` (deleted).

- Props: `items: { id: string; label: string }[]`.
- Fixed to the left edge, vertically centred, visible only at `≥ 1280px`
  (`hidden xl:flex`). Below that breakpoint nothing renders; scrolling alone is
  sufficient on tablet and phone.
- Each item: two-digit numeral in mono; the active item also shows its label. Active
  state tracked with the `IntersectionObserver` logic lifted from `AnchorNav`
  (`rootMargin: "-30% 0px -55% 0px"`).
- Click scrolls to the section using the header-offset logic already in
  `Layout.useScrollToHash` (extracted into `lib/scroll.ts` so both can call it).
- Used by `Home` (8 items) and the four sub-pages (their section ids).
- `aria-label="Chapters"`. Respects `prefers-reduced-motion` (instant scroll).

## 4. Visual system

### 4.1 Typography

- Add `@fontsource/inter` weights 400, 500, 600. `--font-body` becomes
  `"Inter", system-ui, sans-serif`. `--font-display` / `--font-ui` stay Space Grotesk;
  `--font-mono` stays JetBrains Mono.
- Body scale: chapter lead 20px / 1.5 (22px in the hero); card body 16px / 1.55;
  table notes 14px. These are the sizes already used inline, so the change is the
  family, not per-component sizes.
- The `.italic-moss` accent stays (moss + weight 600, upright).
- Anything currently `font-body italic` (a handful of captions) is switched to
  `font-mono` so italics are not rendered in Inter.

### 4.2 Section tone

`components/site/Section.tsx` gains `tone?: "paper" | "deep" | "inverted"`
(default `paper`). `inverted` replaces the existing boolean `inverted` prop; callers
are updated. `deep` sets `background: var(--paper-deep)`. `Chapter` forwards `tone`.
Home sequence: paper → inverted → paper → deep → paper → deep → paper → inverted.

Cards inside a `deep` section use `var(--paper)` as their panel background so they
still contrast with the band (the widgets already accept the ambient variables; where
a widget hard-codes `var(--paper-deep)`, `Chapter` sets a CSS custom property
`--panel` that those four extracted widgets read instead).

### 4.3 Spacing and headers

- Section padding 120px → 96px vertical on desktop (mobile overrides unchanged).
- Hero: meta label to headline gap 80px → 40px; hero `min-height: calc(100svh - 65px)`
  on desktop so the first screen is the whole chapter; the three sub-widgets below the
  hero are gone.
- Every chapter and sub-page section shows `§ 0N · LABEL` via `SectionLabel`'s
  existing `index` prop.

### 4.4 Mobile

- `AtmosphericTimeline` (now on `/market`): below 640px render only the first and
  last x-axis labels and the peak value label, at a minimum of 10px.
- Hero instrument panel stacks under the headline (existing `md:` grid rule).
- Chapter "Go deeper →" links are full-width buttons below 640px.

## 5. Data — testnet readouts

### 5.1 `lib/testnet.ts` (new)

Ported from `testnet/src/lib/onchain.ts` and `testnet/src/lib/contracts.ts`, kept as a
copy because the two apps are deployed independently and share no package. Contents:

- `publicClient`: viem `createPublicClient({ chain: baseSepolia, transport: http(VITE_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org") })`.
- `SANDBOX` addresses (token, NFT, vault, staking, nodeRegistry) and the minimal
  read ABIs (`totalSupply`, `totalWrapped`, `count`, `totalStaked`, `poolRemaining`).
- `usePolling(fn, intervalMs)` as in testnet, plus: polling pauses while
  `document.visibilityState === "hidden"` and resumes on `visibilitychange`.
- `useTestnetSnapshot()`: one `multicall` every 15s returning
  `{ ccmSupply, vaultTonnage, nodeCount, totalStaked, poolRemaining }` as bigints.
  A single hook feeds every widget so the site issues one RPC batch per interval.
- `useRecentMints()`: `getLogs` of `TransferSingle` from zero on the NFT over the last
  2000 blocks (RPC cap), every 30s. Returns event count. Only `/protocol` mounts it.

Values are formatted with the existing `Intl` helpers: 18-decimal token amounts to
whole CCM, tonnage as an integer.

### 5.2 Widget policy

| Widget | New behaviour |
|---|---|
| Hero instrument panel | Upper half unchanged (NOAA ppm, static caption). Lower half label `CCM NETWORK · TESTNET · BASE SEPOLIA`; cells: CCM minted = `ccmSupply`, CCM in vault = `vaultTonnage`. |
| `VaultLedger` (home §04 and `/protocol`) | Label `TESTNET · VAULT`. Cells: NFT tonnage locked = `vaultTonnage`, $CCM circulating = `ccmSupply`, lockup ratio = vault / supply (or `—` when supply is 0), Active nodes = `nodeCount`. Ticking animation removed. |
| `LiveMetrics` (`/protocol` Mining) | Label `TESTNET · NETWORK`. Cells: registered nodes, CCM staked, pool remaining, mints in last ~1h (`useRecentMints`). |
| `CostsLive`, `GradePriceLive`, `MarketLive`, `AdoptionLive`, `TVLLive`, `ValueAccrualLive`, `InsuranceLedger`, `LiveProgress` | Pulse dot, `ns-pulse` keyframes and random tick timers removed. Label prefix changes from `live ·` to `model · illustrative ·`. Values stay (they are model outputs, and the copy already frames them as projections). |
| `NetworkSnapshot`, `CommunityLive` | Deleted. |

### 5.3 States

- Loading: numeric cells show `—`; no skeleton animation.
- RPC error: keep the last successful value if there is one, otherwise `—`, and show a
  mono caption `rpc unreachable` under the label. Never substitute a fabricated number.
- A widget never throws; the hook returns `{ data, isLoading, error }` and the widget
  branches on it. No error boundary is needed.
- `_headers` CSP already allows `connect-src https:`; no change.

## 6. Files

New: `pages/Home.tsx`, `pages/Market.tsx`, `pages/Protocol.tsx`, `pages/Token.tsx`,
`pages/RoadmapPage.tsx`, `components/site/Chapter.tsx`,
`components/site/ChapterRail.tsx`, `lib/testnet.ts`, `lib/scroll.ts`,
`sections/earth/problem/FailureGrid.tsx`, `sections/earth/trinity/TrinityCards.tsx`,
`sections/earth/wrap/WrapStudio.tsx`, `sections/earth/grades/GradeTable.tsx`,
`sections/earth/tokenomics/AllocationPanel.tsx`, `sections/earth/market/MarketContext.tsx`,
`e2e/site.mjs`.

Modified: `App.tsx`, `index.css` (font import, `--font-body`, padding), `package.json`
(`@fontsource/inter`, `test:e2e` script), `components/site/Section.tsx`,
`SectionLabel` callers, `SiteNav.tsx`, `SiteFooter.tsx`, `Layout.tsx`,
`Hero.tsx` (becomes the §01 chapter body), `Problem.tsx`, `Trinity.tsx`,
`WrapSim.tsx`, `Grades.tsx`, `Tokenomics.tsx` (import the extracted widgets),
`VaultLedger.tsx`, `LiveMetrics.tsx`, the eight relabelled model widgets,
`hero/AtmosphericTimeline.tsx` (mobile labels), `locales/en.json`.

Deleted: `pages/Earth.tsx`, `components/site/AnchorNav.tsx`,
`sections/earth/hero/NetworkSnapshot.tsx`, `sections/earth/manifesto/CommunityLive.tsx`,
`sections/earth/Defi.tsx` + `sections/earth/defi/*`, `e2e/earth.mjs`.

## 7. Testing and verification

Per the module-first policy: no broad runs during generation; focused RED→GREEN only
for confirmed review defects; one designated FINAL_INTEGRATION pass at the end.

FINAL_INTEGRATION (once): `npm run typecheck`, `npm run build`, `node e2e/site.mjs`
against the Vite dev server, and `/browse` screenshots of home (desktop 1440 and
mobile 390, top and two mid-scroll positions) plus each sub-page top.

`e2e/site.mjs` (rewrite of `earth.mjs`, same Playwright harness) asserts:

1. Home: HTTP 200, title, the eight chapter ids in order, home height under 12,000px
   at 1440×900, chapter rail has 8 items and is visible at 1440 and hidden at 1024.
2. Nav: five links with the expected hrefs; each sub-page returns 200 and renders an
   `h1`; `/ccmine` lands on `/protocol` with `#mining`; `/tokenomics` lands on `/token`.
3. Theme toggle flips and persists across reload (kept from `earth.mjs`).
4. Wrap slider changes both readouts (kept).
5. Hero readout cells are either `—` or a digit string, never the old literal
   `1,284,003`; no element on the home page contains the text `live ·`.
6. Reduced-motion: no `ns-pulse` class anywhere.

## 8. Out of scope

Portal, testnet, admin apps; the `/defi` and `/whitepaper` pages; a shared workspace
package for chain hooks; NOAA live feed; light-theme palette changes; copy rewrites
beyond labels and the new page headers.
