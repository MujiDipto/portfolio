// What Sudo, the mascot, says (approved by Muji, 2026-11-02): pure functions,
// no React. Each line may end in a command the visitor can click.
// Sudo speaks about Muji, never for him, and adds no facts beyond
// lib/content.ts.
import { run } from "@/lib/terminal";

export type Line = { text: string; command?: string; after?: string };

export const greeting: Line = {
  text: "Hi, I am Sudo, the keeper of this terminal. Run",
  command: "help",
  after: "to see a list of commands.",
};

/** A next step after each kind of output, so the cat guides the visit. */
const replies: Record<string, Line> = {
  whoami: { text: "Want the numbers? Try", command: "cat highlights.md" },
  highlights: { text: "See where they came from:", command: "git log" },
  experience: { text: "Now see what Muji built:", command: "ls projects/" },
  graph: {
    text: "Two branches, one HEAD. The full story:",
    command: "git log",
  },
  files: { text: "The projects live in", command: "ls projects/" },
  projects: { text: "Click a folder to open it." },
  project: { text: "Seen enough? Say hi:", command: "cat contact" },
  skills: { text: "Where it started:", command: "cat education.md" },
  education: { text: "Want to talk to Muji?", command: "cat contact" },
  contact: { text: "Email is fastest. I'll keep watch here." },
  help: { text: "Tip: Tab or → accepts the grey hint." },
  neofetch: { text: "That's me on the left. Handsome, right?" },
  audit: {
    text: "Supply chains are Muji's thing. See one he scored:",
    command: "open sca-scoring",
  },
  secrets: { text: "Shh. Don't tell Muji I told you." },
  error: { text: "Hmm, that's not a command. Try", command: "help" },
};

export function reply(command: string): Line {
  if (isEgg(command)) {
    return { text: "Permission granted. Muji's inbox is below." };
  }
  if (callsSudo(command)) {
    return { text: "That's my name! But only Muji has sudo rights here." };
  }
  const joke = jokes[firstWord(command)];
  if (joke) return joke;
  const { output, effect } = run(command);
  if (output?.type === "files" && output.hidden) {
    return { text: "Ooh, you found the hidden files." };
  }
  if (effect?.type === "clear") {
    return { text: "All clean. Lost? Try", command: "help" };
  }
  if (effect?.type === "theme") {
    const other = effect.theme === "light" ? "dark" : "light";
    return {
      text: "Looking good. Switch back with",
      command: `theme ${other}`,
    };
  }
  return (output && replies[output.type]) ?? replies.error;
}

/** The hidden easter egg, which Sudo celebrates. */
export function isEgg(command: string): boolean {
  return (
    command.trim().toLowerCase().split(/\s+/).join(" ") === "sudo hire muji"
  );
}

/** Sudo's side of the terminal easter eggs (lib/terminal.ts). */
const jokes: Record<string, Line> = {
  exit: {
    text: "Nobody leaves without saying hi. Try",
    command: "cat contact",
  },
  logout: {
    text: "Nobody leaves without saying hi. Try",
    command: "cat contact",
  },
  vim: { text: "Esc, then :q. You're welcome." },
  vi: { text: "Esc, then :q. You're welcome." },
  rm: { text: "Not on my watch." },
};

function firstWord(command: string): string {
  return command.trim().toLowerCase().split(/\s+/)[0];
}

/** Whether Sudo jumps: for joy at the easter egg, or to stop an `rm`. */
export function jumps(command: string): boolean {
  return isEgg(command) || firstWord(command) === "rm";
}

/** `sudo` is the cat's own name, so it answers rather than treat it as a typo. */
function callsSudo(command: string): boolean {
  return firstWord(command) === "sudo";
}

/** Whether a command is one the terminal does not know. */
export function isMistake(command: string): boolean {
  return !callsSudo(command) && run(command).output?.type === "error";
}

/** Shown in turn each time the visitor clicks the cat. */
export const tips: Line[] = [
  { text: "Tip: Tab or → accepts the grey hint." },
  { text: "Tip: ↑ and ↓ bring back earlier commands." },
  { text: "Tip: Esc clears the line." },
  { text: "Tip: prefer light? Try", command: "theme light" },
];
