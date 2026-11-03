import { expect, test } from "@playwright/test";
import { axe } from "./axe";
import { contact, resume } from "../lib/content";

test("home page has language, title and the name as main heading", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Muji Dipto | Senior Software Engineer");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^https?:\/\/[^/]+\/?$/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Muji Dipto",
  );
});

test("link previews and icons are complete and load", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const meta = (key: string) =>
    page
      .locator(`meta[property="${key}"], meta[name="${key}"]`)
      .first()
      .getAttribute("content");
  expect(await meta("og:title")).toBe("Muji Dipto | Senior Software Engineer");
  expect(await meta("og:description")).toContain("OnEarly");
  expect(await meta("og:image:alt")).toContain("Sudo");
  expect(await meta("twitter:card")).toBe("summary_large_image");
  const image = (await meta("og:image"))!;
  expect(image).toMatch(/^https?:\/\//); // previews need an absolute URL
  expect(await meta("og:image:width")).toBe("1200");
  expect(await meta("og:image:height")).toBe("630");

  const files = [
    new URL(image).pathname + new URL(image).search,
    (await page.locator('link[rel="icon"]').first().getAttribute("href"))!,
    (await page.locator('link[rel="apple-touch-icon"]').getAttribute("href"))!,
  ];
  for (const file of files) {
    const response = await request.get(file);
    expect(response.status(), file).toBe(200);
    expect(response.headers()["content-type"], file).toBe("image/png");
  }
});

test("cat contact links a résumé that downloads as a PDF", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "cat contact" }).click();
  const link = page.getByRole("link", { name: "résumé (PDF)" });
  await expect(link).toHaveAttribute("download", "");
  const response = await request.get((await link.getAttribute("href"))!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
});

test("the first screen links the résumé, LinkedIn, GitHub, email and /cv", async ({
  page,
}) => {
  await page.goto("/");
  const links = page.getByRole("list", { name: "Links" });
  await expect(links).toBeInViewport();
  // Other sites open in a new tab and say so; the rest stay in this one.
  const expected = [
    { name: "résumé.pdf", href: resume.href, newTab: false },
    {
      name: "linkedin (opens in a new tab)",
      href: contact.linkedin.href,
      newTab: true,
    },
    {
      name: "github (opens in a new tab)",
      href: contact.github.href,
      newTab: true,
    },
    { name: "email", href: contact.email.href, newTab: false },
    { name: "non-interactive mode", href: "/cv", newTab: false },
  ];
  for (const { name, href, newTab } of expected) {
    const link = links.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", href);
    if (newTab) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    } else {
      await expect(link).not.toHaveAttribute("target");
    }
  }
  await expect(links.getByRole("link", { name: "résumé.pdf" })).toHaveAttribute(
    "download",
    "",
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

test.describe("on a 1366x768 laptop", () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test("the whole first screen fits in the window, with nothing to scroll", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("textbox", { name: "Command" })).toBeVisible();
    const { scrollHeight, clientHeight } = await page
      .locator("main")
      .evaluate((el) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }));
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
  });
});

test("the pull quote's name opens the recommendations", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-pull-quote]").getByRole("button").click();
  await expect(page.getByRole("log")).toContainText("cat recommendations.md");
});
