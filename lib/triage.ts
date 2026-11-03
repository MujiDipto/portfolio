// Triage, a supply-chain risk game: risky, safe, or upgrade? Clues appear one
// at a time; answering on fewer clues scores more. Every package is made up
// (the game says so); the clues are general industry knowledge, and the notes
// name public incidents, nothing from any employer.

export type Verdict = "risky" | "safe" | "upgrade";

export const verdicts: { verdict: Verdict; key: string; means: string }[] = [
  { verdict: "risky", key: "r", means: "don't install it" },
  { verdict: "safe", key: "s", means: "fine as it is" },
  { verdict: "upgrade", key: "u", means: "use it, on the fixed version" },
];

export type Package = {
  id: string;
  name: string;
  /** Shown one at a time, vaguest first. */
  clues: [string, string, string];
  answer: Verdict;
  /** Why, shown after the answer. */
  why: string;
  /** A real, public incident it is modelled on. */
  incident?: string;
};

export const packages: Package[] = [
  {
    id: "reqeusts",
    name: "reqeusts 2.31.0",
    clues: [
      "name is one letter off a popular package",
      "first published 2 days ago",
      "install script pipes curl into sh",
    ],
    answer: "risky",
    why: "A typo of a popular name that runs code from the internet on install: a typosquat.",
    incident:
      "crossenv, 2017: a typo of cross-env that sent developers' environment variables to its author.",
  },
  {
    id: "stream-merge",
    name: "stream-merge 3.3.6",
    clues: [
      "owner handed it to a volunteer last month",
      "a patch release adds a new dependency",
      "that dependency's code is minified",
    ],
    answer: "risky",
    why: "A new owner quietly adding obscured code is how hijacks hide.",
    incident:
      "event-stream, 2018: a new maintainer added a dependency that stole from a Bitcoin wallet app.",
  },
  {
    id: "agent-parse",
    name: "agent-parse 0.7.29",
    clues: [
      "40 million downloads a week",
      "three releases in one hour, none tagged on GitHub",
      "new install script downloads a binary",
    ],
    answer: "risky",
    why: "Releases that skip the repository, plus a binary on install: a hijacked account.",
    incident:
      "ua-parser-js, 2021: a hijacked account published versions that installed a cryptominer.",
  },
  {
    id: "rainbow-text",
    name: "rainbow-text 1.4.44",
    clues: [
      "maintainer says they are done working for free",
      "version jumped with no changelog",
      "new code loops forever on import",
    ],
    answer: "risky",
    why: "A maintainer can sabotage their own package. Pin versions and read the diff.",
    incident:
      "colors.js, 2022: its own maintainer shipped an endless loop that broke thousands of apps.",
  },
  {
    id: "xzip-core",
    name: "xzip-core 5.6.1",
    clues: [
      "a helpful co-maintainer for two years",
      "binary test files added recently",
      "build script now runs code from those files",
    ],
    answer: "risky",
    why: "Trust earned slowly, then code hidden in test files and run by the build: a backdoor.",
    incident:
      "xz Utils, 2024: a contributor spent two years earning trust, then hid a backdoor in the build.",
  },
  {
    id: "acme-internal-utils",
    name: "@acme/internal-utils 99.0.0",
    clues: [
      "public registry, version 99.0.0",
      "name matches a private package",
      "published by an account with no history",
    ],
    answer: "risky",
    why: "A public package impersonating a private one with a huge version: dependency confusion.",
    incident:
      "Dependency confusion, 2021: a researcher got public look-alikes of private packages installed inside large tech companies.",
  },
  {
    id: "env-loader-pro",
    name: "env-loader-pro 1.0.0",
    clues: [
      "no repository linked",
      "reads every environment variable",
      "makes a network request on install",
    ],
    answer: "risky",
    why: "Reading secrets and phoning home on install, with no source to check.",
  },
  {
    id: "http-tiny",
    name: "http-tiny 0.4.2",
    clues: [
      "last release 6 years ago",
      "repository archived",
      "open security issues, no replies",
    ],
    answer: "risky",
    why: "Abandoned, with known problems: nobody will fix the next one either.",
  },
  {
    id: "ipc-bridge",
    name: "ipc-bridge 10.1.1",
    clues: [
      "popular, with a long-time maintainer",
      "patch release adds code that checks your location",
      "in some countries, that code overwrites files",
    ],
    answer: "risky",
    why: "Protestware: a trusted maintainer turned the package against some of its users.",
    incident:
      "node-ipc, 2022: its maintainer added code that overwrote files on machines in certain countries.",
  },
  {
    id: "tidy-dates",
    name: "tidy-dates 4.2.1",
    clues: [
      "2 million downloads a week",
      "14 maintainers",
      "signed releases, no install scripts",
    ],
    answer: "safe",
    why: "Widely used, many maintainers, signed releases and nothing runs on install.",
  },
  {
    id: "csv-quick",
    name: "csv-quick 2.0.1",
    clues: [
      "300,000 downloads a week",
      "3 maintainers, issues answered within days",
      "build provenance attested",
    ],
    answer: "safe",
    why: "Healthy maintenance and provenance that ties the release to its source.",
  },
  {
    id: "uuid-lite",
    name: "uuid-lite 5.1.0",
    clues: [
      "zero dependencies",
      "900,000 downloads a week",
      "high OpenSSF Scorecard",
    ],
    answer: "safe",
    why: "Small, dependency-free, widely used and well scored by OpenSSF.",
  },
  {
    id: "log-pretty",
    name: "log-pretty 3.8.0",
    clues: [
      "500,000 downloads a week",
      "2 long-standing maintainers",
      "no install scripts, MIT licence",
    ],
    answer: "safe",
    why: "Established maintainers, popular, and nothing runs on install.",
  },
  {
    id: "chart-kit-7.3.2",
    name: "chart-kit 7.3.2",
    clues: [
      "a high-severity CVE was reported last month",
      "it affects 7.3.1 and earlier",
      "this is 7.3.2, the fixed release",
    ],
    answer: "safe",
    why: "This is the fix. A CVE in the history is not a CVE in this version.",
  },
  {
    id: "tiny-sort",
    name: "tiny-sort 1.0.0",
    clues: [
      "one maintainer",
      "no release in 4 years",
      "12 lines, no dependencies, no open issues",
    ],
    answer: "safe",
    why: "Old isn't abandoned: a tiny, finished package with nothing left to fix.",
  },
  {
    id: "sharp-image",
    name: "sharp-image 0.33.5",
    clues: [
      "install script downloads a binary",
      "8 million downloads a week",
      "binaries come from its own releases, with checksums",
    ],
    answer: "safe",
    why: "Install scripts aren't always bad: this one fetches verified builds from its own project.",
  },
  {
    id: "mail-kit",
    name: "mail-kit 6.9.1",
    clues: [
      "a new maintainer was added last month",
      "the original author announced it in the repo",
      "releases are still signed",
    ],
    answer: "safe",
    why: "A new maintainer, announced openly and still signing releases, is a healthy handover.",
  },
  {
    id: "log-core",
    name: "log-core 2.14.1",
    clues: [
      "used in thousands of Java apps",
      "a critical remote-code-execution CVE in this version",
      "a fixed release is out, maintainers active",
    ],
    answer: "upgrade",
    why: "Critical, but fixed upstream: upgrade now rather than rip it out.",
    incident:
      "Log4Shell, 2021: a critical flaw in Log4j. The fix was to upgrade, fast.",
  },
  {
    id: "yaml-read",
    name: "yaml-read 3.12.0",
    clues: [
      "5 million downloads a week",
      "a high-severity CVE in this version",
      "fixed in 3.13.1, same API",
    ],
    answer: "upgrade",
    why: "A healthy package with a fixed release: bump the version.",
  },
  {
    id: "jwt-sign",
    name: "jwt-sign 8.5.1",
    clues: [
      "popular and actively maintained",
      "a CVE lets attackers forge tokens in this version",
      "fixed in 9.0.0, with a migration guide",
    ],
    answer: "upgrade",
    why: "Serious, but the maintainers fixed it and documented the move.",
  },
  {
    id: "path-match",
    name: "path-match 0.1.7",
    clues: [
      "a denial-of-service CVE in this version",
      "fixed in 0.1.10",
      "no other changes in the fix",
    ],
    answer: "upgrade",
    why: "A small, safe bump that only fixes the flaw.",
  },
  {
    id: "chart-kit-7.3.1",
    name: "chart-kit 7.3.1",
    clues: [
      "a high-severity CVE was reported last month",
      "it affects 7.3.1 and earlier",
      "7.3.2 fixes it, from the same maintainers",
    ],
    answer: "upgrade",
    why: "This version is affected and the fix exists: move to 7.3.2.",
  },
  {
    id: "web-socket",
    name: "web-socket 7.4.5",
    clues: [
      "2 million downloads a week",
      "a medium-severity CVE in this version",
      "fix released last week",
    ],
    answer: "upgrade",
    why: "Popular, maintained and patched: just upgrade.",
  },
  {
    id: "form-parse",
    name: "form-parse 1.2.0",
    clues: [
      "4 years old, still maintained",
      "a CVE in this version",
      "1.2.1 patches it",
    ],
    answer: "upgrade",
    why: "Old and maintained, with a patch release: upgrade.",
  },
];

/** Mistakes allowed: the third ends the run. */
export const lives = 3;

/**
 * Seconds for the nth package (from 0): 15 for the first, while the rules are
 * still being read, then 10, shrinking every 3 to a floor of 6.
 */
export function secondsFor(n: number): number {
  if (n === 0) return 15;
  return Math.max(6, 10 - Math.floor(n / 3));
}

/** Clues shown after `elapsed` of `total` ms: one more every third. */
export function cluesAt(elapsed: number, total: number): number {
  return Math.min(3, 1 + Math.floor((3 * elapsed) / total));
}

/** Points for a right answer on this many clues: braver answers score more. */
export function pointsFor(clues: number): number {
  return 4 - clues;
}

/** One answered package: what was given (null if time ran out), on how many clues. */
export type Answer = { id: string; given: Verdict | null; clues: number };

const byId = new Map(packages.map((p) => [p.id, p]));

export function packageFor(id: string): Package | undefined {
  return byId.get(id);
}

export function isRight(answer: Answer): boolean {
  return answer.given !== null && byId.get(answer.id)?.answer === answer.given;
}

export function tally(answers: Answer[]): { points: number; mistakes: number } {
  let points = 0;
  let mistakes = 0;
  for (const answer of answers) {
    if (isRight(answer)) points += pointsFor(answer.clues);
    else mistakes++;
  }
  return { points, mistakes };
}

/** Whether the run is over: out of lives, or every package seen. */
export function isOver(answers: Answer[]): boolean {
  return tally(answers).mistakes >= lives || answers.length >= packages.length;
}

/**
 * The score of a submitted run, recomputed by the server from the answers
 * rather than trusted, or null if the run could not have happened: unknown or
 * repeated packages, odd clue counts, or answers after the last life.
 */
export function scoreRun(answers: unknown): number | null {
  if (!Array.isArray(answers) || answers.length > packages.length) return null;
  const seen = new Set<string>();
  const run: Answer[] = [];
  for (const raw of answers) {
    if (typeof raw !== "object" || raw === null) return null;
    const { id, given, clues } = raw as Record<string, unknown>;
    if (typeof id !== "string" || !byId.has(id) || seen.has(id)) return null;
    if (given !== null && !verdicts.some((v) => v.verdict === given)) {
      return null;
    }
    if (clues !== 1 && clues !== 2 && clues !== 3) return null;
    if (isOver(run)) return null;
    seen.add(id);
    run.push({ id, given: given as Verdict | null, clues });
  }
  return tally(run).points;
}

/** The packages in a random order; `random` is injectable for tests. */
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
