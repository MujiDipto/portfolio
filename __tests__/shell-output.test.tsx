import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { OutputView } from "@/components/terminal/Outputs";
import { projects } from "@/lib/content";
import { run } from "@/lib/terminal";

test("echo prints markup as text, never as HTML", () => {
  const { output } = run('echo <img src=x onerror="alert(1)"><b>hi</b>');
  const { container } = render(<OutputView output={output!} />);
  expect(container.querySelector("img, b")).toBeNull();
  expect(container.textContent).toBe('<img src=x onerror="alert(1)"><b>hi</b>');
});

test("multi-line output keeps its lines", () => {
  const { container } = render(
    <OutputView output={run("git branch").output!} />,
  );
  expect(container.querySelector("p")?.className).toContain(
    "whitespace-pre-wrap",
  );
});

test("tree lists every file and project, each one clickable", () => {
  const ran: string[] = [];
  const { getAllByRole, container } = render(
    <OutputView output={{ type: "tree" }} onRun={(c) => ran.push(c)} />,
  );
  const buttons = getAllByRole("button").map((b) => b.textContent);
  expect(buttons).toEqual([
    "contact",
    "education.md",
    "highlights.md",
    "projects/",
    ...projects.map((p) => `${p.slug}/`),
    "recommendations.md",
    "skills.txt",
  ]);
  expect(container.textContent).toContain(
    `${projects.length + 1} directories, 5 files`,
  );
});
