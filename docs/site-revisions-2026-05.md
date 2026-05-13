# CCM Network site revisions — 2026 May

Working log of revisions to the marketing/spec site at **ccmnetwork.net**.
Project (Cloudflare Pages): `ccm-site` (not `ccmnetwork`).

This document records what was changed, why, and what remains as
placeholder pending the official ccmnetwork email / GitHub setup.

---

## 1. Top navigation — final state

```
[ccm | CARBON CREDIT / MEASUREMENT]   CCMine · Tokenomics · Roadmap · DeFi · Whitepaper   [Open App ↗]   [theme]
```

- 5 menu items + outlined CTA + theme toggle, header height 65px desktop / 69px mobile.
- **Anchor links** (in-page scroll on home): `CCMine → /#mining`, `Tokenomics → /#tokenomics`, `Roadmap → /#roadmap`.
- **Dedicated routes**: `DeFi → /defi`, `Whitepaper → /whitepaper`.
- **CTA**: `Open App ↗ → /markets` rendered as outlined moss button (desktop) / full-width pill (mobile drawer bottom).
- **Order rationale**: home-section anchors first (Mining/Tokenomics/Roadmap match home section order), dedicated pages last (DeFi/Whitepaper).
- Group separation makes it visually clear that the last two are standalone documents while the first three are in-page anchors.

### Cross-page anchor scroll
`components/site/Layout.tsx` adds `useScrollToHash()` — on every route change and hash change, scrolls the matching `#id` element to just below the sticky header (header height + 8px offset). Retries up to 20 × 50ms because some home sections mount async.

### Legacy redirects (App.tsx)
The old stub routes `/ccmine`, `/tokenomics`, `/roadmap` now `<Navigate replace>` to `/#mining`, `/#tokenomics`, `/#roadmap` respectively. Their stub page files have been deleted.

---

## 2. `/whitepaper` page — full rebuild

Located at `frontend/src/pages/Whitepaper.tsx`.

Previous state was a `PageHero` stub (headline + lead only). Now it is a real document:

### Structure
- Document header (title, abstract, version metadata).
- Sticky TOC on the left (md+); stacks above content on mobile. Active section highlighted via IntersectionObserver scroll-spy.
- 10 numbered sections (`§1 The unit` → `§10 Risks`).
- References section (8 sources).

### Diagrams (7 inline SVG figures, all use `stroke=currentColor` so they auto-flip with theme)
| Figure | Section | Concept |
|---|---|---|
| 1.1 — Trinity | §1 | Network / Unit / Token relationship |
| 3.1 — Wrap | §3 | NFT ⇄ Vault ⇄ $CCM, FIFR |
| 5.1 — 8-layer stack | §5 | L1 Standard → L8 Application |
| 6.1 — Issuance flow | §6 | 5-step PoCR pipeline |
| 7.1 — Allocation chart | §7 | 40/18/10/9/8/5/5/5 horizontal bar |
| 8.1 — Primitives grid | §8 | §7.2–§7.9 compact summary |
| 9.1 — Phase timeline | §9 | P0 shipped → P5 Article 6 |

### Tables (all wrapped in `overflow-x-auto` for mobile horizontal scroll)
| Table | Columns |
|---|---|
| Grading | Grade · Category · Permanence · VVB |
| Allocation | Category · % · Tokens · Notes |
| Risks | Domain · Risk · Mitigation |

### Body
44 total paragraphs (was ~22). Per-section depth raised from 2-3 to 4-6 paragraphs, with concrete technical detail: invariant equation (`totalSupply($CCM) ≤ Σ vault.NFTs.tonnes`), IPCC AR6 half-life thresholds, 19 contract modules, 5-step PoCR mining flow, 5 utility paths as numbered list, 6 risk domains with mitigations, Insurance Vault as the "phantom credit" structural answer.

### References
8 sources, including Guardian/SourceMaterial 2023 Verra investigation and Chainlink TWAP spec (added during enrichment).

---

## 3. `/defi` page — visual rebuild

Located at `frontend/src/pages/Defi.tsx`. Dark-only via `<ThemeProvider force="dark">`.

### Sections
1. PageHero — title + lead + SignalPlot (right column hidden on mobile).
2. **Eight primitives grid** — 8 cards (`auto-fit minmax(260px, 1fr)`).
3. **Worked strategies** — 3 cards with vertical step flow.
4. **External protocols** — 6-cell grid (Uniswap, Curve, Aave, Pendle, OpenSea, Sudoswap).
5. **Status** — 4 forward-looking metric tiles (TVL target, grade pairs, LTV range, insurance seed).
6. CTA — `Read whitepaper §8 →` + `Open App ↗`.

### SVG glyph system (21 SVGs total)
Each primitive card has a unique 22px line-art glyph in a 40px bordered box (top-left), with `§` number top-right.

| Primitive | Glyph |
|---|---|
| §7.2 Wrap/Unwrap | bidirectional arrows between two shapes |
| §7.3 Grade Wrappers | 4 stacked descending bars |
| §7.4 Vault Lending | safe with dial |
| §7.5 Fractionalization | 4-cell grid |
| §7.6 NFT Yield | coin + upward curve |
| §7.7 Retire-to-Earn | flame |
| §7.8 Insurance Vault | shield with check |
| §7.9 Index Baskets | basket with three dots |

### Strategy flow diagrams
Each of 3 strategies is now a 4-step vertical flow (replacing the previous numbered text list). Each step: 40×40 pictogram + display title + mono sublabel, connected by 1px hairline. Steps include their own glyphs (12 unique step pictograms across the 3 strategies).

---

## 4. Home page section changes

### Roadmap (`MilestoneList.tsx`)
- Added new milestone: **Exchange listing — 2026 Q3–Q4** under phase P1 (planned).
- Added `when` field to the `Milestone` type so every entry carries a year+quarter (e.g., `"2026 Q3–Q4"`).
- Mobile: switched from desktop 5-column grid to `md:hidden` stacked card layout. Each mobile card header shows `Pn · 2026 Q3–Q4` on left and state pill on right.

### Hero (`sections/earth/Hero.tsx`)
- Removed the `View on GitHub` outlined CTA. Hero now has a single primary CTA (`Read the whitepaper →`) on mobile and desktop.

### Manifesto (`sections/earth/Manifesto.tsx`)
- Removed the `GitHub repository` CTA.
- Changed `Read the whitepaper` from external GitHub PDF link to internal `<Link to="/whitepaper">`.

### Pathway cards (`sections/earth/manifesto/PathwayCards.tsx`)
- Whitepaper link → `/whitepaper`.
- Hardware reference removed.
- Standard repository → `mailto:foundation@ccmnetwork.net?subject=Standard%20repository`.

### Documents library (`sections/earth/manifesto/DocumentsLibrary.tsx`)
- Whitepaper now `WEB · /whitepaper · status: ready` (was external PDF).
- Investor deck, Standard spec, Audit reports, Press kit — all `href: "#"` with `status: "soon"`.

### Community live (`sections/earth/manifesto/CommunityLive.tsx`)
- "GitHub stars" metric removed.
- Grid contracted from 4-col to 3-col.

---

## 5. Footer (`SiteFooter.tsx`)

| Column | Items |
|---|---|
| (logo block) | wordmark, `ccm foundation`, `ccmnetwork.net`, `foundation@ccmnetwork.net` |
| Network | Overview · CCMine · Tokenomics · DeFi · Roadmap |
| Build | Whitepaper · Smart contracts · Audit reports |
| Foundation | About · VVB partners · Press kit · Contact |

- "Standard" renamed to "Overview" (wordmark serves as home label; footer column needs a labeled entry).
- DeFi added to Network column for sitemap redundancy (also reachable via top nav).
- GitHub link removed from Build column.

---

## 6. Mobile responsive fixes

### PageHero (`components/site/PageSection.tsx`)
- Grid was `gridTemplateColumns: right ? "1.4fr 1fr" : "1fr"` inline → now `md:grid-cols-[1.4fr_1fr]` (single col on mobile).
- H1 font-size lower bound was `clamp(72px, 9vw, 132px)` → now `clamp(44px, 9vw, 132px)`.
- `right` figure column hidden on mobile (`hidden md:flex`) so narrow viewports don't squeeze it.
- Added `min-w-0` and `overflowWrap: break-word` to prevent text overflow.

### Markets page (`pages/Markets.tsx`)
- Was `flex justify-between items-end` causing Connect Wallet button to overlap "Markets" h1 on mobile.
- Now `flex flex-col gap-6 md:flex-row md:justify-between md:items-end` — stacks vertically on mobile, side-by-side on desktop.
- H1 size: `64px` fixed → `clamp(44px, 7vw, 64px)`.

### Contact panel newsletter (`sections/earth/manifesto/ContactPanel.tsx`)
- Direct lines grid: `repeat(3, 1fr)` inline → `grid-cols-1 md:grid-cols-3`.
- Newsletter form grid: needed explicit `grid-cols-1 md:grid-cols-[1fr_1.6fr_auto]`. Without explicit `grid-cols-1`, mobile grid auto-sizes columns by content, causing the form (input + subscribe button) to extend 4px past viewport.
- Padding: fixed `32px 40px` / `24px 28px` → `p-6 md:p-10` / `p-6 md:p-7`.

### Result
All 4 routes × 2 themes verified at 375px viewport: `clip=0`, `docOverflow=false`.

---

## 7. GitHub removal

User decision: remove all GitHub references; the official ccmnetwork GitHub will be created later, then specific URLs filled in.

`grep -rn 'github' frontend/src` → **0 hits** confirmed across all source files (.tsx, .ts, .json).

### What was removed
| File | Item |
|---|---|
| `Hero.tsx` | "View on GitHub" CTA |
| `Manifesto.tsx` | "GitHub repository" CTA, GitHub PDF link |
| `manifesto/PathwayCards.tsx` | 3 github.com hrefs |
| `manifesto/DocumentsLibrary.tsx` | 3 github.com hrefs (whitepaper, deck, standard) |
| `manifesto/CommunityLive.tsx` | "GitHub stars" metric |
| `components/site/SiteFooter.tsx` | "GitHub ↗" link |
| `locales/en.json` | `viewGithub`, `hero.ctaGithub`, `manifesto.ctaGithub` |

---

## 8. Pending — awaits ccmnetwork email + GitHub setup

These placeholders need real values once the official infrastructure is set up.

### Mailto links (depend on actual mailbox routing)
| Location | Address used |
|---|---|
| `SiteFooter.tsx` (logo block display) | `foundation@ccmnetwork.net` |
| `manifesto/ContactPanel.tsx` direct lines | `ir@`, `press@`, `foundation@` `ccmnetwork.net` |
| `PathwayCards.tsx` 4 audience CTAs | `foundation@ccmnetwork.net` with subject params |

### `#` placeholders (depend on GitHub or PDF hosting)
| Location | Item |
|---|---|
| `SiteFooter.tsx` Build column | Smart contracts, Audit reports |
| `DocumentsLibrary.tsx` | Investor deck, Standard spec, Audit reports, Press kit |

### Other pending
- "Standard repository" in PathwayCards (currently mailto) — change to GitHub URL once available.
- Whitepaper PDF download link (current `/whitepaper` is the web doc; a downloadable PDF can be added if needed).

---

## 9. Other changes

### Wordmark animation (rolled back)
Earlier in this session, the CCM wordmark briefly had a "mining tick" animation (mask + scan sweep + m-pulse). User feedback: the scan line was unwanted. Reverted in commit; current wordmark is static (`components/brand/Wordmark.tsx`).

### Two-tier menu removed (Option A)
Previously, the home page had a sub-nav (`AnchorNav`) below the main header. User feedback: two-tier menu created content balance issues. Removed; `AnchorNav.tsx` left in place but no longer imported. Sticky overhead reduced from ~104px to 65/69px.

---

## 10. Verification snapshot (production)

### Mobile (375px)
| Route | Header H | clip | github | Notes |
|---|---|---|---|---|
| `/` light/dark | 69 | 0 | 0 | hero subscribe ok after grid-cols-1 fix |
| `/whitepaper` light/dark | 69 | 0 (body) | 0 | tables scroll horizontally inside wrapper |
| `/markets` dark | 69 | 0 | 0 | header stacks vertically |
| `/defi` dark | 69 | 0 | 0 | hero h1 wraps cleanly with new clamp |

### Desktop (1440px)
| Route | Header H | clip | github |
|---|---|---|---|
| `/` light/dark | 65 | 0 | 0 |
| `/whitepaper` light/dark | 65 | 0 | 0 |
| `/markets` dark | 65 | 0 | 0 |
| `/defi` dark | 65 | 0 | 0 |

### `/whitepaper` content metrics
- Figures: 7 (all SVG inline)
- Tables: 3 (Grading, Allocation, Risks)
- Paragraphs: 44
- Sections: 11 (10 § + References)
- TOC items: 11

### `/defi` content metrics
- Primitive cards: 8
- Strategy cards: 3 (with 4 step blocks each)
- External protocol cards: 6
- Status tiles: 4
- SVGs total: 21 (8 primitive glyphs + 12 step glyphs + 1 SignalPlot)

---

## 11. Build & deploy

```sh
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=ccm-site --commit-dirty=true
```

- Cloudflare Pages project: **`ccm-site`** (the project named `ccmnetwork` does not exist in this account; deploys to that name will fail with "Project not found.").
- Domain alias: `ccmnetwork.net` resolves to the `ccm-site` project.
- For local Playwright verification against production, use `--host-resolver-rules=MAP ccmnetwork.net 104.21.49.13` to bypass DNS caching and force the Cloudflare anycast IP.

---

## 12. Known design constraints

- **i18n is English-only**. The `nav` namespace and `earth.*` content are populated; `whitepaper` namespace uses only `h1Pre`/`h1Em`/`lead` (the body text is inline in the page component as English prose to avoid bloating the i18n file with multi-paragraph content).
- **Dark-only routes**: `/markets`, `/defi`. Each wraps in `<ThemeProvider force="dark">`. The theme toggle visually changes but `[data-theme="dark"]` is locked.
- **Whitepaper tables on mobile**: The 3 tables exceed 375px width (min-widths 540/600/640). They are inside `overflow-x-auto` wrappers so the page itself does not horizontally scroll; users scroll the table region itself.
