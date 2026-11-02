import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { OutputView } from "@/components/terminal/Outputs";
import { projects, shownBy, skills, usedIn } from "@/lib/content";

const allSkills = skills.flatMap((s) => s.items);
const slugs = projects.map((p) => p.slug);

test("skills point to the projects that used them", () => {
  expect(usedIn("Java")).toEqual(["sca-scoring", "world-cup-newsletter"]);
  expect(usedIn("Python")).toEqual([
    "sca-scoring",
    "vuln-curation",
    "world-cup-newsletter",
  ]);
  expect(usedIn("TypeScript")).toEqual(["this-site"]);
  expect(usedIn("concurrency")).toEqual([
    "sca-scoring",
    "world-cup-newsletter",
  ]);
  expect(usedIn("SAST")).toEqual([]);
});

test("every hand-made link names a real skill and real projects", () => {
  for (const [skill, linked] of Object.entries(shownBy)) {
    expect(allSkills, skill).toContain(skill);
    for (const slug of linked)
      expect(slugs, `${skill}: ${slug}`).toContain(slug);
  }
});

test("cat skills.txt still shows every skill, and links each one's evidence", () => {
  const ran: string[] = [];
  const { container, getAllByRole } = render(
    <OutputView output={{ type: "skills" }} onRun={(c) => ran.push(c)} />,
  );
  for (const skill of allSkills) expect(container.textContent).toContain(skill);
  const links = getAllByRole("button").map((b) => b.textContent);
  const expected = allSkills.flatMap(usedIn);
  expect(links).toEqual(expected);
  getAllByRole("button")[0].click();
  expect(ran).toEqual([`open ${expected[0]}`]);
});
