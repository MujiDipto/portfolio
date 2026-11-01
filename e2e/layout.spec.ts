import { expect, test } from "@playwright/test";

test("skip link is the first stop and moves focus to the content", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
});

for (const viewport of [
  { width: 375, height: 812 },
  { width: 1280, height: 800 },
]) {
  test(`at ${viewport.width}px the page fits the screen and only the terminal scrolls`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const page_overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(page_overflow).toBeLessThanOrEqual(0);
    const terminal = page.locator("#content");
    const scrolls = await terminal.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    expect(scrolls).toBe(true);
  });
}

test("project list links reach each project", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "vuln-curation/" }).click();
  await expect(page).toHaveURL(/#project-vuln-curation$/);
  await expect(
    page.getByRole("heading", { name: "CocoaPods vulnerability curation" }),
  ).toBeInViewport();
});

test("terminal decoration is hidden from assistive technology", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("whoami")).toHaveAttribute("aria-hidden", "true");
});

for (const viewport of [
  { width: 375, height: 812 },
  { width: 1280, height: 800 },
]) {
  test(`no horizontal scrolling at ${viewport.width}px wide`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
