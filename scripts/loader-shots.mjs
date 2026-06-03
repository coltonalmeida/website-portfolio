// Capture the loading-screen animation at several points in its count-up.
// Usage: node scripts/loader-shots.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "screenshots");
mkdirSync(OUT, { recursive: true });
const BASE = process.argv[2] || "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const launchArgs = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
  "--enable-webgl",
];

async function run(context, prefix) {
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "commit" });
  // Grab frames early in the count-up before the overlay fades.
  const stops = [250, 800, 1500, 2300, 3200];
  let i = 1;
  let prev = 0;
  for (const t of stops) {
    await sleep(t - prev);
    prev = t;
    await page.screenshot({ path: join(OUT, `${prefix}-loader-0${i}.png`) });
    console.log(`saved ${prefix}-loader-0${i}.png @ ${t}ms`);
    i++;
  }
  await page.close();
}

const browser = await chromium.launch({ headless: true, args: launchArgs });
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await run(desktop, "desktop");
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  await run(mobile, "mobile");
  await mobile.close();
} finally {
  await browser.close();
}
console.log("Done.");
