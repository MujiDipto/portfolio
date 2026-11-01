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

for (const [tab, heading] of [
  ["about", "About"],
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["contact", "Contact"],
]) {
  test(`the ${tab} tab reaches its section`, async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Sections" });
    await nav.getByRole("link", { name: tab, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${tab}$`));
    // Section headings are visually hidden, so check the section is in view.
    const section = page.locator(`section#${tab}`);
    await expect(section).toBeInViewport();
    await expect(
      section.getByRole("heading", { level: 2, name: heading }),
    ).toHaveCount(1);
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
