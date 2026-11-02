import { expect, test } from "@playwright/test";
import { axe } from "./axe";
import { contact, projects } from "../lib/content";

test("typing a command shows its output and keeps the prompt ready", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Command" });
  await input.fill("git log");
  await input.press("Enter");
  // A git log highlight; whoami already names the titles.
  await expect(page.getByText(/common schema for NVD and OSV/)).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
});

test("a visitor can reach contact details without typing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "cat contact" }).click();
  await expect(
    page.getByRole("link", { name: contact.email.label }),
  ).toHaveAttribute("href", contact.email.href);
});

test("typing shows a hint in line with the text, and Tab accepts it", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Command" });
  await input.pressSequentially("gi");
  const hint = page.locator("[data-hint]");
  await expect(hint).toHaveText("git log");
  // The hint is drawn in the input's font from the same left edge, so its
  // letters sit exactly after the typed ones.
  const styles = await page.evaluate(() => {
    const pick = (el: Element) => {
      const s = getComputedStyle(el);
      return [s.fontFamily, s.fontSize, s.letterSpacing].join("|");
    };
    return [
      pick(document.querySelector("#command")!),
      pick(document.querySelector("[data-hint]")!),
    ];
  });
  expect(styles[0]).toBe(styles[1]);
  expect((await hint.boundingBox())!.x).toBe((await input.boundingBox())!.x);
  await input.press("Tab");
  await expect(input).toHaveValue("git log");
  await expect(input).toBeFocused();
});

test("clicking anywhere in the window puts the caret in the prompt", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Command" });
  await expect(input).toBeVisible();
  await input.blur();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(input).toBeFocused();
  await page.keyboard.type("help");
  await expect(input).toHaveValue("help");
});

test("selecting text in the window does not steal it for the prompt", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Command" });
  await expect(input).toBeVisible();
  await input.blur();
  // Double-click the first word itself, not the empty end of its line.
  await page
    .getByRole("heading", { level: 1 })
    .dblclick({ position: { x: 10, y: 10 } });
  await expect(input).not.toBeFocused();
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
    "Muji",
  );
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("matching commands narrow as you type and can be tapped", async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Command" });
    await input.tap();
    await input.pressSequentially("ls");
    await expect(page.getByText("matching:")).toBeVisible();
    await page.getByRole("button", { name: "ls projects/" }).tap();
    await expect(
      page.getByRole("button", { name: `${projects[0].slug}/` }),
    ).toBeVisible();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the whole session is printed", async ({ page }) => {
    await page.goto("/");
    // Playwright's text and role finders skip <noscript>, so read the
    // rendered text instead; innerText only includes text that is displayed.
    const shown = await page.locator("main").innerText();
    for (const text of [
      "Security Analyst",
      ...projects.map((p) => p.name),
      contact.email.label,
    ]) {
      expect(shown).toContain(text);
    }
    await expect(page.getByRole("textbox", { name: "Command" })).toHaveCount(0);
  });
});

for (const theme of ["light", "dark"] as const) {
  test(`every command's output passes axe in ${theme} mode`, async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Command" });
    const commands = [
      "help",
      "git log",
      "ls projects/",
      ...projects.map((p) => `open ${p.slug}`),
      "cat skills.txt",
      "cat education.md",
      "cat contact",
      "xyz",
      `theme ${theme}`,
    ];
    for (const command of commands) {
      await input.fill(command);
      await input.press("Enter");
    }
    const results = await axe(page).analyze();
    expect(results.violations).toEqual([]);
  });
}
