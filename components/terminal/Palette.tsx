"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { RunCommand } from "@/components/terminal/Outputs";
import { filterPalette, maxCommandLength } from "@/lib/terminal";

/** Dispatched on window to open the palette, as the suggestion row does. */
export const paletteEvent = "terminal:palette";

/** The palette's shortcut as this visitor's keyboard writes it. */
export function paletteShortcut(): string {
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";
}

/**
 * The ⌘K (Ctrl+K) command palette: every command with what it does, for
 * visitors who would rather pick than type. A native modal dialog, so focus
 * stays inside it and Escape closes it; the search box is a combobox over a
 * listbox, moved through with the arrow keys. Its button sits in the title
 * bar (components/TerminalWindow.tsx), so touch screens can open it too.
 */
export function Palette({ onRun }: { onRun: RunCommand }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = filterPalette(query);

  function open() {
    setQuery("");
    setActive(0);
    dialogRef.current?.showModal();
  }

  function choose(command: string) {
    dialogRef.current?.close();
    onRun(command);
  }

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey))
        return;
      event.preventDefault();
      const dialog = dialogRef.current;
      if (dialog?.open) dialog.close();
      else open();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(paletteEvent, open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(paletteEvent, open);
    };
  }, []);

  useEffect(() => {
    document
      .getElementById(`palette-${active}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const count = results.length;
    if (event.key === "ArrowDown" && count) {
      event.preventDefault();
      setActive((i) => (i + 1) % count);
    } else if (event.key === "ArrowUp" && count) {
      event.preventDefault();
      setActive((i) => (i - 1 + count) % count);
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      choose(results[active].command);
    }
  }

  const slot = document.getElementById("palette-slot");
  const shortcut = paletteShortcut();

  return (
    <>
      {slot &&
        createPortal(
          <button
            type="button"
            onClick={open}
            aria-keyshortcuts="Meta+K Control+K"
            aria-haspopup="dialog"
            className="border-border text-muted hover:text-fg-strong inline-flex min-h-6 cursor-pointer items-center gap-2 rounded border px-2 text-xs"
          >
            {/* Its visible text is its name, so voice control users can say it. */}
            menu
            <kbd className="hidden font-mono sm:inline">{shortcut}</kbd>
          </button>,
          slot,
        )}
      {createPortal(
        <dialog
          ref={dialogRef}
          aria-label="Command palette"
          // A click on the backdrop lands on the dialog itself: close it.
          onClick={(event) => {
            if (event.target === event.currentTarget)
              event.currentTarget.close();
          }}
          className="bg-window text-fg border-border m-auto mt-[12vh] w-[min(38rem,calc(100vw-2rem))] rounded-xl border p-0 shadow-2xl backdrop:bg-black/60"
        >
          <div className="border-border flex items-center gap-2 border-b px-4 py-3">
            <span aria-hidden="true" className="text-prompt-user">
              $
            </span>
            <input
              role="combobox"
              aria-label="Search commands"
              aria-expanded="true"
              aria-controls="palette-list"
              aria-autocomplete="list"
              aria-activedescendant={
                results[active] ? `palette-${active}` : undefined
              }
              autoComplete="off"
              maxLength={maxCommandLength}
              spellCheck={false}
              placeholder="search commands"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              id="palette-search"
              // 16px, like the prompt, stops iOS zooming into the field.
              className="text-fg-strong placeholder:text-muted caret-accent w-full bg-transparent text-[16px]"
            />
          </div>
          <ul
            id="palette-list"
            role="listbox"
            // Driven from the search box with the arrow keys; Chrome would
            // otherwise make this scrollable list a Tab stop of its own.
            tabIndex={-1}
            aria-label="Commands"
            className="max-h-[50vh] overflow-y-auto py-2"
          >
            {results.map((entry, i) => (
              <li
                key={entry.command}
                id={`palette-${i}`}
                role="option"
                aria-selected={i === active}
                onClick={() => choose(entry.command)}
                onMouseMove={() => setActive(i)}
                className={`flex cursor-pointer flex-col px-4 py-1.5 sm:flex-row sm:gap-4 ${
                  i === active ? "bg-titlebar" : ""
                }`}
              >
                <span className="text-accent sm:w-[22ch] sm:flex-none">
                  {entry.command}
                </span>
                <span className="text-muted text-sm sm:self-center">
                  {entry.description}
                </span>
              </li>
            ))}
          </ul>
          {results.length === 0 && (
            <p className="text-muted px-4 pb-3 text-sm">
              No matching commands. Try help.
            </p>
          )}
          <p className="text-muted border-border hidden border-t px-4 py-2 text-xs sm:block">
            ↑ ↓ to move, Enter to run, Esc to close
          </p>
        </dialog>,
        document.body,
      )}
    </>
  );
}
