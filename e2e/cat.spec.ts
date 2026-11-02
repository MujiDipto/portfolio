import { expect, test, type Page } from "@playwright/test";
import { contact } from "../lib/content";

const bubble = (page: Page) =>
  page.getByRole("group", { name: "Suggested commands" });
const cat = (page: Page) => page.locator("[data-cat]");

async function run(page: Page, command: string) {
  const input = page.getByRole("textbox", { name: "Command" });
  await input.fill(command);
  await input.press("Enter");
}

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

test("the cat walks in during the opening and arrives with the prompt", async ({
  page,
}) => {
  await page.goto("/");
  await expect(cat(page)).toHaveAttribute("data-moving", "true");
  await expect(page.getByRole("textbox", { name: "Command" })).toBeVisible();
  // Arrival and the prompt land within a frame or two of each other.
  await expect(bubble(page)).toBeVisible({ timeout: 300 });
  await expect(cat(page)).toHaveAttribute("data-moving", "false");
  // The picture loaded, drawn at half its size so it stays sharp.
  const img = cat(page).locator("img");
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(
    98,
  );
  expect((await img.boundingBox())!.height).toBeCloseTo(52, 0);
});

const animation = (page: Page) =>
  cat(page)
    .locator(".cat-body")
    .evaluate((el) => getComputedStyle(el).animationName);

test("its bubble's commands run", async ({ page }) => {
  await page.goto("/");
  await bubble(page).getByRole("button", { name: "cat contact" }).click();
  await expect(
    page.getByRole("link", { name: contact.email.label }),
  ).toBeVisible();
});

test("it stays still until a command runs, then walks somewhere new", async ({
  page,
}) => {
  await page.goto("/");
  await expect(bubble(page)).toBeVisible();
  const arrived = await cat(page).getAttribute("data-x");
  await page.waitForTimeout(1500);
  await expect(cat(page)).toHaveAttribute("data-x", arrived!);

  await run(page, "whoami");
  await expect(cat(page)).toHaveAttribute("data-moving", "true");
  expect(await animation(page)).toBe("cat-waddle");
  await expect(bubble(page)).toBeHidden();
  await expect(cat(page)).toHaveAttribute("data-moving", "false", {
    timeout: 15000,
  });
  expect(await cat(page).getAttribute("data-x")).not.toBe(arrived);
  // With the bubble gone, the suggestions return under the prompt.
  await expect(page.getByRole("button", { name: "cat contact" })).toBeVisible();
});

test("hovering makes it angry", async ({ page }) => {
  await page.goto("/");
  await expect(bubble(page)).toBeVisible();
  await cat(page).hover();
  await expect(cat(page)).toHaveAttribute("data-mood", "angry");
  await page.mouse.move(5, 5);
  await expect(cat(page)).toHaveAttribute("data-mood", "calm");
});

test("wherever it walks, it never covers the terminal or scrolls the page", async ({
  page,
}) => {
  test.setTimeout(60_000); // eight walks of up to about four seconds each
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(bubble(page)).toBeVisible();
  const terminal = (await page.locator("#content").boundingBox())!;
  for (let i = 0; i < 8; i++) {
    await run(page, "whoami");
    await expect(cat(page)).toHaveAttribute("data-moving", "false", {
      timeout: 15000,
    });
    // It walks along the top edge only, above the window.
    expect((await cat(page).boundingBox())!.y + 1).toBeLessThan(terminal.y);
    expect(overlaps((await cat(page).boundingBox())!, terminal)).toBe(false);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  }
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("it never walks, even after a command", async ({ page }) => {
    await page.goto("/");
    await expect(bubble(page)).toBeVisible({ timeout: 2000 });
    const still = await cat(page).getAttribute("data-x");
    await run(page, "whoami");
    await page.waitForTimeout(800);
    await expect(cat(page)).toHaveAttribute("data-x", still!);
    await expect(cat(page)).toHaveAttribute("data-moving", "false");
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
