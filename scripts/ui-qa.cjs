const path = require("node:path");
const puppeteer = require("puppeteer-core");

const EDGE =
  process.env.EDGE_PATH ||
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOT_DIR || path.resolve(__dirname, "..", "screenshots");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const errors = [];
const results = [];

async function openPage(browser, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return page;
}

async function goto(page, route) {
  const response = await page.goto(`${BASE}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await sleep(1100);
  return response?.status() ?? 0;
}

async function shot(page, name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

async function checkRoute(page, route, name, wait = 1100) {
  const status = await goto(page, route);
  await sleep(wait);
  const ok = status === 200 || status === 304;
  results.push({ page: name, path: route, status, ok });
  await shot(page, name);
}

(async () => {
  try {
    const probe = await fetch(`${BASE}/api/v1/status`);
    if (!probe.ok) throw new Error(`status ${probe.status}`);
  } catch (error) {
    console.error(`UI QA needs a running server at ${BASE}. Start it with: npm run dev`);
    console.error(error);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: "new",
    protocolTimeout: 180000,
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
  });

  let page = await openPage(browser, { width: 1440, height: 900 });
  await checkRoute(page, "/", "home-1440", 3000);
  await shot(page, "home-hero-1440");

  const hero = await page.evaluate(() => {
    const canvas = document.querySelector("canvas[data-cinematic-webgl]");
    if (!canvas) return { canvas: false, nonTransparent: 0 };
    const off = document.createElement("canvas");
    off.width = 160;
    off.height = 100;
    const context = off.getContext("2d");
    context.drawImage(canvas, 0, 0, 160, 100);
    const data = context.getImageData(0, 0, 160, 100).data;
    let nonTransparent = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 10) nonTransparent += 1;
    }
    return { canvas: true, nonTransparent };
  });
  results.push({
    page: "home-hero-canvas",
    path: "/",
    status: 200,
    ok: hero.canvas && hero.nonTransparent > 500,
  });
  await page.close();

  page = await openPage(browser, { width: 1440, height: 900 });
  for (const [name, route] of [
    ["datasets-1440", "/datasets"],
    ["dataset-detail-1440", "/datasets/DEMO_LUNG_ADENO_01"],
    ["atlas-1440", "/atlas"],
    ["browser-tp53-1440", "/browser?q=TP53"],
    ["compare-1440", "/compare"],
    ["downloads-1440", "/downloads"],
    ["methods-1440", "/methods"],
    ["about-1440", "/about"],
  ]) {
    await checkRoute(page, route, name);
  }
  await page.close();

  page = await openPage(browser, { width: 1024, height: 768 });
  for (const [name, route] of [
    ["datasets-1024", "/datasets"],
    ["atlas-1024", "/atlas"],
  ]) {
    await checkRoute(page, route, name);
  }
  await page.close();

  page = await openPage(browser, { width: 390, height: 844 });
  for (const [name, route] of [
    ["datasets-390", "/datasets"],
    ["atlas-390", "/atlas"],
    ["browser-390", "/browser?q=TP53"],
    ["compare-390", "/compare"],
    ["downloads-390", "/downloads"],
  ]) {
    await checkRoute(page, route, name);
  }
  await goto(page, "/atlas");
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find(
      (item) => item.textContent?.trim() === "Filters",
    );
    button?.click();
  });
  await sleep(300);
  await shot(page, "atlas-filter-drawer-390");
  await page.close();

  page = await openPage(browser, { width: 1440, height: 900 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  const reducedStatus = await goto(page, "/");
  await sleep(900);
  const reduced = await page.evaluate(() => ({
    webgl: Boolean(document.querySelector("canvas[data-cinematic-webgl]")),
    fallback: Boolean(document.querySelector("canvas[data-cinematic-fallback]")),
  }));
  results.push({
    page: "home-reduced-motion",
    path: "/",
    status: reducedStatus,
    ok: !reduced.webgl && reduced.fallback,
  });
  await shot(page, "home-reduced-1440");
  await page.close();

  await browser.close();

  console.log(JSON.stringify({ results, errors }, null, 2));
  console.log(`Screenshots written to ${SHOTS}`);
  if (results.some((result) => !result.ok) || errors.length > 0) {
    process.exitCode = 1;
  }
})();
