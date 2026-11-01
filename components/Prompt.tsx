/** A decorative shell prompt; screen readers get the real heading instead. */
export function Prompt({ command }: { command: string }) {
  return (
    <p aria-hidden="true" className="font-mono text-sm">
      <span className="text-prompt-user">muji@brisbane</span>{" "}
      <span className="text-prompt-path">~</span>{" "}
      <span className="text-muted">$</span> {command}
    </p>
  );
}
