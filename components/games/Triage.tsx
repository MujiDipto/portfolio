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
import { triageVerdict } from "@/lib/sudo";
import {
  cluesAt,
  isOver,
  isRight,
  lives,
  packageFor,
  packages,
  pointsFor,
  secondsFor,
  shuffle,
  tally,
  verdicts,
  type Answer,
  type Verdict,
} from "@/lib/triage";

type Phase = "asking" | "feedback" | "over" | "quit";

const tickMs = 100;
const barCells = 10;

const keyLabel =
  "border-border text-muted rounded border px-1.5 text-xs font-normal";
const action =
  "text-accent inline-flex min-h-6 cursor-pointer items-center gap-2 underline-offset-4 hover:underline";

/**
 * Triage: made-up packages, one at a time, with clues appearing as the clock
 * runs; answer risky, safe or upgrade. Fewer clues score more, three mistakes
 * end the run. The clock pauses when focus leaves the game, and Esc quits back
 * to the prompt. Only the newest output is `live`.
 */
export function Triage({ live, onRun }: { live: boolean; onRun?: RunCommand }) {
  const ref = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [order] = useState(() => shuffle(packages));
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [phase, setPhase] = useState<Phase>("asking");
  const [elapsed, setElapsed] = useState(0);
  // Clues asked for early with space, on top of those the clock has shown.
  const [asked, setAsked] = useState(1);
  const focused = useFocusWithin(ref);
  // It loads after the terminal scrolled to the command, and grows as it goes.
  useFollow(ref, live);

  const ended = phase === "over" || phase === "quit" || !live;
  // Running another command leaves a run unfinished: it shows as quit.
  const quit = phase === "quit" || (!live && phase !== "over");
  const current = order[answers.length - (phase === "feedback" ? 1 : 0)];
  const total = secondsFor(answers.length) * 1000;
  const clues = Math.max(asked, cluesAt(elapsed, total));
  const { points, mistakes } = tally(answers);
  const last = answers.at(-1);

  // The keyboard follows the run: to "next" after an answer, back to the game
  // for the next package.
  useEffect(() => {
    if (!live) return;
    if (phase === "feedback") nextRef.current?.focus({ preventScroll: true });
    if (phase === "asking") ref.current?.focus({ preventScroll: true });
  }, [phase, live]);

  // The clock runs only while the visitor is here to play.
  const ticking = live && phase === "asking" && focused;
  useEffect(() => {
    if (!ticking) return;
    // Measured, not counted: browsers delay timers. Capped, so a tab left in
    // the background barely moves the clock.
    const from = performance.now();
    const timer = window.setTimeout(() => {
      const now = elapsed + Math.min(250, performance.now() - from);
      if (now >= total) answer(null);
      else setElapsed(now);
    }, tickMs);
    return () => window.clearTimeout(timer);
  });

  function answer(given: Verdict | null) {
    if (phase !== "asking" || ended) return;
    setAnswers([...answers, { id: current.id, given, clues }]);
    setPhase("feedback");
  }

  function next() {
    if (isOver(answers)) {
      setPhase("over");
      say(triageVerdict(points));
      // With a score, the high-score form takes the keyboard instead.
      if (points === 0) focusPrompt(ref.current);
      return;
    }
    setElapsed(0);
    setAsked(1);
    setPhase("asking");
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (ended) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setPhase("quit");
      focusPrompt(ref.current, { always: true });
      return;
    }
    // Space and Enter on a focused button press that button.
    const onButton = event.target instanceof HTMLButtonElement;
    if (onButton && (event.key === " " || event.key === "Enter")) return;
    const key = event.key.toLowerCase();
    if (phase === "asking") {
      if (key === " ") {
        event.preventDefault();
        setAsked(Math.min(3, clues + 1));
        return;
      }
      const choice = verdicts.find((v) => v.key === key);
      if (choice) answer(choice.verdict);
    }
    if (phase === "feedback" && key === "n") {
      // Otherwise the n lands in the initials box that may take focus next.
      event.preventDefault();
      next();
    }
  }

  const left = Math.ceil((total - elapsed) / 1000);
  const filled = Math.ceil(((total - elapsed) / total) * barCells);

  return (
    <div
      ref={ref}
      data-game="triage"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      role="group"
      aria-label="Triage"
      className="-m-2 max-w-[72ch] scroll-m-4 space-y-3 rounded-sm p-2"
    >
      <div className="text-muted">
        <p>
          Every package here is made up. Is it risky, safe, or does it need an
          upgrade to its fixed version?
        </p>
        <p>
          Clues appear as the clock runs: answer sooner for more points. Three
          mistakes end the run. Esc quits.
        </p>
      </div>

      <p className="flex flex-wrap gap-x-6">
        <span>
          lives{" "}
          <span aria-hidden="true" className="text-fg-strong">
            {"♥".repeat(Math.max(0, lives - mistakes))}
            {"♡".repeat(Math.min(lives, mistakes))}
          </span>
          <span className="sr-only">{Math.max(0, lives - mistakes)} left</span>
        </span>
        <span>
          score <span className="text-number">{points}</span>
        </span>
        <span className="text-muted">
          package {answers.length + (phase === "asking" ? 1 : 0)}
        </span>
      </p>

      {!quit && (phase === "asking" || phase === "feedback") && current && (
        <div>
          <p className="flex flex-wrap items-baseline gap-x-4">
            <span data-package className="text-fg-strong">
              {current.name}
            </span>
            {phase === "asking" && (
              // The countdown is visual; announcing every tick would drown out
              // the clues.
              <span aria-hidden="true" data-timer className="text-muted">
                <span className="text-accent">{"█".repeat(filled)}</span>
                {"░".repeat(barCells - filled)}{" "}
                <span className="text-number">{left}s</span>
              </span>
            )}
          </p>
          <ul className="mt-1">
            {current.clues.map((clue, i) =>
              i < (phase === "feedback" ? 3 : clues) ? (
                <li
                  key={clue}
                  className={`before:text-muted before:content-['-_'] ${
                    phase === "feedback" && i >= (last?.clues ?? 3)
                      ? "text-muted"
                      : ""
                  }`}
                >
                  {clue}
                </li>
              ) : (
                <li key={clue} aria-hidden="true" className="text-muted">
                  - ???
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      {phase === "asking" && live && (
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          {verdicts.map(({ verdict, key }) => (
            <button
              key={verdict}
              type="button"
              onClick={() => answer(verdict)}
              className={action}
            >
              <kbd className={keyLabel}>{key}</kbd>
              {verdict}
            </button>
          ))}
          {clues < 3 && (
            <button
              type="button"
              onClick={() => setAsked(Math.min(3, clues + 1))}
              className={`${action} text-muted`}
            >
              <kbd className={keyLabel}>space</kbd>
              next clue (+{pointsFor(clues + 1)} if right)
            </button>
          )}
        </p>
      )}

      {!quit && phase === "feedback" && last && (
        <div data-feedback className="space-y-1">
          <p>
            <span
              className={isRight(last) ? "text-prompt-user" : "text-fg-strong"}
            >
              {isRight(last)
                ? `Right: ${packageFor(last.id)?.answer}. +${pointsFor(last.clues)}`
                : last.given
                  ? `Not quite: it's ${packageFor(last.id)?.answer}. A life lost.`
                  : `Time's up: it's ${packageFor(last.id)?.answer}. A life lost.`}
            </span>{" "}
            {packageFor(last.id)?.why}
          </p>
          {packageFor(last.id)?.incident && (
            <p className="text-muted">
              This really happened: {packageFor(last.id)?.incident}
            </p>
          )}
          <button
            ref={nextRef}
            type="button"
            onClick={next}
            className={`${action} mt-1`}
          >
            <kbd className={keyLabel}>n</kbd>
            {isOver(answers) ? "see your score" : "next"}
          </button>
        </div>
      )}

      {(phase === "over" || quit) && (
        <p data-score>
          {quit ? "Quit. " : "Game over. "}Score{" "}
          <span className="text-number">{points}</span> from{" "}
          <span className="text-number">{answers.length}</span>{" "}
          {answers.length === 1 ? "package" : "packages"}.
        </p>
      )}

      {phase === "over" && (
        <HighScores
          game="triage"
          score={points}
          answers={answers}
          live={live}
        />
      )}

      {phase === "over" && live && onRun && (
        <p className="text-muted flex gap-4">
          <CommandButton command="triage" label="play again" onRun={onRun} />
          <CommandButton command="games" onRun={onRun} />
        </p>
      )}
    </div>
  );
}
