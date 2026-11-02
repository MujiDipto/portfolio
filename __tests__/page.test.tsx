import { render } from "@testing-library/react";
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

// Without JavaScript the opening plus the static session are printed, so
// search engines and no-JS visitors get every piece of content.
test("the opening and static session contain every piece of resume content", () => {
  const { container } = render(
    <>
      <Terminal />
      <StaticSession />
    </>,
  );
  const pageText = container.textContent ?? "";
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
  expect(expected.filter((text) => !pageText.includes(text))).toEqual([]);
});
