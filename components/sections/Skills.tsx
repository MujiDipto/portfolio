import { Section } from "@/components/Section";
import { skills } from "@/lib/content";

export function Skills() {
  return (
    <Section id="skills" title="Skills" command="cat skills.txt">
      <dl className="grid max-w-[72ch] gap-x-8 gap-y-3 sm:grid-cols-[10rem_1fr]">
        {skills.map((skill) => (
          <div key={skill.group} className="contents">
            <dt className="text-fg-strong font-mono text-sm sm:pt-0.5">
              {skill.group}
            </dt>
            <dd className="mb-2 sm:mb-0">{skill.items.join(", ")}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
