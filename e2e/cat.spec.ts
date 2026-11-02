import { expect, test, type Page } from "@playwright/test";

const bubble = (page: Page) => page.getByRole("group", { name: "Sudo says" });
const cat = (page: Page) => page.locator("[data-cat]");

async function run(page: Page, command: string) {
  const input = page.getByRole("textbox", { name: "Command" });
  await input.fill(command);
  await input.press("Enter");
}

test("the cat rises from behind the window as the opening finishes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(cat(page)).toHaveAttribute("data-state", /down|rising/);
  await expect(page.getByRole("textbox", { name: "Command" })).toBeVisible();
  // Arrival and the prompt land within a frame or two of each other.
  await expect(bubble(page)).toBeVisible({ timeout: 300 });
  await expect(cat(page)).toHaveAttribute("data-state", "up");
  // The picture loaded, drawn at half its size so it stays sharp.
  const img = cat(page).locator("img");
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(
    98,
  );
  expect((await img.boundingBox())!.height).toBeCloseTo(52, 0);
});

test("while it is down, the window hides it", async ({ page }) => {
  await page.goto("/");
  await expect(cat(page)).toHaveAttribute("data-state", "down");
  const box = (await cat(page).boundingBox())!;
  const layer = (await page.locator("#cat-layer").boundingBox())!;
  expect(box.y).toBeGreaterThan(layer.y); // below the window's top edge
  const onTop = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x, y)?.closest("[data-cat]") !== null,
    [box.x + box.width / 2, box.y + box.height / 2],
  );
  expect(onTop).toBe(false);
});

const animation = (page: Page) =>
  cat(page)
    .locator(".cat-body")
    .evaluate((el) => getComputedStyle(el).animationName);

test("its bubble is one line, and its help button runs help", async ({
  page,
}) => {
  await page.goto("/");
  await expect(bubble(page)).toHaveText(
    "Hi, I’m Sudo! Run help to see what you can do.",
  );
  // One line: the first and last letters sit at the same height.
  const drift = await bubble(page)
    .locator("p")
    .evaluate((el) => {
      const top = (node: Node, offset: number) => {
        const range = document.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        return range.getBoundingClientRect().top;
      };
      const first = el.firstChild!;
      const last = el.lastChild!;
      return Math.abs(top(first, 0) - top(last, last.textContent!.length - 1));
    });
  expect(drift).toBeLessThan(2);
  await bubble(page).getByRole("button", { name: "help" }).click();
  await expect(page.getByText("switch colours")).toBeVisible();
});

test("it stays put until a command runs, then pops up somewhere new", async ({
  page,
}) => {
  await page.goto("/");
  await expect(bubble(page)).toBeVisible();
  const arrived = await cat(page).getAttribute("data-x");
  await page.waitForTimeout(1500);
  await expect(cat(page)).toHaveAttribute("data-x", arrived!);

  await run(page, "whoami");
  await expect(cat(page)).toHaveAttribute("data-state", "sinking");
  await expect(bubble(page)).toBeHidden();
  await expect(cat(page)).toHaveAttribute("data-state", "up");
  expect(await cat(page).getAttribute("data-x")).not.toBe(arrived);
  expect(await animation(page)).toBe("cat-bob");
});

test("hovering makes it angry", async ({ page }) => {
  await page.goto("/");
  await expect(bubble(page)).toBeVisible();
  await cat(page).hover();
  await expect(cat(page)).toHaveAttribute("data-mood", "angry");
  await expect.poll(() => animation(page)).toBe("cat-shake");
  await page.mouse.move(5, 5);
  await expect(cat(page)).toHaveAttribute("data-mood", "calm");
});

test("wherever it pops up, it sits on the top edge and never scrolls the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(bubble(page)).toBeVisible();
  // The cat layer has the same box as the window.
  const layer = (await page.locator("#cat-layer").boundingBox())!;
  for (let i = 0; i < 8; i++) {
    await run(page, "whoami");
    await expect(cat(page)).toHaveAttribute("data-state", "sinking");
    await expect(cat(page)).toHaveAttribute("data-state", "up");
    const box = (await cat(page).boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(layer.y + 1);
    // Clear of the rounded corners.
    expect(box.x).toBeGreaterThanOrEqual(layer.x + 16);
    expect(box.x + box.width).toBeLessThanOrEqual(layer.x + layer.width - 16);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  }
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("it never moves, even after a command", async ({ page }) => {
    await page.goto("/");
    await expect(bubble(page)).toBeVisible({ timeout: 2000 });
    const still = await cat(page).getAttribute("data-x");
    await run(page, "whoami");
    await page.waitForTimeout(800);
    await expect(cat(page)).toHaveAttribute("data-x", still!);
    await expect(cat(page)).toHaveAttribute("data-state", "up");
    expect(await animation(page)).toBe("none");
    await cat(page).hover();
    await expect(cat(page)).toHaveAttribute("data-mood", "angry");
    expect(await animation(page)).toBe("none");
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("a still cat sits in the title bar and suggestions stay under the prompt", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("header [data-cat-static] img")).toBeVisible();
    await expect(bubble(page)).toBeHidden();
    await expect(
      page.getByRole("button", { name: "cat contact" }),
    ).toBeVisible();
  });
});
