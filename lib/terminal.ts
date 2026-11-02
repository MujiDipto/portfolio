// The terminal's command engine: pure functions, no React. Outputs name what to
// show; the UI renders them from lib/content.ts so facts stay in one place.
import { projects } from "@/lib/content";
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
  | { type: "files"; hidden?: boolean }
  | { type: "neofetch" }
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
  { command: "cat contact", description: "how to reach me" },
  { command: "neofetch", description: "system info, Sudo included" },
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
  // Hidden: only `ls -a` lists it. It leads to the easter egg.
  ".sudo-secrets": { type: "secrets" },
};

const error = (text: string): Result => ({ output: { type: "error", text } });
const message = (text: string): Result => ({
  output: { type: "message", text },
});

export function run(input: string): Result {
  const words = input.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return {};
  const [command, ...args] = words;
  const arg = args[0];

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
      break;
    case "ls":
      if (!arg) return { output: { type: "files" } };
      if (["-a", "-la", "-al"].includes(arg)) {
        return { output: { type: "files", hidden: true } };
      }
      if (arg === "projects" || arg === "projects/") {
        return { output: { type: "projects" } };
      }
      return error(`ls: cannot access '${arg}': No such file or directory`);
    case "cat":
      if (!arg) return error("cat: missing file operand. Try ls");
      return files[arg]
        ? { output: files[arg] }
        : error(`cat: ${arg}: No such file or directory`);
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
  "cat contact",
  "git log",
  "git log --graph",
  "ls",
  "ls projects/",
  ...projects.map((p) => `open ${p.slug}`),
  "theme light",
  "theme dark",
  "neofetch",
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
