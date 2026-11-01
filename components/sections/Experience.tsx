import { Highlights } from "@/components/Highlights";
import { Section } from "@/components/Section";
import { experience } from "@/lib/content";

export function Experience() {
  return (
    <Section id="experience" title="Experience" command="git log">
      <div className="space-y-12">
        {experience.map((org) => (
          <div key={org.name}>
            <h3 className="text-fg-strong text-xl font-semibold">{org.name}</h3>
            <p className="text-muted font-mono text-sm">{org.location}</p>
            <ol className="border-border mt-5 space-y-8 border-l pl-5">
              {org.roles.map((role) => (
                <li key={role.title}>
                  <p className="text-muted font-mono text-sm">
                    {role.start} – {role.end}
                  </p>
                  <h4 className="text-fg-strong mt-1 text-lg font-medium">
                    {role.title}
                  </h4>
                  <Highlights items={role.highlights} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </Section>
  );
}
