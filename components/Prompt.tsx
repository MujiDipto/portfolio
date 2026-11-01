/**
 * A shell prompt line. The `muji@brisbane ~ $` prefix is decoration hidden from
 * screen readers; the command itself is read out.
 */
export function Prompt({ command }: { command?: string }) {
  return (
    <p className="text-base">
      <PromptPrefix /> {command}
    </p>
  );
}

export function PromptPrefix() {
  return (
    <span aria-hidden="true" data-prompt-prefix>
      <span className="text-prompt-user">muji@brisbane</span>{" "}
      <span className="text-prompt-path">~</span>{" "}
      <span className="text-muted">$</span>
    </span>
  );
}
