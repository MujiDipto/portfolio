// The terminal's command engine: pure functions, no React. Outputs name what to
// show; the UI renders them from lib/content.ts so facts stay in one place.
import { projects } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import type { Theme } from "@/lib/theme";

export type Output =
  | { type: "whoami" }
  | { type: "highlights" }
  | { type: "experience" }
  | { type: "graph" }
  | { type: "projects" }
  | { type: "project"; slug: string }
  | { type: "skills" }
  | { type: "education" }
  | { type: "contact"; note?: string }
  | { type: "recommendations" }
  | { type: "files"; hidden?: boolean }
  | { type: "neofetch" }
  | { type: "audit" }
  | { type: "tree" }
  | { type: "secrets" }
  | { type: "help" }
  | { type: "message"; text: string }
  | { type: "error"; text: string };

export type Effect = { type: "clear" } | { type: "theme"; theme: Theme };

export type Result = { output?: Output; effect?: Effect };

export const helpEntries = [
  { command: "whoami", description: "who I am" },
  { command: "cat highlights.md", description: "outcomes" },
  { command: "git log", description: "work history" },
  { command: "git log --graph", description: "career at a glance" },
  {
    command: "ls projects/",
    description: "selected projects (open <name> for details)",
  },
  { command: "cat skills.txt", description: "skills" },
  { command: "cat education.md", description: "education" },
  {
    command: "cat recommendations.md",
    description: "what colleagues say",
  },
  { command: "cat contact", description: "how to reach me" },
  { command: "neofetch", description: "system info, Sudo included" },
  { command: "npm audit", description: "scan this site's dependencies" },
  { command: "theme dark|light", description: "switch colours" },
  { command: "clear", description: "clear the screen" },
];

/** Commands the cat suggests. */
export const suggestions = [
  "git log",
  "ls projects/",
  "cat skills.txt",
  "cat contact",
];

const files: Record<string, Output> = {
  "highlights.md": { type: "highlights" },
  highlights: { type: "highlights" },
  // The file's old name, so anyone who guesses it still gets an answer.
  "about.md": { type: "highlights" },
  about: { type: "highlights" },
  "skills.txt": { type: "skills" },
  skills: { type: "skills" },
  "education.md": { type: "education" },
  education: { type: "education" },
  contact: { type: "contact" },
  "recommendations.md": { type: "recommendations" },
  recommendations: { type: "recommendations" },
  // Hidden: only `ls -a` lists it. It leads to the easter egg.
  ".sudo-secrets": { type: "secrets" },
};

const error = (text: string): Result => ({ output: { type: "error", text } });
const message = (text: string): Result => ({
  output: { type: "message", text },
});

// Commands that would change something get a polite refusal, like `rm`.
export const readOnly = [
  "mkdir",
  "touch",
  "mv",
  "cp",
  "chmod",
  "chown",
  "kill",
  "reboot",
  "shutdown",
  "apt",
  "apt-get",
  "brew",
];

/** What some commands read beyond their input: `history` and `date`. */
export type Context = {
  /** Commands run so far, oldest first, the current one last. */
  history?: string[];
  now?: Date;
};

// git commands that would change the repository; the terminal is read-only.
const gitWrites = [
  "add",
  "commit",
  "merge",
  "rebase",
  "reset",
  "stash",
  "checkout",
  "switch",
  "clone",
];

/** `date`'s output, in Brisbane time: "Tue 03 Nov 2026 09:41:07 AEST". */
export function formatDate(now: Date): string {
  const part = (options: Intl.DateTimeFormatOptions) =>
    now.toLocaleString("en-AU", { timeZone: "Australia/Brisbane", ...options });
  const time = part({
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${part({ weekday: "short" })} ${part({ day: "2-digit" })} ${part({ month: "short" })} ${part({ year: "numeric" })} ${time} AEST`;
}

export function run(input: string, context: Context = {}): Result {
  const words = input.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return {};
  const [command, ...args] = words;
  const arg = args[0];

  if (readOnly.includes(command)) {
    return message(
      `${command}: permission denied. This terminal is read-only.`,
    );
  }

  switch (command) {
    case "whoami":
      return { output: { type: "whoami" } };
    case "help":
      return { output: { type: "help" } };
    case "clear":
      return { effect: { type: "clear" } };
    case "git":
      if (arg === "log") {
        return args.includes("--graph")
          ? { output: { type: "graph" } }
          : { output: { type: "experience" } };
      }
      // In step with git log --graph: HEAD is on onearly, one ahead of main.
      if (arg === "status") {
        return message(
          "On branch onearly\nnothing to commit, working tree clean",
        );
      }
      if (arg === "branch") return message("* onearly\n  main");
      if (!arg) {
        return message(
          "usage: git log, git log --graph, git status, git branch",
        );
      }
      if (arg === "pull" || arg === "fetch") {
        return message("Already up to date.");
      }
      if (arg === "push") {
        return message("remote: Permission denied.");
      }
      if (arg === "diff") return {};
      if (gitWrites.includes(arg)) {
        return message(`git ${arg}: this terminal is read-only. Try git log`);
      }
      return error(`git: '${arg}' is not a git command. Try git log`);
    case "pwd":
      return message("/home/muji");
    case "cd":
      if (!arg || arg === "~" || arg === "." || arg === "~/") return {};
      return message(
        "cd: this is a guided tour, you stay in ~. Try ls projects/",
      );
    case "echo":
      // As typed, case kept; React renders it as text, never as HTML.
      return message(input.trim().replace(/^\S+\s*/, ""));
    case "date":
      return message(formatDate(context.now ?? new Date()));
    case "hostname":
      return message(siteUrl.host);
    case "uname":
      return message("Next.js 16 on Node 26, hosted on Vercel");
    case "id":
      return message("uid=1000(muji) gid=1000(muji)");
    case "history": {
      // Numbered like bash, which counts the current command too.
      const past = context.history ?? [input.trim()];
      return message(
        past.map((c, i) => `${String(i + 1).padStart(4)}  ${c}`).join("\n"),
      );
    }
    case "tree":
      return { output: { type: "tree" } };
    case "man":
      return message(
        arg
          ? `man: no manual entry for ${arg}. Try help`
          : "What manual page do you want? Try help",
      );
    case "ls": {
      // Flags in any combination, as in a real shell: any that includes
      // "a" (-a, -la, -ali, --all) shows the hidden files.
      const flags = args.filter((a) => a.startsWith("-"));
      const [path] = args.filter((a) => !a.startsWith("-"));
      const all = flags.some((f) => f === "--all" || /^-[^-]*a/.test(f));
      if (!path || path === "." || path === "./") {
        return { output: { type: "files", ...(all && { hidden: true }) } };
      }
      if (path === "projects" || path === "projects/") {
        return { output: { type: "projects" } };
      }
      return error(`ls: cannot access '${path}': No such file or directory`);
    }
    case "cat":
    case "head":
    case "tail":
    case "less":
    case "more":
      if (!arg) return error(`${command}: missing file operand. Try ls`);
      return files[arg]
        ? { output: files[arg] }
        : error(`${command}: ${arg}: No such file or directory`);
    case "open": {
      if (!arg) return error("open: missing project name. Try ls projects/");
      const slug = arg.replace(/^projects\//, "").replace(/\/$/, "");
      return projects.some((p) => p.slug === slug)
        ? { output: { type: "project", slug } }
        : error(`open: no such project: ${arg}. Try ls projects/`);
    }
    case "theme":
      if (arg === "light" || arg === "dark") {
        return {
          effect: { type: "theme", theme: arg },
          output: { type: "message", text: `theme: ${arg}` },
        };
      }
      return error("theme: choose light or dark");
    case "neofetch":
      return { output: { type: "neofetch" } };
    case "npm":
      if (arg === "audit") return { output: { type: "audit" } };
      return error("npm: this terminal is read-only. Try npm audit");
    // Easter eggs: real terminal habits, answered in the site's voice. They
    // stay out of help and the hints.
    case "exit":
    case "logout":
      return message("exit: Sudo is guarding the door.");
    case "vim":
    case "vi":
      return message("vim: not here. This terminal is for reading.");
    case "rm":
      return message("rm: permission denied. This terminal is read-only.");
    case "sudo":
      if (args.join(" ") === "hire muji") {
        return { output: { type: "contact", note: "permission granted." } };
      }
      return error("sudo: nice try. Try help");
  }
  return error(`command not found: ${words.join(" ")}. Try help`);
}

// Every full command hints can offer; the easter egg stays hidden.
const completions = [
  "whoami",
  "cat highlights.md",
  "cat skills.txt",
  "cat education.md",
  "cat recommendations.md",
  "cat contact",
  "git log",
  "git log --graph",
  "ls",
  "ls projects/",
  ...projects.map((p) => `open ${p.slug}`),
  "theme light",
  "theme dark",
  "neofetch",
  "npm audit",
  "help",
  "clear",
];

/**
 * Commands that start with what the visitor has typed, for hints as they type:
 * commands from their own history first (newest first), then the rest. Only
 * real commands are offered, so typos in history and the easter egg never are.
 */
export function matches(input: string, history: string[] = []): string[] {
  const typed = input.toLowerCase().trimStart();
  if (!typed) return [];
  const known = [...history].reverse().filter((c) => completions.includes(c));
  return [...new Set([...known, ...completions])].filter(
    (c) => c.startsWith(typed) && c !== typed,
  );
}

/**
 * Moves through command history. `index === history.length` means the empty
 * prompt below the newest entry.
 */
export function historyStep(
  history: string[],
  index: number,
  direction: "up" | "down",
): number {
  return direction === "up"
    ? Math.max(0, index - 1)
    : Math.min(history.length, index + 1);
}

/**
 * Shareable links: `/#sca-scoring` opens the site with that command run. A
 * fixed list, so a link can never run anything else. Words people read, not
 * commands, so `#career` rather than `#git-log`.
 */
export const deepLinks: Record<string, string> = {
  highlights: "cat highlights.md",
  career: "git log",
  graph: "git log --graph",
  projects: "ls projects/",
  ...Object.fromEntries(projects.map((p) => [p.slug, `open ${p.slug}`])),
  skills: "cat skills.txt",
  education: "cat education.md",
  recommendations: "cat recommendations.md",
  contact: "cat contact",
};

/** The command a URL hash (`#career`) links to, if any. */
export function commandForHash(hash: string): string | undefined {
  let name: string;
  try {
    name = decodeURIComponent(hash.replace(/^#/, "")).toLowerCase();
  } catch {
    return undefined; // a malformed escape such as `#%E0`
  }
  return Object.hasOwn(deepLinks, name) ? deepLinks[name] : undefined;
}

/**
 * The link name for what a command shows, so aliases such as `cat about.md`
 * share their command's link. Undefined for commands with no link.
 */
export function linkFor(command: string): string | undefined {
  const shown = JSON.stringify(run(command).output);
  return Object.keys(deepLinks).find(
    (name) => JSON.stringify(run(deepLinks[name]).output) === shown,
  );
}

export type PaletteEntry = { command: string; description: string };

/** Every command the ⌘K palette offers: the help list, with each project. */
export const paletteEntries: PaletteEntry[] = [
  ...helpEntries.flatMap((entry) =>
    entry.command === "theme dark|light"
      ? [
          { command: "theme light", description: "switch to light colours" },
          { command: "theme dark", description: "switch to dark colours" },
        ]
      : [entry],
  ),
  ...projects.map((p) => ({ command: `open ${p.slug}`, description: p.name })),
];

/** Entries whose command or description contains every word typed. */
export function filterPalette(query: string): PaletteEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return paletteEntries.filter((entry) => {
    const text = `${entry.command} ${entry.description}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
