import { expect, test } from "@playwright/test";
import { axe } from "./axe";

test("home page has language, title and the name as main heading", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Muji Dipto | Senior Software Engineer");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Muji Dipto",
  );
});

test("starts in Ayu dark even when the system prefers light", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  // #06080b, the Ayu dark page colour.
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(6, 8, 11)",
  );
});

test("there is no theme button; the theme command is the way to switch", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /theme/i })).toHaveCount(0);
});

test("theme light switches to Ayu Light and the choice survives a reload", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Command" });
  await input.fill("theme light");
  await input.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  // #e7e9eb, the Ayu Light page colour.
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(231, 233, 235)",
  );
});

for (const theme of ["light", "dark"] as const) {
  test(`home page has no WCAG 2.2 AA violations in ${theme} mode`, async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Command" });
    if (theme === "light") {
      await input.fill("theme light");
      await input.press("Enter");
    }
    // Check the finished opening, not a frame of the animation.
    await expect(input).toBeVisible();
    const results = await axe(page).analyze();
    expect(results.violations).toEqual([]);
  });
}

// Wrapped controls sit closer together on a phone, where touch target size
// (WCAG 2.5.8) matters most.
// 412px is the width Lighthouse emulates.
for (const width of [375, 412]) {
  test.describe(`on a ${width}px phone`, () => {
    test.use({ viewport: { width, height: 823 }, hasTouch: true });

    test("home page has no WCAG 2.2 AA violations", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "cat contact" }).waitFor();
      const results = await axe(page).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
