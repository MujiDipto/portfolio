import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "@/app/page";
import {
  contact,
  education,
  experience,
  profile,
  projects,
  skills,
} from "@/lib/content";

test("home page renders the name as the main heading", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Muji Dipto" }),
  ).toBeDefined();
});

test("every piece of resume content appears on the page", () => {
  const { container } = render(<Home />);
  const pageText = container.textContent ?? "";
  const expected = [
    ...profile.summary,
    ...experience.flatMap((org) => [
      org.name,
      ...org.roles.flatMap((r) => [r.title, r.start, r.end, ...r.highlights]),
    ]),
    ...projects.flatMap((p) => [
      p.name,
      p.context,
      ...p.highlights,
      ...p.stack,
    ]),
    ...skills.flatMap((s) => [s.group, ...s.items]),
    education.degree,
    education.institution,
    ...education.notes,
  ];
  expect(expected.filter((text) => !pageText.includes(text))).toEqual([]);
});

test("contact and project links point where the content says", () => {
  render(<Home />);
  for (const link of [contact.email, contact.linkedin, contact.github]) {
    expect(
      screen.getByRole("link", { name: link.label }).getAttribute("href"),
    ).toBe(link.href);
  }
  const repo = projects.find((p) => p.link)!.link!;
  expect(
    screen.getByRole("link", { name: repo.label }).getAttribute("href"),
  ).toBe(repo.href);
});
