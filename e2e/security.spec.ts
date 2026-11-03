import { expect, test, type Page } from "@playwright/test";

const expected = [
  "content-security-policy",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "x-frame-options",
  "cross-origin-opener-policy",
];

test("every kind of response sends the security headers", async ({
  request,
}) => {
  for (const path of ["/", "/cv", "/muji-dipto-resume.pdf", "/robots.txt"]) {
    const headers = (await request.get(path)).headers();
    for (const name of expected)
      expect(headers[name], `${path} ${name}`).toBeTruthy();
    expect(headers["x-frame-options"]).toBe("DENY");
  }
  const csp = (await request.get("/")).headers()["content-security-policy"];
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  // The production build never allows eval.
  expect(csp).not.toContain("unsafe-eval");
});

test("the curl card is sent as plain text that cannot be sniffed", async ({
  request,
}) => {
  const headers = (
    await request.get("/", { headers: { "user-agent": "curl/8.7.1" } })
  ).headers();
  expect(headers["content-type"]).toBe("text/plain; charset=utf-8");
  expect(headers["x-content-type-options"]).toBe("nosniff");
});

/** Records every CSP violation and console error the page reports. */
async function watch(page: Page) {
  const problems: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      console.error(`CSP blocked ${e.blockedURI} (${e.violatedDirective})`);
    });
  });
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(m.text());
  });
  page.on("pageerror", (e) => problems.push(e.message));
  return problems;
}

test("nothing the site does is blocked by its CSP", async ({ page }) => {
  const problems = await watch(page);
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Command" });
  for (const command of [
    "npm audit",
    "git log --graph",
    "open sca-scoring",
    "tree",
    "neofetch",
    "theme light",
    "theme dark",
    "sudo hire muji",
  ]) {
    await input.fill(command);
    await input.press("Enter");
  }
  await page.keyboard.press("Control+K");
  await page.getByRole("combobox", { name: "Search commands" }).fill("contact");
  await page.keyboard.press("Enter");
  await page.goto("/#vuln-curation");
  await expect(page.getByRole("log")).toContainText("open vuln-curation");
  await page.goto("/cv");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Fonts and the icon load from this site.
  expect(await page.evaluate(() => document.fonts.status)).toBe("loaded");
  expect(problems).toEqual([]);
});

test.describe("hardening", () => {
  test("a huge paste is cut to the limit, in the prompt and the palette", async ({
    page,
  }) => {
    await page.goto("/");
    const prompt = page.getByRole("textbox", { name: "Command" });
    await prompt.click();
    await page.keyboard.insertText("x".repeat(20_000));
    expect((await prompt.inputValue()).length).toBe(500);

    await page.keyboard.press("Control+K");
    const search = page.getByRole("combobox", { name: "Search commands" });
    await page.keyboard.insertText("y".repeat(20_000));
    expect((await search.inputValue()).length).toBe(500);
  });

  test("a flood of commands keeps the page light and working", async ({
    page,
  }) => {
    await page.goto("/");
    const prompt = page.getByRole("textbox", { name: "Command" });
    await expect(prompt).toBeVisible();
    for (let i = 0; i < 150; i++) {
      await prompt.fill("pwd");
      await prompt.press("Enter");
    }
    const outputs = page.getByRole("log").locator(":scope > div");
    expect(await outputs.count()).toBeLessThanOrEqual(100);
    await prompt.fill("whoami");
    await prompt.press("Enter");
    await expect(outputs.last()).toContainText("whoami");
  });

  test("a crafted history entry cannot break the page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("textbox", { name: "Command" })).toBeVisible();
    await page.evaluate(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: { terminal: true, entry: '"]]]][[[(' },
        }),
      );
    });
    await page.waitForTimeout(200);
    expect(errors).toEqual([]);
    await expect(page.getByRole("textbox", { name: "Command" })).toBeVisible();
  });
});
