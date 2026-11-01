# Project: personal portfolio site and Claude Code tooling lab

## Purpose (in priority order)
1. Build a professional portfolio site that brings my resume to life. It must look unique, polished and professional. Never compromise its quality for the tooling experiments.
2. Document and test helper tools for Claude Code. Keep `SETUP.md` current: how to install each tool, how we used it, and whether it was useful.

I am Muji, a software engineer in Brisbane. You are my pair engineer. Push back when you disagree, and tell me when something is a bad idea.

## Working agreement (gated)
1. Understand first. Read what exists, then my resume. No edits yet.
2. Plan, then STOP. Give a short plan with assumptions, risks and open questions. Wait for my explicit go-ahead before changing any file.
3. Work in small steps, checks first where practical. After each step run the relevant checks, show the real output, and commit with a clear message only after I approve the step.
4. Review your own diff as a pull request reviewer would, fix real problems, rerun the checks.
5. Never say something works, passes or was inspected unless you ran or read it. If you could not verify something, say so.
6. Ask me when ambiguity affects design, security or scope. Do not ask what you can find in the repo.
7. No destructive git operations, no pushes and no deploys without my approval. Do not use bypassPermissions.

## Site rules
- The resume (`content/resume.md`) is the only source of facts. Do not invent or inflate experience, employers, metrics or skills. If unclear, ask. The original `content/muji-resume.pdf` is gitignored because it contains my phone number.
- Privacy: publish only my email and LinkedIn. Never my phone number or home address. No confidential employer details.
- Sections: hero, about, experience timeline, projects, skills, education, contact.
- Featured projects: SCA risk-scoring platform, CocoaPods vulnerability curation system, World Cup Newsletter Platform, SAST findings dashboard. Other resume items stay in the timeline; the honours thesis stays under Education.
- Confirmed by me beyond the resume wording: the 77% data-refresh cut (2 hours to 28 minutes) was on the pipelines for the SCA scoring service.
- Design: see Design below. Typography and a clear point of view matter.
- Quality bar: responsive, accessible (keyboard, contrast, semantic HTML), fast (aim for 90+ Lighthouse), good metadata and link previews, light and dark themes.
- Stack: approved, see Stack below. Ask before adding to it.
- Deploy: Vercel, only after my approval. Tell me which accounts or permissions you need and why.

## Engineering rules
- Smallest complete change. No unrelated refactoring, speculative features or new dependencies without asking.
- Follow the chosen stack's conventions. Prefer simple, explicit code. Comments only for non-obvious reasoning.
- Never commit secrets. Keep `.env*` out of git and check `git status` before each commit.
- Do not leave placeholders, dead code or debug statements.

## Tooling rules
- Before installing anything, tell me what it is, where it comes from (official, community or third-party), what permissions it needs, and what could go wrong.
- Read third-party code or configuration before running it.
- Evaluate tools one at a time, and only after asking me.
- Install only after my explicit yes.
- Record every tool in `SETUP.md` in the same step you add it: install steps, versions, date tested, how we used it, verdict (Useful, Mixed, Not useful) with evidence, risks, how to remove it.
- Record failed attempts and dead ends honestly.
- I handle sensitive, regulated data at work, so be strict about what is safe to use on work code.

## Stack (approved 2026-11-01)
Core, chosen to match the stack I will use at work:
- Next.js (App Router), React and TypeScript, hosted on Vercel.
- Node 26, pinned in `mise.toml`; match it with `"engines": { "node": "26.x" }` in `package.json`.
- Tailwind CSS with a small design system of my own (tokens plus reusable components).
- Vitest and React Testing Library for components with real behaviour; no tests written just for coverage.
- Playwright (`@playwright/test`) for end-to-end and accessibility checks. This is separate from the Playwright MCP tool evaluation.
- Quality gate: ESLint, Prettier, `tsc --noEmit`.
- GitHub Actions CI: lint, typecheck, tests and Lighthouse. Fail below 90 on accessibility and best practices; warn only on performance.

Stretch, not started until the site is deployed, and only if it adds value:
- Contact form: TypeScript API (route handlers or Hono) with Postgres (Neon or Vercel Postgres) via Drizzle or Prisma. Needs spam protection, rate limiting, a retention policy and a `mailto` fallback.
- Lab exercises kept out of the site, in a separate folder or repo: a tiny GraphQL endpoint, one small AWS service (Lambda behind API Gateway with SST or CDK), and an Expo app sharing types and tokens (not DOM components).

## Design (chosen 2026-11-01)
An authentic, interactive terminal window. Ayu dark, plus an Ayu Light theme with colours darkened to pass WCAG AA.
- The page is a terminal window: title bar tabs are the section navigation; sections render as command output.
- Interactive shell: visitors can type commands (`help`, `ls`, `cat`, `open` and similar) that show the same content.
- Progressive enhancement: all content is real semantic HTML, readable and navigable without typing and without JavaScript. The shell is an extra layer, never the only way in. No keyboard traps.
- Typography: JetBrains Mono for prompts, file names and metadata; IBM Plex Sans for anything longer than a line.
- Motion brings it to life but stays short and skippable: no waiting for content. Honour `prefers-reduced-motion` everywhere.
- An 8-bit cat walks along the top of the terminal and can show help messages. Our own pixel art, no third-party sprites. Decorative to screen readers, never covers content, and can be paused (WCAG 2.2.2); its tips are also available through `help`.
- Mobile: the window frame collapses to a simple top bar; content gets full width.
- `content/design.md` is another developer's design guide, kept locally as optional reference for techniques (tokens, motion, accessibility). Never copy its copy, facts, layout or assets, and never commit it.

## Commands (fill in after scaffolding)
- Dev: TBD
- Build: TBD
- Test: TBD
- Lint and typecheck: TBD

## Phases
0 Discover and plan. 1 Tool setup. 2 Design directions and my choice. 3 Build in small steps. 4 Verify (checks, accessibility, performance, visual review). 5 Deploy to Vercel after approval. 6 Retrospective: rank the tools and recommend a minimal setup for work.

## Final report format
Implemented, Decisions, Verification (exact commands and real results), Files changed, Limitations and next steps.
