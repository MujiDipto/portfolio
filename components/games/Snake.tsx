"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { HighScores } from "@/components/games/HighScores";
import {
  focusPrompt,
  say,
  useFocusWithin,
  useFollow,
} from "@/components/games/shared";
import { CommandButton, type RunCommand } from "@/components/terminal/Outputs";
import { draw, newGame, step, turn, type Direction } from "@/lib/snake";
import { snakeVerdict } from "@/lib/sudo";

const keys: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

const pad: { direction: Direction; label: string; area: string }[] = [
  { direction: "up", label: "↑", area: "col-start-2" },
  { direction: "left", label: "←", area: "col-start-1 row-start-2" },
  { direction: "down", label: "↓", area: "col-start-2 row-start-2" },
  { direction: "right", label: "→", area: "col-start-3 row-start-2" },
];

/** Milliseconds per move: a little faster with each bite, to a limit. */
const tickMs = (score: number) => Math.max(70, 140 - score * 4);

const cell: Record<string, string> = {
  "@": "text-fg-strong",
  o: "text-prompt-user",
  "*": "text-accent",
  "·": "text-muted opacity-50",
};

type Phase = "ready" | "playing" | "quit";

// Phones have no keyboard: the hint names the buttons there instead.
const start = (
  <>
    <span className="pointer-coarse:hidden">
      Press an arrow key or WASD to start. Esc quits.
    </span>
    <span className="hidden pointer-coarse:inline">Tap an arrow to start.</span>
  </>
);

/**
 * Snake in the terminal. It waits for the first arrow key, pauses when focus
 * leaves it, and Esc quits back to the prompt. Only the newest output is
 * `live`; an older game stays on screen as it ended.
 */
export function Snake({ live, onRun }: { live: boolean; onRun?: RunCommand }) {
  const ref = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState(() => newGame());
  const [phase, setPhase] = useState<Phase>("ready");
  const focused = useFocusWithin(ref);
  // It loads after the terminal scrolled to the command, and grows as it goes.
  useFollow(ref, live);
  const running = live && phase === "playing" && focused && !game.over;

  useEffect(() => {
    if (live) ref.current?.focus({ preventScroll: true });
  }, [live]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setGame((current) => step(current)),
      tickMs(game.score),
    );
    return () => window.clearInterval(timer);
  }, [running, game.score]);

  const over = game.over;
  useEffect(() => {
    if (!over) return;
    say(snakeVerdict(game.score));
    // With a score, the high-score form takes the keyboard instead.
    if (game.score === 0) focusPrompt(ref.current);
  }, [over, game.score]);

  const ended = over || phase === "quit" || !live;

  function go(direction: Direction) {
    if (ended) return;
    setGame((current) => turn(current, direction));
    setPhase("playing");
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (ended) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setPhase("quit");
      focusPrompt(ref.current, { always: true });
      return;
    }
    const direction = keys[event.key] ?? keys[event.key.toLowerCase()];
    if (!direction) return;
    // The arrows would otherwise scroll the window.
    event.preventDefault();
    go(direction);
  }

  const status = over
    ? `Game over. Score ${game.score}.`
    : phase === "quit" || (!live && phase !== "ready")
      ? `Quit. Score ${game.score}.`
      : !live
        ? "Not played."
        : phase === "ready"
          ? start
          : focused
            ? `Score ${game.score}. Esc quits.`
            : `Paused, score ${game.score}. Click the board to go on.`;

  return (
    <div
      ref={ref}
      data-game="snake"
      // Out of the Tab order once over, but still holding focus until the
      // prompt takes it back (removing tabIndex would drop it on the body).
      tabIndex={ended ? -1 : 0}
      onKeyDown={onKeyDown}
      onClick={() => {
        if (!ended) ref.current?.focus({ preventScroll: true });
      }}
      role="group"
      aria-label="Snake"
      className="-m-2 w-fit scroll-m-4 space-y-3 rounded-sm p-2"
    >
      {/* A picture of the board; the status line below says what matters. */}
      <div
        aria-hidden="true"
        data-board
        className={`border-border w-fit border px-2 py-1 leading-none ${
          ended ? "opacity-60" : ""
        } ${running ? "border-accent" : ""}`}
      >
        {draw(game).map((row, y) => (
          <div key={y} className="h-[1.1em] tracking-[0.4em] whitespace-pre">
            {[...row].map((char, x) => (
              <span key={x} className={cell[char]}>
                {char}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p data-status className="text-muted">
        {status}
      </p>
      {!ended && (
        // Phones have no arrow keys.
        <div className="hidden w-fit grid-cols-3 gap-1 pointer-coarse:grid">
          {pad.map(({ direction, label, area }) => (
            <button
              key={direction}
              type="button"
              aria-label={direction}
              onClick={() => go(direction)}
              className={`${area} border-border text-fg-strong grid size-11 cursor-pointer place-items-center rounded border`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {over && <HighScores game="snake" score={game.score} live={live} />}
      {over && live && onRun && (
        <p className="text-muted flex gap-4">
          <CommandButton command="snake" label="play again" onRun={onRun} />
          <CommandButton command="games" onRun={onRun} />
        </p>
      )}
    </div>
  );
}
