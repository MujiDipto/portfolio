import { describe, expect, test } from "vitest";
import {
  matches,
  helpEntries,
  historyStep,
  commandForHash,
  deepLinks,
  filterPalette,
  paletteEntries,
  linkFor,
  run,
  suggestions,
} from "@/lib/terminal";
import { profile, projects } from "@/lib/content";

describe("run", () => {
  test.each([
    ["whoami", { type: "whoami" }],
    ["cat highlights.md", { type: "highlights" }],
    ["git log", { type: "experience" }],
    ["ls projects/", { type: "projects" }],
    ["cat skills.txt", { type: "skills" }],
    ["cat education.md", { type: "education" }],
    ["cat contact", { type: "contact" }],
    ["help", { type: "help" }],
    ["ls", { type: "files" }],
    ["neofetch", { type: "neofetch" }],
    ["git log --graph", { type: "graph" }],
    ["git log --oneline --graph", { type: "graph" }],
    ["ls -a", { type: "files", hidden: true }],
    ["cat .sudo-secrets", { type: "secrets" }],
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
    ["cat about", { type: "highlights" }],
    ["cat about.md", { type: "highlights" }],
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

describe("easter eggs", () => {
  test.each(["exit", "logout", "vim", "vi", "rm -rf /"])(
    "%s gets an answer, not an error",
    (input) => {
      expect(run(input).output?.type).toBe("message");
    },
  );

  test("stay out of help and the hints", () => {
    const listed = helpEntries.map((e) => e.command).join(" ");
    for (const egg of ["exit", "vim", "rm", "ls -a", ".sudo-secrets"]) {
      expect(listed, egg).not.toContain(egg);
    }
    for (const typed of ["ex", "vi", "rm", "ls -", "cat .s"]) {
      expect(matches(typed), typed).toEqual([]);
    }
  });
});

describe("matches", () => {
  test("offers every command that starts with what was typed", () => {
    expect(matches("git")).toEqual(["git log", "git log --graph"]);
    expect(matches("open wor")).toEqual(["open world-cup-newsletter"]);
    expect(matches("cat ")).toEqual([
      "cat highlights.md",
      "cat skills.txt",
      "cat education.md",
      "cat contact",
    ]);
  });

  test("ignores case and leading spaces", () => {
    expect(matches("  GI")).toEqual(["git log", "git log --graph"]);
  });

  test("puts commands from history first, newest first", () => {
    expect(matches("cat ", ["cat contact", "cat skills.txt"])).toEqual([
      "cat skills.txt",
      "cat contact",
      "cat highlights.md",
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
    expect(matches("help")).toEqual([]);
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

test("each highlight links to a project that opens", () => {
  for (const { project } of profile.outcomes) {
    expect(run(`open ${project}`).output?.type).toBe("project");
  }
});

describe("deep links", () => {
  test("every link runs a real command, and leads back to itself", () => {
    for (const [name, command] of Object.entries(deepLinks)) {
      const { output } = run(command);
      expect(output, name).toBeDefined();
      expect(output?.type, name).not.toBe("error");
      expect(linkFor(command)).toBe(name);
    }
  });

  test("every project has a link", () => {
    for (const p of projects) {
      expect(commandForHash(`#${p.slug}`)).toBe(`open ${p.slug}`);
    }
  });

  test.each([
    ["#career", "git log"],
    ["#CAREER", "git log"],
    ["career", "git log"],
    ["#graph", "git log --graph"],
    ["#contact", "cat contact"],
  ])("%s runs %s", (hash, command) => {
    expect(commandForHash(hash)).toBe(command);
  });

  test.each([
    "",
    "#",
    "#content",
    "#rm",
    "#sudo hire muji",
    "#toString",
    "#%E0",
  ])("%j runs nothing", (hash) => {
    expect(commandForHash(hash)).toBeUndefined();
  });

  test("aliases share their command's link; other commands have none", () => {
    expect(linkFor("cat about.md")).toBe("highlights");
    expect(linkFor("  GIT LOG ")).toBe("career");
    expect(linkFor("help")).toBeUndefined();
    expect(linkFor("theme light")).toBeUndefined();
    expect(linkFor("nope")).toBeUndefined();
  });
});

describe("command palette", () => {
  test("offers every help command, both themes and each project, all runnable", () => {
    const commands = paletteEntries.map((e) => e.command);
    expect(commands).toContain("git log --graph");
    expect(commands).toContain("theme light");
    expect(commands).toContain("theme dark");
    for (const p of projects) expect(commands).toContain(`open ${p.slug}`);
    for (const command of commands) {
      expect(run(command).output?.type, command).not.toBe("error");
    }
  });

  test("matches every typed word against command and description", () => {
    expect(filterPalette("").length).toBe(paletteEntries.length);
    expect(filterPalette("graph").map((e) => e.command)).toEqual([
      "git log --graph",
    ]);
    // "SCA" is in the project's name, not its command.
    expect(filterPalette("sca").map((e) => e.command)).toContain(
      "open sca-scoring",
    );
    expect(filterPalette("THEME light").map((e) => e.command)).toEqual([
      "theme light",
    ]);
    expect(filterPalette("nothing like this")).toEqual([]);
  });
});
