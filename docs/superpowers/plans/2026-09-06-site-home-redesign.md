# ccmnetwork.net Home Redesign — Implementation Plan

Spec: `docs/superpowers/specs/2026-09-06-site-home-redesign-design.md`
Workflow: module-first (MODULE_GENERATION → REVIEW_FIX per module → one FINAL_INTEGRATION).
Working dir: `frontend/`. Branch: `main` (repo has no branch protection; commits end `[skip ci]`).

## Module tasks (MODULE_GENERATION)

### M1 — Layout foundation
- `components/site/Section.tsx`: replace `inverted` boolean with `tone: "paper" | "deep" | "inverted"`; padding 96px/56px.
- `components/site/Chapter.tsx`: `{ id, index, label, tone, heading: {pre, em}, lead, deeper?: {to, label}, children }` → renders `<Section id tone>` with `SectionLabel index`, `Heading`, lead `<p>`, children, deeper link.
- `lib/scroll.ts`: `scrollToId(id, behavior)` with header offset (lifted from `Layout.useScrollToHash`); `Layout` calls it.
- `components/site/ChapterRail.tsx`: fixed left rail, `hidden xl:flex`, IntersectionObserver active tracking (from `AnchorNav`), click → `scrollToId`.
- `index.css`: import `@fontsource/inter` 400/500/600; `--font-body: "Inter"`; section padding rule; `.chapter-deeper` mobile full-width rule.
- `package.json`: add `@fontsource/inter`.
- `locales/en.json`: `nav.market/protocol/token`, `home.*` chapter copy (lead paragraphs + deeper labels), page hero copy for the four sub-pages.

### M2 — Testnet data layer
- `lib/testnet.ts`: viem public client (Base Sepolia), `SANDBOX` addresses, minimal ABIs, `usePolling` (visibility-aware), `useTestnetSnapshot()` (multicall: token totalSupply, vault totalWrapped, registry count, staking totalStaked + poolRemaining), `useRecentMints()` (2000-block TransferSingle scan), `fmtCcm(bigint)`, `fmtInt(bigint)`.

### M3 — Widget extraction (no behaviour change)
- `problem/FailureGrid.tsx` ← inverted 4-failure block from `Problem.tsx`.
- `trinity/TrinityCards.tsx` ← 3 cards from `Trinity.tsx`.
- `wrap/WrapStudio.tsx` ← slider demo from `WrapSim.tsx` (owns its `amt` state; accepts optional `amt/onChange` so WrapSim can keep its state if needed).
- `grades/GradeTable.tsx` ← desktop + mobile table from `Grades.tsx`.
- `tokenomics/AllocationPanel.tsx` ← ring + hover-synced table from `Tokenomics.tsx` (owns `active` state).
- `market/MarketContext.tsx` ← new small section: AtmosphericTimeline + WhyNow with labels (for `/market`).
- Originals import the extracted widgets. `AtmosphericTimeline`: mobile label thinning.

### M4 — LIVE policy
- `wrap/VaultLedger.tsx`, `mining/LiveMetrics.tsx`: rewire to `useTestnetSnapshot` / `useRecentMints`, TESTNET labels, `—` loading, `rpc unreachable` caption, no tick timers.
- Relabel + de-pulse: `CostsLive`, `GradePriceLive`, `MarketLive`, `AdoptionLive`, `TVLLive` (deleted with Defi section), `ValueAccrualLive`, `InsuranceLedger`, `LiveProgress`.
- Delete `hero/NetworkSnapshot.tsx`, `manifesto/CommunityLive.tsx`, `sections/earth/Defi.tsx` + `defi/`; drop their imports and i18n labels.

### M5 — Pages and routing
- `pages/Home.tsx`: hero chapter (from `Hero.tsx`, readout rewired to testnet) + 7 chapters per spec §3.1 + `ChapterRail`.
- `pages/Market.tsx`, `Protocol.tsx`, `Token.tsx`, `RoadmapPage.tsx`: `PageHero` + full sections + rail.
- `App.tsx`: routes, redirects `/ccmine → /protocol#mining`, `/tokenomics → /token`; remove `Earth`.
- `SiteNav.tsx`: five route links; `SiteFooter.tsx`: network column.
- Delete `pages/Earth.tsx`, `components/site/AnchorNav.tsx`, `Hero.tsx` (folded into Home) — keep `hero/AtmosphericTimeline`, `hero/WhyNow`.

### M6 — e2e
- `e2e/site.mjs` per spec §7; `package.json` `test:e2e` → `node e2e/site.mjs`; delete `e2e/earth.mjs`.

## REVIEW_FIX
After each module: source review of the module's diff (correctness, contracts, mobile CSS selectors, i18n keys, dead imports). Each accepted finding → smallest repro (for UI, a focused `tsc` on the file or a single Playwright check) → fix → re-review the fix.

## FINAL_INTEGRATION (exactly once, auto-entered)
`VALIDATION_PHASE=FINAL_INTEGRATION`: `npm run typecheck`, `npm run build`, `node e2e/site.mjs` against `vite dev`, `/browse` screenshots (home 1440 top/mid/mid2, 390 top/mid; each sub-page top), final diff review. Then commit.
