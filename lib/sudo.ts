// What Sudo, the mascot, says (approved by Muji, 2026-11-02): pure functions,
// no React. Each line may end in a command the visitor can click.
// Sudo speaks about Muji, never for him, and adds no facts beyond
// lib/content.ts.
import { siteUrl } from "@/lib/site";
import { readOnly, run } from "@/lib/terminal";

export type Line = { text: string; command?: string; after?: string };

export const greeting: Line = {
  text: "Hi, I am Sudo, the keeper of this terminal. Run",
  command: "help",
  after: "to see a list of commands.",
};

/** A next step after each kind of output, so the cat guides the visit. */
const replies: Record<string, Line> = {
  tree: { text: "Every file here. Click one to open it." },
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
  recommendations: {
    text: "Kind words. Want to talk to Muji?",
    command: "cat contact",
  },
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
  // Everyday shell commands print a line, or nothing (cd); Sudo answers
  // them rather than treating them as mistakes.
  if (!output || output.type === "message") {
    const word = firstWord(command);
    if (shell[word]) return shell[word];
    if (readOnly.includes(word)) {
      return { text: "Read-only, I'm afraid. I guard this terminal." };
    }
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

/** Sudo's side of the everyday shell commands (lib/terminal.ts). */
const shell: Record<string, Line> = {
  pwd: { text: "Home sweet home. Look around:", command: "ls" },
  cd: { text: "Everything is right here in ~. Try", command: "ls projects/" },
  echo: { text: "Loud and clear. Now try", command: "cat highlights.md" },
  date: { text: "That's Brisbane time, where Muji is." },
  hostname: { text: "That's my home address. Bookmark it." },
  uname: {
    text: "Small stack, fast site. Check its health:",
    command: "npm audit",
  },
  id: { text: "Muji is uid 1000. I'm just the cat." },
  history: { text: "Your trail so far. ↑ brings any of it back." },
  man: { text: "No manuals here, but there is", command: "help" },
  git: {
    text: "Clean tree, open branch. The full story:",
    command: "git log --graph",
  },
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
  { text: "Tip: Page Up and Page Down scroll the output." },
  { text: "Tip: prefer light? Try", command: "theme light" },
  { text: `Tip: in your own terminal, try curl ${siteUrl.host}` },
];
