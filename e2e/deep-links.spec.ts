import { expect, test, type Page } from "@playwright/test";
import { axe } from "./axe";
import { contact, projects } from "../lib/content";

const prompt = (page: Page) => page.getByRole("textbox", { name: "Command" });
const sca = projects.find((p) => p.slug === "sca-scoring")!;

test("a link opens with its command run, skipping the opening", async ({
  page,
}) => {
  await page.goto("/#sca-scoring");
  await expect(prompt(page)).toBeVisible();
  const log = page.getByRole("log");
  await expect(log).toContainText("open sca-scoring");
  await expect(log.getByText(sca.highlights[0])).toBeInViewport();
  await expect(page.locator("[data-boot-typed]")).toHaveCount(0);
  // Sudo is up and replies to the linked command, not with its greeting.
  await expect(page.getByRole("group", { name: "Sudo says" })).toContainText(
    "Seen enough?",
  );
  expect(await axe(page).analyze()).toMatchObject({ violations: [] });
});

test("changing the hash on the page runs its command", async ({ page }) => {
  await page.goto("/");
  await expect(prompt(page)).toBeVisible();
  await page.evaluate(() => (window.location.hash = "#contact"));
  await expect(
    page.getByRole("link", { name: contact.email.label }),
  ).toBeInViewport();
});

test("the address follows what is on screen, without adding history", async ({
  page,
}) => {
  await page.goto("/");
  const before = await page.evaluate(() => history.length);
  const input = prompt(page);
  await input.fill("git log --graph");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/#graph$/);
  await input.fill("help");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/#graph$/);
  await input.fill("clear");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => history.length)).toBe(before);
});

test("an unknown hash is ignored and the opening plays", async ({ page }) => {
  await page.goto("/#nope");
  await page.locator("[data-boot-typed]").waitFor();
  await expect(prompt(page)).toBeVisible();
  // Just the opening: whoami and cat highlights.md.
  await expect(page.getByRole("log").locator(":scope > div")).toHaveCount(2);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const link of ["career", "graph", "sca-scoring", "contact"]) {
    test(`#${link} scrolls to its section`, async ({ page }) => {
      await page.goto(`/#${link}`);
      await expect(page.locator(`#${link}`)).toBeInViewport();
    });
  }
});
