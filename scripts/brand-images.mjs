// Makes the site's icons and link-preview card. Requires `npm run build` first.
//   app/icon.png, app/apple-icon.png: Sudo's head, from assets/sudo-source.webp
//   app/opengraph-image.png: the real first screen, scaled to 1200x630, so the card
//     always matches the site's content and fonts
// Rerun after changing the opening or the cat, and commit the results.
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const port = 3400;
const url = `http://localhost:${port}/`;
// Sudo's head and helmet in the 1229x1280 source art.
const head = { x: 335, y: 230, size: 600 };

async function waitForServer(deadline = Date.now() + 60_000) {
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not respond at ${url} within 60 seconds`);
}

/** Crops Sudo's head, mirrored to face right as on the site, onto a square. */
async function icon(page, source, size, background) {
  const data = await page.evaluate(
    async ({ source, size, background, head }) => {
      const img = new Image();
      img.src = source;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);
      }
      // A solid background needs breathing room; a transparent icon does not.
      const inset = background ? Math.round(size * 0.12) : 0;
      ctx.imageSmoothingQuality = "high";
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        img,
        head.x,
        head.y,
        head.size,
        head.size,
        inset,
        inset,
        size - inset * 2,
        size - inset * 2,
      );
      return canvas.toDataURL("image/png");
    },
    { source, size, background, head },
  );
  return Buffer.from(data.split(",")[1], "base64");
}

const browser = await chromium.launch();
const server = spawn("npx", ["next", "start", "--port", String(port)], {
  stdio: "ignore",
  detached: true,
});

try {
  const page = await browser.newPage();
  const source = `data:image/webp;base64,${(
    await readFile("assets/sudo-source.webp")
  ).toString("base64")}`;
  await writeFile("app/icon.png", await icon(page, source, 64));
  // iOS draws home-screen icons on a solid square: Ayu dark's window colour.
  await writeFile(
    "app/apple-icon.png",
    await icon(page, source, 180, "#0b0e14"),
  );

  await waitForServer();
  // A laptop-sized viewport in the card's shape, scaled down to 1200x630, so
  // the whole first screen (whoami and highlights) fits in the card.
  const card = await browser.newPage({
    viewport: { width: 1520, height: 798 },
    deviceScaleFactor: 1200 / 1520,
    reducedMotion: "reduce",
  });
  await card.goto(url);
  await card.locator('[data-cat][data-state="up"]').waitFor();
  await card.screenshot({ path: "app/opengraph-image.png" });
  console.log(
    "Wrote app/icon.png, app/apple-icon.png, app/opengraph-image.png",
  );
} finally {
  await browser.close();
  process.kill(-server.pid);
}
