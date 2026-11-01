import { Prompt } from "@/components/Prompt";
import { OutputView } from "@/components/terminal/Outputs";
import { projects } from "@/lib/content";
import { run } from "@/lib/terminal";

// Everything after the opening, as if each command had been run. The page
// shows it only when JavaScript is off.
const commands = [
  "git log",
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
          <div key={command}>
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
