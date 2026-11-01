import type { ReactNode } from "react";
import { Numbers } from "@/components/Numbers";
import {
  contact,
  education,
  experience,
  profile,
  projects,
  skills,
} from "@/lib/content";
import { helpEntries, type Output } from "@/lib/terminal";

/** Runs a command when a visitor clicks it; absent in the no-JS session. */
export type RunCommand = (command: string) => void;

export const linkClass =
  "text-accent underline underline-offset-4 hover:no-underline";

/** A command a visitor can click; plain text when there is no JavaScript. */
export function CommandButton({
  command,
  label = command,
  onRun,
  className = "text-accent",
}: {
  command: string;
  label?: string;
  onRun?: RunCommand;
  className?: string;
}) {
  if (!onRun) return <code className={className}>{label}</code>;
  return (
    <button
      type="button"
      onClick={() => onRun(command)}
      className={`${className} cursor-pointer underline-offset-4 hover:underline`}
    >
      {label}
    </button>
  );
}

function Title({ children }: { children: ReactNode }) {
  return <h2 className="sr-only">{children}</h2>;
}

function Highlights({ items }: { items: string[] }) {
  return (
    <ul className="marker:text-muted mt-2 max-w-[80ch] list-disc space-y-1.5 pl-5 leading-relaxed">
      {items.map((item) => (
        <li key={item}>
          <Numbers text={item} />
        </li>
      ))}
    </ul>
  );
}

function Whoami({ main }: { main: boolean }) {
  const Name = main ? "h1" : "p";
  return (
    <div>
      <Name className="text-fg-strong text-3xl font-semibold tracking-tight">
        {profile.name}
      </Name>
      <p className="mt-2 text-lg">
        {profile.title}, {profile.focus}
      </p>
      <p className="text-muted mt-1 text-sm">{profile.location}</p>
    </div>
  );
}

function About() {
  return (
    <div className="max-w-[80ch] space-y-2 leading-relaxed">
      <Title>About</Title>
      {profile.summary.map((line) => (
        <p key={line}>
          <Numbers text={line} />
        </p>
      ))}
    </div>
  );
}

function Experience() {
  return (
    <div className="space-y-6">
      <Title>Experience</Title>
      {experience.map((org) =>
        org.roles.map((role) => (
          <article key={`${org.name}-${role.title}`}>
            <p className="text-number text-sm">
              {role.start} – {role.end}
            </p>
            <h3 className="text-fg-strong font-semibold">
              {role.title}, {org.name}
              <span className="text-muted font-normal"> ({org.location})</span>
            </h3>
            <Highlights items={role.highlights} />
          </article>
        )),
      )}
    </div>
  );
}

function ProjectList({ onRun }: { onRun?: RunCommand }) {
  return (
    <div>
      <Title>Projects</Title>
      <ul className="flex flex-wrap gap-x-6 gap-y-1">
        {projects.map((p) => (
          <li key={p.slug}>
            <CommandButton
              command={`open ${p.slug}`}
              label={`${p.slug}/`}
              onRun={onRun}
              className="text-prompt-path"
            />
          </li>
        ))}
      </ul>
      {onRun && (
        <p className="text-muted mt-2 text-sm">open &lt;name&gt; for details</p>
      )}
    </div>
  );
}

function Project({ slug }: { slug: string }) {
  const project = projects.find((p) => p.slug === slug);
  if (!project) return null;
  return (
    <article>
      <h3 className="text-fg-strong text-lg font-semibold">{project.name}</h3>
      <p className="text-muted text-sm">{project.context}</p>
      <Highlights items={project.highlights} />
      <p className="mt-3 text-sm">
        <span className="text-muted">stack:</span> {project.stack.join(", ")}
      </p>
      {project.link && (
        <p className="mt-1 text-sm">
          <span className="text-muted">repo:</span>{" "}
          <a href={project.link.href} className={linkClass}>
            {project.link.label}
          </a>
        </p>
      )}
    </article>
  );
}

function Skills() {
  return (
    <div>
      <Title>Skills</Title>
      <dl className="grid max-w-[80ch] gap-x-6 gap-y-1 sm:grid-cols-[11rem_1fr]">
        {skills.map((skill) => (
          <div key={skill.group} className="contents">
            <dt className="text-fg-strong font-semibold">{skill.group}</dt>
            <dd className="mb-2 sm:mb-0">{skill.items.join(", ")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Education() {
  return (
    <div className="max-w-[80ch]">
      <Title>Education</Title>
      <h3 className="text-fg-strong font-semibold">{education.degree}</h3>
      <p className="text-muted text-sm">
        {education.institution}, {education.start} – {education.end}
      </p>
      <div className="mt-2 space-y-1.5 leading-relaxed">
        {education.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </div>
  );
}

function Contact({ note }: { note?: string }) {
  const rows = [
    { label: "email", link: contact.email },
    { label: "linkedin", link: contact.linkedin },
    { label: "github", link: contact.github },
  ];
  return (
    <div>
      <Title>Contact</Title>
      {note && <p className="text-prompt-user mb-2">{note}</p>}
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[6rem_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted">{row.label}</dt>
            <dd className="mb-1 break-all sm:mb-0">
              <a href={row.link.href} className={linkClass}>
                {row.link.label}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Files({ onRun }: { onRun?: RunCommand }) {
  const entries = [
    { label: "about.md", command: "cat about.md" },
    { label: "contact", command: "cat contact" },
    { label: "education.md", command: "cat education.md" },
    { label: "projects/", command: "ls projects/" },
    { label: "skills.txt", command: "cat skills.txt" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-1">
      {entries.map((e) => (
        <li key={e.label}>
          <CommandButton
            command={e.command}
            label={e.label}
            onRun={onRun}
            className={
              e.label.endsWith("/") ? "text-prompt-path" : "text-fg-strong"
            }
          />
        </li>
      ))}
    </ul>
  );
}

function Help({ onRun }: { onRun?: RunCommand }) {
  return (
    <div>
      <Title>Commands</Title>
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[13rem_1fr]">
        {helpEntries.map((entry) => (
          <div key={entry.command} className="contents">
            <dt>
              <CommandButton
                command={entry.command.replace("dark|light", "dark")}
                label={entry.command}
                onRun={onRun}
              />
            </dt>
            <dd className="text-muted mb-1 sm:mb-0">{entry.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function OutputView({
  output,
  main = false,
  onRun,
}: {
  output: Output;
  main?: boolean;
  onRun?: RunCommand;
}) {
  switch (output.type) {
    case "whoami":
      return <Whoami main={main} />;
    case "about":
      return <About />;
    case "experience":
      return <Experience />;
    case "projects":
      return <ProjectList onRun={onRun} />;
    case "project":
      return <Project slug={output.slug} />;
    case "skills":
      return <Skills />;
    case "education":
      return <Education />;
    case "contact":
      return <Contact note={output.note} />;
    case "files":
      return <Files onRun={onRun} />;
    case "help":
      return <Help onRun={onRun} />;
    case "message":
      return <p className="text-muted">{output.text}</p>;
    case "error":
      return <p className="text-fg">{output.text}</p>;
  }
}
