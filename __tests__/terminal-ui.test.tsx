import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { Terminal } from "@/components/terminal/Terminal";
import { contact, projects } from "@/lib/content";

// Reduced motion skips the opening animation; __tests__/boot.test.tsx covers it.
beforeEach(() => {
  window.matchMedia = (query: string) =>
    ({ matches: query.includes("reduce") }) as MediaQueryList;
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

async function setup() {
  const user = userEvent.setup();
  render(<Terminal />);
  const input = await screen.findByRole("textbox", { name: "Command" });
  const log = screen.getByRole("log");
  return { user, input, log };
}

describe("Terminal", () => {
  test("opens with whoami and about, and nothing else", async () => {
    const { log } = await setup();
    expect(
      screen.getByRole("heading", { level: 1, name: "Muji Dipto" }),
    ).toBeDefined();
    expect(log.textContent).toContain("960+ analyst-hours");
    expect(log.textContent).not.toContain("Security Analyst");
  });

  test("typing a command and pressing Enter appends its output", async () => {
    const { user, input, log } = await setup();
    await user.type(input, "git log{Enter}");
    expect(log.textContent).toContain("Security Analyst");
    expect((input as HTMLInputElement).value).toBe("");
  });

  test("unknown commands explain what to do", async () => {
    const { user, input, log } = await setup();
    await user.type(input, "xyz{Enter}");
    expect(log.textContent).toContain("command not found: xyz. Try help");
  });

  test("suggested commands can be clicked instead of typed", async () => {
    const { user, log } = await setup();
    await user.click(screen.getByRole("button", { name: "cat contact" }));
    expect(
      within(log)
        .getByRole("link", { name: contact.email.label })
        .getAttribute("href"),
    ).toBe(contact.email.href);
  });

  test("project names in ls output open the project", async () => {
    const { user, input, log } = await setup();
    await user.type(input, "ls projects/{Enter}");
    await user.click(
      within(log).getByRole("button", { name: "vuln-curation/" }),
    );
    const project = projects.find((p) => p.slug === "vuln-curation")!;
    expect(
      within(log).getByRole("heading", { name: project.name }),
    ).toBeDefined();
  });

  test("clear empties the screen", async () => {
    const { user, input, log } = await setup();
    await user.type(input, "clear{Enter}");
    expect(log.textContent).toBe("");
  });

  test("up arrow recalls the previous command", async () => {
    const { user, input } = await setup();
    await user.type(input, "git log{Enter}");
    await user.type(input, "{ArrowUp}");
    expect((input as HTMLInputElement).value).toBe("git log");
    await user.type(input, "{ArrowDown}");
    expect((input as HTMLInputElement).value).toBe("");
  });

  test("Tab completes a unique command", async () => {
    const { user, input } = await setup();
    await user.type(input, "gi");
    await user.keyboard("{Tab}");
    expect((input as HTMLInputElement).value).toBe("git log");
    expect(document.activeElement).toBe(input);
  });

  test("Tab on an ambiguous start lists the options", async () => {
    const { user, input } = await setup();
    await user.type(input, "cat ");
    await user.keyboard("{Tab}");
    expect(screen.getByText("cat education.md")).toBeDefined();
  });

  test("Tab on an empty prompt moves focus on, so there is no keyboard trap", async () => {
    const { user, input } = await setup();
    input.focus();
    await user.keyboard("{Tab}");
    expect(document.activeElement).not.toBe(input);
  });

  test("theme dark switches the page theme", async () => {
    const { user, input, log } = await setup();
    await user.type(input, "theme dark{Enter}");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(log.textContent).toContain("theme: dark");
  });
});
