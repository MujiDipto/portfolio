# dipto.dev

The portfolio of Muji Dipto, a senior software engineer in Brisbane, built as a terminal session: type `help`, or click any command. Recruiters can skip the terminal entirely with the résumé link or the non-interactive page at [dipto.dev/cv](https://dipto.dev/cv).

It is also a lab for working with Claude Code under a gated agreement: plan first, small approved steps, real checks before every commit. [`CLAUDE.md`](CLAUDE.md) holds the rules and design decisions, and [`SETUP.md`](SETUP.md) records every tool tried, how it was used and whether it was worth it.

## What's inside

- Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4, on Vercel. Every page is static.
- A pure command engine in [`lib/terminal.ts`](lib/terminal.ts); the facts it shows live in [`lib/content.ts`](lib/content.ts) and are tested against the résumé.
- Sudo, the pixel cat who guides visitors, with his lines in [`lib/sudo.ts`](lib/sudo.ts).
- Two mini games, `snake` and `triage` (a supply-chain risk game), loaded only when played, with a small high-score API backed by Upstash Redis.
- Accessible by keyboard and screen reader, in light and dark themes, with a strict content security policy and no tracking.

## Running it

Node 26 (pinned with [mise](https://mise.jdx.dev)).

```bash
npm install
npm run dev          # http://localhost:3000; high scores go to a local JSON file
npm test             # unit tests (Vitest)
npm run test:e2e     # end-to-end and accessibility (Playwright and axe)
npm run lint && npm run typecheck
npm run build && npm run lighthouse
```

CI runs all of these on every push.

## Licence

All rights reserved. The code is public to read and learn from; the content, writing and artwork are Muji's and not for reuse.
