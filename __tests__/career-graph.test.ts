import { expect, test } from "vitest";
import { careerGraph, tenure } from "@/components/terminal/Outputs";
import { education, experience } from "@/lib/content";

const rows = careerGraph();
const commits = rows.filter((row) => row.text);
const oracle = experience[1];

test("tells the career newest first: every role, the degree and the tenure", () => {
  const titles = experience.flatMap((org) => org.roles.map((r) => r.title));
  for (const title of titles) {
    expect(
      commits.some((c) => c.text!.includes(title)),
      title,
    ).toBe(true);
  }
  expect(commits[0].head).toBe(true);
  expect(commits[0].text).toContain(experience[0].name);
  expect(commits.some((c) => c.text!.includes(tenure(oracle)))).toBe(true);
  expect(commits.some((c) => c.text === education.degree)).toBe(true);
  // The oldest fact is the root commit on main, where the uq branch splits off.
  expect(rows.at(-1)).toMatchObject({
    lanes: "*  ",
    branch: "main",
    date: education.start,
  });
});

test("Oracle and the degree are branches that split off and merge back", () => {
  for (const branch of ["oracle", "uq"] as const) {
    const merge = rows.findIndex((r) => r.merge?.branch === branch);
    const opens = rows.findIndex(
      (r, i) => i > merge && r.branch === branch && r.lanes.startsWith("|\\"),
    );
    const closes = rows.findIndex(
      (r, i) => i > opens && r.branch === branch && r.lanes.startsWith("|/"),
    );
    expect(merge, branch).toBeGreaterThanOrEqual(0);
    // The merge sits on main, right above the branch it joins.
    expect(rows[merge].branch).toBe("main");
    expect(opens, branch).toBe(merge + 1);
    expect(closes, branch).toBeGreaterThan(opens);
    // Everything between is a commit on that branch.
    for (const row of rows.slice(opens + 1, closes)) {
      expect(row.branch).toBe(branch);
      expect(row.lanes).toBe("| *");
    }
  }
});

test("each merge runs a command that shows that part of the story", () => {
  const merges = rows.filter((r) => r.merge).map((r) => r.merge!.command);
  expect(merges).toEqual(["git log", "cat education.md"]);
});
