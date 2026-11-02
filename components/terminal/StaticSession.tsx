import { Prompt } from "@/components/Prompt";
import { OutputView } from "@/components/terminal/Outputs";
import { projects } from "@/lib/content";
import { linkFor, run } from "@/lib/terminal";

// Everything after the opening, as if each command had been run. The page
// shows it only when JavaScript is off. Each section's id is its deep link
// (lib/terminal.ts), so /#career scrolls to it without JavaScript too.
const commands = [
  "git log",
  "git log --graph",
  "ls projects/",
  ...projects.map((p) => `open ${p.slug}`),
  "cat skills.txt",
  "cat education.md",
  "cat contact",
];

export function StaticSession() {
  return (
    <div className="mt-6 space-y-6">
      {commands.map((command) => {
        const { output } = run(command);
        return (
          <div key={command} id={linkFor(command)} className="scroll-mt-4">
            <Prompt command={command} />
            {output && (
              <div className="mt-3">
                <OutputView output={output} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
