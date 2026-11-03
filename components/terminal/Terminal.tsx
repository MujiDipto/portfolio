"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Cat, commandEvent, typingEvent } from "@/components/cat/Cat";
import { Prompt, PromptPrefix } from "@/components/Prompt";
import { AuditContext } from "@/components/terminal/AuditOutput";
import { CommandButton, OutputView } from "@/components/terminal/Outputs";
import {
  Palette,
  paletteEvent,
  paletteShortcut,
} from "@/components/terminal/Palette";
import { bootCommand, useBoot, type Boot } from "@/components/terminal/useBoot";
import type { Audit } from "@/lib/audit";
import { highlightLines } from "@/lib/content";
import {
  commandForHash,
  historyStep,
  linkFor,
  matches,
  maxCommandLength,
  maxEntries,
  run,
  suggestions,
  type Output,
} from "@/lib/terminal";
import { setTheme } from "@/lib/theme";

type Entry = { id: number; command: string; output?: Output };

const bootEntryId = 1;

const opening: Entry[] = [
  { id: 0, command: "whoami", output: { type: "whoami" } },
  { id: bootEntryId, command: bootCommand, output: { type: "highlights" } },
];

const noop = () => () => {};

/** The command while the opening animation types it. */
function BootCommand({ boot }: { boot: Boot }) {
  if (boot.phase === "pending") {
    // Hidden by CSS once JavaScript runs, still read by screen readers.
    return <span className="boot-hidden">{bootCommand}</span>;
  }
  return (
    <>
      <span aria-hidden="true" data-boot-typed>
        {bootCommand.slice(0, boot.typed)}
        <span className="boot-cursor" />
      </span>
      <span className="sr-only">{bootCommand}</span>
    </>
  );
}

export function Terminal({ audit = null }: { audit?: Audit | null }) {
  // The prompt only renders once JavaScript runs; without it, the static
  // session (rendered by the page) shows everything instead.
  const interactive = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const [entries, setEntries] = useState(opening);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const nextId = useRef(opening.length);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(false);
  const boot = useBoot(highlightLines.length);
  const ready = interactive && boot.phase === "done";
  // Fish-style hints: the best match shows as grey text after the caret.
  const hints = matches(input, history);
  const hint = hints[0];
  const ghost = hint ? hint.slice(input.toLowerCase().trimStart().length) : "";

  useEffect(() => {
    // Focus the prompt once it appears, for mouse and trackpad users only, so
    // phones do not open the keyboard uninvited.
    if (ready && window.matchMedia?.("(pointer: fine)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [ready]);

  useEffect(() => {
    // Like a real terminal, clicking anywhere in the window puts the caret in
    // the prompt. Mouse and trackpad only: on phones every tap while reading
    // would open the keyboard. Links, buttons and text selection still work.
    const area = inputRef.current?.closest("[data-terminal-window]");
    if (!ready || !area) return;
    const onClick = (event: Event) => {
      const target = event.target as Element;
      if (!window.matchMedia?.("(pointer: fine)").matches) return;
      if (target.closest("a, button, input, label")) return;
      if (!window.getSelection()?.isCollapsed) return;
      inputRef.current?.focus({ preventScroll: true });
    };
    area.addEventListener("click", onClick);
    return () => area.removeEventListener("click", onClick);
  }, [ready]);

  useEffect(() => {
    if (!shouldScroll.current) return;
    shouldScroll.current = false;
    latestRef.current?.scrollIntoView?.({ block: "start" });
  }, [entries]);

  // Deep links: /#career runs `git log` once the prompt is ready. After that
  // the browser's history follows the session: each command that changes what
  // is shown adds an entry, so Back and Forward move between outputs (they
  // scroll; nothing runs again) and only leave the site from the start of the
  // visit. A hash the visitor types or follows from elsewhere still runs its
  // command. The ref keeps the listener on the latest runCommand, which reads
  // the current history.
  const runLatest = useRef(runCommand);
  useEffect(() => {
    runLatest.current = runCommand;
  });
  useEffect(() => {
    if (!ready) return;
    // The start of the visit: Back to here shows the opening again.
    if (!window.history.state?.terminal) {
      window.history.replaceState({ terminal: true, entry: opening[0].id }, "");
    }
    const follow = () => {
      const command = commandForHash(window.location.hash);
      if (command) runLatest.current(command, { fromAddress: true });
    };
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as {
        terminal?: boolean;
        entry?: number;
      } | null;
      if (!state?.terminal) {
        // A new hash (typed in the address bar or followed from a link).
        follow();
        return;
      }
      // Only a whole number goes into the selector.
      const entry = Number(state.entry);
      if (!Number.isInteger(entry)) return;
      document
        .querySelector(`[data-entry="${entry}"]`)
        ?.scrollIntoView?.({ block: "start" });
    };
    // A tick later, so Sudo has arrived and replies to it.
    const timer = window.setTimeout(follow, 0);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", onPopState);
    };
  }, [ready]);

  function runCommand(
    command: string,
    { fromAddress = false }: { fromAddress?: boolean } = {},
  ) {
    const result = run(command, {
      history: [...history, command.trim()],
      now: new Date(),
    });
    // Keep the address shareable: it links to what is on screen. A command
    // adds a history entry pointing at its output; one the address itself
    // asked for replaces the current entry instead, so Back does not land on
    // the same view twice.
    const link = linkFor(command);
    if (link || result.effect?.type === "clear") {
      const { pathname, search } = window.location;
      const state = { terminal: true, entry: nextId.current };
      const url = link ? `#${link}` : pathname + search;
      if (fromAddress || !link) window.history.replaceState(state, "", url);
      else window.history.pushState(state, "", url);
    }
    if (command.trim()) {
      window.dispatchEvent(new CustomEvent(commandEvent, { detail: command }));
    }
    if (result.effect?.type === "clear") {
      setEntries([]);
    } else {
      if (result.effect?.type === "theme") setTheme(result.effect.theme);
      shouldScroll.current = true;
      setEntries((current) =>
        [
          ...current,
          { id: nextId.current++, command, output: result.output },
        ].slice(-maxEntries),
      );
    }
    const trimmed = command.trim();
    const nextHistory = trimmed ? [...history, trimmed] : history;
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length);
    setInput("");
    inputRef.current?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      if (history.length === 0) return;
      event.preventDefault();
      const index = historyStep(
        history,
        historyIndex,
        event.key === "ArrowUp" ? "up" : "down",
      );
      setHistoryIndex(index);
      setInput(history[index] ?? "");
    } else if (event.key === "Tab" && !event.shiftKey && hint) {
      // Tab accepts a hint only when there is one; otherwise it moves focus
      // as usual, so keyboard users are never trapped.
      event.preventDefault();
      setInput(hint);
    } else if (
      event.key === "ArrowRight" &&
      hint &&
      event.currentTarget.selectionStart === input.length
    ) {
      // As in fish and zsh: → at the end of the line accepts the hint.
      event.preventDefault();
      setInput(hint);
    } else if (event.key === "Escape") {
      setInput("");
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      // As in a real terminal, Page Up and Page Down scroll the output, so
      // keyboard users can read long output without leaving the prompt.
      event.preventDefault();
      const output = event.currentTarget.closest("main");
      if (!output) return;
      const page = output.clientHeight * 0.85;
      output.scrollBy({ top: event.key === "PageUp" ? -page : page });
    }
  }

  return (
    <AuditContext value={audit}>
      <div className="space-y-6">
        <div role="log" aria-label="Terminal output" className="space-y-6">
          {entries.map((entry, i) => {
            const booting = entry.id === bootEntryId && boot.phase !== "done";
            return (
              <div
                key={entry.id}
                data-entry={entry.id}
                ref={i === entries.length - 1 ? latestRef : undefined}
                // The no-JS target for /#highlights; with JavaScript the link runs the command.
                id={
                  !interactive && entry.id === bootEntryId
                    ? linkFor(entry.command)
                    : undefined
                }
                className="scroll-mt-4"
              >
                {booting ? (
                  <Prompt>
                    <BootCommand boot={boot} />
                  </Prompt>
                ) : (
                  <Prompt command={entry.command} />
                )}
                {entry.output && (
                  <div className="mt-3">
                    <OutputView
                      output={entry.output}
                      main={entry.id === 0}
                      onRun={runCommand}
                      revealed={booting ? boot.lines : undefined}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {ready && (
          <div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                runCommand(input);
              }}
              className="flex items-baseline gap-2"
            >
              <label htmlFor="command" className="text-base">
                <PromptPrefix />
                <span className="sr-only">Command</span>
              </label>
              <div className="relative min-w-0 flex-1">
                {/* The hint sits under the input in the same font, after an
                  invisible copy of what was typed, so the letters line up. */}
                <div
                  aria-hidden="true"
                  data-hint
                  className="text-muted pointer-events-none absolute inset-0 overflow-hidden text-[16px] whitespace-pre"
                >
                  <span className="invisible">{input}</span>
                  {ghost}
                </div>
                <input
                  ref={inputRef}
                  id="command"
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    if (event.target.value) {
                      window.dispatchEvent(new Event(typingEvent));
                    }
                  }}
                  onKeyDown={onKeyDown}
                  autoComplete="off"
                  maxLength={maxCommandLength}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  // 16px stops iOS zooming into the field.
                  className="text-fg-strong caret-accent relative w-full bg-transparent text-[16px]"
                />
              </div>
            </form>
            {/* Touch screens have no Tab key, so matches are buttons too. */}
            {(!input.trim() || hints.length > 0) && (
              <p className="text-muted mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                <span>{input.trim() ? "matching:" : "try one of these:"}</span>
                {(input.trim() ? hints : suggestions).map((command) => (
                  <CommandButton
                    key={command}
                    command={command}
                    onRun={runCommand}
                  />
                ))}
                {!input.trim() && (
                  <span className="flex items-baseline gap-2">
                    or
                    <button
                      type="button"
                      onClick={() =>
                        window.dispatchEvent(new Event(paletteEvent))
                      }
                      aria-haspopup="dialog"
                      className="text-accent inline-flex min-h-6 cursor-pointer items-center gap-2 underline-offset-4 hover:underline"
                    >
                      search all
                      <kbd className="border-border text-muted hidden rounded border px-1.5 font-mono text-xs sm:inline">
                        {paletteShortcut()}
                      </kbd>
                    </button>
                  </span>
                )}
              </p>
            )}
          </div>
        )}
        {interactive && <CatPortal onRun={runCommand} />}
        {interactive && <Palette onRun={runCommand} />}
      </div>
    </AuditContext>
  );
}

/**
 * Renders the cat into its layer behind the window (see TerminalWindow). It
 * mounts with the opening so its entrance runs alongside the typing.
 */
function CatPortal(props: Parameters<typeof Cat>[0]) {
  const layer = document.getElementById("cat-layer");
  return layer ? createPortal(<Cat {...props} />, layer) : null;
}
