// Capture screenshots of the running dev server (Toronto night scene) with
// headless Chromium + software WebGL (SwiftShader). Saves PNGs to screenshots/.
//
// Usage:  node scripts/screenshots.mjs [baseUrl]
// Requires the dev server running (npm run dev) at baseUrl (default :3000).

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "screenshots");
mkdirSync(OUT, { recursive: true });

const BASE = process.argv[2] || "http://localhost:3000";

const ZONES = ["Experience", "Projects", "Skills", "Contact"];

const launchArgs = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
  "--enable-webgl",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function capture(context, prefix, { withZones }) {
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") console.log(`  [console.error] ${m.text()}`);
  });
  page.on("pageerror", (e) => console.log(`  [pageerror] ${e.message}`));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 30000 });
  await sleep(3500); // first render + camera settle + reflections

  // Quick WebGL sanity check.
  const gl = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    const ctx = c && (c.getContext("webgl2") || c.getContext("webgl"));
    return ctx ? ctx.getParameter(ctx.VERSION) : "NO-WEBGL";
  });
  console.log(`  ${prefix}: WebGL = ${gl}`);

  await page.screenshot({ path: join(OUT, `${prefix}-01-default.png`) });
  console.log(`  saved ${prefix}-01-default.png`);

  if (withZones) {
    let i = 2;
    for (const zone of ZONES) {
      await page.getByRole("button", { name: zone, exact: true }).click();
      await sleep(2600); // camera fly + overlay
      const name = `${prefix}-0${i}-${zone.toLowerCase()}.png`;
      await page.screenshot({ path: join(OUT, name) });
      console.log(`  saved ${name}`);
      i++;
    }
  } else {
    // Mobile: just one zone to show the overlay layout.
    await page.getByRole("button", { name: "Projects", exact: true }).click();
    await sleep(2600);
    await page.screenshot({ path: join(OUT, `${prefix}-02-projects.png`) });
    console.log(`  saved ${prefix}-02-projects.png`);
  }

  await page.close();
}

const browser = await chromium.launch({ headless: true, args: launchArgs });
try {
  console.log("Desktop (1440x900)…");
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await capture(desktop, "desktop", { withZones: true });
  await desktop.close();

  console.log("Mobile (390x844)…");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await capture(mobile, "mobile", { withZones: false });
  await mobile.close();
} finally {
  await browser.close();
}
console.log("Done.");
