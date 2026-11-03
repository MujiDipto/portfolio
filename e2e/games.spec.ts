import { expect, test, type Page } from "@playwright/test";
import { axe } from "./axe";
import { packages, verdicts } from "../lib/triage";

async function command(page: Page, text: string) {
  const input = page.getByRole("textbox", { name: "Command" });
  await input.fill(text);
  await input.press("Enter");
  return input;
}

const game = (page: Page, name: string) =>
  page.locator(`[data-game="${name}"]`).last();

/** The key for a right or wrong answer to the package on screen. */
async function keyFor(page: Page, right: boolean) {
  const name = (await game(page, "triage")
    .locator("[data-package]")
    .textContent())!.trim();
  const answer = packages.find((p) => p.name === name)!.answer;
  return verdicts.find((v) => (v.verdict === answer) === right)!.key;
}

async function answer(page: Page, right: boolean) {
  const triage = game(page, "triage");
  await expect(triage.locator("[data-package]")).toBeVisible();
  await page.keyboard.press(await keyFor(page, right));
  await expect(triage.locator("[data-feedback]")).toBeVisible();
  await page.keyboard.press("n");
}

/** Stands in for the scores API, recording what is posted. */
async function fakeScores(page: Page) {
  const posted: unknown[] = [];
  await page.route("**/api/scores**", async (route) => {
    if (route.request().method() === "POST") {
      posted.push(route.request().postDataJSON());
      await route.fulfill({
        json: {
          scores: [
            { initials: "AAA", score: 40 },
            { initials: "MUD", score: 3 },
          ],
          placed: 1,
        },
      });
    } else {
      await route.fulfill({
        json: { scores: [{ initials: "AAA", score: 40 }] },
      });
    }
  });
  return posted;
}

test("games lists both, and each loads only when played", async ({ page }) => {
  await page.goto("/");
  const scripts: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "script") scripts.push(r.url());
  });
  await command(page, "games");
  await expect(page.getByRole("button", { name: "snake" })).toBeVisible();
  await expect(page.getByRole("button", { name: "triage" })).toBeVisible();
  expect(scripts).toEqual([]);
  await page.getByRole("button", { name: "snake" }).click();
  await expect(game(page, "snake")).toBeFocused();
  expect(scripts.length).toBeGreaterThan(0);
});

test("triage plays by keyboard and hands back the prompt when lost", async ({
  page,
}) => {
  await page.goto("/");
  const input = await command(page, "triage");
  const triage = game(page, "triage");
  await expect(triage).toBeFocused();
  // Space shows the next clue early.
  await expect(triage.getByText("- ???")).toHaveCount(2);
  await page.keyboard.press(" ");
  await expect(triage.getByText("- ???")).toHaveCount(1);
  for (let i = 0; i < 3; i++) await answer(page, false);
  await expect(triage.locator("[data-score]")).toHaveText(
    "Game over. Score 0 from 3 packages.",
  );
  // Nothing to save; the production test server has no store either.
  await expect(triage.getByLabel(/Initials/)).toHaveCount(0);
  await expect(
    triage.getByText("High scores are offline right now."),
  ).toBeVisible();
  await expect(input).toBeFocused();
});

test("a triage score can be saved with initials", async ({ page }) => {
  const posted = await fakeScores(page);
  await page.goto("/");
  const input = await command(page, "triage");
  await answer(page, true);
  for (let i = 0; i < 3; i++) await answer(page, false);
  const triage = game(page, "triage");
  await expect(triage.locator("[data-score]")).toContainText("Score 3 from 4");
  // The key that ended the run is not typed into the box.
  await expect(triage.getByLabel(/Initials/)).toHaveValue("");
  const initials = triage.getByLabel(/Initials/);
  await expect(initials).toBeFocused();
  await initials.pressSequentially("m1ud");
  await expect(initials).toHaveValue("mud");
  await initials.press("Enter");
  await expect(triage.getByText("← you")).toBeVisible();
  await expect(input).toBeFocused();
  // The server gets the answers, to score the run itself.
  expect(posted).toHaveLength(1);
  expect(posted[0]).toMatchObject({ game: "triage", initials: "mud" });
  expect((posted[0] as { answers: unknown[] }).answers).toHaveLength(4);
});

test("snake starts on an arrow key, and Esc quits to the prompt", async ({
  page,
}) => {
  await page.goto("/");
  const input = await command(page, "snake");
  const snake = game(page, "snake");
  const status = snake.locator("[data-status]");
  await expect(status).toHaveText(/Press an arrow key/);
  await page.keyboard.press("ArrowDown");
  await expect(status).toHaveText(/^Score 0/);
  await page.keyboard.press("Escape");
  await expect(status).toHaveText("Quit. Score 0.");
  await expect(input).toBeFocused();
});

test("a crash ends the game and returns the keyboard", async ({ page }) => {
  // Food lands in the top-left corner, out of the snake's way.
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/");
  const input = await command(page, "snake");
  await expect(game(page, "snake")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(game(page, "snake").locator("[data-status]")).toHaveText(
    "Game over. Score 0.",
  );
  await expect(input).toBeFocused();
});

test("running another command leaves the old game as it was", async ({
  page,
}) => {
  await page.goto("/");
  const input = await command(page, "snake");
  await expect(game(page, "snake")).toBeFocused();
  await input.click();
  await command(page, "whoami");
  const old = page.locator('[data-game="snake"]');
  await expect(old.locator("[data-status]")).toHaveText("Not played.");
  await expect(old).not.toHaveAttribute("tabindex", "0");
});

for (const theme of ["dark", "light"] as const) {
  test(`the games pass axe in ${theme} mode`, async ({ page }) => {
    await fakeScores(page);
    await page.goto("/");
    if (theme === "light") await command(page, "theme light");
    await command(page, "snake");
    await expect(game(page, "snake").locator("[data-board]")).toBeVisible();
    await command(page, "triage");
    await expect(game(page, "triage").locator("[data-package]")).toBeVisible();
    expect((await axe(page).analyze()).violations).toEqual([]);
    await answer(page, true);
    for (let i = 0; i < 3; i++) await answer(page, false);
    await expect(game(page, "triage").getByText("high scores")).toBeVisible();
    expect((await axe(page).analyze()).violations).toEqual([]);
  });
}

test.describe("on a phone", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });

  test("snake has arrow buttons that fit the screen", async ({ page }) => {
    await page.goto("/");
    await command(page, "snake");
    const snake = game(page, "snake");
    await expect(snake.getByText("Tap an arrow to start.")).toBeVisible();
    const up = snake.getByRole("button", { name: "up" });
    await expect(up).toBeVisible();
    const board = (await snake.locator("[data-board]").boundingBox())!;
    expect(board.x + board.width).toBeLessThanOrEqual(375);
    await up.tap();
    await expect(snake.locator("[data-status]")).toHaveText(/^Score 0/);
  });
});
