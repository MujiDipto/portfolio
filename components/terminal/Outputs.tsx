import type { ReactNode } from "react";
import { Numbers } from "@/components/Numbers";
import {
  contact,
  contactPitch,
  education,
  additionalExperience,
  experience,
  profile,
  projects,
  resume,
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
      className={`${className} inline-flex min-h-6 cursor-pointer items-center underline-offset-4 hover:underline`}
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
    <ul className="marker:text-muted mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
      {items.map((item) => (
        <li key={item}>
          <Numbers text={item} />
        </li>
      ))}
    </ul>
  );
}

// Pixel icons, drawn like Sudo: each character is one pixel, "#" is filled.
const icons = {
  briefcase: [
    "..###..",
    "..#.#..",
    "#######",
    "#.....#",
    "#######",
    "#.....#",
    "#######",
  ],
  pin: [
    "..###..",
    ".#####.",
    "##...##",
    "##...##",
    ".#####.",
    "..###..",
    "...#...",
  ],
};

function PixelIcon({
  name,
  className,
}: {
  name: keyof typeof icons;
  className: string;
}) {
  const rows = icons[name];
  return (
    <svg
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      width={rows[0].length * 2}
      height={rows.length * 2}
      shapeRendering="crispEdges"
      className={`inline-block flex-none ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {rows.flatMap((row, y) =>
        [...row].map((pixel, x) =>
          pixel === "#" ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

/**
 * Each organisation newest first, styled like `git log`: dates in the number
 * colour, then the organisation, then the titles held there.
 */
function Career() {
  return (
    <dl className="grid gap-x-4 text-sm sm:grid-cols-[max-content_max-content_1fr]">
      {experience.map((org) => {
        const end = org.roles[0].end;
        return (
          <div key={org.name} className="contents">
            <dd className="text-number mt-2 sm:mt-0">
              {org.roles.at(-1)!.start} – {end === "Present" ? "present" : end}
            </dd>
            <dt className="text-fg-strong font-semibold">{org.name}</dt>
            <dd>
              {[...org.roles]
                .reverse()
                .map((role) => role.title)
                .join(" → ")}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function Whoami({ main }: { main: boolean }) {
  const Name = main ? "h1" : "p";
  const current = experience[0];
  return (
    <div>
      <Name className="text-fg-strong text-3xl font-semibold tracking-tight">
        {profile.name}
      </Name>
      <p className="mt-2 text-lg">
        {profile.title} | {profile.focus}
      </p>
      <ul className="text-muted mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <li className="flex items-center gap-2">
          <PixelIcon name="briefcase" className="text-prompt-path" />
          {current.roles[0].title} @ {current.name}
        </li>
        <li className="flex items-center gap-2">
          <PixelIcon name="pin" className="text-dot-close" />
          {profile.location}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="text-accent">
            ●
          </span>
          {profile.status}
        </li>
      </ul>
      <div className="mt-4">
        <Career />
      </div>
    </div>
  );
}

/**
 * `revealed` is how many lines the opening animation has printed; hidden lines
 * stay in the DOM so screen readers and search engines get them at once.
 */
function Outcomes({ revealed }: { revealed?: number }) {
  return (
    <div className="leading-relaxed">
      <Title>Highlights</Title>
      <ul className="space-y-1">
        {profile.outcomes.map((outcome, i) => (
          <li
            key={outcome.value}
            data-boot-line
            className={`flex gap-4 ${
              revealed !== undefined && i >= revealed ? "boot-hidden" : ""
            }`}
          >
            <span className="text-number w-[6ch] flex-none text-right font-semibold">
              {outcome.value}
            </span>{" "}
            <span>{outcome.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Experience() {
  return (
    <div className="space-y-6">
      <Title>Experience</Title>
      {[...experience, ...additionalExperience].map((org) =>
        org.roles.map((role) => (
          <article key={`${org.name}-${role.title}`}>
            <p className="text-number text-sm">
              {role.start} – {role.end}
            </p>
            <h3 className="text-fg-strong font-semibold">
              {role.title}, {org.name}
              {org.location && (
                <span className="text-muted font-normal">
                  {" "}
                  ({org.location})
                </span>
              )}
            </h3>
            {role.highlights.length > 0 && (
              <Highlights items={role.highlights} />
            )}
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
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[11rem_1fr]">
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
    <div>
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
    { label: "résumé", link: resume, download: true },
  ];
  return (
    <div>
      <Title>Contact</Title>
      {note && <p className="text-prompt-user mb-2">{note}</p>}
      <p className="text-fg-strong text-lg font-semibold">
        {contactPitch.line}
      </p>
      <p className="mt-2 mb-4 max-w-[70ch] leading-relaxed">
        {contactPitch.status}
      </p>
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[6rem_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted">{row.label}</dt>
            <dd className="mb-1 break-all sm:mb-0">
              <a
                href={row.link.href}
                download={row.download}
                className={linkClass}
              >
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
    { label: "contact", command: "cat contact" },
    { label: "education.md", command: "cat education.md" },
    { label: "highlights.md", command: "cat highlights.md" },
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
  revealed,
}: {
  output: Output;
  main?: boolean;
  onRun?: RunCommand;
  revealed?: number;
}) {
  switch (output.type) {
    case "whoami":
      return <Whoami main={main} />;
    case "highlights":
      return <Outcomes revealed={revealed} />;
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
