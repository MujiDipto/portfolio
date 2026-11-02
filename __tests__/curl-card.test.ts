import { expect, test } from "vitest";
import { curlCard } from "@/lib/curl-card";
import { contact, experience, profile } from "@/lib/content";

const card = curlCard("https://www.dipto.dev");
// What a terminal shows, without the colour codes.
const shown = card.replace(/\x1b\[[0-9;]*m/g, "");

test("prints the pitch, every highlight and every link", () => {
  for (const text of [
    profile.name,
    `${profile.title} | ${profile.focus}`,
    experience[0].name,
    ...profile.outcomes.flatMap((o) => [o.value, o.text]),
    "https://www.dipto.dev/muji-dipto-resume.pdf",
    contact.linkedin.href,
    contact.github.href,
    contact.email.label,
    "https://www.dipto.dev",
  ]) {
    expect(shown, text).toContain(text);
  }
});

test("fits a standard terminal and closes every colour it opens", () => {
  for (const line of shown.split("\n")) expect(line.length).toBeLessThan(100);
  const opened = card.match(/\x1b\[[1-9][0-9;]*m/g)?.length ?? 0;
  const closed = card.match(/\x1b\[0m/g)?.length ?? 0;
  expect(closed).toBe(opened);
});
