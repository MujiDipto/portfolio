import { render, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { hireSubject, OutputView } from "@/components/terminal/Outputs";
import { contact, resume } from "@/lib/content";
import { run } from "@/lib/terminal";

const hire = (onRun?: (c: string) => void) =>
  render(<OutputView output={run("sudo hire muji").output!} onRun={onRun} />);

test("sudo hire muji grants every way to reach Muji, honestly", () => {
  const { container, getByRole } = hire();
  const text = container.textContent ?? "";
  expect(text).toContain("[sudo] privileges confirmed for visitor");
  expect(text).toContain("access granted.");
  // It never contradicts his status.
  expect(text).toContain("isn't looking for a new role right now");
  // No password prompt, even as a joke.
  expect(text.toLowerCase()).not.toContain("password");

  const pdf = getByRole("link", { name: "download now" });
  expect(pdf.getAttribute("href")).toBe(resume.href);
  expect(pdf.hasAttribute("download")).toBe(true);
  const email = getByRole("link", { name: "email Muji" }).getAttribute("href")!;
  expect(email.startsWith(contact.email.href)).toBe(true);
  expect(new URL(email).searchParams.get("subject")).toBe(hireSubject);
  for (const link of [contact.linkedin, contact.github]) {
    const a = within(container).getByRole("link", {
      name: new RegExp(link.label),
    });
    expect(a.getAttribute("href")).toBe(link.href);
    expect(a.getAttribute("target")).toBe("_blank");
  }
});

test("in the terminal it prints line by line; elsewhere all at once", () => {
  const live = hire(() => {}).container;
  expect(live.querySelectorAll(".reveal-row").length).toBeGreaterThan(5);
  const still = hire().container;
  expect(still.querySelectorAll(".reveal-row")).toHaveLength(0);
});
