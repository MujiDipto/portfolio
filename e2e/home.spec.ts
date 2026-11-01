import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

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

test("starts in light mode even when the system prefers dark", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  // #f7f4ef, the light page colour.
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(247, 244, 239)",
  );
});

test("theme button switches to dark and the choice survives a reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "Dark theme" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

for (const theme of ["light", "dark"] as const) {
  test(`home page has no WCAG 2.2 AA violations in ${theme} mode`, async ({
    page,
  }) => {
    await page.goto("/");
    if (theme === "dark") {
      await page.getByRole("button", { name: "Dark theme" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    }
    // Check the finished opening, not a frame of the animation.
    await expect(page.getByRole("textbox", { name: "Command" })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
  });
}
