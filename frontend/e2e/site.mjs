// End-to-end smoke test for ccmnetwork.net after the 2026-09 home redesign.
// Covers: the eight home chapters and their order, page height budget,
// chapter rail visibility by viewport, nav links + sub-page routes, legacy
// redirects, theme toggle persistence, the wrap slider, testnet readout
// honesty (no hard-coded "live" numbers, no pulse dots).
//
// Prerequisites
//   1. Vite dev server on http://localhost:5173 (npm run dev)
//   2. Chromium for Playwright (one-time): npx playwright install chromium
//   3. E2E_URL overrides the base URL for deployed previews.

import { chromium } from "playwright";

const BASE = (process.env.E2E_URL ?? "http://localhost:5173").replace(/\/$/, "");
const HOME_CHAPTERS = [
  "vision", "problem", "trinity", "wrap", "grades", "tokenomics", "roadmap", "manifesto",
];
const NAV = [
  ["/market", "Market"],
  ["/protocol", "Protocol"],
  ["/token", "Token"],
  ["/defi", "DeFi"],
  ["/whitepaper", "Whitepaper"],
];
const SUBPAGES = ["/market", "/protocol", "/token", "/roadmap"];

const results = [];
const log = (group, name, ok, detail = "") => {
  results.push({ group, name, ok, detail });
  process.stdout.write(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? `  — ${detail}` : ""}\n`);
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

async function newCtx({ width = 1440, height = 900, theme = "dark", reducedMotion } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    colorScheme: theme,
    reducedMotion,
  });
  await ctx.addInitScript((t) => localStorage.setItem("ccm-theme", t), theme);
  const page = await ctx.newPage();
  return { ctx, page };
}

// ─────── 1. HOME STRUCTURE ───────
await inGroup("Home structure", async () => {
  const { ctx, page } = await newCtx();
  const resp = await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  log("Home", "HTTP 200", resp?.status() === 200, `status ${resp?.status()}`);
  log("Home", "title contains CCM", /CCM/.test(await page.title()));

  const ids = await page.$$eval("main section[id]", (els) => els.map((e) => e.id));
  log("Home", "eight chapters in order", JSON.stringify(ids) === JSON.stringify(HOME_CHAPTERS), ids.join(","));

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  log("Home", "page height under 12,000px", height < 12000, `${height}px`);

  const railItems = await page.locator("nav[aria-label='Chapters'] a").count();
  log("Home", "chapter rail has 8 items", railItems === 8, `count=${railItems}`);
  const railVisible = await page.locator("nav[aria-label='Chapters']").isVisible();
  log("Home", "chapter rail visible at 1440", railVisible);

  await page.setViewportSize({ width: 1024, height: 900 });
  const railHidden = !(await page.locator("nav[aria-label='Chapters']").isVisible());
  log("Home", "chapter rail hidden at 1024", railHidden);

  const deeper = await page.locator("a.chapter-deeper").count();
  log("Home", "six deeper links", deeper === 6, `count=${deeper}`);
  await ctx.close();
});

// ─────── 2. NAV + SUB-PAGES + REDIRECTS ───────
await inGroup("Navigation", async () => {
  const { ctx, page } = await newCtx();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const links = await page.$$eval("header nav a", (as) =>
    as.map((a) => [a.getAttribute("href"), a.textContent?.trim()]),
  );
  const expected = NAV.map(([href]) => href);
  const actual = links.map(([href]) => href);
  log("Nav", "five route links in order", JSON.stringify(actual) === JSON.stringify(expected), actual.join(" "));

  for (const path of SUBPAGES) {
    const r = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const h1 = await page.locator("main h1").first().textContent();
    log("Nav", `${path} renders`, r?.status() === 200 && !!h1?.trim(), `h1=${h1?.trim().slice(0, 40)}`);
    const rail = await page.locator("nav[aria-label='Chapters'] a").count();
    log("Nav", `${path} has chapter rail`, path === "/roadmap" ? rail === 0 : rail > 0, `count=${rail}`);
  }

  await page.goto(`${BASE}/ccmine`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const u1 = new URL(page.url());
  log("Nav", "/ccmine → /protocol#mining", u1.pathname === "/protocol" && u1.hash === "#mining", page.url());
  await page.goto(`${BASE}/tokenomics`, { waitUntil: "networkidle" });
  log("Nav", "/tokenomics → /token", new URL(page.url()).pathname === "/token", page.url());
  await ctx.close();
});

// ─────── 3. THEME TOGGLE ───────
await inGroup("Theme toggle", async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const before = await page.getAttribute("html", "data-theme");
  await page.click("button[aria-label='Toggle theme']");
  await page.waitForTimeout(150);
  const after = await page.getAttribute("html", "data-theme");
  log("Theme", "theme flips", before !== after, `${before} → ${after}`);
  await page.reload({ waitUntil: "networkidle" });
  const persisted = await page.getAttribute("html", "data-theme");
  log("Theme", "theme survives reload", persisted === after, `after reload=${persisted}`);
  await ctx.close();
});

// ─────── 4. WRAP SLIDER ───────
await inGroup("Wrap slider", async () => {
  const { ctx, page } = await newCtx();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const slider = page.locator("#wrap input[type='range']");
  await slider.fill("2500");
  const readouts = await page.locator("#wrap .font-display").allTextContents();
  const hits = readouts.filter((t) => t.trim() === "2,500").length;
  log("Wrap", "both readouts follow the slider", hits === 2, `matches=${hits}`);
  await ctx.close();
});

// ─────── 5. READOUT HONESTY ───────
await inGroup("Readout honesty", async () => {
  const { ctx, page } = await newCtx({ reducedMotion: "reduce" });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const minted = (await page.getByTestId("readout-minted").textContent())?.trim() ?? "";
  log("Readout", "hero supply is — or digits", /^(—|[\d,]+)$/.test(minted), minted);
  log("Readout", "old literal 1,284,003 gone", !(await page.content()).includes("1,284,003"));
  const body = (await page.locator("main").innerText()).toLowerCase();
  log("Readout", "no 'live ·' labels on home", !body.includes("live ·"));
  // PhaseTrack keeps a pulsing "current phase" marker — a UI cue, not a
  // fake live-data indicator — so the roadmap chapter is excluded here.
  const pulses = await page.evaluate(() =>
    [...document.querySelectorAll("main [class*='-pulse']")].filter((el) => !el.closest("#roadmap")).length,
  );
  log("Readout", "no live-data pulse dots on home (outside #roadmap)", pulses === 0, `count=${pulses}`);
  await ctx.close();
});

await browser.close();

const failed = results.filter((r) => !r.ok);
process.stdout.write(`\n${results.length - failed.length}/${results.length} passed\n`);
if (failed.length) {
  for (const f of failed) process.stdout.write(`  ✗ ${f.group} › ${f.name} ${f.detail}\n`);
  process.exit(1);
}
