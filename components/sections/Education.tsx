import { Section } from "@/components/Section";
import { education } from "@/lib/content";

export function Education() {
  return (
    <Section id="education" title="Education" command="cat education.md">
      <h3 className="text-fg-strong text-xl font-semibold">
        {education.degree}
      </h3>
      <p className="text-muted font-mono text-sm">
        {education.institution}, {education.start} – {education.end}
      </p>
      <div className="mt-3 max-w-[72ch] space-y-2 leading-relaxed">
        {education.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </Section>
  );
}
