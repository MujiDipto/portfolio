import { expect, test } from "@playwright/test";
import { axe } from "./axe";
import { profile } from "../lib/content";

test("/cv is a plain page with its own title and canonical address", async ({
  page,
}) => {
  await page.goto("/cv");
  await expect(page).toHaveTitle("Muji Dipto | CV");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    profile.name,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/cv$/,
  );
  // Everything is already on the page: no prompt to type into.
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("the terminal links to /cv, and /cv links back", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("list", { name: "Links" })
    .getByRole("link", { name: "non-interactive mode" })
    .click();
  await expect(page).toHaveURL(/\/cv$/);
  await page
    .getByRole("link", { name: "Open the interactive terminal" })
    .click();
  await expect(page.getByRole("textbox", { name: "Command" })).toBeVisible();
});

test("a project link on /cv opens that project in the terminal", async ({
  page,
}) => {
  await page.goto("/cv");
  await page.getByRole("link", { name: "open vuln-curation" }).click();
  await expect(page).toHaveURL(/\/#vuln-curation$/);
  await expect(page.getByRole("log")).toContainText("open vuln-curation");
});

test("/cv is in the sitemap", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toMatch(/<loc>[^<]*\/cv<\/loc>/);
});

test("printing /cv gives dark text on white, without the navigation", async ({
  page,
}) => {
  await page.goto("/cv");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(
    page.getByRole("link", { name: "Open the interactive terminal" }),
  ).toBeHidden();
});

for (const theme of ["light", "dark"] as const) {
  test(`/cv passes axe in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((t) => {
      if (t === "light") localStorage.setItem("theme", "light");
    }, theme);
    await page.goto("/cv");
    expect(await axe(page).analyze()).toMatchObject({ violations: [] });
  });
}
