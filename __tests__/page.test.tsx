import { render } from "@testing-library/react";
import Cv from "@/app/cv/page";
import { expect, test } from "vitest";
import { StaticSession } from "@/components/terminal/StaticSession";
import { Terminal } from "@/components/terminal/Terminal";
import {
  contact,
  education,
  highlightLines,
  additionalExperience,
  contactPitch,
  experience,
  profile,
  resume,
  projects,
  skills,
} from "@/lib/content";

/** Every piece of résumé content the site shows; missing ones are returned. */
function missingFrom(pageText: string): string[] {
  const expected = [
    profile.name,
    profile.focus,
    profile.status,
    ...highlightLines,
    contactPitch.line,
    contactPitch.status,
    resume.label,
    ...[...experience, ...additionalExperience].flatMap((org) => [
      org.name,
      ...org.roles.flatMap((r) => [r.title, r.start, r.end, ...r.highlights]),
    ]),
    ...projects.flatMap((p) => [
      p.name,
      p.context,
      p.outcome,
      ...(p.story
        ? [
            p.story.problem,
            ...p.story.constraints,
            ...p.story.approach,
            ...(p.story.result ? [p.story.result] : []),
          ]
        : []),
      ...p.highlights,
      ...p.stack,
    ]),
    ...skills.flatMap((s) => [s.group, ...s.items]),
    education.degree,
    education.institution,
    ...education.notes,
    contact.email.label,
    contact.linkedin.label,
    contact.github.label,
  ];
  return expected.filter((text) => !pageText.includes(text));
}

// Without JavaScript the opening plus the static session are printed, so
// search engines and no-JS visitors get every piece of content.
test("the opening and static session contain every piece of resume content", () => {
  const { container } = render(
    <>
      <Terminal />
      <StaticSession />
    </>,
  );
  expect(missingFrom(container.textContent ?? "")).toEqual([]);
});

test("/cv contains every piece of resume content as plain HTML", () => {
  const { container } = render(<Cv />);
  expect(missingFrom(container.textContent ?? "")).toEqual([]);
  // One h1, then visible section headings.
  expect(container.querySelectorAll("h1")).toHaveLength(1);
  expect(
    [...container.querySelectorAll("h2")].map((h) => h.textContent),
  ).toEqual([
    "Highlights",
    "Experience",
    "Projects",
    "Skills",
    "Education",
    "Contact",
  ]);
});
