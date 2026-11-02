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
      output: { type: "hire" },
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
      "cat recommendations.md",
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
      "cat recommendations.md",
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

describe("ls flags", () => {
  test.each([
    "ls -a",
    "ls -la",
    "ls -al",
    "ls -ali",
    "ls -lah",
    "ls -A",
    "ls --all",
    "ls -l -a",
    "ls -a .",
  ])("%s shows the hidden files", (command) => {
    expect(run(command).output).toEqual({ type: "files", hidden: true });
  });

  test.each(["ls", "ls -l", "ls -lh", "ls ."])(
    "%s lists the usual files",
    (command) => {
      expect(run(command).output).toEqual({ type: "files" });
    },
  );

  test("a path still works after flags", () => {
    expect(run("ls -la projects/").output).toEqual({ type: "projects" });
    expect(run("ls -l nope").output).toEqual({
      type: "error",
      text: "ls: cannot access 'nope': No such file or directory",
    });
  });
});

describe("everyday shell commands", () => {
  const text = (command: string, context?: Parameters<typeof run>[1]) => {
    const { output } = run(command, context);
    return output?.type === "message" ? output.text : output?.type;
  };

  test.each([
    ["pwd", "/home/muji"],
    [
      "cd projects",
      "cd: this is a guided tour, you stay in ~. Try ls projects/",
    ],
    ["id", "uid=1000(muji) gid=1000(muji)"],
    ["uname -a", "Next.js 16 on Node 26, hosted on Vercel"],
    ["git status", "On branch onearly\nnothing to commit, working tree clean"],
    ["git branch", "* onearly\n  main"],
    ["man ls", "man: no manual entry for ls. Try help"],
    ["mkdir x", "mkdir: permission denied. This terminal is read-only."],
    ["chmod 777 /", "chmod: permission denied. This terminal is read-only."],
  ])("%s", (command, expected) => {
    expect(text(command)).toBe(expected);
  });

  test("cd home prints nothing, like a shell", () => {
    for (const command of ["cd", "cd ~", "cd ."]) {
      expect(run(command)).toEqual({});
    }
  });

  test("echo keeps what was typed, case and all", () => {
    expect(text("echo Hello, World")).toBe("Hello, World");
    expect(text("echo")).toBe("");
  });

  test("head, tail, less and more read files like cat", () => {
    for (const reader of ["head", "tail", "less", "more"]) {
      expect(run(`${reader} skills.txt`).output).toEqual({ type: "skills" });
      expect(text(`${reader} nope`)).toBe("error");
    }
  });

  test("date is Brisbane time", () => {
    const now = new Date("2026-11-02T23:41:07Z");
    expect(text("date", { now })).toBe("Tue 03 Nov 2026 09:41:07 AEST");
  });

  test("history numbers the commands like bash, the current one last", () => {
    expect(text("history", { history: ["pwd", "ls", "history"] })).toBe(
      "   1  pwd\n   2  ls\n   3  history",
    );
  });

  test("tree is a command", () => {
    expect(run("tree").output).toEqual({ type: "tree" });
  });

  test("none of them is a mistake", () => {
    for (const command of [
      "pwd",
      "cd",
      "cd projects",
      "echo hi",
      "date",
      "hostname",
      "uname",
      "id",
      "history",
      "tree",
      "head skills.txt",
      "man ls",
      "git status",
      "git branch",
      "mkdir x",
      "kill 1",
      "brew install x",
    ]) {
      expect(run(command).output?.type, command).not.toBe("error");
    }
  });
});

describe("git commands", () => {
  const text = (command: string) => {
    const { output } = run(command);
    return output?.type === "message" || output?.type === "error"
      ? output.text
      : output?.type;
  };

  test.each([
    ["git pull", "Already up to date."],
    ["git fetch", "Already up to date."],
    ["git push", "remote: Permission denied."],
    ["git push origin main", "remote: Permission denied."],
    [
      "git commit -m wip",
      "git commit: this terminal is read-only. Try git log",
    ],
    [
      "git checkout main",
      "git checkout: this terminal is read-only. Try git log",
    ],
    ["git", "usage: git log, git log --graph, git status, git branch"],
    ["git yolo", "git: 'yolo' is not a git command. Try git log"],
  ])("%s", (command, expected) => {
    expect(text(command)).toBe(expected);
  });

  test("git diff on a clean tree prints nothing", () => {
    expect(run("git diff")).toEqual({});
  });

  test("only an unknown subcommand is a mistake", () => {
    for (const command of [
      "git pull",
      "git push",
      "git diff",
      "git commit",
      "git",
    ]) {
      expect(run(command).output?.type, command).not.toBe("error");
    }
    expect(run("git yolo").output?.type).toBe("error");
  });
});
