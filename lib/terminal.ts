// The terminal's command engine: pure functions, no React. Outputs name what to
// show; the UI renders them from lib/content.ts so facts stay in one place.
import { projects } from "@/lib/content";
import type { Theme } from "@/lib/theme";

export type Output =
  | { type: "whoami" }
  | { type: "about" }
  | { type: "experience" }
  | { type: "projects" }
  | { type: "project"; slug: string }
  | { type: "skills" }
  | { type: "education" }
  | { type: "contact"; note?: string }
  | { type: "files" }
  | { type: "help" }
  | { type: "message"; text: string }
  | { type: "error"; text: string };

export type Effect = { type: "clear" } | { type: "theme"; theme: Theme };

export type Result = { output?: Output; effect?: Effect };

export const helpEntries = [
  { command: "whoami", description: "who I am" },
  { command: "cat about.md", description: "summary" },
  { command: "git log", description: "work history" },
  {
    command: "ls projects/",
    description: "selected projects (open <name> for details)",
  },
  { command: "cat skills.txt", description: "skills" },
  { command: "cat education.md", description: "education" },
  { command: "cat contact", description: "how to reach me" },
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
  "about.md": { type: "about" },
  about: { type: "about" },
  "skills.txt": { type: "skills" },
  skills: { type: "skills" },
  "education.md": { type: "education" },
  education: { type: "education" },
  contact: { type: "contact" },
};

const error = (text: string): Result => ({ output: { type: "error", text } });

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
      if (arg === "log") return { output: { type: "experience" } };
      break;
    case "ls":
      if (!arg) return { output: { type: "files" } };
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
    case "sudo":
      if (args.join(" ") === "hire muji") {
        return { output: { type: "contact", note: "permission granted." } };
      }
      return error("sudo: nice try. Try help");
  }
  return error(`command not found: ${words.join(" ")}. Try help`);
}

// Every full command a visitor can complete to; the easter egg stays hidden.
const completions = [
  "whoami",
  "cat about.md",
  "cat skills.txt",
  "cat education.md",
  "cat contact",
  "git log",
  "ls",
  "ls projects/",
  ...projects.map((p) => `open ${p.slug}`),
  "theme light",
  "theme dark",
  "help",
  "clear",
];

function sharedPrefix(values: string[]): string {
  return values.reduce((prefix, value) => {
    let i = 0;
    while (i < prefix.length && prefix[i] === value[i]) i++;
    return prefix.slice(0, i);
  });
}

/** Tab completion: the completed value, plus the options when it is ambiguous. */
export function complete(input: string): { value: string; options: string[] } {
  const typed = input.toLowerCase().trimStart();
  const matches = completions.filter((c) => c.startsWith(typed));
  if (matches.length === 0) return { value: input, options: [] };
  if (matches.length === 1) return { value: matches[0], options: [] };
  return { value: sharedPrefix(matches), options: [...matches].sort() };
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
