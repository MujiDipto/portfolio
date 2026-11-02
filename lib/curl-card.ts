// What `curl dipto.dev` prints in a real terminal (proxy.ts): the site as a
// plain-text card, coloured with ANSI codes. Every fact comes from
// lib/content.ts.
import { contact, experience, profile, resume } from "@/lib/content";

const ansi = (code: string) => (text: string) => `\x1b[${code}m${text}\x1b[0m`;
const bold = ansi("1");
const dim = ansi("2");
const green = ansi("32");
const yellow = ansi("33");
const blue = ansi("34");
const magenta = ansi("35");

/** The card, with links made absolute against the site's origin. */
export function curlCard(origin: string): string {
  const current = experience[0];
  const width = Math.max(...profile.outcomes.map((o) => o.value.length));
  const links: [string, string][] = [
    ["résumé", new URL(resume.href, origin).href],
    ["linkedin", contact.linkedin.href],
    ["github", contact.github.href],
    ["email", contact.email.label],
  ];
  return [
    "",
    `   /\\_/\\    ${bold(profile.name)}`,
    `  ( o.o )   ${profile.title} | ${profile.focus}`,
    `   > ^ <    ${dim(`${current.roles[0].title} @ ${current.name}, ${profile.location}`)}`,
    "",
    `${green("muji@brisbane")} ${blue("~")} $ cat highlights.md`,
    ...profile.outcomes.map(
      (o) => `  ${magenta(bold(o.value.padStart(width)))}  ${o.text}`,
    ),
    "",
    ...links.map(([label, href]) => `  ${dim(label.padEnd(9))}${yellow(href)}`),
    "",
    `  The full terminal, with Sudo: ${yellow(origin)}`,
    "",
  ].join("\n");
}
