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
  6. `claude doctor` run from the desktop app's shell shows auto-updates disabled, because the app sets `DISABLE_AUTOUPDATER=1` in its own environment. In a normal terminal they should be on; check with `claude doctor` there.
- **How we used it here:** not used for project work yet.
- **Verdict:** Pending.
- **Evidence:** to be recorded once used alongside the desktop app.
- **Risks and permissions:** reads and writes files in the folder it runs in, and runs shell commands subject to your permission mode. Sends prompts, file contents and command output to Anthropic under the signed-in account. Keeps transcripts in `~/.claude/projects`, which contain whatever code it read. Updates itself in the background. For work code with regulated data: use only an employer-approved account with the right data agreement, never a personal account, and consider a pinned version or the `stable` channel.
- **Remove it:** `rm -f ~/.local/bin/claude && rm -rf ~/.local/share/claude ~/.local/state/claude`, then remove the PATH line from `~/.zshrc`. Settings and history in `~/.claude` are shared with the desktop app; leave them unless removing both.

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

## Dead ends and failed attempts
Record what did not work and why. Negative results are valuable.

- 2026-11-01, Claude Code CLI native installer: the installer script (260 lines, SHA256 `3a68d340…a944`) downloaded and verified the binary, then `claude install` failed with `EACCES: permission denied, mkdir '/Users/ares/.cache/claude'`. Cause: `~/.cache` is owned by `root` (created by an old `sudo` run of matplotlib or yt-dlp), not by the installer. Shell profiles were unchanged; it left empty `~/.local/share/claude/versions` and `~/.local/state/claude/locks`. Lesson: check `ls -ld ~/.cache ~/.local` before installing CLI tools that use XDG directories. Resolved the same day: Muji ran `sudo chown -R ares:staff ~/.cache` and the second install succeeded.

## Work-safety notes
What is safe to use at work, what needs approval first, and what must stay on personal projects.

- Safe at work:
- Needs approval first:
- Personal projects only:

## Retrospective (fill in at the end)
- Final ranking of tools:
- Recommended minimal setup for work:
- What I would do differently:
