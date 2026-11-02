"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Cat, commandEvent } from "@/components/cat/Cat";
import { Prompt, PromptPrefix } from "@/components/Prompt";
import { CommandButton, OutputView } from "@/components/terminal/Outputs";
import { bootCommand, useBoot, type Boot } from "@/components/terminal/useBoot";
import { profile } from "@/lib/content";
import {
  complete,
  historyStep,
  run,
  suggestions,
  type Output,
} from "@/lib/terminal";
import { setTheme } from "@/lib/theme";

type Entry = { id: number; command: string; output?: Output };

const bootEntryId = 1;

const opening: Entry[] = [
  { id: 0, command: "whoami", output: { type: "whoami" } },
  { id: bootEntryId, command: bootCommand, output: { type: "about" } },
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

export function Terminal() {
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
  const [options, setOptions] = useState<string[]>([]);
  const [catBubble, setCatBubble] = useState(false);
  const nextId = useRef(opening.length);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(false);
  const boot = useBoot(profile.summary.length);
  const ready = interactive && boot.phase === "done";

  useEffect(() => {
    // Focus the prompt once it appears, for mouse and trackpad users only, so
    // phones do not open the keyboard uninvited.
    if (ready && window.matchMedia?.("(pointer: fine)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [ready]);

  useEffect(() => {
    if (!shouldScroll.current) return;
    shouldScroll.current = false;
    latestRef.current?.scrollIntoView?.({ block: "start" });
  }, [entries]);

  function runCommand(command: string) {
    const result = run(command);
    if (command.trim()) window.dispatchEvent(new Event(commandEvent));
    if (result.effect?.type === "clear") {
      setEntries([]);
    } else {
      if (result.effect?.type === "theme") setTheme(result.effect.theme);
      shouldScroll.current = true;
      setEntries((current) => [
        ...current,
        { id: nextId.current++, command, output: result.output },
      ]);
    }
    const trimmed = command.trim();
    const nextHistory = trimmed ? [...history, trimmed] : history;
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length);
    setInput("");
    setOptions([]);
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
    } else if (event.key === "Tab" && !event.shiftKey && input.trim()) {
      // Tab completes only when there is something to complete; on an empty
      // prompt it moves focus as usual, so keyboard users are never trapped.
      const result = complete(input);
      if (result.value !== input || result.options.length > 0) {
        event.preventDefault();
        setInput(result.value);
        setOptions(result.options);
      }
    } else if (event.key === "Escape") {
      setInput("");
      setOptions([]);
    }
  }

  return (
    <div className="space-y-6">
      <div role="log" aria-label="Terminal output" className="space-y-6">
        {entries.map((entry, i) => {
          const booting = entry.id === bootEntryId && boot.phase !== "done";
          return (
            <div
              key={entry.id}
              ref={i === entries.length - 1 ? latestRef : undefined}
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
            <input
              ref={inputRef}
              id="command"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              // 16px stops iOS zooming into the field.
              className="text-fg-strong caret-accent min-w-0 flex-1 bg-transparent text-[16px]"
            />
          </form>
          {options.length > 0 && (
            <p className="text-muted mt-2 flex flex-wrap gap-x-6 text-sm">
              {options.map((option) => (
                <span key={option}>{option}</span>
              ))}
            </p>
          )}
          {/* On wider screens the cat's bubble offers these while it is open. */}
          <p
            className={`text-muted mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm ${catBubble ? "sm:hidden" : ""}`}
          >
            <span>try one of these:</span>
            {suggestions.map((command) => (
              <CommandButton
                key={command}
                command={command}
                onRun={runCommand}
              />
            ))}
          </p>
        </div>
      )}
      {interactive && (
        <CatPortal onRun={runCommand} onBubbleChange={setCatBubble} />
      )}
    </div>
  );
}

/**
 * Renders the cat into the layer over the window (see TerminalWindow). It
 * mounts with the opening so its entrance runs alongside the typing.
 */
function CatPortal(props: Parameters<typeof Cat>[0]) {
  const layer = document.getElementById("cat-layer");
  return layer ? createPortal(<Cat {...props} />, layer) : null;
}
