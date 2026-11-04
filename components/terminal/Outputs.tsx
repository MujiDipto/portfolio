import type { CSSProperties, ReactNode } from "react";
import { CatImage } from "@/components/cat/CatImage";
import { Game } from "@/components/games/Game";
import { AuditOutput } from "@/components/terminal/AuditOutput";
import { CountUp } from "@/components/terminal/CountUp";
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
  type Organisation,
  type Project,
  pullQuote,
  recommendations,
  usedIn,
} from "@/lib/content";
import { games, helpEntries, linkFor, type Output } from "@/lib/terminal";
import { currentTheme } from "@/lib/theme";

/** Runs a command when a visitor clicks it; absent in the no-JS session. */
export type RunCommand = (command: string) => void;

export const linkClass =
  "text-accent underline underline-offset-4 hover:no-underline";

/**
 * A link. Other sites (LinkedIn, GitHub, a repo) open in a new tab, so the
 * terminal session is not lost; email, the résumé download and this site's
 * own pages stay in place.
 */
function TextLink({
  href,
  download,
  children,
}: {
  href: string;
  download?: boolean;
  children: ReactNode;
}) {
  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      download={download}
      className={linkClass}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

/**
 * A command a visitor can click. Without JavaScript (and on /cv) it links to
 * the command's deep link instead, or is plain text when it has none.
 */
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
  if (!onRun) {
    const link = linkFor(command);
    if (!link) return <code className={className}>{label}</code>;
    return (
      <a
        href={`/#${link}`}
        className={`${className} underline underline-offset-4 hover:no-underline`}
      >
        {label}
      </a>
    );
  }
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
  // Screen-reader only in the terminal; app/cv/page.tsx shows them (globals.css).
  return (
    <h2 data-title className="sr-only">
      {children}
    </h2>
  );
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

export function Whoami({
  main,
  cvLink = true,
}: {
  main: boolean;
  /** /cv leaves out its own link. */
  cvLink?: boolean;
}) {
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
      {/* Everything a recruiter needs, without typing a command. */}
      <ul
        aria-label="Links"
        className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm"
      >
        {[
          { label: "résumé.pdf", href: resume.href, download: true },
          { label: "linkedin", href: contact.linkedin.href },
          { label: "github", href: contact.github.href },
          { label: "email", href: contact.email.href },
          ...(cvLink ? [{ label: "non-interactive mode", href: "/cv" }] : []),
        ].map((link) => (
          <li key={link.label}>
            <TextLink href={link.href} download={link.download}>
              {link.label}
            </TextLink>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Career />
      </div>
    </div>
  );
}

/** A highlight row's theme word: beside its figure on wide screens. */
function RowLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-muted text-sm sm:w-[8ch] sm:flex-none">
      {children}
    </span>
  );
}

/**
 * `cat highlights.md`: four rows of one shape, a theme word, a figure and a
 * sentence. Three are outcomes, number first; the fourth is a colleague's
 * words, with a purple quote mark as its figure.
 * `revealed` is how many lines the opening animation has printed; hidden
 * lines stay in the DOM so screen readers and search engines get them at once.
 */
// The quote split before its last word, which keeps the closing mark company.
const quoteBreak = pullQuote.text.lastIndexOf(" ") + 1;
const quoteStart = pullQuote.text.slice(0, quoteBreak);
const quoteEnd = pullQuote.text.slice(quoteBreak);

function Outcomes({
  revealed,
  onRun,
}: {
  revealed?: number;
  onRun?: RunCommand;
}) {
  // On phones the label sits beside the figure, above the sentence.
  const row = "flex flex-col gap-x-4 sm:flex-row sm:items-baseline";
  const head = "flex items-baseline gap-3 sm:contents";
  const figure =
    "flex-none text-2xl leading-tight font-bold tabular-nums sm:w-[6ch] sm:text-right sm:leading-none";
  return (
    <div>
      <Title>Highlights</Title>
      <ul className="space-y-1">
        {profile.outcomes.map((outcome, i) => {
          const waiting = revealed !== undefined && i >= revealed;
          return (
            <li
              key={outcome.value}
              data-boot-line
              className={`${row} ${waiting ? "boot-hidden" : ""}`}
            >
              <span className={head}>
                <RowLabel>{outcome.label}</RowLabel>
                <span className={`text-number ${figure}`}>
                  <CountUp value={outcome.value} waiting={waiting} />
                </span>
              </span>{" "}
              <span className="min-w-0 leading-normal">
                <span className="text-fg-strong">{outcome.text}</span>{" "}
                {/* An arrow to the proof, the project; wraps as one piece. */}
                <span className="text-muted ml-2 text-sm whitespace-nowrap">
                  <span aria-hidden="true">↳ </span>
                  <CommandButton
                    command={`open ${outcome.project}`}
                    onRun={onRun}
                  />
                </span>
              </span>
            </li>
          );
        })}
        {/* In the opening it appears with the last highlight. */}
        <li
          data-pull-quote
          className={`${row} ${
            revealed !== undefined && revealed < profile.outcomes.length
              ? "boot-hidden"
              : ""
          }`}
        >
          <span className={head}>
            <RowLabel>{pullQuote.label}</RowLabel>
            {/* Purple like the numbers: Muji's choice for the quote marks. */}
            <span aria-hidden="true" className={`text-number ${figure}`}>
              “
            </span>
          </span>
          <figure className="min-w-0 leading-normal">
            <blockquote className="text-fg-strong inline">
              {quoteStart}
              {/* The last word and the closing mark wrap together, so the
                  mark never sits alone on a line. */}
              <span className="whitespace-nowrap">
                {quoteEnd}
                {/* Drawn over a small box, so the large mark cannot make the
                    line taller and push the first screen past the window.
                    ml-4 matches the gap after the opening mark. */}
                <span
                  aria-hidden="true"
                  className="relative ml-4 inline-block w-[1ch]"
                >
                  <span className="text-number absolute -top-5 left-0 text-2xl leading-none font-bold">
                    ”
                  </span>
                </span>
              </span>
            </blockquote>{" "}
            <figcaption className="text-muted ml-2 inline text-sm whitespace-nowrap">
              <span aria-hidden="true">↳ </span>
              {/* Name only, so the row stays one line; the full title is in
                  cat recommendations.md, which the name opens. */}
              <CommandButton
                command="cat recommendations.md"
                label={pullQuote.by.name}
                onRun={onRun}
              />
            </figcaption>
          </figure>
        </li>
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

/** A short, stable stand-in for a commit hash, so the graph looks like git. */
function fakeHash(text: string): string {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash.toString(16).padStart(7, "0").slice(0, 7);
}

type Branch = "main" | "oracle" | "uq";

type GraphRow = {
  /** The graph characters; column 0 is main, the rest the row's branch. */
  lanes: string;
  branch: Branch;
  date?: string;
  /** The branch HEAD is on, shown as `HEAD -> name`. */
  head?: string;
  /** A branch that points here without HEAD, such as `main`. */
  ref?: string;
  tag?: string;
  /** A merge names its branch, which runs `command` when clicked. */
  merge?: { branch: Exclude<Branch, "main">; command: string };
  text?: string;
};

// Like git's coloured graph: each branch keeps its own colour.
const laneColour: Record<Branch, string> = {
  main: "text-prompt-user",
  oracle: "text-number",
  uq: "text-prompt-path",
};

/**
 * The career as `git log --graph`, newest first: Oracle and the degree are
 * branches that merge into main, as real history would. Every fact comes from
 * lib/content.ts; only the hashes and the decorative `senior` tag are made up.
 */
export function careerGraph(): GraphRow[] {
  const [current, oracle] = experience;
  const [senior, engineer, analyst] = oracle.roles;
  const tutor = additionalExperience[0].roles[0];
  const thesis = education.notes[0];
  return [
    {
      lanes: "*  ",
      branch: "main",
      date: current.roles[0].start,
      // The current chapter: a branch ahead of main, not merged yet.
      head: "onearly",
      text: `joined ${current.name} as ${current.roles[0].title}`,
    },
    {
      lanes: "*  ",
      branch: "main",
      date: senior.end,
      ref: "main",
      merge: { branch: "oracle", command: "git log" },
      text: `${tenure(oracle)}, ${analyst.title} to ${senior.title}`,
    },
    { lanes: "|\\ ", branch: "oracle" },
    {
      lanes: "| *",
      branch: "oracle",
      date: senior.start,
      tag: "senior",
      text: `promoted to ${senior.title}`,
    },
    {
      lanes: "| *",
      branch: "oracle",
      date: engineer.start,
      text: `became ${engineer.title}`,
    },
    {
      lanes: "| *",
      branch: "oracle",
      date: analyst.start,
      text: `joined ${oracle.name} as ${analyst.title}`,
    },
    { lanes: "|/ ", branch: "oracle" },
    {
      lanes: "*  ",
      branch: "main",
      date: education.end,
      merge: { branch: "uq", command: "cat education.md" },
      text: education.degree,
    },
    { lanes: "|\\ ", branch: "uq" },
    {
      lanes: "| *",
      branch: "uq",
      // "Honours thesis with Oracle: automated IoT firmware ..." from the résumé.
      text: thesis
        .slice(0, thesis.indexOf(" through"))
        .replace("Honours thesis", "honours thesis")
        .replace("automated ", ""),
    },
    {
      lanes: "| *",
      branch: "uq",
      date: tutor.start,
      text: `started tutoring ${tutor.title.replace("Casual Tutor, ", "")}`,
    },
    { lanes: "|/ ", branch: "uq" },
    // The root commit, where the uq branch splits off.
    {
      lanes: "*  ",
      branch: "main",
      date: education.start,
      text: `started at ${education.institution}`,
    },
  ];
}

function Lanes({ row }: { row: GraphRow }) {
  return (
    <span aria-hidden="true" className="flex-none whitespace-pre">
      {[...row.lanes].map((char, column) => (
        <span
          key={column}
          className={laneColour[column === 0 ? "main" : row.branch]}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

function CareerGraph({ onRun }: { onRun?: RunCommand }) {
  return (
    <div className="text-sm">
      <Title>Career graph</Title>
      <ul>
        {careerGraph().map((row, i) => (
          <li
            key={i}
            // In the terminal the graph draws itself line by line (globals.css).
            className={`flex gap-3 ${onRun ? "reveal-row" : ""}`}
            style={onRun ? ({ "--row": i } as CSSProperties) : undefined}
            aria-hidden={row.text ? undefined : true}
          >
            <Lanes row={row} />
            {row.text && (
              <>
                {/* On phones the hash gives way so the message can wrap. */}
                <span
                  aria-hidden="true"
                  className="text-accent hidden flex-none sm:inline"
                >
                  {fakeHash(row.text)}
                </span>
                <span className="text-number w-[8ch] flex-none">
                  {row.date}
                </span>
                <span className="min-w-0">
                  {(row.head || row.ref || row.tag) && (
                    <span className="font-semibold">
                      (
                      {row.head && (
                        <>
                          <span className="text-prompt-path">HEAD -&gt; </span>
                          <span className="text-prompt-user">{row.head}</span>
                        </>
                      )}
                      {row.ref && (
                        <span className="text-prompt-user">{row.ref}</span>
                      )}
                      {row.tag && (
                        <span className="text-accent">tag: {row.tag}</span>
                      )}
                      ){" "}
                    </span>
                  )}
                  {row.merge && (
                    <>
                      Merge branch &apos;
                      <CommandButton
                        command={row.merge.command}
                        label={row.merge.branch}
                        onRun={onRun}
                        className={laneColour[row.merge.branch]}
                      />
                      &apos;:{" "}
                    </>
                  )}
                  {row.text}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectList({ onRun }: { onRun?: RunCommand }) {
  return (
    <div>
      <Title>Projects</Title>
      <ul className="space-y-2">
        {projects.map((p) => (
          <li key={p.slug} className="grid gap-x-4 sm:grid-cols-[22ch_1fr]">
            <span>
              <CommandButton
                command={`open ${p.slug}`}
                label={`${p.slug}/`}
                onRun={onRun}
                className="text-prompt-path"
              />
            </span>
            {/* Outcome first, so a skimmer sees what each one achieved. */}
            <span className="sm:self-center">
              <Numbers text={p.outcome} />
            </span>
          </li>
        ))}
      </ul>
      {onRun && (
        <p className="text-muted mt-2 text-sm">open &lt;name&gt; for details</p>
      )}
    </div>
  );
}

export function Project({ slug }: { slug: string }) {
  const project = projects.find((p) => p.slug === slug);
  if (!project) return null;
  return (
    <article>
      <h3 className="text-fg-strong text-lg font-semibold">{project.name}</h3>
      <p className="text-muted text-sm">{project.context}</p>
      <p className="text-fg-strong mt-2 text-lg">
        <Numbers text={project.outcome} />
      </p>
      {project.story && <Story story={project.story} />}
      {project.story && <p className="text-muted mt-4 text-sm"># what I did</p>}
      <Highlights items={project.highlights} />
      <p className="mt-3 text-sm">
        <span className="text-muted">stack:</span> {project.stack.join(", ")}
      </p>
      {project.link && (
        <p className="mt-1 text-sm">
          <span className="text-muted">repo:</span>{" "}
          <TextLink href={project.link.href}>{project.link.label}</TextLink>
        </p>
      )}
      {project.notes && (
        <p className="mt-1 text-sm">
          <span className="text-muted">notes:</span>{" "}
          <TextLink href={project.notes.href}>{project.notes.label}</TextLink>
        </p>
      )}
    </article>
  );
}

/**
 * A project's deep dive: the problem, what made it hard, the approach and the
 * result, laid out like an annotated terminal listing.
 */
function Story({ story }: { story: NonNullable<Project["story"]> }) {
  const rows: [string, ReactNode][] = [
    ["problem", story.problem],
    ["challenge", <List key="challenge" items={story.constraints} />],
    ["approach", <List key="approach" items={story.approach} />],
    ...(story.result
      ? ([["result", <Numbers key="result" text={story.result} />]] as [
          string,
          ReactNode,
        ][])
      : []),
  ];
  return (
    <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-[9ch_1fr]">
      {rows.map(([label, body]) => (
        <div key={label} className="contents">
          <dt className="text-prompt-path">{label}</dt>
          <dd className="leading-relaxed">{body}</dd>
        </div>
      ))}
    </dl>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className="text-muted">
            -
          </span>
          <span>
            <Numbers text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Skills with their evidence: each one a project shows in use is listed with
 * those projects, as clickable ↳ links; the rest follow on one line.
 */
function Skills({ onRun }: { onRun?: RunCommand }) {
  return (
    <div>
      <Title>Skills</Title>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[11rem_1fr]">
        {skills.map((skill) => {
          const shown = skill.items.filter((item) => usedIn(item).length > 0);
          const rest = skill.items.filter((item) => !shown.includes(item));
          return (
            <div key={skill.group} className="contents">
              <dt className="text-fg-strong font-semibold">{skill.group}</dt>
              <dd className="mb-2 sm:mb-0">
                {shown.length > 0 && (
                  <ul>
                    {shown.map((item) => (
                      <li key={item}>
                        {item}{" "}
                        <span className="text-muted text-sm">
                          <span aria-hidden="true">↳ </span>
                          <span className="sr-only">used in </span>
                          {usedIn(item).map((slug, i) => (
                            <span key={slug}>
                              {i > 0 && " "}
                              <CommandButton
                                command={`open ${slug}`}
                                label={slug}
                                onRun={onRun}
                              />
                            </span>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {rest.length > 0 && <p>{rest.join(", ")}</p>}
              </dd>
            </div>
          );
        })}
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

/** The subject `sudo hire muji` puts on its email, so Muji knows the route. */
export const hireSubject = "Found you via sudo hire muji";

/**
 * `sudo hire muji`, the hidden egg: a short privilege-escalation sequence
 * that hands over every way to reach Muji, printed line by line. It stays
 * honest about his status. No password prompt, even as a joke: a page that
 * asks for one looks like phishing.
 */
function Hire({ animate }: { animate: boolean }) {
  const grants = [
    {
      label: "résumé.pdf",
      href: resume.href,
      text: "download now",
      download: true,
    },
    {
      label: "direct line",
      href: `${contact.email.href}?subject=${encodeURIComponent(hireSubject)}`,
      text: "email Muji",
    },
    {
      label: "linkedin",
      href: contact.linkedin.href,
      text: contact.linkedin.label,
    },
    { label: "github", href: contact.github.href, text: contact.github.label },
  ];
  // Each line prints a beat after the last (globals.css .reveal-row).
  const reveal = (n: number, className = "") => ({
    className: `${animate ? "reveal-row" : ""} ${className}`.trim(),
    style: animate ? ({ "--row": n * 2 } as CSSProperties) : undefined,
  });
  return (
    <div className="leading-relaxed">
      <Title>Access granted</Title>
      <p {...reveal(0, "text-muted")}>
        [sudo] privileges confirmed for visitor
      </p>
      <p {...reveal(1)}>granting access to: muji</p>
      <ul className="my-1">
        {grants.map((g, i) => (
          <li key={g.label} {...reveal(i + 2, "grid grid-cols-[2ch_14ch_1fr]")}>
            <span aria-hidden="true" className="text-prompt-user">
              ✓
            </span>
            <span>{g.label}</span>
            <span>
              <TextLink href={g.href} download={g.download}>
                {g.text}
              </TextLink>
            </span>
          </li>
        ))}
      </ul>
      <p {...reveal(6, "text-prompt-user font-semibold")}>access granted.</p>
      <p {...reveal(7, "text-muted text-sm")}>
        note: Muji isn&apos;t looking for a new role right now, but he&apos;s
        always happy to talk.
      </p>
    </div>
  );
}

/** What colleagues wrote, as quotes with their names and roles. */
function Recommendations() {
  return (
    <div>
      <Title>Recommendations</Title>
      <div className="space-y-6">
        {recommendations.map((r) => (
          <figure
            key={r.name}
            className="border-border max-w-[80ch] border-l-2 pl-4"
          >
            <blockquote className="text-fg-strong space-y-2 leading-relaxed">
              {r.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </blockquote>
            <figcaption className="text-muted mt-2 text-sm">
              <span className="text-prompt-path">{r.name}</span>, {r.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function Contact() {
  const rows = [
    { label: "email", link: contact.email },
    { label: "linkedin", link: contact.linkedin },
    { label: "github", link: contact.github },
    { label: "résumé", link: resume, download: true },
  ];
  return (
    <div>
      <Title>Contact</Title>
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
              <TextLink href={row.link.href} download={row.download}>
                {row.link.label}
              </TextLink>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Files({ onRun, hidden }: { onRun?: RunCommand; hidden?: boolean }) {
  const entries = [
    ...(hidden
      ? [
          { label: ".", command: "ls -a" },
          { label: "..", command: "ls -a" },
          { label: ".sudo-secrets", command: "cat .sudo-secrets" },
        ]
      : []),
    { label: "contact", command: "cat contact" },
    { label: "education.md", command: "cat education.md" },
    { label: "highlights.md", command: "cat highlights.md" },
    { label: "projects/", command: "ls projects/" },
    { label: "recommendations.md", command: "cat recommendations.md" },
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

/** `tree`: the files and projects as a tree, each one clickable. */
function Tree({ onRun }: { onRun?: RunCommand }) {
  const rows: { lead: string; label: string; command: string }[] = [
    { lead: "├── ", label: "contact", command: "cat contact" },
    { lead: "├── ", label: "education.md", command: "cat education.md" },
    { lead: "├── ", label: "highlights.md", command: "cat highlights.md" },
    { lead: "├── ", label: "projects/", command: "ls projects/" },
    ...projects.map((p, i) => ({
      lead: `│   ${i === projects.length - 1 ? "└── " : "├── "}`,
      label: `${p.slug}/`,
      command: `open ${p.slug}`,
    })),
    {
      lead: "├── ",
      label: "recommendations.md",
      command: "cat recommendations.md",
    },
    { lead: "└── ", label: "skills.txt", command: "cat skills.txt" },
  ];
  return (
    <div>
      <p className="text-prompt-path">~</p>
      <ul>
        {rows.map((row) => (
          <li key={row.label} className="flex">
            <span aria-hidden="true" className="text-muted whitespace-pre">
              {row.lead}
            </span>
            <CommandButton
              command={row.command}
              label={row.label}
              onRun={onRun}
              className={
                row.label.endsWith("/") ? "text-prompt-path" : "text-fg-strong"
              }
            />
          </li>
        ))}
      </ul>
      <p className="text-muted mt-1 text-sm">
        {projects.length + 1} directories, 5 files
      </p>
    </div>
  );
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Jan 2022" to a count of months, so tenures are computed, not typed. */
function monthIndex(date: string): number {
  const [month, year] = date.split(" ");
  return Number(year) * 12 + months.indexOf(month);
}

/** How long someone was at an organisation that they have left, as "4 yrs 10 mos". */
export function tenure(org: Organisation): string {
  const total =
    monthIndex(org.roles[0].end) - monthIndex(org.roles.at(-1)!.start) + 1;
  const years = Math.floor(total / 12);
  const rest = total % 12;
  return [
    years && `${years} ${years === 1 ? "yr" : "yrs"}`,
    rest && `${rest} ${rest === 1 ? "mo" : "mos"}`,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * The classic system-info card, with Sudo as the logo and Muji's career as the
 * specs. Every value comes from lib/content.ts.
 */
function Neofetch() {
  const current = experience[0];
  const oracle = experience.find((org) => org.name === "Oracle")!;
  const rows = [
    ["OS", `${current.roles[0].title} @ ${current.name}`],
    ["Host", profile.location],
    ["Kernel", profile.focus],
    ["Uptime", `${tenure(oracle)} at Oracle`],
    ["Packages", `${profile.outcomes[0].value} risk-scored daily`],
    ["Shell", skills[0].items.join(", ")],
    ["Theme", "Ayu"],
    ["Font", "Geist Mono"],
  ];
  const swatches = [
    "bg-dot-close",
    "bg-dot-minimise",
    "bg-dot-zoom",
    "bg-prompt-path",
    "bg-number",
    "bg-accent",
    "bg-fg",
    "bg-muted",
  ];
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div
        aria-hidden="true"
        className="flex-none self-start"
        style={{ transform: "scaleX(-1)" }}
      >
        <CatImage width={98} height={104} />
      </div>
      <div className="text-sm">
        <Title>System info</Title>
        <p>
          <span className="text-prompt-user font-semibold">muji</span>@
          <span className="text-prompt-user font-semibold">brisbane</span>
        </p>
        <p aria-hidden="true" className="text-muted">
          {"-".repeat(13)}
        </p>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-2">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-prompt-path font-semibold">{label}:</dt>
              <dd>
                <Numbers text={value} />
              </dd>
            </div>
          ))}
        </dl>
        <p aria-hidden="true" className="mt-3 flex">
          {swatches.map((swatch) => (
            <span key={swatch} className={`${swatch} inline-block h-4 w-6`} />
          ))}
        </p>
      </div>
    </div>
  );
}

/** The hidden file: a riddle whose answer is the easter egg. */
function Secrets() {
  return (
    <div className="text-muted leading-relaxed">
      <p># .sudo-secrets</p>
      <p>Only one command makes me jump for joy.</p>
      <p>It starts with my name and ends with his.</p>
      <p>In the middle: what every good team should do.</p>
    </div>
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
              {entry.command === "theme dark|light" ? (
                // Switches to whichever theme is not showing, decided on click.
                <CommandButton
                  command="theme dark"
                  label={entry.command}
                  onRun={
                    onRun &&
                    (() =>
                      onRun(
                        `theme ${currentTheme() === "dark" ? "light" : "dark"}`,
                      ))
                  }
                />
              ) : (
                <CommandButton
                  command={entry.command}
                  label={entry.command}
                  onRun={onRun}
                />
              )}
            </dt>
            <dd className="text-muted mb-1 sm:mb-0">{entry.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function GameList({ onRun }: { onRun?: RunCommand }) {
  return (
    <div>
      <Title>Games</Title>
      <ol data-games className="grid gap-x-6 gap-y-1 sm:grid-cols-[13rem_1fr]">
        {games.map((game, i) => (
          <li key={game.name} className="contents">
            <span className="flex items-baseline gap-2">
              <span className="text-muted">{i + 1}.</span>
              <CommandButton command={game.name} onRun={onRun} />
            </span>
            <span className="text-muted mb-1 sm:mb-0">{game.description}</span>
          </li>
        ))}
      </ol>
      <p className="text-muted mt-2">Type a number or a name to play.</p>
    </div>
  );
}

export function OutputView({
  output,
  main = false,
  live = false,
  onRun,
  revealed,
}: {
  output: Output;
  main?: boolean;
  /** Whether this is the newest output, the only one a game runs in. */
  live?: boolean;
  onRun?: RunCommand;
  revealed?: number;
}) {
  switch (output.type) {
    case "whoami":
      return <Whoami main={main} />;
    case "highlights":
      return <Outcomes revealed={revealed} onRun={onRun} />;
    case "experience":
      return <Experience />;
    case "graph":
      return <CareerGraph onRun={onRun} />;
    case "projects":
      return <ProjectList onRun={onRun} />;
    case "project":
      return <Project slug={output.slug} />;
    case "skills":
      return <Skills onRun={onRun} />;
    case "education":
      return <Education />;
    case "contact":
      return <Contact />;
    case "hire":
      return <Hire animate={Boolean(onRun)} />;
    case "recommendations":
      return <Recommendations />;
    case "files":
      return <Files onRun={onRun} hidden={output.hidden} />;
    case "neofetch":
      return <Neofetch />;
    case "tree":
      return <Tree onRun={onRun} />;
    case "audit":
      return <AuditOutput animate={Boolean(onRun)} />;
    case "secrets":
      return <Secrets />;
    case "help":
      return <Help onRun={onRun} />;
    case "games":
      return <GameList onRun={onRun} />;
    case "game":
      return <Game name={output.name} live={live} onRun={onRun} />;
    case "message":
      return <p className="whitespace-pre-wrap">{output.text}</p>;
    case "error":
      return <p className="text-fg">{output.text}</p>;
  }
}
