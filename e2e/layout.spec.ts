import { expect, test } from "@playwright/test";

test("on desktop the prompt is focused on load, ready to type", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("textbox", { name: "Command" })).toBeFocused();
});

test.describe("on a touch device", () => {
  test.use({ isMobile: true, hasTouch: true });

  test("the prompt is not focused on load, so the keyboard stays closed", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("textbox", { name: "Command" }),
    ).not.toBeFocused();
  });
});

test.describe("when focus starts at the top of the page", () => {
  test.use({ isMobile: true, hasTouch: true });

  test("the skip link is the first stop and moves focus to the content", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page.locator("#content")).toBeFocused();
  });
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
    const input = page.getByRole("textbox", { name: "Command" });
    await input.fill("git log");
    await input.press("Enter");
    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(pageOverflow).toBeLessThanOrEqual(0);
    const scrolls = await page
      .locator("#content")
      .evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(scrolls).toBe(true);
  });

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

test("the prompt decoration is hidden from assistive technology", async ({
  page,
}) => {
  await page.goto("/");
  const prefixes = page.locator("[data-prompt-prefix]");
  await expect(prefixes.first()).toHaveAttribute("aria-hidden", "true");
});
