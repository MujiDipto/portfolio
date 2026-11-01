import { Highlights } from "@/components/Highlights";
import { Section, linkClass } from "@/components/Section";
import { projects } from "@/lib/content";

export function Projects() {
  return (
    <Section id="projects" title="Projects" command="ls projects/">
      <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
        {projects.map((project) => (
          <li key={project.slug}>
            <a
              href={`#project-${project.slug}`}
              className="text-prompt-path hover:underline"
            >
              {project.slug}/
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-10 space-y-12">
        {projects.map((project) => (
          <article
            key={project.slug}
            id={`project-${project.slug}`}
            aria-labelledby={`project-${project.slug}-heading`}
            className="border-border scroll-mt-4 border-t pt-8"
          >
            <h3
              id={`project-${project.slug}-heading`}
              className="text-fg-strong text-xl font-semibold"
            >
              {project.name}
            </h3>
            <p className="text-muted font-mono text-sm">{project.context}</p>
            <Highlights items={project.highlights} />
            <p className="mt-4 font-mono text-sm">
              <span className="text-muted">stack:</span>{" "}
              {project.stack.join(", ")}
            </p>
            {project.link && (
              <p className="mt-2 font-mono text-sm">
                <span className="text-muted">repo:</span>{" "}
                <a href={project.link.href} className={linkClass}>
                  {project.link.label}
                </a>
              </p>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
