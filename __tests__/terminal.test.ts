import { describe, expect, test } from "vitest";
import {
  matches,
  helpEntries,
  historyStep,
  run,
  suggestions,
} from "@/lib/terminal";
import { projects } from "@/lib/content";

describe("run", () => {
  test.each([
    ["whoami", { type: "whoami" }],
    ["cat about.md", { type: "about" }],
    ["git log", { type: "experience" }],
    ["ls projects/", { type: "projects" }],
    ["cat skills.txt", { type: "skills" }],
    ["cat education.md", { type: "education" }],
    ["cat contact", { type: "contact" }],
    ["help", { type: "help" }],
    ["ls", { type: "files" }],
  ])("%s", (input, output) => {
    expect(run(input)).toEqual({ output });
  });

  test("open shows each project by name", () => {
    for (const p of projects) {
      expect(run(`open ${p.slug}`)).toEqual({
        output: { type: "project", slug: p.slug },
      });
    }
  });

  test.each([
    ["  GIT   LOG  ", { type: "experience" }],
    ["ls projects", { type: "projects" }],
    ["cat about", { type: "about" }],
    ["cat skills", { type: "skills" }],
    ["open sca-scoring/", { type: "project", slug: "sca-scoring" }],
    ["open projects/vuln-curation", { type: "project", slug: "vuln-curation" }],
  ])("forgives %j", (input, output) => {
    expect(run(input)).toEqual({ output });
  });

  test("empty input does nothing", () => {
    expect(run("   ")).toEqual({});
  });

  test("clear asks the screen to clear", () => {
    expect(run("clear")).toEqual({ effect: { type: "clear" } });
  });

  test.each(["light", "dark"] as const)("theme %s switches theme", (theme) => {
    expect(run(`theme ${theme}`)).toEqual({
      effect: { type: "theme", theme },
      output: { type: "message", text: `theme: ${theme}` },
    });
  });

  test.each([
    ["xyz", "command not found: xyz. Try help"],
    ["cat", "cat: missing file operand. Try ls"],
    ["cat secrets.txt", "cat: secrets.txt: No such file or directory"],
    ["open", "open: missing project name. Try ls projects/"],
    ["open nothing", "open: no such project: nothing. Try ls projects/"],
    ["theme", "theme: choose light or dark"],
    ["theme blue", "theme: choose light or dark"],
    ["sudo rm -rf /", "sudo: nice try. Try help"],
  ])("%j explains what went wrong", (input, message) => {
    expect(run(input)).toEqual({ output: { type: "error", text: message } });
  });

  test("the hire easter egg shows contact details", () => {
    expect(run("sudo hire muji")).toEqual({
      output: { type: "contact", note: "permission granted." },
    });
  });
});

describe("matches", () => {
  test("offers every command that starts with what was typed", () => {
    expect(matches("git")).toEqual(["git log"]);
    expect(matches("open wor")).toEqual(["open world-cup-newsletter"]);
    expect(matches("cat ")).toEqual([
      "cat about.md",
      "cat skills.txt",
      "cat education.md",
      "cat contact",
    ]);
  });

  test("ignores case and leading spaces", () => {
    expect(matches("  GI")).toEqual(["git log"]);
  });

  test("puts commands from history first, newest first", () => {
    expect(matches("cat ", ["cat contact", "cat skills.txt"])).toEqual([
      "cat skills.txt",
      "cat contact",
      "cat about.md",
      "cat education.md",
    ]);
  });

  test("never offers typos from history or the hidden easter egg", () => {
    expect(matches("ca", ["cat nothing"])).not.toContain("cat nothing");
    expect(matches("sudo", ["sudo hire muji"])).toEqual([]);
  });

  test("offers nothing for an empty prompt, unknown input or a finished command", () => {
    expect(matches("")).toEqual([]);
    expect(matches("zzz")).toEqual([]);
    expect(matches("git log")).toEqual([]);
  });

  test("a finished command can still lead to a longer one", () => {
    expect(matches("ls")).toEqual(["ls projects/"]);
  });
});

describe("historyStep", () => {
  const history = ["whoami", "git log", "cat contact"];

  test("up walks back from the newest entry and stops at the oldest", () => {
    let index = history.length;
    index = historyStep(history, index, "up");
    expect(history[index]).toBe("cat contact");
    index = historyStep(history, historyStep(history, index, "up"), "up");
    expect(history[index]).toBe("whoami");
    expect(historyStep(history, index, "up")).toBe(0);
  });

  test("down past the newest entry returns to an empty prompt", () => {
    expect(historyStep(history, 2, "down")).toBe(3);
    expect(historyStep(history, 3, "down")).toBe(3);
  });
});

test("the cat suggests four commands that all run", () => {
  expect(suggestions).toEqual([
    "git log",
    "ls projects/",
    "cat skills.txt",
    "cat contact",
  ]);
  for (const s of suggestions) expect(run(s).output?.type).not.toBe("error");
});

test("every command in help runs without error", () => {
  for (const entry of helpEntries) {
    const command = entry.command.replace("dark|light", "dark");
    expect(run(command).output?.type, command).not.toBe("error");
  }
});
