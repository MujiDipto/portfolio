// Runs Lighthouse against the production build and applies thresholds.
// Requires `npm run build` first. Reports are written to .lighthouse/ and never uploaded.
import { spawn, execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { evaluate, thresholds } from "./lighthouse-thresholds.mjs";

const run = promisify(execFile);
const port = 3200;
const url = `http://localhost:${port}/`;
const runs = 3;
const categories = Object.keys(thresholds);

async function waitForServer(deadline = Date.now() + 60_000) {
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not respond at ${url} within 60 seconds`);
}

const server = spawn("npx", ["next", "start", "--port", String(port)], {
  stdio: "ignore",
  detached: true,
});

try {
  await waitForServer();
  await mkdir(".lighthouse", { recursive: true });

  const scores = Object.fromEntries(categories.map((c) => [c, []]));
  for (let i = 1; i <= runs; i++) {
    const { stdout } = await run(
      "npx",
      [
        "lighthouse",
        url,
        "--output=json",
        "--output-path=stdout",
        "--quiet",
        `--only-categories=${categories.join(",")}`,
        "--chrome-flags=--headless=new --no-sandbox",
      ],
      { maxBuffer: 64 * 1024 * 1024 },
    );
    const report = JSON.parse(stdout);
    await writeFile(`.lighthouse/run-${i}.json`, stdout);
    for (const c of categories) scores[c].push(report.categories[c].score);
  }

  const { failed, warnings, rows } = evaluate(scores);
  for (const row of rows) {
    const score = row.score === null ? "none" : row.score.toFixed(2);
    const status = row.passed ? "pass" : row.blocking ? "FAIL" : "warn";
    console.log(
      `${row.category.padEnd(15)} median ${score}  min ${row.min}  ${status}`,
    );
  }
  if (warnings.length > 0) {
    console.log(
      `Warning: below target but not blocking: ${warnings.join(", ")}`,
    );
  }
  process.exitCode = failed ? 1 : 0;
} finally {
  process.kill(-server.pid);
}
