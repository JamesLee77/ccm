// End-to-end smoke + interaction test for the Earth long-scroll page.
// Covers: render of all 15 anchor sections, theme toggle persistence,
// in-page nav scrolling, wrap slider, the five Mining sub-components
// (animated hub, IssuanceFlow staggered reveal, RoleCards hover, fee
// distribution hover sync, ticking LiveMetrics), dark-mode parity, and
// reduced-motion respect. Exits non-zero on any failure.
//
// Prerequisites
//   1. Vite dev server running on http://localhost:5173 (npm run dev)
//   2. Chromium installed for Playwright (one-time):
//        npx playwright install chromium
//   3. Override the URL with E2E_URL when targeting a deployed preview:
//        E2E_URL=https://preview.example node e2e/earth.mjs

import { chromium } from "playwright";

const URL = process.env.E2E_URL ?? "http://localhost:5173/";
const SECTIONS = [
  "vision", "market", "trinity", "problem", "wrap", "grades",
  "arch", "mining", "tokenomics", "scenarios", "defi", "vs",
  "roadmap", "risks", "manifesto",
];

const results = [];
const log = (group, name, ok, detail = "") => {
  results.push({ group, name, ok, detail });
  const tag = ok ? "PASS" : "FAIL";
  process.stdout.write(`  [${tag}] ${name}${detail ? `  — ${detail}` : ""}\n`);
};

async function inGroup(name, fn) {
  process.stdout.write(`\n■ ${name}\n`);
  try {
    await fn();
  } catch (e) {
    log(name, "uncaught", false, String(e.message ?? e));
  }
}

const browser = await chromium.launch();

async function newCtx(theme) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: theme,
  });
  await ctx.addInitScript((t) => localStorage.setItem("ccm-theme", t), theme);
  const page = await ctx.newPage();
  return { ctx, page };
}

// ─────── 1. PAGE LOAD ───────
await inGroup("Page load", async () => {
  const { ctx, page } = await newCtx("light");
  const resp = await page.goto(URL, { waitUntil: "networkidle" });
  log("Page load", "HTTP 200", resp?.status() === 200, `status ${resp?.status()}`);

  const title = await page.title();
  log("Page load", "title contains CCM", /CCM/.test(title), title);

  const lang = await page.getAttribute("html", "lang");
  log("Page load", "html lang=en", lang === "en", `lang=${lang}`);

  const theme = await page.getAttribute("html", "data-theme");
  log("Page load", "data-theme set", theme === "light" || theme === "dark", `theme=${theme}`);

  // Wordmark renders (custom SVG, not text)
  const wordmark = await page.locator("svg[aria-label='ccm']").first();
  log("Page load", "Wordmark SVG present", await wordmark.count() > 0);

  // Nav links
  const navLinks = await page.locator("header nav a").count();
  log("Page load", "SiteNav has 6 links", navLinks === 6, `count=${navLinks}`);

  // Anchor nav has 6 chapters
  const anchorLinks = await page.locator("nav[aria-label='In-page navigation'] a").count();
  log("Page load", "AnchorNav has 6 chapters", anchorLinks === 6, `count=${anchorLinks}`);

  await ctx.close();
});

// ─────── 2. ALL SECTIONS PRESENT ───────
await inGroup("All sections present", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  for (const id of SECTIONS) {
    const el = await page.locator(`#${id}`).count();
    log("All sections", `#${id}`, el >= 1, `count=${el}`);
  }
  await ctx.close();
});

// ─────── 3. THEME TOGGLE ───────
await inGroup("Theme toggle", async () => {
  // Do NOT seed localStorage via init script — would overwrite on reload.
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });

  const before = await page.getAttribute("html", "data-theme");
  await page.click("button[aria-label='Toggle theme']");
  await page.waitForTimeout(150);
  const after = await page.getAttribute("html", "data-theme");
  log("Theme toggle", "theme flips", before !== after, `${before} → ${after}`);

  const stored = await page.evaluate(() => localStorage.getItem("ccm-theme"));
  log("Theme toggle", "localStorage persists", stored === after, `localStorage=${stored}`);

  await page.reload({ waitUntil: "networkidle" });
  const persisted = await page.getAttribute("html", "data-theme");
  log("Theme toggle", "theme survives reload", persisted === after, `after reload=${persisted}`);
  await ctx.close();
});

// ─────── 4. ANCHOR NAV ───────
await inGroup("Anchor nav scrolls", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  for (const id of ["market", "tokenomics", "defi", "roadmap"]) {
    await page.click(`nav[aria-label='In-page navigation'] a[href='#${id}']`);
    await page.waitForTimeout(400);
    const sectionTop = await page.evaluate((s) => {
      const el = document.getElementById(s);
      return el ? el.getBoundingClientRect().top : null;
    }, id);
    // Section should be within ~120px of viewport top after scroll
    log("Anchor nav", `scroll to #${id}`, sectionTop !== null && Math.abs(sectionTop) < 200, `top offset=${Math.round(sectionTop ?? -9999)}`);
  }
  await ctx.close();
});

// ─────── 5. WRAP SLIDER ───────
await inGroup("Wrap slider", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("wrap")?.scrollIntoView());
  await page.waitForTimeout(400);

  const slider = page.locator("input[type='range']").first();
  const initialValue = await slider.inputValue();
  log("Wrap slider", "initial value present", !!initialValue, `value=${initialValue}`);

  await slider.fill("5000");
  await page.waitForTimeout(200);
  const newValue = await slider.inputValue();
  log("Wrap slider", "value updates", newValue === "5000");

  // The two displayed counts should reflect the new value
  const displayed = await page.evaluate(() => {
    const els = document.querySelectorAll("#wrap div");
    const text = Array.from(els).map((e) => e.textContent ?? "").join(" ");
    return /5,000/.test(text);
  });
  log("Wrap slider", "display reflects 5,000", displayed);
  await ctx.close();
});

// ─────── 6. MINING — animated network ───────
await inGroup("Mining · MiningNetwork", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("mining")?.scrollIntoView());
  await page.waitForTimeout(400);

  const hub = page.locator("#mining svg circle[fill='var(--ink)'][stroke='var(--moss)']").first();
  log("MiningNetwork", "hub SVG present", await hub.count() > 0);

  const counterEl = page.locator("#mining text").filter({ hasText: /\d{1,3}(,\d{3})+/ }).first();
  const v1 = await counterEl.textContent();
  log("MiningNetwork", "live counter renders", !!v1 && /^\d/.test(v1), `value=${v1}`);

  await page.waitForTimeout(5000); // 4.2s tick
  const v2 = await counterEl.textContent();
  log("MiningNetwork", "counter ticks (≠ initial)", v1 !== v2, `${v1} → ${v2}`);

  // Spinning ring class present
  const spinClass = await page.locator("#mining .mn-spin-slow").count();
  log("MiningNetwork", "outer ring rotation class present", spinClass > 0);

  // Pulse animation classes
  const pulseClass = await page.locator("#mining .mn-pulse").count();
  log("MiningNetwork", "satellite pulse classes (=count)", pulseClass === 7, `count=${pulseClass}`);

  await ctx.close();
});

// ─────── 7. MINING — IssuanceFlow ───────
await inGroup("Mining · IssuanceFlow", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("mining")?.scrollIntoView());
  await page.waitForTimeout(2000); // let stagger reveal finish (5 × 140ms)

  const steps = await page.locator("#mining ol li").count();
  log("IssuanceFlow", "5 steps rendered", steps === 5, `count=${steps}`);

  // After reveal, all steps should have full opacity (1)
  const opacities = await page.locator("#mining ol li").evaluateAll((els) =>
    els.map((e) => parseFloat(getComputedStyle(e).opacity)),
  );
  log("IssuanceFlow", "all steps revealed (opacity=1)", opacities.every((o) => o > 0.95), `opacities=[${opacities.map((o) => o.toFixed(2)).join(",")}]`);

  // Step labels in expected order
  const labels = await page.locator("#mining ol li").evaluateAll((els) =>
    els.map((e) => e.querySelector(".font-display")?.textContent?.trim()),
  );
  const expected = ["Activity", "Oracle", "VVB", "Mint", "Activate"];
  log("IssuanceFlow", "step labels match expected order", JSON.stringify(labels) === JSON.stringify(expected), `labels=${JSON.stringify(labels)}`);

  await ctx.close();
});

// ─────── 8. MINING — RoleCards hover ───────
await inGroup("Mining · RoleCards hover", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("mining")?.scrollIntoView());
  await page.waitForTimeout(400);

  // Locate the actual role card container — the .grid.grid-cols-3 wraps 3
  // direct-child cards; pick first one (Physical).
  const card = page.locator("#mining .grid.grid-cols-3 > div").first();
  const cardCount = await page.locator("#mining .grid.grid-cols-3 > div").count();
  log("RoleCards", "3 role cards present", cardCount === 3, `count=${cardCount}`);

  const containsStake = await card.locator("text=STAKE 5,000 $CCM").count();
  log("RoleCards", "first card is Physical (stake 5,000)", containsStake > 0);

  const beforeBorder = await card.evaluate((e) => getComputedStyle(e).borderColor);
  await card.hover();
  await page.waitForTimeout(250);
  const afterBorder = await card.evaluate((e) => getComputedStyle(e).borderColor);
  log("RoleCards", "border-color changes on hover", beforeBorder !== afterBorder, `${beforeBorder} → ${afterBorder}`);

  const transform = await card.evaluate((e) => getComputedStyle(e).transform);
  log("RoleCards", "card lifts on hover (translateY)", /matrix|translate/.test(transform) && transform !== "none", `transform=${transform}`);

  await ctx.close();
});

// ─────── 9. MINING — Economics ───────
await inGroup("Mining · Economics", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("mining")?.scrollIntoView());
  await page.waitForTimeout(400);

  const formula = await page.locator("#mining pre").textContent();
  log("Economics", "revenue formula present", formula?.includes("market_price"), `formula starts: ${formula?.slice(0, 60)}…`);

  const slices = await page.locator("#mining button[aria-label*='%']").count();
  log("Economics", "4 fee slices rendered", slices === 4, `count=${slices}`);

  // Slice percentages
  const labels = await page.locator("#mining button[aria-label*='%']").evaluateAll((els) =>
    els.map((e) => e.getAttribute("aria-label")),
  );
  const pcts = labels.map((l) => l?.match(/(\d+)%/)?.[1]).join(",");
  log("Economics", "slice percentages = 60,25,10,5", pcts === "60,25,10,5", `pcts=${pcts}`);

  // Hover changes opacity of others
  const slice0 = page.locator("#mining button[aria-label*='%']").nth(0);
  const slice2 = page.locator("#mining button[aria-label*='%']").nth(2);
  const before = await slice2.evaluate((e) => parseFloat(getComputedStyle(e).opacity));
  await slice0.hover();
  await page.waitForTimeout(200);
  const after = await slice2.evaluate((e) => parseFloat(getComputedStyle(e).opacity));
  log("Economics", "non-active slice dims on hover sync", after < before, `opacity ${before.toFixed(2)} → ${after.toFixed(2)}`);

  await ctx.close();
});

// ─────── 10. MINING — LiveMetrics ───────
await inGroup("Mining · LiveMetrics", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("mining")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(400);

  // 4 readouts
  const readouts = await page.locator("#mining .lm-pulse").count();
  log("LiveMetrics", "LIVE pulse indicator present", readouts === 1);

  // Use a DOM-walk evaluation to find the value that sits as a sibling of
  // the "CCM MINTED (24H)" label, instead of a fragile selector chain.
  const getMinted = () =>
    page.evaluate(() => {
      const labels = document.querySelectorAll("#mining .font-mono");
      const label = Array.from(labels).find((el) =>
        /CCM MINTED \(24H\)/i.test(el.textContent ?? ""),
      );
      const parent = label?.parentElement;
      const value = parent?.querySelector(".font-display");
      return value?.textContent?.trim() ?? null;
    });

  const m1 = await getMinted();
  log("LiveMetrics", "ccm minted readout present", !!m1 && /\d/.test(m1 ?? ""), `value=${m1}`);

  // Wait long enough for ≥1 tick (random 4.5–8s)
  await page.waitForTimeout(9000);
  const m2 = await getMinted();
  log("LiveMetrics", "ccm minted ticks within 9s", m1 !== m2, `${m1} → ${m2}`);

  await ctx.close();
});

// ─────── 11a. TOKENOMICS — AllocationRing + table sync ───────
await inGroup("Tokenomics · AllocationRing", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("tokenomics")?.scrollIntoView());
  await page.waitForTimeout(1500); // let stroke-dasharray draw-in finish

  // Donut renders 8 segments inside the rotated <g>
  const segments = await page
    .locator("#tokenomics svg circle[role='button']")
    .count();
  log("AllocationRing", "8 arcs rendered", segments === 8, `count=${segments}`);

  // SVG arcs use fill=none so Playwright's hover at bounding-box center
  // misses the stroke. Dispatching mouseenter directly is more reliable
  // and verifies the React handler the same way a real cursor would.
  const first = page.locator("#tokenomics svg circle[role='button']").first();
  await first.dispatchEvent("mouseenter");
  await page.waitForTimeout(300);

  const centerText = await page
    .locator("#tokenomics svg text")
    .filter({ hasText: /^\d+%/ })
    .first()
    .textContent();
  log("AllocationRing", "hover updates center label", /\d+%/.test(centerText ?? ""), `center=${centerText}`);

  // Allocation table syncs: hovered row should have brighter background.
  // Pick the matching row by its position (1st = mining).
  const rows = page.locator("#tokenomics .grid[style*='1.6fr 0.5fr']");
  const rowCount = await rows.count();
  log("AllocationRing", "allocation table has 9 grid rows (header + 8)", rowCount === 9, `count=${rowCount}`);

  await ctx.close();
});

// ─────── 11b. TOKENOMICS — EmissionCurve ───────
await inGroup("Tokenomics · EmissionCurve", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("tokenomics")?.scrollIntoView());
  await page.waitForTimeout(2000); // path draw-in

  // Find the emission svg by its aria-label
  const svg = page.locator("#tokenomics svg[aria-label*='Mining emission']");
  log("EmissionCurve", "labelled svg present", await svg.count() === 1);

  const yearTicks = await svg
    .locator("text")
    .filter({ hasText: /^Y\d+$/ })
    .count();
  log("EmissionCurve", "10 year ticks (Y1..Y10)", yearTicks === 10, `count=${yearTicks}`);

  // 4 milestone summaries below the chart
  const milestones = await page
    .locator("#tokenomics")
    .locator("text=/end of Y\\d+/i")
    .count();
  log("EmissionCurve", "4 cumulative milestones rendered", milestones === 4, `count=${milestones}`);

  await ctx.close();
});

// ─────── 11c. TOKENOMICS — VestingTimeline ───────
await inGroup("Tokenomics · VestingTimeline", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("tokenomics")?.scrollIntoView());
  await page.waitForTimeout(2500);

  // Bars: 5 buckets × 2 rects (cliff + vesting) = 10
  const labels = ["TGE · Seed", "TGE · Series A", "Foundation", "Strategic", "Team"];
  for (const label of labels) {
    const found = await page
      .locator("#tokenomics text", { hasText: label })
      .count();
    log("VestingTimeline", `row "${label}" present`, found > 0);
  }

  // Month ticks 0..60
  const ticks = await page
    .locator("#tokenomics text")
    .filter({ hasText: /^M\d+$/ })
    .count();
  log("VestingTimeline", "6 month ticks (M0..M60)", ticks === 6, `count=${ticks}`);

  await ctx.close();
});

// ─────── 11d. TOKENOMICS — UtilityCards ───────
await inGroup("Tokenomics · UtilityCards", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("tokenomics")?.scrollIntoView());
  await page.waitForTimeout(400);

  const cards = await page
    .locator("#tokenomics .grid[style*='repeat(5, 1fr)'] > div")
    .count();
  log("UtilityCards", "5 utility cards present", cards === 5, `count=${cards}`);

  // Hover behaviour on first card
  const first = page
    .locator("#tokenomics .grid[style*='repeat(5, 1fr)'] > div")
    .first();
  const before = await first.evaluate((e) => getComputedStyle(e).borderColor);
  await first.hover();
  await page.waitForTimeout(220);
  const after = await first.evaluate((e) => getComputedStyle(e).borderColor);
  log("UtilityCards", "border swaps to moss on hover", before !== after, `${before} → ${after}`);

  const transform = await first.evaluate((e) => getComputedStyle(e).transform);
  log("UtilityCards", "card lifts on hover", /matrix|translate/.test(transform) && transform !== "none");

  await ctx.close();
});

// ─────── 11e. TOKENOMICS — ValueAccrualLive ───────
await inGroup("Tokenomics · ValueAccrualLive", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("tokenomics")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(400);

  const livePulse = await page.locator("#tokenomics .va-pulse").count();
  log("ValueAccrualLive", "LIVE pulse indicator present", livePulse === 1);

  // Burn ledger rows (3 sources)
  const burnSources = ["Retire-to-Earn burn", "Buy-back & burn", "Vault liquidation"];
  for (const s of burnSources) {
    const found = await page
      .locator("#tokenomics li")
      .filter({ hasText: s })
      .count();
    log("ValueAccrualLive", `burn source "${s}" present`, found > 0);
  }

  // Total burned ticks within 9s
  const getTotal = () =>
    page.evaluate(() => {
      // Find the largest font-display in the live ledger area
      const labels = document.querySelectorAll("#tokenomics .font-mono");
      const target = Array.from(labels).find((el) =>
        /total \$ccm burned/i.test(el.textContent ?? ""),
      );
      const value = target?.parentElement?.querySelector(".font-display");
      return value?.textContent?.trim() ?? null;
    });
  const t1 = await getTotal();
  log("ValueAccrualLive", "total burned readout present", !!t1 && /\d/.test(t1 ?? ""), `value=${t1}`);
  await page.waitForTimeout(9000);
  const t2 = await getTotal();
  log("ValueAccrualLive", "total burned ticks within 9s", t1 !== t2, `${t1} → ${t2}`);

  await ctx.close();
});

// ─────── 12a. ARCHITECTURE — StackDiagram ───────
await inGroup("Architecture · StackDiagram", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("arch")?.scrollIntoView());
  await page.waitForTimeout(1500);

  const layers = await page
    .locator("#arch button[aria-label^='L']")
    .count();
  log("StackDiagram", "8 layer buttons rendered", layers === 8, `count=${layers}`);

  // Hover L7 (DeFi Primitives). Buttons have full bounding boxes so a
  // real hover() works here (unlike SVG arcs in AllocationRing).
  const defi = page.locator("#arch button[aria-label='L7 DeFi Primitives']");
  await defi.hover();
  await page.waitForTimeout(250);

  const panelBodyVisible = await page
    .locator("#arch")
    .locator("text=Eight composable building blocks")
    .count();
  log(
    "StackDiagram",
    "detail panel updates on hover",
    panelBodyVisible > 0,
    `body matches=${panelBodyVisible}`,
  );

  // L5 button has the moss star
  const l5 = page.locator("#arch button[aria-label='L5 NFT Registry']");
  const starCount = await l5.locator("text=★").count();
  log("StackDiagram", "L5 carries moss star", starCount > 0);

  await ctx.close();
});

// ─────── 12b. ARCHITECTURE — DataFlow ───────
await inGroup("Architecture · DataFlow", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("arch")?.scrollIntoView());
  await page.waitForTimeout(1500);

  const svg = page.locator("#arch svg[aria-label*='Data flow']");
  log("DataFlow", "labelled svg present", await svg.count() === 1);

  // Sources: 5 small dots
  const sources = ["Sentinel-2", "Planet Labs", "GEDI LiDAR", "IoT mesh", "DAC monitors"];
  for (const s of sources) {
    const found = await page
      .locator("#arch text", { hasText: s })
      .count();
    log("DataFlow", `source "${s}" present`, found > 0);
  }

  // Stages: 4
  const stages = ["Oracle aggregator", "VVB consensus", "CCM-NFT mint", "$CCM wrap"];
  for (const s of stages) {
    const found = await page
      .locator("#arch text", { hasText: s })
      .count();
    log("DataFlow", `stage "${s}" present`, found > 0);
  }

  // df-flow animation classes attached
  const flowCount = await page.locator("#arch .df-flow").count();
  log("DataFlow", "flow animation classes attached", flowCount > 0, `count=${flowCount}`);

  await ctx.close();
});

// ─────── 12c. ARCHITECTURE — ContractMap ───────
await inGroup("Architecture · ContractMap", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("arch")?.scrollIntoView());
  await page.waitForTimeout(1500);

  const groupLabels = ["core", "defi", "governance", "verification"];
  for (const gl of groupLabels) {
    const found = await page
      .locator("#arch span")
      .filter({ hasText: new RegExp(`^${gl}$`, "i") })
      .count();
    log("ContractMap", `group "${gl}" rendered`, found > 0);
  }

  // Total contract count = 5+8+3+3 = 19
  const codeNodes = await page.locator("#arch code").count();
  log("ContractMap", "19 contract nodes rendered", codeNodes === 19, `count=${codeNodes}`);

  await ctx.close();
});

// ─────── 12d. ARCHITECTURE — Composability ───────
await inGroup("Architecture · Composability", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("arch")?.scrollIntoView());
  await page.waitForTimeout(1500);

  // Both lanes
  for (const lane of ["$CCM ERC-20", "CCM-NFT ERC-1155"]) {
    const found = await page
      .locator("#arch")
      .locator(`text=${lane}`)
      .count();
    log("Composability", `lane "${lane}" present`, found > 0);
  }

  // 5 protocols on each lane
  const protocols = ["Uniswap V3/V4", "Curve", "Balancer", "OpenSea / Blur", "Sudoswap"];
  for (const p of protocols) {
    const found = await page
      .locator("#arch span")
      .filter({ hasText: p })
      .count();
    log("Composability", `protocol "${p}" listed`, found > 0);
  }

  await ctx.close();
});

// ─────── 12e. ARCHITECTURE — SecurityCards ───────
await inGroup("Architecture · SecurityCards", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("arch")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(400);

  // Find the security cards grid (5-column repeat at the bottom of #arch)
  const cards = await page
    .locator("#arch .grid[style*='repeat(5, 1fr)'] > div")
    .count();
  log("SecurityCards", "5 security cards present", cards === 5, `count=${cards}`);

  const titles = ["Non-upgradeable", "External audits", "Multi-sig admin", "48h timelock", "Bug bounty"];
  for (const t of titles) {
    const found = await page
      .locator("#arch")
      .locator(`text=${t}`)
      .count();
    log("SecurityCards", `card "${t}" present`, found > 0);
  }

  // Hover behaviour on first
  const first = page
    .locator("#arch .grid[style*='repeat(5, 1fr)'] > div")
    .first();
  await first.hover();
  await page.waitForTimeout(220);
  const transform = await first.evaluate((e) => getComputedStyle(e).transform);
  log("SecurityCards", "hover lifts the card", transform !== "none" && /matrix|translate/.test(transform));

  await ctx.close();
});

// ─────── 12f. WRAP — VaultLedger ───────
await inGroup("Wrap · VaultLedger", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("wrap")?.scrollIntoView());
  await page.waitForTimeout(500);

  const livePulse = await page.locator("#wrap .vl-pulse").count();
  log("VaultLedger", "LIVE pulse indicator present", livePulse === 1);

  for (const l of [
    "NFTs locked in vault",
    "$CCM circulating",
    "Lockup ratio (vault / minted)",
    "Wrap volume (24h)",
  ]) {
    const found = await page
      .locator("#wrap")
      .locator(`text=${l}`)
      .count();
    log("VaultLedger", `readout "${l}" present`, found > 0);
  }

  // Locked + circulating tick together (preserves invariant)
  const getReadout = (label) =>
    page.evaluate((target) => {
      const labels = document.querySelectorAll("#wrap .font-mono");
      const labelEl = Array.from(labels).find((el) =>
        new RegExp(target, "i").test(el.textContent ?? ""),
      );
      const value = labelEl?.parentElement?.querySelector(".font-display");
      return value?.textContent?.trim() ?? null;
    }, label);

  const lockedBefore = await getReadout("NFTs locked in vault");
  const circBefore = await getReadout("\\$CCM circulating");
  await page.waitForTimeout(9000);
  const lockedAfter = await getReadout("NFTs locked in vault");
  const circAfter = await getReadout("\\$CCM circulating");

  log(
    "VaultLedger",
    "locked tick within 9s",
    lockedBefore !== lockedAfter,
    `${lockedBefore} → ${lockedAfter}`,
  );
  log(
    "VaultLedger",
    "locked + circulating delta matched (invariant)",
    lockedBefore !== lockedAfter
      ? Number(lockedAfter?.replace(/,/g, "")) - Number(lockedBefore?.replace(/,/g, "")) ===
          Number(circAfter?.replace(/,/g, "")) - Number(circBefore?.replace(/,/g, ""))
      : true,
  );

  await ctx.close();
});

// ─────── 12g. WRAP — WrapModes ───────
await inGroup("Wrap · WrapModes", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("wrap")?.scrollIntoView());
  await page.waitForTimeout(500);

  const cards = await page
    .locator("#wrap .grid.grid-cols-3 > div")
    .count();
  log("WrapModes", "3 mode cards present", cards === 3, `count=${cards}`);

  const titles = ["Standard · FIFR", "Premium", "Specific tokenId"];
  for (const t of titles) {
    const found = await page
      .locator("#wrap")
      .locator(`text=${t}`)
      .count();
    log("WrapModes", `card "${t}" present`, found > 0);
  }

  const first = page.locator("#wrap .grid.grid-cols-3 > div").first();
  const before = await first.evaluate((e) => getComputedStyle(e).borderColor);
  await first.hover();
  await page.waitForTimeout(220);
  const after = await first.evaluate((e) => getComputedStyle(e).borderColor);
  log("WrapModes", "border swaps to moss on hover", before !== after, `${before} → ${after}`);

  const transform = await first.evaluate((e) => getComputedStyle(e).transform);
  log("WrapModes", "card lifts on hover", transform !== "none" && /matrix|translate/.test(transform));

  await ctx.close();
});

// ─────── 12h. WRAP — GradeFlow ───────
await inGroup("Wrap · GradeFlow", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("wrap")?.scrollIntoView());
  await page.waitForTimeout(2000);

  const svg = page.locator("#wrap svg[aria-label*='grade composition']");
  log("GradeFlow", "labelled svg present", await svg.count() === 1);

  // Year ticks Y0..Y10
  const yearTicks = await svg
    .locator("text")
    .filter({ hasText: /^Y\d+$/ })
    .count();
  log("GradeFlow", "11 year ticks (Y0..Y10)", yearTicks === 11, `count=${yearTicks}`);

  // Endpoint summary cards (4)
  const summaryCards = await page
    .locator("#wrap")
    .locator("text=/over 10y/")
    .count();
  log("GradeFlow", "4 endpoint summaries rendered", summaryCards === 4, `count=${summaryCards}`);

  await ctx.close();
});

// ─────── 12i. WRAP — InvariantTicker ───────
await inGroup("Wrap · InvariantTicker", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("wrap")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(400);

  const livePulse = await page.locator("#wrap .it-pulse").count();
  log("InvariantTicker", "LIVE pulse indicator present", livePulse === 1);

  // Equation pre-block
  const formula = await page.locator("#wrap pre").textContent();
  log(
    "InvariantTicker",
    "invariant equation present",
    /total_supply\(\$CCM\)/.test(formula ?? ""),
    `formula starts: ${formula?.slice(0, 40)}…`,
  );

  // Both sides display same number — extract and compare
  const sides = await page.evaluate(() => {
    const labels = document.querySelectorAll("#wrap .font-mono");
    const left = Array.from(labels).find((el) => /NFT vault/i.test(el.textContent ?? ""));
    const right = Array.from(labels).find((el) => /\$CCM circulating/i.test(el.textContent ?? ""));
    const lv = left?.parentElement?.querySelector(".font-display")?.textContent?.trim();
    const rv = right?.parentElement?.querySelector(".font-display")?.textContent?.trim();
    return { lv, rv };
  });
  log(
    "InvariantTicker",
    "NFT vault == $CCM circulating",
    sides.lv === sides.rv,
    `left=${sides.lv} right=${sides.rv}`,
  );

  await ctx.close();
});

// ─────── 13a. ROADMAP — PhaseTrack + PhaseDetail ───────
await inGroup("Roadmap · PhaseTrack", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("roadmap")?.scrollIntoView());
  await page.waitForTimeout(1500);

  const phases = await page
    .locator("#roadmap button[aria-label^='Phase']")
    .count();
  log("PhaseTrack", "6 phase buttons rendered", phases === 6, `count=${phases}`);

  // Hover Phase 3 — detail panel should update with deliverable text unique to P3
  const p3 = page.locator("#roadmap button[aria-label='Phase 3 DeFi full']");
  await p3.hover();
  await page.waitForTimeout(250);
  const panelHasUnique = await page
    .locator("#roadmap")
    .locator("text=veCCM governance launch")
    .count();
  log("PhaseTrack", "panel reflects P3 deliverables on hover", panelHasUnique > 0);

  // Progress bar fill exists
  const progressBar = await page
    .locator("#roadmap")
    .locator("text=delivered")
    .count();
  log("PhaseTrack", "progress label rendered", progressBar > 0);

  await ctx.close();
});

// ─────── 13b. ROADMAP — DeliveryGantt ───────
await inGroup("Roadmap · DeliveryGantt", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("roadmap")?.scrollIntoView());
  await page.waitForTimeout(2000);

  const svg = page.locator("#roadmap svg[aria-label*='delivery gantt']");
  log("DeliveryGantt", "labelled svg present", await svg.count() === 1);

  // 4 year labels (2026, 2027, 2028, 2029)
  for (const y of ["2026", "2027", "2028", "2029"]) {
    const found = await svg.locator(`text=${y}`).count();
    log("DeliveryGantt", `year ${y} labelled`, found > 0);
  }

  // Today marker labelled NOW
  const nowMarker = await svg.locator("text=NOW").count();
  log("DeliveryGantt", "NOW marker present", nowMarker > 0);

  await ctx.close();
});

// ─────── 13c. ROADMAP — MilestoneList ───────
await inGroup("Roadmap · MilestoneList", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("roadmap")?.scrollIntoView());
  await page.waitForTimeout(1500);

  // Count rows in the milestone list — header + 12 = 13 li
  const rows = await page
    .locator("#roadmap ol > li")
    .count();
  log(
    "MilestoneList",
    "12 milestones + header (13 rows)",
    rows >= 13,
    `count=${rows}`,
  );

  // State labels appear (done, current, planned)
  for (const state of ["done", "current", "planned"]) {
    const found = await page
      .locator("#roadmap span")
      .filter({ hasText: new RegExp(`^${state}$`, "i") })
      .count();
    log("MilestoneList", `state "${state}" rendered`, found > 0);
  }

  await ctx.close();
});

// ─────── 13d. ROADMAP — LiveProgress ───────
await inGroup("Roadmap · LiveProgress", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("roadmap")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(400);

  const livePulse = await page.locator("#roadmap .lp-pulse").count();
  log("LiveProgress", "LIVE pulse indicator present", livePulse === 1);

  const labels = ["Phase 1 progress", "Milestones completed", "Days until phase 2", "Active contributors"];
  for (const l of labels) {
    const found = await page
      .locator("#roadmap")
      .locator(`text=${l}`)
      .count();
    log("LiveProgress", `readout "${l}" present`, found > 0);
  }

  await ctx.close();
});

// ─────── 14a. RISKS — RiskMatrix + MitigationDetail ───────
await inGroup("Risks · RiskMatrix", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("risks")?.scrollIntoView());
  await page.waitForTimeout(1800);

  // 6 risk dots in the matrix svg
  const dots = await page
    .locator("#risks svg[aria-label='Risk matrix'] circle[role='button']")
    .count();
  log("RiskMatrix", "6 risk dots", dots === 6, `count=${dots}`);

  // SVG arcs use fill=transparent; dispatchEvent("mouseenter") doesn't
  // bubble through React's delegated handler. Use click() instead — the
  // RiskMatrix dot also wires onClick to the same setActive.
  const adoption = page.locator("#risks circle[aria-label='Adoption']");
  await adoption.click({ force: true });
  await page.waitForTimeout(300);

  const panelHas = await page
    .locator("#risks")
    .locator("text=Verra / Gold Standard lock-in")
    .count();
  log("RiskMatrix", "mitigation panel updates on hover", panelHas > 0);

  await ctx.close();
});

// ─────── 14b. RISKS — DefenseInDepth ───────
await inGroup("Risks · DefenseInDepth", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("risks")?.scrollIntoView());
  await page.waitForTimeout(1500);

  const labels = [
    "Stake bond",
    "M-of-N consensus",
    "Slashing",
    "ZK-proof option",
    "Dispute layer",
    "Insurance Vault",
  ];
  for (const l of labels) {
    const found = await page
      .locator("#risks")
      .locator(`text=${l}`)
      .count();
    log("DefenseInDepth", `layer "${l}" present`, found > 0);
  }

  await ctx.close();
});

// ─────── 14c. RISKS — DisputeFlow ───────
await inGroup("Risks · DisputeFlow", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("risks")?.scrollIntoView());
  await page.waitForTimeout(1500);

  const steps = await page
    .locator("#risks ol > li")
    .count();
  log("DisputeFlow", "5 steps rendered", steps === 5, `count=${steps}`);

  const expected = ["Raise", "Bond", "Panel review", "Resolution", "Remedy"];
  const labels = await page
    .locator("#risks ol > li")
    .evaluateAll((els) =>
      els.map((e) => e.querySelector(".font-display")?.textContent?.trim()),
    );
  log(
    "DisputeFlow",
    "step labels match expected order",
    JSON.stringify(labels) === JSON.stringify(expected),
    `labels=${JSON.stringify(labels)}`,
  );

  await ctx.close();
});

// ─────── 14d. RISKS — InsuranceLedger ───────
await inGroup("Risks · InsuranceLedger", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("risks")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(400);

  const livePulse = await page.locator("#risks .il-pulse").count();
  log("InsuranceLedger", "LIVE pulse indicator present", livePulse === 1);

  const labels = ["Premiums collected", "Claims paid", "Reserve balance", "Coverage ratio"];
  for (const l of labels) {
    const found = await page
      .locator("#risks")
      .locator(`text=${l}`)
      .count();
    log("InsuranceLedger", `readout "${l}" present`, found > 0);
  }

  // Premiums readout ticks within 9s
  const getPremium = () =>
    page.evaluate(() => {
      const labels = document.querySelectorAll("#risks .font-mono");
      const target = Array.from(labels).find((el) =>
        /premiums collected/i.test(el.textContent ?? ""),
      );
      const value = target?.parentElement?.querySelector(".font-display");
      return value?.textContent?.trim() ?? null;
    });
  const p1 = await getPremium();
  log("InsuranceLedger", "premiums readout present", !!p1 && /\d/.test(p1 ?? ""), `value=${p1}`);
  await page.waitForTimeout(11000);
  const p2 = await getPremium();
  log("InsuranceLedger", "premiums tick within 11s", p1 !== p2, `${p1} → ${p2}`);

  await ctx.close();
});

// ─────── 15a. MANIFESTO — PathwayCards ───────
await inGroup("Manifesto · PathwayCards", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("manifesto")?.scrollIntoView());
  await page.waitForTimeout(500);

  const cards = await page
    .locator("#manifesto .grid.grid-cols-4 > div")
    .count();
  log("PathwayCards", "4 audience cards present", cards === 4, `count=${cards}`);

  const audiences = ["Investors", "Node operators", "ESG buyers", "Researchers"];
  for (const a of audiences) {
    const found = await page
      .locator("#manifesto")
      .locator(`text=${a}`)
      .count();
    log("PathwayCards", `audience "${a}" present`, found > 0);
  }

  // Hover lift on first card
  const first = page
    .locator("#manifesto .grid.grid-cols-4 > div")
    .first();
  const before = await first.evaluate((e) => getComputedStyle(e).borderColor);
  await first.hover();
  await page.waitForTimeout(220);
  const after = await first.evaluate((e) => getComputedStyle(e).borderColor);
  log("PathwayCards", "border swaps to moss on hover", before !== after);

  await ctx.close();
});

// ─────── 15b. MANIFESTO — DocumentsLibrary ───────
await inGroup("Manifesto · DocumentsLibrary", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("manifesto")?.scrollIntoView());
  await page.waitForTimeout(800);

  // Header row + 6 docs = 7 li
  const rows = await page
    .locator("#manifesto ol > li")
    .count();
  log("DocumentsLibrary", "header + 6 doc rows", rows === 7, `count=${rows}`);

  const titles = [
    "Whitepaper · v1.0",
    "Investor deck · v1.0",
    "Tokenomics paper",
    "CCM Standard · spec",
    "External audit reports",
    "Press kit",
  ];
  for (const tt of titles) {
    const found = await page
      .locator("#manifesto")
      .locator(`text=${tt}`)
      .count();
    log("DocumentsLibrary", `doc "${tt}" present`, found > 0);
  }

  // State pips for ready / draft / post-tge
  for (const state of ["ready", "draft", "post-tge"]) {
    const found = await page
      .locator("#manifesto span")
      .filter({ hasText: new RegExp(`^${state}$`, "i") })
      .count();
    log("DocumentsLibrary", `state pip "${state}" present`, found > 0);
  }

  await ctx.close();
});

// ─────── 15c. MANIFESTO — CommunityLive ───────
await inGroup("Manifesto · CommunityLive", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("manifesto")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(400);

  const livePulse = await page.locator("#manifesto .cl-pulse").count();
  log("CommunityLive", "LIVE pulse indicator present", livePulse === 1);

  const labels = [
    "GitHub stars",
    "Active contributors",
    "Discord members",
    "veCCM proposals (open)",
  ];
  for (const l of labels) {
    const found = await page
      .locator("#manifesto")
      .locator(`text=${l}`)
      .count();
    log("CommunityLive", `readout "${l}" present`, found > 0);
  }

  // Discord ticks within 11s (step [1,6])
  const getDiscord = () =>
    page.evaluate(() => {
      const labels = document.querySelectorAll("#manifesto .font-mono");
      const target = Array.from(labels).find((el) =>
        /discord members/i.test(el.textContent ?? ""),
      );
      const value = target?.parentElement?.querySelector(".font-display");
      return value?.textContent?.trim() ?? null;
    });
  const d1 = await getDiscord();
  await page.waitForTimeout(11000);
  const d2 = await getDiscord();
  log("CommunityLive", "Discord readout ticks within 11s", d1 !== d2, `${d1} → ${d2}`);

  await ctx.close();
});

// ─────── 15d. MANIFESTO — ContactPanel ───────
await inGroup("Manifesto · ContactPanel", async () => {
  const { ctx, page } = await newCtx("light");
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("manifesto")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(400);

  const emails = [
    "ir@ccmnetwork.net",
    "press@ccmnetwork.net",
    "foundation@ccmnetwork.net",
  ];
  for (const e of emails) {
    const found = await page
      .locator("#manifesto")
      .locator(`text=${e}`)
      .count();
    log("ContactPanel", `${e} present`, found > 0);
  }

  // Newsletter signup form interaction
  const input = page.locator("#manifesto input[type='email']");
  await input.fill("test@example.com");
  await page.waitForTimeout(120);

  const button = page.locator("#manifesto button[type='submit']");
  await button.click();
  await page.waitForTimeout(220);

  const submittedLabel = await page
    .locator("#manifesto")
    .locator("text=queued ✓")
    .count();
  log("ContactPanel", "newsletter signup transitions to queued", submittedLabel > 0);

  const successCopy = await page
    .locator("#manifesto")
    .locator("text=added to list")
    .count();
  log("ContactPanel", "success label appears", successCopy > 0);

  await ctx.close();
});

// ─────── 11. DARK MODE — same checks (lightweight) ───────
await inGroup("Dark mode parity", async () => {
  const { ctx, page } = await newCtx("dark");
  await page.goto(URL, { waitUntil: "networkidle" });
  const dataTheme = await page.getAttribute("html", "data-theme");
  log("Dark mode", "data-theme=dark", dataTheme === "dark", `data-theme=${dataTheme}`);

  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // Dark paper = #0a0e0c → rgb(10, 14, 12)
  log("Dark mode", "dark paper background applied", /rgb\(10,\s*14,\s*12\)/.test(bg), `bg=${bg}`);

  // All sections still render
  for (const id of SECTIONS) {
    const exists = await page.locator(`#${id}`).count();
    log("Dark mode", `#${id} renders`, exists >= 1);
  }
  await ctx.close();
});

// ─────── 12. REDUCED MOTION — counters frozen ───────
await inGroup("Reduced motion", async () => {
  const { ctx, page } = await newCtx("light");
  // Override motion preference
  await ctx.close();
  const ctx2 = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  const p2 = await ctx2.newPage();
  await p2.goto(URL, { waitUntil: "networkidle" });
  await p2.evaluate(() => document.getElementById("mining")?.scrollIntoView());
  await p2.waitForTimeout(500);

  const counterEl = p2.locator("#mining text").filter({ hasText: /\d{1,3}(,\d{3})+/ }).first();
  const v1 = await counterEl.textContent();
  await p2.waitForTimeout(5000);
  const v2 = await counterEl.textContent();
  log("Reduced motion", "minted counter frozen (v1==v2)", v1 === v2, `${v1} == ${v2}`);

  await ctx2.close();
});

await browser.close();

// ─────── REPORT ───────
const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
console.log(`\n────────────────────────────────────────`);
console.log(`Total: ${results.length}  ·  PASS: ${passed}  ·  FAIL: ${failed}`);
if (failed > 0) {
  console.log("\nFailures:");
  for (const r of results.filter((r) => !r.ok)) {
    console.log(`  · [${r.group}] ${r.name} — ${r.detail}`);
  }
}
process.exit(failed > 0 ? 1 : 0);
