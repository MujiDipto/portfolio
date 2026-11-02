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
- Privacy: publish only my email, LinkedIn and GitHub profile (`github.com/MujiDipto`). Never my phone number or home address. No confidential employer details.
- Sections: hero, about, experience timeline, projects, skills, education, contact.
- Featured projects: SCA risk-scoring platform, CocoaPods vulnerability curation system, World Cup Newsletter Platform, SAST findings dashboard. Other resume items stay in the timeline; the honours thesis stays under Education.
- Confirmed by me beyond the resume wording: the 77% data-refresh cut (2 hours to 28 minutes) was on the pipelines for the SCA scoring service. The World Cup Newsletter Platform card may link to the public repo `github.com/MujiDipto/fifa-wc-newsletter`.
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

## Design (revised 2026-11-02)
A real terminal session in one fixed-size window, not a long page.
- Window: fixed height (about 80% of the viewport on desktop, always leaving 5.5rem above it for the cat's bubble; full screen on phones), up to 73.6rem wide. Output scrolls inside the window, never the page. The prompt shows focus with its caret, not an underline or box.
- Opening: `whoami` and its output appear at once; `cat about.md` types itself letter by letter (under a second), then its output prints. Any key or click finishes the animation; with `prefers-reduced-motion` everything appears at once.
- The mascot, Sudo, is a pixel knight cat (helmet with red plume, sword, paw-print shield, red cape) that Muji made with an AI image tool. It is used directly as `public/sudo.webp` (trimmed, stored at twice its 49x52 display size); its motion is CSS in `app/globals.css`. It walks in along the window's top edge while `cat about.md` types, arriving as the opening finishes, then speaks from a pixel speech bubble offering `git log`, `ls projects/`, `cat skills.txt` and `cat contact`. After the opening it sits until a command runs, then waddles somewhere new along the top edge only, facing the way it walked. When it stops it bobs twice (under five seconds). Hovering shakes it once and shows a pixel anger mark. It never moves with reduced motion; on phones it sits still in the title bar. Its moves are short and user-triggered, so no pause button is needed (WCAG 2.2.2). Decorative to screen readers; the bubble's buttons are real, and its tips are also in `help`.
- Interactive: typed commands append output like a real terminal. `help`, `clear`, `theme light` / `theme dark`, `cat education.md`, `open <project>`, history with up and down arrows, Tab completion, and `command not found: x. Try help` for unknown input.
- Commands live in `lib/terminal.ts` (pure functions, tested in `__tests__/terminal.test.ts`). Approved microcopy: the help list, `command not found: x. Try help`, `cat: x: No such file or directory`, `open: no such project: x. Try ls projects/`, and the cat's bubble "meow! try one of these:". One hidden easter egg, `sudo hire muji`, prints contact details; it is not in `help` or Tab completion.
- Progressive enhancement: without JavaScript the whole session is printed as HTML, so search engines, screen readers and no-JS visitors get all content. New output is announced to screen readers. No keyboard traps.
- Typography: monospace throughout, Geist Mono (from `content/design.md`).
- Colour: Ayu dark by default, Ayu Light with `theme light` (no button; remembered per visitor). Ayu Light colours are darkened where needed to pass WCAG AA and marked as adjusted. Colours with meaning: prompt user green, path blue, links and the cursor Ayu yellow, metrics as number literals in purple. Tokens live in `app/globals.css`; `__tests__/theme-contrast.test.ts` must keep passing.
- Domain: none yet; I want `muji.dev` eventually. Use the Vercel URL until then, from a single setting.
- `content/design.md` is another developer's design guide, kept locally. Its font (Geist Mono) is used by my choice; never copy its copy, facts, layout or assets, and never commit it.

## Commands
Run from the repo root; mise supplies Node 26 and sets `NEXT_TELEMETRY_DISABLED=1`.
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm test` (Vitest, single run); `npm run test:watch` while working
- End-to-end and accessibility: `npm run test:e2e` (Playwright on Chromium with axe, against a production build on port 3100). Unit tests live in `__tests__/`, Playwright tests in `e2e/`.
- Lint and typecheck: `npm run lint` and `npm run typecheck`
- Format: `npm run format`; check with `npm run format:check`. Markdown and `content/` are excluded.
- Lighthouse: `npm run build` then `npm run lighthouse` (3 runs, medians; fails below 0.9 on accessibility or best practices, warns on performance and SEO; reports in `.lighthouse/`, never uploaded).
- CI: `.github/workflows/ci.yml` runs all of the above on pushes and pull requests to `main`. Actions are pinned to commit SHAs; keep it that way. Repo: `MujiDipto/portfolio` (private).

## Next.js guidance
@AGENTS.md

## Phases
0 Discover and plan. 1 Tool setup. 2 Design directions and my choice. 3 Build in small steps. 4 Verify (checks, accessibility, performance, visual review). 5 Deploy to Vercel after approval. 6 Retrospective: rank the tools and recommend a minimal setup for work.

## Final report format
Implemented, Decisions, Verification (exact commands and real results), Files changed, Limitations and next steps.
