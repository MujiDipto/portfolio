// Site content, transcribed from content/resume.md (the only source of facts)
// plus the facts Muji confirmed beyond it, listed in CLAUDE.md (OnEarly and the
// Oracle end date). __tests__/content-facts.test.ts checks numbers, links and
// phone numbers.

export type Role = {
  title: string;
  start: string;
  end: string;
  highlights: string[];
};

export type Organisation = {
  name: string;
  location?: string;
  roles: Role[];
};

export type Project = {
  slug: string;
  name: string;
  context: string;
  /** One line, outcome first, from the facts in `highlights` (approved by Muji, 2026-11-02). */
  outcome: string;
  /** The deep dive, in Muji's own account: what, why it was hard, how. */
  story?: {
    problem: string;
    constraints: string[];
    approach: string[];
    /** Only when it adds to the outcome line above it. */
    result?: string;
  };
  highlights: string[];
  stack: string[];
  link?: { label: string; href: string };
  /** A write-up about the project, shown under its repo. */
  notes?: { label: string; href: string };
};

export const profile = {
  name: "Muji Dipto",
  title: "Senior Software Engineer",
  // Muji's own positioning (2026-11-02), replacing the résumé's focus line.
  focus: "AI Native Product Engineering",
  location: "Brisbane, QLD",
  // Approved by Muji, 2026-11-02.
  status: "Not looking, happy to connect",
  // Number first, so a skimmer reads the scale before the sentence. Each has
  // a theme word (labels approved by Muji, 2026-11-03) and names the project
  // (a slug in `projects`) where the number comes from.
  outcomes: [
    {
      value: "15,000",
      label: "scale",
      text: "software packages risk-scored daily, on a platform I owned end to end",
      project: "sca-scoring",
    },
    {
      value: "77%",
      label: "speed",
      text: "cut in security data refresh pipeline runtime, from 2 hours to 28 minutes",
      project: "sca-scoring",
    },
    {
      value: "960+",
      label: "impact",
      text: "analyst-hours saved by a curation system I built from scratch",
      project: "vuln-curation",
    },
  ],
};

/** Every line `cat highlights.md` prints, in order; the opening reveals them one by one. */
export const highlightLines = profile.outcomes.map(
  (o) => `${o.value} ${o.text}`,
);

/** The closing pitch in `cat contact` (approved by Muji, 2026-11-02). */
export const contactPitch = {
  line: "I build the platforms other teams rely on without having to think about them.",
  status:
    "I've just joined OnEarly, so I'm not looking for a new role. I'm always happy to talk about backend platforms, data pipelines and software supply-chain security. Email is the quickest way to reach me.",
};

/** The résumé PDF, published with Muji's phone number by his choice. */
export const resume = {
  label: "résumé (PDF)",
  href: "/muji-dipto-resume.pdf",
};

export const contact = {
  email: {
    label: "mujibulislamdipto@gmail.com",
    href: "mailto:mujibulislamdipto@gmail.com",
  },
  linkedin: {
    label: "linkedin.com/in/mujidipto",
    href: "https://www.linkedin.com/in/mujidipto",
  },
  github: {
    label: "github.com/MujiDipto",
    href: "https://github.com/MujiDipto",
  },
};

// Transcribed from the résumé, with Oracle's lines in the past tense since
// Muji left in Oct 2026 (approved 2026-11-03).
export const experience: Organisation[] = [
  {
    name: "OnEarly",
    roles: [
      {
        title: "Senior Software Engineer",
        start: "Nov 2026",
        end: "Present",
        highlights: [],
      },
    ],
  },
  {
    name: "Oracle",
    location: "Brisbane, QLD",
    roles: [
      {
        title: "Senior Software Engineer",
        start: "Oct 2025",
        end: "Oct 2026",
        highlights: [
          "Owned the software composition analysis (SCA) service and the risk-scoring platform covering 15,000 software packages, leading backend development, OCI deployment and production operations.",
          "Built a rule-based CocoaPods vulnerability-report curation system from scratch in Python, reducing a 4,500-report backlog by 73% and saving 960+ analyst-hours.",
          "Improved Java/Maven scan reliability in an enterprise scanning platform on OCI and Kubernetes (OKE), with queue-based orchestration and event-driven result processing.",
          "Designed, built and deployed an Oracle APEX document approvals application within one week using AI-assisted development.",
        ],
      },
      {
        title: "Software Engineer",
        start: "Aug 2022",
        end: "Oct 2025",
        highlights: [
          "Led the design and Java/Micronaut development of the SCA Scoring service.",
          "Redesigned REST API response schemas and caching to improve throughput and reliability in SCA Scoring.",
          "Built a CLI tool for analysts to generate software bills of materials (SBOMs) and score software packages in optimised batches.",
          "Developed Python ingestion pipelines using Apache Airflow, with concurrency controls, exponential backoff and rate-limit handling to keep scoring data current.",
          "Led development of a SAST findings dashboard; created Figma designs and React/Oracle JET prototypes following WCAG and Oracle design standards.",
        ],
      },
      {
        title: "Security Analyst",
        start: "Jan 2022",
        end: "Jul 2022",
        highlights: [
          "Designed a common schema for NVD and OSV vulnerability data that became the standard for subsequent source integrations.",
          "Built Python dependency-analysis and ingestion pipelines for Go and Objective-C, automating SBOM processing and handling ecosystem-specific formats and edge cases.",
        ],
      },
    ],
  },
];

/** Listed after the engineering career, as on the résumé. */
export const additionalExperience: Organisation[] = [
  {
    name: "The University of Queensland",
    location: "Brisbane, QLD",
    roles: [
      {
        title: "Casual Tutor, Web Design and Development",
        start: "Feb 2020",
        end: "Jan 2022",
        highlights: [
          "Taught approximately 90 students per semester across HTML, CSS, JavaScript, prototyping and user-centred design, with strong evaluations for clarity and approachability.",
        ],
      },
    ],
  },
];

export const projects: Project[] = [
  {
    slug: "sca-scoring",
    name: "SCA risk-scoring platform",
    context: "Oracle, Aug 2022 to Oct 2026",
    outcome:
      "15,000 packages risk-scored daily; data refresh cut by 77%, 2 hours to 28 minutes",
    // From Muji's account; wording approved by Muji, 2026-11-03.
    story: {
      problem:
        "A software composition analysis service that gives open-source packages a security risk score. Security analysts used the scores to triage and prioritise.",
      constraints: [
        "15,000 packages to assess.",
        "Scores had to come back quickly whenever someone queried one.",
        "Scoring depended on external APIs that are slow and rate-limited.",
      ],
      approach: [
        "Scores are computed ahead of time, not on request: data pipelines refresh them continuously and the service answers from its own database.",
        "Exponential backoff and rate-limit handling keep the pipelines moving through slow external APIs.",
        "Database indexing, query optimisation and caching keep both the refresh and the lookups fast.",
      ],
    },
    highlights: [
      "Led end-to-end delivery of a risk-scoring service assessing 15,000 software packages daily.",
      "Led the design and Java/Micronaut development of the SCA Scoring service.",
      "Redesigned REST API response schemas and caching to improve throughput and reliability in SCA Scoring.",
      // Linked to the scoring pipelines on Muji's confirmation (CLAUDE.md).
      "Cut data-refresh time by 77%, from 2 hours to 28 minutes, through query optimisation and smarter caching.",
      "Developed Python ingestion pipelines using Apache Airflow, with concurrency controls, exponential backoff and rate-limit handling to keep scoring data current.",
    ],
    stack: ["Java", "Micronaut", "Python", "Apache Airflow", "OCI"],
  },
  {
    slug: "vuln-curation",
    name: "CocoaPods vulnerability curation",
    context: "Oracle, Oct 2025 to Oct 2026",
    outcome: "960+ analyst-hours saved; a 4,500-report backlog cut by 73%",
    // From Muji's account; wording approved by Muji, 2026-11-03, then kept
    // general on purpose: no exact curation signals, no per-report time and
    // no internal team names, so it describes the work, not Oracle's process.
    story: {
      problem:
        "Security analysts curated raw vulnerability reports for the CocoaPods ecosystem by hand, one at a time, and a backlog of 4,500 reports had built up.",
      constraints: [
        "Each report took an analyst a long time to curate by hand.",
        "Little ground truth: only a small set of reports had been curated, too few to build a proper solution on directly.",
      ],
      approach: [
        "Studied the small curated set to find the patterns the analysts followed.",
        "Built a rule-based curation system from those patterns, using public vulnerability metadata such as CVE and CPE records.",
        "Ran the rules over the raw backlog to curate reports and filter out false positives.",
      ],
    },
    highlights: [
      "Built a rule-based CocoaPods vulnerability-report curation system from scratch in Python, reducing a 4,500-report backlog by 73% and saving 960+ analyst-hours.",
    ],
    stack: ["Python"],
  },
  {
    slug: "world-cup-newsletter",
    name: "World Cup Newsletter Platform",
    context: "Personal project, 2026",
    outcome:
      "A daily newsletter per subscriber, from live football APIs, written by an LLM",
    // From the public repo, read 2026-11-03; wording approved by Muji the
    // same day. The code calls a Llama model through Groq; the résumé's
    // "Gemini" predates a switch (a stale code comment still says Gemini).
    // No numbers from the code, as the facts test requires.
    story: {
      problem:
        "Every morning of the 2026 World Cup, each subscriber gets an email about the team they follow: yesterday's result, the group standings, what the media is saying and the next fixture in their own timezone. Written by an LLM, sent without manual work.",
      constraints: [
        "Four free data sources to combine (football-data.org, ESPN, TheSportsDB and The Guardian), one of them strictly rate-limited.",
        "An LLM writing about real matches, where a made-up scoreline would be a serious error.",
        "Free tiers throughout: the LLM API rejects bursts of requests, and hosting had to cost nothing.",
      ],
      approach: [
        "A Java pipeline fetches every source concurrently on a bounded worker pool, with exponential backoff around each call (skipping errors that cannot succeed) and a rate limiter for the strictest API.",
        "Each subscriber's facts are bundled from SQLite and sent to a Python FastAPI service, where the LLM writes the email under a strict rule: state only facts present in the bundle.",
        "Emails are composed one request at a time to stay within the LLM's free tier, and a failure goes to a dead-letter list instead of stopping everyone else's email.",
        "Runs daily from cron on an Oracle Cloud Always Free virtual machine behind nginx, so it costs nothing to run.",
      ],
    },
    highlights: [
      "Built and deployed a Java and Python platform that ingests data from multiple live APIs and uses an LLM (Llama, through Groq) to generate personalised newsletters.",
      "Implemented bounded worker pools, prioritised scheduling, fan-out and retry handling to coordinate concurrent requests across rate-limited APIs and the LLM provider.",
    ],
    stack: [
      "Java",
      "Python",
      "FastAPI",
      "SQLite",
      "Groq (Llama)",
      "Oracle Cloud",
    ],
    link: {
      label: "github.com/MujiDipto/fifa-wc-newsletter",
      href: "https://github.com/MujiDipto/fifa-wc-newsletter",
    },
  },
  // This site, as evidence for "AI Native Product Engineering". Its facts are
  // the project's own record: CLAUDE.md, SETUP.md, the tests and CI (wording
  // approved by Muji, 2026-11-03).
  {
    slug: "this-site",
    name: "dipto.dev, this terminal",
    context: "Personal project, 2026",
    outcome:
      "Shipped with an AI coding agent under a gated agreement: plan, approve, test, commit",
    // Facts from this project's own record; wording approved by Muji, 2026-11-03.
    story: {
      problem:
        "A portfolio that shows how the work gets done, not just what was done, built with an AI coding agent and held to the same bar as production code.",
      constraints: [
        "AI-written code has to be checked, not trusted: it can lean on out-of-date framework knowledge, state things that are not true or quietly break accessibility.",
        "Every fact on the page has to be true and safe to publish, from the numbers to what is said about past employers.",
        "A terminal is a hard interface to make accessible: keyboards, screen readers, reduced motion and phones all have to work.",
      ],
      approach: [
        "A written, gated working agreement: plan first, wait for approval, work in small steps, run real checks, then commit.",
        "Tests that guard the content itself: a facts test fails on any number that is not on the résumé, and every output passes axe in both themes.",
        "Version-matched framework docs instead of the model's memory, which caught several breaking changes in Next.js.",
        "Security as part of the build: security headers on every response, a CI test that fails on any Content Security Policy violation, and a real npm audit of its own dependencies each time it is built.",
        "Each AI tool judged on evidence, with the dead ends written down alongside the wins.",
        "Progressive enhancement: without JavaScript the whole site is plain HTML, and the same content is a printable page at /cv.",
      ],
    },
    highlights: [
      "Designed and built this interactive terminal in Next.js, React and TypeScript, with Claude Code as pair programmer and each change planned, reviewed and checked before commit.",
      "Each change is checked with formatting, linting, type checks, unit tests and Playwright end-to-end tests with axe accessibility checks; GitHub Actions also fails a run if Lighthouse accessibility or best practices scores drop.",
      "Audits its own dependencies with a real npm audit at build time, and answers curl with a plain-text card through a Next.js proxy while the page stays static.",
      "Evaluated each AI tool on evidence and wrote up the verdicts, the dead ends and a minimal setup for AI-assisted work on sensitive, regulated code.",
    ],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Vitest",
      "Playwright",
      "GitHub Actions",
      "Vercel",
      "Claude Code",
    ],
    link: {
      label: "github.com/MujiDipto/portfolio",
      href: "https://github.com/MujiDipto/portfolio",
    },
    notes: {
      label: "SETUP.md, every AI tool tried and its verdict",
      href: "https://github.com/MujiDipto/portfolio/blob/main/SETUP.md",
    },
  },
];

export const skills = [
  {
    group: "Languages",
    items: ["Java", "Python", "SQL", "JavaScript", "TypeScript"],
  },
  {
    group: "Backend",
    items: [
      "Micronaut",
      "REST API design",
      "microservices",
      "concurrency",
      "asynchronous processing",
    ],
  },
  {
    group: "Data",
    items: [
      "Apache Airflow",
      "ETL pipelines",
      "data modelling",
      "MySQL",
      "Oracle Database",
    ],
  },
  {
    group: "Cloud & delivery",
    items: ["OCI", "OCI Functions", "Docker", "Maven", "CI/CD", "Git"],
  },
  {
    group: "Testing",
    items: ["JUnit", "integration testing", "performance testing"],
  },
  {
    group: "Security",
    items: ["SCA", "SAST", "SBOMs", "vulnerability analysis"],
  },
  {
    group: "Practices",
    items: [
      "Agile/Scrum",
      "requirements analysis",
      "technical design",
      "code reviews",
      "AI-assisted development",
    ],
  },
];

// Skills a project shows in use although its stack names them differently,
// or that are not a stack item at all. Each follows from the project's own
// facts above.
export const shownBy: Record<string, string[]> = {
  OCI: ["world-cup-newsletter"], // hosted on Oracle Cloud
  "REST API design": ["sca-scoring"], // redesigned its API response schemas
  concurrency: ["sca-scoring", "world-cup-newsletter"], // concurrency controls; worker pools
  "ETL pipelines": ["sca-scoring"], // its ingestion pipelines
  "CI/CD": ["this-site"], // GitHub Actions on every change
  SCA: ["sca-scoring"],
  "vulnerability analysis": ["vuln-curation"],
  "AI-assisted development": ["this-site"],
};

/** The projects that show a skill in use: by their stack, or `shownBy`. */
export function usedIn(skill: string): string[] {
  const named = skill.toLowerCase();
  const slugs = projects
    .filter((p) => p.stack.some((item) => item.toLowerCase() === named))
    .map((p) => p.slug);
  return projects
    .map((p) => p.slug)
    .filter((slug) => slugs.includes(slug) || shownBy[skill]?.includes(slug));
}

/**
 * What colleagues wrote, word for word apart from a typo fix ("Whether") and
 * a closing full stop. Published with both authors' permission (2026-11-03).
 */
export const recommendations = [
  {
    name: "Arpit Gupta",
    title: "Principal Software Engineer",
    paragraphs: [
      "I worked with Mujibul at Oracle on security and software supply chain related projects and one thing that consistently stood out was how quickly he could understand complex problem spaces and take ownership when needed. He has strong backend engineering skills, particularly around security systems, vulnerability intelligence and large-scale data processing, but also brings a product mindset that is surprisingly rare in backend-focused engineers.",
      "Mujibul has a very good eye for design and usability, which made him especially effective in projects that required collaboration across engineering, security and product teams. He was someone people naturally went to for help, whether it was debugging difficult issues, thinking through architecture decisions, or refining a feature experience.",
      "Beyond the technical side, he’s approachable, easy to work with and genuinely invested in helping the team succeed. I’d confidently recommend him to any team looking for a strong engineer who can operate across both deep technical work and product-oriented thinking.",
    ],
  },
  {
    name: "James Yant",
    title: "Senior Software Engineer",
    paragraphs: [
      "I worked directly with Muji on multiple projects. What stood out for me was his adaptability to anything that came his way. Whether it be a new technology or framework, or a completely new problem space, Muji was always able to quickly immerse himself in whatever came down the pipeline and arrive at a solution. His flexibility is an incredible asset to any team.",
    ],
  },
];

/** One line from a recommendation, shown under the highlights. */
export const pullQuote = {
  label: "endorsed",
  text: "a product mindset that is surprisingly rare in backend-focused engineers",
  by: recommendations[0],
};

export const education = {
  institution: "The University of Queensland",
  location: "Brisbane, QLD",
  degree: "Bachelor of Engineering (Honours), Software Engineering",
  // Months confirmed by Muji (2026-11-02); the résumé gives years only.
  start: "Feb 2018",
  end: "Nov 2021",
  notes: [
    "Honours thesis with Oracle: automated IoT firmware vulnerability detection through open-source dependency analysis and vulnerability database lookups.",
    "High Distinctions in Advanced Cybersecurity, Cybersecurity, Data Visualisation and Statistics; Distinction in Machine Learning.",
  ],
};
