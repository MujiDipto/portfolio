import { expect, test } from "@playwright/test";
import { axe } from "./axe";

const palette = (page: import("@playwright/test").Page) =>
  page.getByRole("dialog", { name: "Command palette" });

test("Ctrl+K opens the palette; typing filters and Enter runs", async ({
  page,
}) => {
  await page.goto("/");
  const prompt = page.getByRole("textbox", { name: "Command" });
  await expect(prompt).toBeVisible();
  await page.keyboard.press("Control+K");
  await expect(palette(page)).toBeVisible();
  const search = page.getByRole("combobox", { name: "Search commands" });
  await expect(search).toBeFocused();
  await search.fill("graph");
  await expect(page.getByRole("option")).toHaveCount(1);
  await search.press("Enter");
  await expect(palette(page)).toBeHidden();
  await expect(page.getByRole("log")).toContainText("git log --graph");
  await expect(prompt).toBeFocused();
});

test("the arrow keys move through the list", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Command" }).waitFor();
  await page.keyboard.press("Control+K");
  const search = page.getByRole("combobox", { name: "Search commands" });
  const options = page.getByRole("option");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await search.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(search).toHaveAttribute(
    "aria-activedescendant",
    (await options.nth(1).getAttribute("id"))!,
  );
  await search.press("ArrowUp");
  await search.press("ArrowUp");
  await expect(options.last()).toHaveAttribute("aria-selected", "true");
});

test("Escape closes it and returns to the prompt", async ({ page }) => {
  await page.goto("/");
  const prompt = page.getByRole("textbox", { name: "Command" });
  await expect(prompt).toBeFocused();
  await page.keyboard.press("Control+K");
  await expect(palette(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette(page)).toBeHidden();
  await expect(prompt).toBeFocused();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("the title bar's menu button opens it, and a tap runs a command", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "menu", exact: true }).tap();
    await expect(palette(page)).toBeVisible();
    await page.getByRole("option", { name: /cat contact/ }).tap();
    await expect(palette(page)).toBeHidden();
    await expect(page.getByRole("log")).toContainText("cat contact");
  });
});

for (const theme of ["light", "dark"] as const) {
  test(`the open palette passes axe in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((t) => {
      if (t === "light") localStorage.setItem("theme", "light");
    }, theme);
    await page.goto("/");
    await page.getByRole("textbox", { name: "Command" }).waitFor();
    await page.keyboard.press("Control+K");
    await expect(palette(page)).toBeVisible();
    expect(await axe(page).analyze()).toMatchObject({ violations: [] });
  });
}
