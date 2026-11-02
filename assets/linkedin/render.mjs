// Renders banner.html to linkedin-banner.png (1584x396, LinkedIn's size) and
// sharper @2x, @4x and @5x copies. 5x is 7920px wide, under the 8000px limit
// some uploaders set; LinkedIn accepts up to 8 MB. Run from the repo root:
//   node assets/linkedin/render.mjs
import path from "node:path";
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
try {
  for (const scale of [1, 2, 4, 5]) {
    const page = await browser.newPage({
      viewport: { width: 1584, height: 396 },
      deviceScaleFactor: scale,
    });
    await page.goto(`file://${path.join(import.meta.dirname, "banner.html")}`);
    await page.evaluate(() => document.fonts.ready);
    const name =
      scale === 1 ? "linkedin-banner.png" : `linkedin-banner@${scale}x.png`;
    await page.screenshot({ path: path.join(import.meta.dirname, name) });
  }
} finally {
  await browser.close();
}
