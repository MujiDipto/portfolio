import { expect, test } from "vitest";
import { careerGraph } from "@/components/terminal/Outputs";
import { education, experience } from "@/lib/content";

const commits = careerGraph().filter((row) => row.text);

test("tells the career newest first, every role and the degree", () => {
  const titles = experience.flatMap((org) => org.roles.map((r) => r.title));
  for (const title of titles) {
    expect(
      commits.some((c) => c.text!.includes(title)),
      title,
    ).toBe(true);
  }
  expect(commits[0].ref).toBe("HEAD -> main");
  expect(commits[0].text).toContain(experience[0].name);
  expect(commits.at(-1)!.date).toBe(education.start);
});

test("draws a side branch that splits off and merges back", () => {
  const lanes = careerGraph().map((row) => row.lanes.trim());
  expect(lanes).toContain("|\\");
  expect(lanes).toContain("|/");
  expect(lanes.indexOf("|\\")).toBeLessThan(lanes.indexOf("|/"));
});
