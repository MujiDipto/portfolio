"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { Prompt, PromptPrefix } from "@/components/Prompt";
import { CommandButton, OutputView } from "@/components/terminal/Outputs";
import {
  complete,
  historyStep,
  run,
  suggestions,
  type Output,
} from "@/lib/terminal";
import { setTheme } from "@/lib/theme";

type Entry = { id: number; command: string; output?: Output };

const opening: Entry[] = [
  { id: 0, command: "whoami", output: { type: "whoami" } },
  { id: 1, command: "cat about.md", output: { type: "about" } },
];

const noop = () => () => {};

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
  const nextId = useRef(opening.length);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(false);

  useEffect(() => {
    // Focus the prompt on load for mouse and trackpad users only, so phones
    // do not open the keyboard uninvited.
    if (window.matchMedia?.("(pointer: fine)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [interactive]);

  useEffect(() => {
    if (!shouldScroll.current) return;
    shouldScroll.current = false;
    latestRef.current?.scrollIntoView?.({ block: "start" });
  }, [entries]);

  function runCommand(command: string) {
    const result = run(command);
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
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            ref={i === entries.length - 1 ? latestRef : undefined}
            className="scroll-mt-4"
          >
            <Prompt command={entry.command} />
            {entry.output && (
              <div className="mt-3">
                <OutputView
                  output={entry.output}
                  main={entry.id === 0}
                  onRun={runCommand}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {interactive && (
        <div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              runCommand(input);
            }}
            className="focus-within:border-accent flex items-baseline gap-2 border-b border-transparent pb-1"
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
          <p className="text-muted mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
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
    </div>
  );
}
