import { expect, test } from "@playwright/test";
import { highlightLines } from "../lib/content";

const lastLine = highlightLines.at(-1)!;

test("the opening finishes and the prompt is ready within two seconds", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Command" });
  await expect(input).toBeVisible({ timeout: 2000 });
  await expect(page.getByText(lastLine)).toHaveCSS("opacity", "1");
});

test("pressing a key skips the opening at once", async ({ page }) => {
  await page.goto("/");
  // Typing has started, so the page is hydrated and listening for keys. A key
  // pressed before that is ignored and the opening simply plays out.
  await page.locator("[data-boot-typed]").waitFor();
  await page.keyboard.press("Space");
  await expect(page.getByRole("textbox", { name: "Command" })).toBeVisible({
    timeout: 300,
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("everything appears without animation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("textbox", { name: "Command" })).toBeVisible({
      timeout: 300,
    });
    await expect(page.getByText(lastLine)).toHaveCSS("opacity", "1");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the opening is fully visible, not stuck mid-animation", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText(lastLine)).toHaveCSS("opacity", "1");
    await expect(page.getByText("cat highlights.md")).toHaveCSS("opacity", "1");
  });
});
