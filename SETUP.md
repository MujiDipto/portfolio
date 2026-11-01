# SETUP.md: Claude Code tooling lab

A running record of every tool we try while building the portfolio site: what it is, how to install it, how we used it, and whether it was worth it.

Last updated: 2026-11-01
Machine: MacBook Air (M1, MacBookAir10,1), macOS 26.1
Claude Code version: 2.1.316 (Claude Code), native install

Baseline on 2026-11-01, before any tool work: Claude desktop app 4.4212.0 and Ghostty 1.4.0 already installed; `claude` CLI not on PATH; no `~/.claude/settings.json`, no plugins, no Ghostty config. Node v23.11.0, npm, git, gh and Homebrew present; Vercel CLI not installed.

## Quick start: rebuild this setup on a new Mac
Keep this list short and in order. Update it whenever a tool earns a permanent place.

1. Check `ls -ld ~/.cache ~/.local` shows your user as owner; if not, `sudo chown -R "$USER":staff ~/.cache`.
2. Ghostty: install from `https://ghostty.org`, then add the settings from the Ghostty entry below to `~/Library/Application Support/com.mitchellh.ghostty/config.ghostty` and run `ghostty +validate-config`.
3. Claude Code CLI: download `https://claude.ai/install.sh`, read it, run it with `bash`, then add `export PATH="$HOME/.local/bin:$PATH"` to `~/.zshrc`. Check with `claude --version` and `claude doctor`.
4. mise: `brew install mise`, add `eval "$(mise activate zsh)"` to `~/.zshrc`, then in the repo run `mise trust` and `mise install` (reads `mise.toml`).

## Verdict key
- **Useful:** saved time or caught real problems, and I would use it again.
- **Mixed:** helpful in some situations, with noticeable cost or friction.
- **Not useful:** no clear benefit, or the cost outweighed it.
- **Not safe for work:** fine for a personal project, but not for code that touches regulated data.

## Summary

| Tool | Source | Verdict | Tested on | One-line finding |
| --- | --- | --- | --- | --- |
| Ghostty | Community (open source) | Pending | 2026-11-01 | Configured and validated; not used for project work yet |
| Claude Code desktop app | | | | |
| Claude Code terminal | Official (Anthropic) | Pending | 2026-11-01 | Installed and verified; not used for project work yet |
| mise (Node 26 pin) | Community (open source) | Pending | 2026-11-01 | Pins Node 26 per project; global setup untouched |
| Next.js `AGENTS.md` | Official (Vercel) | Pending | 2026-11-01 | Points agents at version-matched docs in `node_modules`; imported into CLAUDE.md |
| GitHub CLI | Official (GitHub) | Useful | 2026-11-01 | Pinned actions to SHAs and checked repos before creating one; broad token scope |
| Project permission rules | Official (built in) | Useful | 2026-11-01 | Deny and ask rules blocked secret reads and paused `git push` in tests |
| typescript-lsp | | | | |
| explanatory-output-style | | | | |
| Playwright MCP | | | | |
| superpowers | | | | |
| gstack | | | | |
| Memory plugin | | | | |

## Tool entries
Copy this block for each tool.

### Tool name
- **What it is and who makes it:** (official, community or third-party)
- **Why we tried it:**
- **Install and configure:** (exact commands, versions, the date tested)
- **How we used it here:** (a concrete example from this project)
- **Verdict:** Useful / Mixed / Not useful / Not safe for work
- **Evidence:** (time saved, bugs caught, friction, cost in context or tokens)
- **Risks and permissions:** (what it can read, run or send; what to check before using it on work code)
- **Remove it:** (exact steps)

### Claude Code terminal (CLI)
- **What it is and who makes it:** the `claude` command-line agent. Official, made by Anthropic. Same agent as the desktop app's Code tab, run in a terminal.
- **Why we tried it:** to compare it with the desktop app and decide when each is the better choice, and because the brief pairs it with Ghostty.
- **Install and configure (2026-11-01):**
  1. Confirmed the method in the official docs (`code.claude.com/docs/en/setup`): native installer recommended; Homebrew cask `claude-code` is the alternative without auto-updates.
  2. Downloaded `https://claude.ai/install.sh` (260 lines, SHA256 `3a68d3406cf674e17bed1733a4dcf37805e2e47d87417700007d7e1aa766a944`) and read it before running. It refuses sudo, writes only under `$HOME`, downloads the binary from `downloads.claude.ai` and checks its SHA256 against the release manifest, then runs `claude install`. It does not verify the manifest's GPG signature itself.
  3. First run failed (see Dead ends); fixed `~/.cache` ownership, re-downloaded the script (identical hash) and ran `bash install.sh`.
  4. Result: `~/.local/bin/claude` symlinked to `~/.local/share/claude/versions/2.1.316`. The installer did not edit any shell profile; it prints the PATH line to add to `~/.zshrc` yourself.
  5. Verified: `claude --version` prints `2.1.316 (Claude Code)`. `codesign --verify` reports valid; `spctl` reports "Notarized Developer ID, Anthropic PBC (Q6L2SF6YDW)". `claude doctor` reports one warning, `~/.local/bin` not on PATH.
  6. `claude doctor` run from the desktop app's shell shows auto-updates disabled, because the app sets `DISABLE_AUTOUPDATER=1` in its own environment. After adding the PATH line to `~/.zshrc`, Muji ran `claude doctor` in Ghostty: "Auto-updates: enabled", "Auto-update channel: latest", "No installation issues found". Not yet signed in to claude.ai.
- **How we used it here:** not used for project work yet.
- **Verdict:** Pending.
- **Evidence:** to be recorded once used alongside the desktop app.
- **Risks and permissions:** reads and writes files in the folder it runs in, and runs shell commands subject to your permission mode. Sends prompts, file contents and command output to Anthropic under the signed-in account. Keeps transcripts in `~/.claude/projects`, which contain whatever code it read. Updates itself in the background. For work code with regulated data: use only an employer-approved account with the right data agreement, never a personal account, and consider a pinned version or the `stable` channel.
- **Remove it:** `rm -f ~/.local/bin/claude && rm -rf ~/.local/share/claude ~/.local/state/claude`, then remove the PATH line from `~/.zshrc`. Settings and history in `~/.claude` are shared with the desktop app; leave them unless removing both.

### Project permission rules (`.claude/settings.json`)
- **What it is and who makes it:** Claude Code's built-in permission rules, written in a settings file committed with the repo. Official, Anthropic. Nothing to install. Applies to every Claude Code session in this folder, desktop app and CLI.
- **Why we tried it:** to enforce parts of the working agreement (no secrets read, no push or deploy without approval) instead of relying on instructions alone. The pattern carries straight over to work repos.
- **Install and configure (2026-11-01):**
  1. Checked the rule syntax in the official permissions docs (`code.claude.com/docs/en/permissions`). Key points: deny and ask rules from any settings file beat allow rules; a `Read` deny also blocks Edit and Write on that path and Bash commands that name the file (`cat`, `head`, redirects); ask rules still prompt in auto mode; `deny` and `ask` rules need no workspace trust.
  2. Wrote:
     ```json
     {
       "permissions": {
         "deny": ["Read(.env*)", "Read(/content/*.pdf)"],
         "ask": ["Bash(git push *)", "Bash(vercel *)", "Bash(npx vercel *)"]
       }
     }
     ```
     `.env*` is a bare pattern, so it matches at any depth. `/content/*.pdf` is anchored at the project root. Push and deploy are `ask`, not `deny`, because the agreement is "not without my approval", not "never".
  3. The rules took effect in the running desktop session without a restart.
- **How we used it here, with test results:** using a dummy `.env.guardtest` file (gitignored, no real secret, deleted afterwards):

  | Rule | Test | Result |
  | --- | --- | --- |
  | `Read(.env*)` | Read tool on `.env.guardtest` | Blocked |
  | `Read(.env*)` | `cat .env.guardtest` | Blocked |
  | `Read(/content/*.pdf)` | Read tool on the resume PDF | Blocked |
  | (no over-match) | `head content/resume.md` | Still readable |
  | `Bash(git push *)` | `git push` while Muji watched | Prompt appeared; Muji declined |
  | `Bash(vercel *)` | `vercel --version` | Not cleanly tested: it ran, and it is unclear whether it prompted and was approved. Retest in phase 5 once the Vercel CLI is installed. |

  The first two `git push` and `vercel` runs also went through; Muji was not sure whether prompts appeared and were approved. Lesson: when testing ask rules, tell the person to watch and decline before running the command.
- **Verdict:** Useful.
- **Evidence:** three deny tests blocked as expected, one over-match check passed, one ask rule paused for approval. Costs no context or tokens.
- **Risks and permissions:** only restricts; it cannot grant anything. Limits, from the docs: rules match the command text Claude writes, so they are not a security boundary. `git -C . push` or `/usr/bin/curl` forms are not matched, and deny rules do not cover commands that read files without naming them (`grep -r`, a Python or Node script). Probing the `grep -r` gap was itself blocked by the auto mode classifier, so it was not tested here. For regulated-data work: use these rules plus Claude Code's sandbox, which enforces file and network limits at the OS level, and prefer managed settings so individuals cannot loosen them.
- **Remove it:** delete `.claude/settings.json`, or remove individual rules from it.

### Ghostty
- **What it is and who makes it:** a native, GPU-accelerated terminal for macOS and Linux. Community open-source project led by Mitchell Hashimoto. Not made by Anthropic.
- **Why we tried it:** a fast terminal to run the Claude Code CLI in, compared against the desktop app.
- **Install and configure (2026-11-01):**
  1. Already installed: Ghostty 1.4.0, stable channel. `spctl` reports "Notarized Developer ID, Mitchell Hashimoto (24VZTF6M5V)".
  2. Ghostty had created a comment-only template at `~/Library/Application Support/com.mitchellh.ghostty/config.ghostty`. We added settings there, not in `~/.config/ghostty/`, to keep a single config file.
  3. Checked option names and theme names against the app itself with `ghostty +show-config --default --docs` and `ghostty +list-themes` (819 themes) before writing anything.
  4. Settings added (font left at Ghostty's default):
     ```
     theme = Ayu
     font-size = 14
     window-padding-x = 10
     window-padding-y = 8
     window-padding-balance = true
     mouse-hide-while-typing = true
     notify-on-command-finish = unfocused
     notify-on-command-finish-action = bell,notify
     notify-on-command-finish-after = 30s
     auto-update = download
     ```
     - `theme = Ayu` is the dark Ayu variant, used always (Muji's choice). It replaced an earlier light/dark GitHub pair. In the Claude Code CLI, pick the dark theme with `/theme` to match.
     - The notification settings alert, with a bell and a macOS notification, when a shell command that ran 30 seconds or more finishes while Ghostty is not focused (long installs, builds, Playwright runs). Claude Code sends its own notifications in Ghostty without this.
     - `auto-update = download` fetches updates and asks before installing. Ghostty's docs say the update check adds no tracking.
  5. Verified: `ghostty +validate-config` exits 0, and `ghostty +show-config` lists all ten values as set. Not yet checked by eye in a running window, and the notifications have not been triggered yet.
  6. Checked against the Claude Code terminal docs (`code.claude.com/docs/en/terminal-config`): in Ghostty, Shift+Enter for a newline and Claude Code's desktop notifications work without setup.
  7. Considered and not applied: `macos-option-as-alt = left` (needed for Claude Code's Option shortcuts such as Option+P; use Shift+Enter or Ctrl+J for newlines instead), `window-save-state = always`, a global quick-terminal hotkey (needs macOS Accessibility permission, which lets Ghostty see keystrokes system-wide), `copy-on-select` (risks copying secrets to the clipboard without meaning to), background opacity or blur (hurts contrast), and third-party cursor shaders (third-party code, GPU cost).
- **How we used it here:** not used for project work yet.
- **Verdict:** Pending.
- **Evidence:** to be recorded once used with the CLI.
- **Risks and permissions:** runs your shell as your user, like any terminal. Good defaults to keep: `clipboard-read = ask` (programs must ask before reading the clipboard) and `clipboard-paste-protection = true` (warns before pasting text that could run commands). `clipboard-write = allow` lets programs set the clipboard. The only network traffic the config adds is the update check. Notifications need Ghostty to be allowed in System Settings > Notifications. Low risk for work use; check whether your employer requires an approved terminal.
- **Remove it:** delete the settings block from the config file (or the file), then drag Ghostty.app to the Bin if removing the app.

### mise (Node version pin)
- **What it is and who makes it:** a version manager for languages and tools (Node, Ruby, Python and more), configured per project with `mise.toml`. Community open source, made by jdx (Jeff Dickey). Node itself comes from nodejs.org.
- **Why we tried it:** the Mac had Homebrew Node 23.11.0 (out of support) on PATH and an old Intel Node 14.17.0 in `/usr/local/bin`. The project needs one pinned, supported version that matches Vercel.
- **Install and configure (2026-11-01):**
  1. Already installed: mise 2026.9.14 via Homebrew, activated in `~/.zshrc` with `eval "$(mise activate zsh)"`, managing Ruby 3.2.4 globally. `mise doctor` reported it activated with shims on PATH. A newer release, 2026.10.25, exists; update with `brew upgrade mise`.
  2. Checked Vercel's docs (`vercel.com/docs/functions/runtimes/node-js/node-js-versions`): available versions are 26.x (default), 24.x and 22.x; `engines.node` in `package.json` overrides the project setting. Chose Node 26 (Muji's choice) over 24 (Claude's recommendation for ecosystem maturity).
  3. Added `mise.toml` to the repo with `node = "26"`, pinning the major version to match how Vercel selects versions.
  4. Ran `mise trust mise.toml` (mise ignores a repo's config until trusted), then `mise install`. It downloaded `node-v26.13.0-darwin-arm64.tar.gz` in 4.5 seconds. `mise settings get node.verify` returned `true`.
  5. Verified: in the project, `node --version` prints `v26.13.0` (via `~/.local/share/mise/shims/node`) and `npm --version` prints `11.20.0`. In the home directory, `node --version` still prints `v23.11.0`. The global `~/.config/mise/config.toml` is unchanged.
- **How we used it here:** pins the Node used for scaffolding, builds and tests. When we scaffold, `package.json` gets `"engines": { "node": "26.x" }` so Vercel uses the same major version.
- **Verdict:** Pending.
- **Evidence:** to be recorded once builds run on it.
- **Risks and permissions:** downloads runtimes into `~/.local/share/mise` with no sudo. A trusted `mise.toml` can also set environment variables and run tasks, so read a repo's `mise.toml` before running `mise trust`. Two Node installs can confuse; `which node` shows which one runs. For work: a pinned `mise.toml` per repo is a good habit; check whether your employer standardises on another manager such as nvm or volta.
- **Remove it:** delete `mise.toml` from the repo and run `mise uninstall node@26.13.0`. To remove mise itself: remove the activate line from `~/.zshrc`, `brew uninstall mise`, and delete `~/.local/share/mise`.
- **Cleanup still to do (not part of this step):** the 2021 Node 14 installer in `/usr/local/bin` (needs sudo to remove) and Homebrew Node 23.

### Next.js `AGENTS.md` (via create-next-app)
- **What it is and who makes it:** a short file that `create-next-app` adds by default (`--agents-md`) and `next dev` re-adds if missing. It tells coding agents to read the docs bundled with the installed Next.js in `node_modules/next/dist/docs/` before writing code, since APIs may differ from their training data. Official, Vercel.
- **Why we tried it:** Next.js 16.4 is newer than much of any model's training data; version-matched docs should prevent outdated code.
- **Install and configure (2026-11-01):**
  1. Checked current versions with `npm view` (read-only): `create-next-app` and `next` 16.4.3, published 2026-10-23. Pinned `create-next-app@16.4.3` instead of `@latest`, so the release had 9 days in the wild.
  2. Read the CLI docs (`nextjs.org/docs/app/api-reference/cli/create-next-app`). Defaults include "agent feedback" (agents prepare anonymised Next.js feedback for review); turned off with `--no-agent-feedback`.
  3. Scaffolded into a scratch folder, not the repo, so nothing could overwrite `CLAUDE.md`:
     `npx create-next-app@16.4.3 scaffold --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --disable-git --skip-install --no-react-compiler --no-agent-feedback`. It generated 17 files and no `CLAUDE.md`.
  4. Read every file, then copied `AGENTS.md`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `app/layout.tsx` and `app/globals.css`. Dropped the demo page, README, favicon and five SVGs.
  5. Claude Code reads `CLAUDE.md`, not `AGENTS.md`, so `CLAUDE.md` imports it with an `@AGENTS.md` line.
  6. Verified the docs exist: `node_modules/next/dist/docs/` holds 474 markdown files (4.4 MB).
- **How we used it here:** to set up Vitest, Claude read the bundled guide `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` instead of relying on memory or the web. The guide recommended `vite-tsconfig-paths`; checking the installed Vite 8.3.5 types showed a built-in `resolve.tsconfigPaths` option, so that package was skipped.
- **Verdict:** Pending, early signs positive.
- **Evidence so far:** one setup done from version-matched docs (2026-11-01). Still to record whether it avoids outdated APIs while building pages.
- **Risks and permissions:** text only. Reading the bundled docs costs context tokens. `next dev` rewrites the file if it is removed.
- **Remove it:** delete `AGENTS.md`, remove the `@AGENTS.md` line from `CLAUDE.md`, and pass `--no-agents-md` on future scaffolds. `next dev` may re-create it; check `node_modules/next/dist/server/lib/generate-agent-files.js`.

### Playwright test suite vs Playwright MCP (note)
- The project's own end-to-end suite uses `@playwright/test` 1.64.1 and `@axe-core/playwright` 4.14.0 (Deque), set up 2026-11-01. It is a project dependency that runs in CI, not a Claude Code tool, so it is not scored here.
- Playwright MCP, still to evaluate, is different: a tool that lets Claude open and inspect pages while working.
- Browsers: `npx playwright install chromium` downloaded Chrome for Testing 156 from `cdn.playwright.dev` into `~/Library/Caches/ms-playwright`. That cache already held older Playwright browsers (`chromium-1187`, `firefox-1490`, `webkit-2203`) from earlier use, 1.5 GB in total; `npx playwright uninstall` removes browsers no current install uses.
- npm 11 warned that `fsevents` (optional macOS file watcher) has an install script not covered by `allowScripts`. Left unapproved; nothing failed without it.

### GitHub CLI (`gh`)
- **What it is and who makes it:** GitHub's official command-line tool. Already installed via Homebrew and signed in as MujiDipto before this project.
- **Why we used it:** to read package and action metadata, resolve action tags to commit SHAs for pinning, create the private repo, and watch CI runs without leaving the session.
- **Install and configure:** `brew install gh`, then `gh auth login`. On 2026-11-01 `gh auth status` showed token scopes `gist`, `read:org`, `repo`, `workflow`.
- **How we used it here:** `gh api repos/actions/checkout/git/ref/tags/v7.0.1` to get the commit SHA to pin; `gh repo list` to check for name clashes before creating `MujiDipto/portfolio`.
- **Verdict:** Useful.
- **Evidence:** pinned both actions to exact commits in two commands; spotted the existing `terminal-portfolio` repo and the public `fifa-wc-newsletter` repo before creating anything.
- **Risks and permissions:** the `repo` scope gives full read and write to every repo on the account, private ones included, and Claude can use it whenever it runs `gh`. For work: use a fine-grained token limited to one repository and read-only where possible, and keep pushes behind an `ask` rule as here.
- **Remove it:** `gh auth logout`, then `brew uninstall gh`.

### Next.js telemetry (setting)
- Next.js collects anonymous usage data by default. Disabled for this project only by adding `NEXT_TELEMETRY_DISABLED = "1"` under `[env]` in `mise.toml` (re-ran `mise trust` after the edit; `mise exec -- printenv NEXT_TELEMETRY_DISABLED` prints `1`). For work, set it in CI and on build machines too.

## Dead ends and failed attempts
Record what did not work and why. Negative results are valuable.

- 2026-11-01, Claude Code CLI native installer: the installer script (260 lines, SHA256 `3a68d340…a944`) downloaded and verified the binary, then `claude install` failed with `EACCES: permission denied, mkdir '/Users/ares/.cache/claude'`. Cause: `~/.cache` is owned by `root` (created by an old `sudo` run of matplotlib or yt-dlp), not by the installer. Shell profiles were unchanged; it left empty `~/.local/share/claude/versions` and `~/.local/state/claude/locks`. Lesson: check `ls -ld ~/.cache ~/.local` before installing CLI tools that use XDG directories. Resolved the same day: Muji ran `sudo chown -R ares:staff ~/.cache` and the second install succeeded.

- 2026-11-01, `npm audit` after scaffolding: 16 moderate findings, all one advisory (GHSA-g3hv-75wg-m249, minimatch below 11.0.1, denial of service via glob patterns, CVSS 0) in the ESLint 9 toolchain. npm's suggested fix (`npm audit fix --force`) would downgrade to ESLint 4 and `eslint-config-next` 0.2.4, which is wrong. ESLint 10 would not clear it, because the lint plugins use minimatch 3.x, which has no fixed release. Accepted for now: dev-only, never shipped, and the only glob patterns come from our own config. `npm audit --audit-level=high` exits 0. Also, `npm install` warns that ESLint 9.39.5 is no longer supported; the scaffold still ships `eslint ^9`. Revisit when Next.js moves to ESLint 10. After adding Prettier and Vitest the count became 17: the extra entry is `eslint-config-prettier`, flagged only because it depends on ESLint; same single advisory.

- 2026-11-01, Lighthouse CI (`@lhci/cli` 0.15.1, Google): installing it raised `npm audit` from 17 to 36 findings, 13 high (path traversal and arbitrary file writes in `extract-zip` and `tmp`, denial of service in `basic-ftp` and `zod`), all through its bundled Lighthouse 12 and Puppeteer chain. Its last release was June 2025. Uninstalled it the same minute. Replaced with `lighthouse` 13.6.0 (released 2026-10-27; 0 high findings) plus our own `scripts/lighthouse.mjs` (3 runs, medians, thresholds in `scripts/lighthouse-thresholds.mjs` with 9 unit tests). Lesson: audit right after each install, and check the release date of wrapper tools, not just the tool they wrap.

## Work-safety notes
What is safe to use at work, what needs approval first, and what must stay on personal projects.

- Safe at work: project permission rules in `.claude/settings.json` (deny secret reads, ask before push and deploy), paired with the sandbox for OS-level enforcement.
- Needs approval first:
- Personal projects only:

## Retrospective (fill in at the end)
- Final ranking of tools:
- Recommended minimal setup for work:
- What I would do differently:
