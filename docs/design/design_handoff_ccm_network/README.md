# Handoff — CCM Network · BI & Site

## Overview

CCM Network 메인넷 런치를 위한 **브랜드 아이덴티티(BI) 시스템 + 마케팅 사이트(7 페이지) + 앱 대시보드 1 페이지** 디자인 패키지입니다.

핵심 컨셉: **"cc"는 carbon black, "m"은 forest green** — 탄소(cc)를 측정해 숲(m)으로 환원하는 네트워크의 시각적 압축. 단일 BI 시스템에서 light(`paper`) / dark(`paper-dark`) 두 표면이 자동 파생됩니다.

이 핸드오프는 다음을 포함합니다:

- **BI 시스템**: 토큰(컬러·타입·룰), wordmark(custom-drawn SVG), 다이어그램 프리미티브
- **2 개의 진입 사이트**: Earth(공식 홈, light), DeFi-native(앱 진입, dark)
- **5 개의 추가 페이지**: CCMine, Tokenomics, Roadmap, Whitepaper, Markets(connected app)
- **공유 chrome**: SiteNav, SiteFooter, ThemeToggle
- **테마 시스템**: 단일 토큰 객체에서 light/dark 가 동적으로 파생되는 구조

## About the Design Files

`design_reference/` 안의 파일들은 **HTML + React(JSX, Babel-in-browser) 로 작성된 디자인 레퍼런스 프로토타입**입니다 — 그대로 프로덕션에 옮길 코드가 아니라 **의도된 외관·구조·인터랙션을 픽셀 단위로 시연하는 mock 입니다.

작업 목표: 이 디자인을 **프로덕션 코드베이스의 기존 환경**(Next.js / React / Vue / SvelteKit 등)으로 재구현하는 것입니다. 코드베이스가 아직 없다면 **Next.js 14 (App Router) + TypeScript + CSS Modules 또는 Tailwind v4** 조합을 권장합니다 — 본 디자인이 정적 마케팅 사이트와 dashboard 가 섞인 구조이므로 RSC + 클라이언트 컴포넌트의 양립이 자연스럽습니다.

레퍼런스 파일에서 **그대로 가져올 것**: 모든 hex 컬러, spacing 값, 타이포그래피 스케일, SVG path(wordmark, 다이어그램), 카피, 레이아웃 비율.

레퍼런스 파일에서 **다시 쓸 것**: Babel-in-browser, `window.*` 글로벌 등록, inline `style={{ ... }}` 객체 — 이건 prototype 편의 장치이며 프로덕션에서는 모듈 import + CSS Modules / Tailwind 로 옮겨야 합니다.

## Fidelity

**High-fidelity (hifi)**. 모든 컬러는 hex 로 명시되어 있고, 타이포그래피 스케일(폰트 패밀리·weight·size·line-height·letter-spacing)도 픽셀값으로 고정되어 있습니다. SVG wordmark 와 다이어그램 프리미티브도 path 좌표까지 결정되어 있습니다. 그대로 픽셀 일치하게 재현해야 합니다.

## Stack 권장

| 영역 | 권장 |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict) |
| Styling | CSS Modules **또는** Tailwind v4 (디자인 토큰을 CSS 변수로 노출) |
| Fonts | `next/font/google` 로 Fraunces, Source Serif 4, Inter, IBM Plex Mono 4 종 셀프호스팅 |
| Theme | `next-themes` 또는 자체 React Context — `data-theme="light|dark"` 를 `<html>` 에 |
| 다이어그램 | inline SVG (third-party 차트 라이브러리 도입 금지 — 의도된 hand-tuned aesthetic 손상) |
| 인터랙션 | LandingEarth 의 wrap slider, LandingDefi 의 primitive grid hover — 클라이언트 컴포넌트로 |

---

## Design Tokens

모든 페이지가 **단일 토큰 객체**(`biTokens`)에서 파생됩니다. light / dark 두 팔레트가 동일한 키 셰이프를 가지므로, `T = isDark ? darkPalette : lightPalette` 단일 분기로 모든 컴포넌트가 자동으로 양쪽 표면에 대응됩니다.

### Color — V1 Bright (`palette: "lime"`)

| Token | Hex | 용도 |
|---|---|---|
| `paper`     | `#f5f3ec` | light 배경(메인) |
| `paperDeep` | `#ebe8de` | light 배경(footer / surface 강조) |
| `ink`       | `#0c0f10` | 본문 텍스트 / strong elements |
| `inkSoft`   | `#3a3f3c` | 보조 텍스트 / meta |
| `moss`      | `#2dbf63` | 액센트 1 — m glyph, link, accent number, primary CTA hover |
| `moss2`     | `#5fe089` | 액센트 1 강조(다이어그램 stroke variant) |
| `clay`      | `#c8602e` | 액센트 2 — 경고/보조 차트 시리즈 |
| `sky`       | `#4a7d8c` | 액센트 3 — 보조 차트 시리즈 |
| `rule`      | `#c9c5b8` | 보더 / hairline / divider |

### Color — V1 Dark (`palette: "forest-dark"`)

| Token | Hex | 용도 |
|---|---|---|
| `paper`     | `#0a0e0c` | dark 배경(메인) |
| `paperDeep` | `#060908` | dark 배경(footer / surface 강조) |
| `ink`       | `#eef1ea` | 본문 텍스트 |
| `inkSoft`   | `#7a8278` | 보조 텍스트 |
| `moss`      | `#2dbf63` | 액센트 — light 와 동일 hex(브랜드 일관성) |
| `moss2`     | `#5fe089` | |
| `clay`      | `#e88a4e` | |
| `sky`       | `#7ba9c4` | |
| `rule`      | `#1a221e` | |

> **주의**: `moss` (`#2dbf63`) 는 light/dark 동일 — 브랜드 핵심 신호색이므로 절대 표면별로 다르게 두지 마십시오.

### Typography

4 종 패밀리 — `next/font/google` 로 셀프호스팅 권장:

| Family | 용도 | weights |
|---|---|---|
| **Fraunces** (variable, opsz) | 디스플레이(h1, h2, h3) | 300, 400 |
| **Source Serif 4** | 본문(body, bodyLg, lead) | 400 |
| **Inter** | UI / nav / button | 400, 500, 600 |
| **IBM Plex Mono** | meta / label / code / data | 400, 500 |

#### Type scale (페이지 사이트 기준 — `brand/site-shared.jsx` 참고)

| Token | font-family | size | weight | line-height | letter-spacing | font-variation-settings |
|---|---|---|---|---|---|---|
| `h1` | Fraunces | 132 | 300 | 0.92 | -0.035em | `'opsz' 144` |
| `h2` | Fraunces | 64  | 300 | 1.05 | -0.025em | — |
| `h3` | Fraunces | 32  | 400 | 1.1  | -0.02em  | — |
| `bodyLg` | Source Serif 4 | 22 | 400 | 1.5 | — | — |
| `body`   | Source Serif 4 | 18 | 400 | 1.6 | — | — |
| `meta`     | IBM Plex Mono | 11 | 400 | — | 0.12em + uppercase | — |
| `metaMoss` | IBM Plex Mono | 11 | 400 | — | 0.16em + uppercase + `color: moss` | — |

> BI 스펙 페이지(`brand/bi-system.jsx`)는 자체 더 큰 스케일을 사용 — h1 = 96px, h2 = 40px, lead = 22px. 스펙 페이지 전용입니다.

#### `<em>` 처리

Fraunces italic 은 **moss 컬러 + italic** 조합으로 디스플레이 단어 강조에 쓰입니다 (`Apply, stake, *start mining.*` 형태). 이 조합 전용 스타일:

```css
em.italic-moss { font-style: italic; color: var(--moss); font-weight: 400; }
```

### Spacing

| Token | px | 용도 |
|---|---|---|
| `--sp-section` | 120 | section vertical padding |
| `--sp-section-x` | 56 | section horizontal padding |
| `--sp-nav-y` | 20 | nav vertical padding |
| `--sp-block` | 96 | h2 section block 사이 |
| `--sp-card-x` | 28–36 | 카드 내부 horizontal |
| `--sp-card-y` | 28–36 | 카드 내부 vertical |
| `--sp-stack-md` | 24 | 단락-단락 |
| `--sp-stack-sm` | 14 | label-제목 |

### Border / Radius / Shadow

- **모든 borders**: `1px solid var(--rule)` — 한 토큰만 씁니다.
- **Radius**: **0** (의도된 디자인 — sharp edges 가 "instrument-like" 정체성). 카드, 버튼, 입력, 차트 컨테이너 모두 radius 0.
- **Shadow**: 없음. depth 는 `paperDeep` / `paper` 의 단계로만 표현.

### Layout

- 캔버스 폭: **1280px** 디자인 기준 (artboard width).
- 메인 레이아웃: `padding: 120px 56px;` section.
- Hero 그리드: `grid-template-columns: 1.4fr 1fr` (좌측 텍스트 70%, 우측 다이어그램 30% 가량) 가 기본 패턴.
- Footer 그리드: `grid-template-columns: 1.4fr 1fr 1fr 1fr`.

---

## Wordmark

**Custom-drawn SVG** — Fraunces 텍스트가 아닙니다. `brand/bi-system.jsx` 상단 `lcC`, `lcM_paths` 헬퍼가 letterform path 를 generate 합니다.

규격 (canonical UNIT box: 100 tall × 240 wide):

- x-height: 56u (top 22 → bottom 78)
- stroke: 10u
- cap height: 72u
- `c` opening: 19° half-angle (~38° total) — 4-o'clock / 8-o'clock 위치에서 잘림. 측정 게이지 needle 이 통과하는 비유.
- `m` 비율: bowl `rx = 0.78r`(narrower than tall — 진짜 m 자형 비율), 총 폭 ≈ 3.4r

#### 표준 사용

| Variant | 용도 |
|---|---|
| `<Wordmark size={N} color={ink} mColor={moss} />` | 기본 — nav, footer, hero |
| 단색 (mColor=ink) | favicon, 1-color 인쇄 |

`size` prop 은 height(px) — width 는 자동으로 ~2.4× 로 그려집니다. nav 22px, footer 32px, hero 96–132px 가 표준 레인.

**재구현 가이드**: `bi-system.jsx` 의 `Wordmark` 컴포넌트와 `lcC`/`lcM_paths` 헬퍼를 그대로 React/TS 로 포팅하십시오. SVG path 산식을 재해석하지 마세요 — 이미 tuned 된 형상입니다.

---

## Pages / Routes

각 페이지가 어떤 역할이고, 어떤 컴포넌트로 구성되며, 어떤 데이터를 필요로 하는지 정리.

### Site IA

```
/                       → Earth landing (V1 Bright)
/ccmine                 → CCMine onboarding
/tokenomics             → Tokenomics deep-dive
/roadmap                → Roadmap (Phase 0 → 5)
/whitepaper             → Long-form reader
app.ccm.network/        → Markets dashboard (V1 Dark, wallet-connected)
app.ccm.network/defi    → DeFi-native landing (V1 Dark, public app entry)
```

### 1. Earth landing — `brand/landing-earth.jsx`

**Path**: `/` · **Theme**: V1 Bright(default), 토글로 Dark
**Purpose**: ESG 매수자·규제기관·crypto-curious 향 공식 홈. 메시지: "Carbon credits, measured by physics."
**Sections** (위→아래):
1. SiteNav (sticky, blur)
2. Hero — h1 ("A unit deserves its own voice.") + lead + dual CTA(Open App / Whitepaper) + 우측 NodeNetwork SVG
3. **Wrap slider** (interactive) — drag 으로 carbon → CCM 변환 시연. State: `wrapAmount: number`. 좌측 input, 우측 실시간 결과
4. Pillar 3-grid — Measure / Verify / Retire
5. Trust badges row — VVB partners, audit, regulator names
6. 1-line manifesto block (full-width, paperDeep bg)
7. SiteFooter

### 2. DeFi landing — `brand/landing-defi.jsx`

**Path**: `app.ccm.network/defi` (또는 `/defi`) · **Theme**: V1 Dark
**Purpose**: 지갑 연결 전 마케팅 페이지. 톤: 고밀도, 모노스페이스, 터미널-친화. light Earth 와 동일 콘텐츠를 dark 로 재해석.
**Sections**:
1. SiteNav (dark variant)
2. Hero — h1 + 중앙 SignalPlot SVG
3. **Primitive grid** (interactive hover) — 6 prim card(mint, wrap, vault, retire, swap, claim). hover 시 카드 회전·텍스트 expand
4. Stat row (5 metric grid)
5. CTA strip — "Open app →"
6. Footer

### 3. CCMine — `brand/page-ccmine.jsx`

**Path**: `/ccmine` · **Theme**: V1 Bright(toggle)
**Purpose**: 노드 운영자(physical / verification / storage) 온보딩. 톤: 모집 공고에 가까운 정직한 직설.
**Sections**:
1. SiteNav(active=`ccmine`)
2. Hero — h1 ("Run a node, mint $CCM.") + 우측 NodeNetwork
3. **3-role table** — Physical · Verification · Storage 각 카드. stake req · payout · timeline · 자격 요건
4. Economics block — "5% protocol fee on every node payout" 강조
5. **Apply CTA** (dark inverted section, `bg: ink`) — 4-step onboarding(`Select role` → `Stake` → `Run client` → `First mint`)
6. Footer

### 4. Tokenomics — `brand/page-tokenomics.jsx`

**Path**: `/tokenomics` · **Theme**: V1 Bright
**Purpose**: §8 토크노믹스 챕터의 single-page summary. 슈펠스타일 spec sheet.
**Sections**:
1. SiteNav(active=`tokenomics`)
2. Hero — h1 ("§ 8 · The token is a measurement.") + supply 다이어그램(원형 segment)
3. Allocation grid — 6 카테고리 ring chart + 표
4. **§8.2 Staking pool** (dark inverted block) — yield formula(IBM Plex Mono ASCII math) + 4-row price-elastic table
5. §8.3 Vesting schedule — gantt-style 5-row timeline
6. §8.4 TGE event card
7. Footer

### 5. Roadmap — `brand/page-roadmap.jsx`

**Path**: `/roadmap` · **Theme**: V1 Bright
**Purpose**: Phase 0 → 5 까지의 timeline. instrument 게이지의 dial face 를 시각 메타포로.
**Sections**:
1. SiteNav(active=`roadmap`)
2. Hero — h1 ("Six phases, one instrument.")
3. **Phase 6-card grid** — 각 phase: 라벨 / 분기 / 핵심 deliverable 3 개 / state(complete · current · planned)
4. 현재 phase 강조 카드(full-width)
5. Risk register block — 5-row hairline table
6. Footer

### 6. Whitepaper — `brand/page-whitepaper.jsx`

**Path**: `/whitepaper` · **Theme**: V1 Bright
**Purpose**: long-form reader. Source Serif 4 본문, Plex Mono section §, sidebar TOC.
**Sections**:
1. SiteNav(active=`whitepaper`)
2. Cover block — title / authors / version / abstract
3. **Sidebar TOC + body** 2-column (`grid: 240px 1fr`) — sidebar sticky
4. Sections §1 ~ §10, 각 § 내부 h2 + body 단락 + occasional figure(NodeNetwork, SignalPlot)
5. References / footnotes block
6. Footer

### 7. Markets — `brand/page-markets.jsx`

**Path**: `app.ccm.network/markets` (앱 entrypoint) · **Theme**: V1 Dark **only**
**Purpose**: 지갑 연결된 사용자의 dashboard. 시장 시세·내 holdings·minted units·retire activity.
**Sections**:
1. SiteNav (dark, active=`app`) + 우측 wallet pill(`0x12…aBcD · 4,250 CCM`)
2. Top stat strip — 4 metric(price · 24h · supply · TVL)
3. **Markets table** — 8-row CCM 시리즈(2024 vintage / 2025 / verified / unverified …) sortable columns
4. Holdings panel + Mint/Retire 버튼
5. Recent activity feed (5-row)
6. Footer (dark)

---

## Shared Components

`brand/site-shared.jsx` 의 공통 chrome — 전 페이지 동일.

### `<SiteNav active={pageId} T S isDark onToggle />`

- sticky top, `backdrop-filter: blur(8px)`, 92% opacity bg
- 좌: `<Wordmark size={22} />` + `ccm.network` meta
- 중: 6 nav links — `Standard · CCMine · Tokenomics · Roadmap · Whitepaper · Open App ↗`
- 우: `<ThemeToggle />` (sun/moon icon + "light"/"dark" 라벨)
- active 링크: `color: moss` + `border-bottom: 1px solid moss`

### `<SiteFooter T S />`

- 4-col grid: brand mark + 3 col link 리스트(Network / Build / Foundation)
- 하단 copyright row — `© 2026 CCM Foundation · CC BY 4.0` + `Whitepaper v1.0 · May 2026`
- `bg: paperDeep`

### `<NodeNetwork T count={7} size={240} label="CCM" />`

중앙 hub + N satellite — circle radius 88, hub r=22 (ink fill, paper text). dial face 메타포. 모든 페이지 hero 우측에 재사용.

### `<SignalPlot T w={480} h={120} accent={moss} />`

sine + cosine 합성 60-point line + 8-step marker dot. 측정 신호의 시각화.

> **추가 다이어그램**: 페이지마다 ring chart, gantt, gauge dial 등 1-off SVG 가 등장. 모두 `<svg>` inline + `T` 토큰만 사용. 그대로 React component 로 포팅.

---

## Theme System (light/dark)

### 작동 방식

1. 단일 `biTokens` 객체에 light(`lime`) / dark(`forest-dark`) 두 셰이프가 같은 키 스키마로 존재.
2. 페이지 루트 `<SitePage>` 가 자체 `isDark` 상태 보유 (default: 페이지가 dark 전용이면 `true`).
3. `T = isDark ? getSiteDark() : getSiteLight()` 한 줄로 분기 → 모든 자식 컴포넌트가 `T.paper`, `T.ink`, `T.moss` 등을 참조.
4. nav 의 `<ThemeToggle />` 클릭 → `setDark(d => !d)`.

### 프로덕션 권장 옮김

```ts
// app/lib/tokens.ts
export const lightTokens = { paper: '#f5f3ec', paperDeep: '#ebe8de', /* … */ } as const;
export const darkTokens  = { paper: '#0a0e0c', paperDeep: '#060908', /* … */ } as const;
export type Tokens = typeof lightTokens;

// app/providers/ThemeProvider.tsx — Client Component
// next-themes 사용. data-theme="light|dark" 를 <html> 에.

// CSS variables 로 노출 — Tailwind v4 의 @theme 또는 globals.css :root / [data-theme=dark]
```

`Tokens` 타입을 prop drill 하지 말고, **CSS variable + Tailwind arbitrary value 또는 `var(--moss)` 직접 참조** 방식이 깔끔. inline style 객체는 prototype 한정 패턴입니다.

### Markets 페이지 예외

`PageMarkets` 는 dark only — 라이트 토글을 hide 하거나 disable. 현재 mock 은 `forest-dark` 를 강제 적용 (`<PageVariant palette="forest-dark">`). 프로덕션에서는 `defaultTheme="dark"` + 토글 비노출.

---

## Interactions & Behavior

### Earth — wrap slider

- State: `wrapAmount: number` (0 ~ 10000, default 1000)
- input: `<input type="range">` + 숫자 입력 동기화
- 출력: `wrapped = wrapAmount * rate` (rate = 0.94 demo 값)
- 변환 시 우측 panel 의 숫자 카운트업 — `requestAnimationFrame` 기반 200ms ease-out
- 하단 micro-meta: `gas ≈ 0.0021 ETH · slippage 0.3%` (정적)

### DeFi — primitive grid hover

- 6 카드, 3×2 grid
- hover: `transform: translateY(-4px)` + `border-color: moss` + 카드 내부 추가 라인 fade-in (300ms)
- 클릭은 향후 라우팅 자리 — 현재 `href="#"`

### Theme toggle

- 즉시 전환, no animation. 단 svg icon swap(sun ↔ moon) 은 200ms cross-fade 가능.

### Tokenomics — staking pool table

- 정적. price-elastic yield row hover 시 row bg `paperDeep`.

### Markets — table sort

- column header click → asc/desc 토글. sort indicator: `▲` / `▼` (Plex Mono).
- 현재 mock 은 정적 데이터; 프로덕션은 RSC 로 데이터 fetch + 클라이언트 sort.

---

## Tweaks Panel (디자인 전용 — 프로덕션엔 제외)

`brand/tweaks-panel.jsx` 는 **디자인 검토용 toggle 패널**입니다. 프로덕션 빌드에 포함하지 마십시오. light/dark 외에 추가 팔레트 변형을 실험할 때만 디자인 단계에서 사용한 도구입니다.

---

## Assets

- **폰트**: 모두 Google Fonts 무료. `next/font/google` 로 셀프호스트.
  - Fraunces (variable, ital + opsz)
  - Source Serif 4
  - Inter
  - IBM Plex Mono
- **이미지/사진**: 없음. 모든 그래픽 요소는 inline SVG.
- **로고/wordmark**: `bi-system.jsx` 의 `Wordmark` 컴포넌트가 single source of truth. 별도 SVG 파일로 export 해서 favicon / og-image / app icon 으로 분기 권장.
- **아이콘**: nav 의 sun/moon, footer link 옆 `↗` 외에는 거의 없음. 추가 아이콘 필요 시 `lucide-react` 권장(설치된 적 없는 한 stroke 1.6 / sharp corner 만 유지).

---

## File Reference

`design_reference/` 폴더 안의 파일 목록:

```
design_reference/
├── CCM Network - BI & Site.html       ← 진입점. 모든 jsx 를 babel-in-browser 로 로드 + DesignCanvas 로 8 페이지 grid 렌더
├── design-canvas.jsx                  ← 디자인 검토용 pan/zoom canvas. 프로덕션에 포함하지 말 것
└── brand/
    ├── bi-system.jsx                  ← BI 스펙 단일 페이지(토큰·타이포·wordmark 정의 원본). h1 = 96px 큰 스케일
    ├── guideline.jsx                  ← BI 1-page 요약 카드
    ├── site-shared.jsx                ← SiteNav · SiteFooter · SitePage · NodeNetwork · SignalPlot · sharedStylesFor
    ├── landing-earth.jsx              ← / 라우트
    ├── landing-defi.jsx               ← /defi (또는 app entrypoint)
    ├── landing-sci.jsx                ← (참고용 polished 대안 — 채택 안 됨, 무시 가능)
    ├── page-ccmine.jsx                ← /ccmine
    ├── page-tokenomics.jsx            ← /tokenomics
    ├── page-roadmap.jsx               ← /roadmap
    ├── page-whitepaper.jsx            ← /whitepaper
    ├── page-markets.jsx               ← app.ccm.network/markets (dark only)
    └── tweaks-panel.jsx               ← 디자인 검토 도구. 프로덕션에 포함하지 말 것
```

### 읽는 순서 (개발자용)

1. **`brand/bi-system.jsx`** 전체 — 토큰·타이포·wordmark·헬퍼의 **single source of truth**. 여기서 모든 hex 와 path 추출.
2. **`brand/site-shared.jsx`** — SiteNav / SiteFooter / SitePage / 다이어그램 프리미티브. 7 개 페이지가 모두 이걸 import.
3. **`CCM Network - BI & Site.html`** L100~150 (TWEAK_DEFAULTS, `__BI_PALETTES`, `__BI_FONTS` 정의) — 두 팔레트의 hex 한 눈에 확인.
4. 각 페이지 jsx — `landing-earth.jsx` 부터, 하나씩 컴포넌트 트리·레이아웃 그리드·copy 만 추출.
5. `landing-sci.jsx` 와 `tweaks-panel.jsx` 는 **무시**.

---

## Recommended Next.js 14 Skeleton

```
app/
├── layout.tsx                  ← <html data-theme>, fonts, ThemeProvider
├── globals.css                 ← :root tokens + [data-theme=dark] override + @theme(tailwind v4)
├── page.tsx                    ← Earth landing
├── ccmine/page.tsx
├── tokenomics/page.tsx
├── roadmap/page.tsx
├── whitepaper/page.tsx
├── (app)/
│   ├── layout.tsx              ← dark theme 강제
│   ├── markets/page.tsx
│   └── defi/page.tsx
└── components/
    ├── brand/
    │   ├── Wordmark.tsx
    │   ├── NodeNetwork.tsx
    │   └── SignalPlot.tsx
    ├── site/
    │   ├── SiteNav.tsx         ← "use client" — sticky + theme toggle
    │   ├── SiteFooter.tsx
    │   └── ThemeToggle.tsx     ← "use client"
    └── ui/
        ├── WrapSlider.tsx      ← "use client"
        └── PrimitiveCard.tsx   ← "use client" — hover state
lib/
├── tokens.ts                   ← lightTokens · darkTokens · type Tokens
└── content.ts                  ← copy/data 분리(추천)
```

---

## Notes / 주의사항

- **inline `style={{ ... }}` 객체 그대로 옮기지 마세요.** prototype 의 편의 패턴입니다 — CSS Modules / Tailwind utility 로 옮기되, **모든 hex / px / weight 는 정확히 보존**.
- **`window.*` 글로벌 등록(`window.SitePage = ...`) 그대로 옮기지 마세요.** Babel-in-browser 의 scope 제약 회피 패턴입니다 — 일반 ES module import 로 충분.
- **Babel-in-browser, 외부 unpkg.com CDN script tag 그대로 옮기지 마세요.** Next.js 가 빌드 타임에 처리합니다.
- **radius 0 유지.** 단 한 군데도 `border-radius: 4px` 같은 게 들어가면 안 됩니다.
- **shadow 사용 금지.** `paperDeep` 단계로만 surface 분리.
- **Fraunces opsz axis** — h1 (`font-size: 132`) 는 반드시 `font-variation-settings: 'opsz' 144`. h2/h3 는 default opsz.
- **`text-wrap: pretty`** 를 모든 본문 단락에 default 로. h1/h2 는 `text-wrap: balance`.
- **컬러 일관성**: `moss` 는 **light/dark 동일 hex** (`#2dbf63`). 토큰 객체 두 팔레트에 같은 값을 두십시오 — 절대 표면별로 다르게 두지 마세요.

문의 / clarification 필요 시 디자이너에게 직접. 즐거운 구현 되시길.
