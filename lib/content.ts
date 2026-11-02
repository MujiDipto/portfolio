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
  highlights: string[];
  stack: string[];
  link?: { label: string; href: string };
};

export const profile = {
  name: "Muji Dipto",
  title: "Senior Software Engineer",
  // Muji's own positioning (2026-11-02), replacing the résumé's focus line.
  focus: "AI Native Product Engineering",
  location: "Brisbane, QLD",
  // Approved by Muji, 2026-11-02.
  status: "Not looking, happy to connect",
  // Number first, so a skimmer reads the scale before the sentence. Each
  // names the project (a slug in `projects`) where the number comes from.
  outcomes: [
    {
      value: "15,000",
      text: "software packages risk-scored daily, on a platform I own end to end",
      project: "sca-scoring",
    },
    {
      value: "77%",
      text: "cut in security data refresh pipeline runtime, from 2 hours to 28 minutes",
      project: "sca-scoring",
    },
    {
      value: "960+",
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
          "Own the software composition analysis (SCA) service and the risk-scoring platform covering 15,000 software packages, leading backend development, OCI deployment and production operations.",
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
    context: "Oracle, Senior Software Engineer",
    highlights: [
      "Built a rule-based CocoaPods vulnerability-report curation system from scratch in Python, reducing a 4,500-report backlog by 73% and saving 960+ analyst-hours.",
    ],
    stack: ["Python"],
  },
  {
    slug: "world-cup-newsletter",
    name: "World Cup Newsletter Platform",
    context: "Personal project, deployed",
    highlights: [
      "Built and deployed a Java and Python platform that ingests data from multiple live APIs and uses the Gemini LLM API to generate personalised newsletters.",
      "Implemented bounded worker pools, prioritised scheduling, fan-out and retry handling to coordinate concurrent requests across rate-limited APIs and the LLM provider.",
    ],
    stack: ["Java", "Python", "Gemini LLM API"],
    link: {
      label: "github.com/MujiDipto/fifa-wc-newsletter",
      href: "https://github.com/MujiDipto/fifa-wc-newsletter",
    },
  },
  {
    slug: "sast-dashboard",
    name: "SAST findings dashboard",
    context: "Oracle, Software Engineer",
    highlights: [
      "Led development of a SAST findings dashboard; created Figma designs and React/Oracle JET prototypes following WCAG and Oracle design standards.",
    ],
    stack: ["Figma", "React", "Oracle JET"],
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

export const education = {
  institution: "The University of Queensland",
  location: "Brisbane, QLD",
  degree: "Bachelor of Engineering (Honours), Software Engineering",
  start: "2018",
  end: "2021",
  notes: [
    "Honours thesis with Oracle: automated IoT firmware vulnerability detection through open-source dependency analysis and vulnerability database lookups.",
    "High Distinctions in Advanced Cybersecurity, Cybersecurity, Data Visualisation and Statistics; Distinction in Machine Learning.",
  ],
};
