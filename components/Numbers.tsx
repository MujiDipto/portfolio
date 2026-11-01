// Colours numbers like number literals in a code editor (see CLAUDE.md Design).
const NUMBER = /(\d[\d,]*(?:\.\d+)?\+?%?)/;

export function Numbers({ text }: { text: string }) {
  return text.split(NUMBER).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="text-number">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
