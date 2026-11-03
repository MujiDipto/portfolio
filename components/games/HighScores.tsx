"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { focusPrompt } from "@/components/games/shared";
import { cleanInitials, shown, type HighScore } from "@/lib/scores";
import type { Game } from "@/lib/terminal";
import type { Answer } from "@/lib/triage";

type Board = HighScore[] | "loading" | "offline";

/**
 * The top scores for a game, and a form to save this one with three initials.
 * The form only shows in the newest output, for a score worth saving; the
 * server checks it again (lib/scores.ts).
 */
export function HighScores({
  game,
  score,
  answers,
  live,
}: {
  game: Game;
  score: number;
  /** Triage sends its answers, so the server can recompute the score. */
  answers?: Answer[];
  live: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [board, setBoard] = useState<Board>("loading");
  const [initials, setInitials] = useState("");
  const [placed, setPlaced] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let current = true;
    fetch(`/api/scores?game=${game}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { scores?: HighScore[] } | null) => {
        if (current) setBoard(data?.scores ?? "offline");
      })
      .catch(() => current && setBoard("offline"));
    return () => {
      current = false;
    };
  }, [game]);

  const canSave = live && score > 0 && board !== "offline" && state !== "saved";

  useEffect(() => {
    // The natural next step on a keyboard; not on phones, where it would
    // open the keyboard uninvited.
    if (live && score > 0 && window.matchMedia?.("(pointer: fine)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [live, score]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!initials) return;
    if (!cleanInitials(initials)) {
      setProblem("Three letters, A to Z.");
      return;
    }
    setState("saving");
    setProblem("");
    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, initials, score, answers }),
      });
      const data = (await response.json()) as {
        scores?: HighScore[];
        placed?: number | null;
        error?: string;
      };
      if (!response.ok || !data.scores) {
        setState("idle");
        setProblem(
          response.status === 400
            ? "That score can't be saved."
            : (data.error ?? "Couldn't save. Try again later."),
        );
        return;
      }
      setBoard(data.scores);
      setPlaced(data.placed ?? null);
      setState("saved");
      focusPrompt(inputRef.current, { always: true });
    } catch {
      setState("idle");
      setProblem("Couldn't save. Try again later.");
    }
  }

  return (
    <div data-high-scores className="space-y-2">
      {canSave && (
        <form onSubmit={save} className="flex flex-wrap items-baseline gap-3">
          <label htmlFor={id}>Save your score? Initials:</label>
          <input
            ref={inputRef}
            id={id}
            value={initials}
            onChange={(event) =>
              setInitials(event.target.value.replace(/[^a-z]/gi, ""))
            }
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                focusPrompt(inputRef.current, { always: true });
              }
            }}
            maxLength={3}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            aria-describedby={`${id}-hint`}
            // 16px stops iOS zooming into the field.
            className="border-border text-fg-strong caret-accent w-[5ch] border-b bg-transparent text-[16px] uppercase"
          />
          <button
            type="submit"
            disabled={state === "saving"}
            className="text-accent inline-flex min-h-6 cursor-pointer items-center underline-offset-4 hover:underline disabled:cursor-wait"
          >
            {state === "saving" ? "saving…" : "save"}
          </button>
          <span id={`${id}-hint`} className="text-muted text-sm">
            three letters, Esc to skip
          </span>
        </form>
      )}
      {problem && <p className="text-fg-strong">{problem}</p>}
      {state === "saved" && placed === null && (
        <p className="text-muted">
          Saved, but not in the top {shown} this time.
        </p>
      )}

      {board === "offline" ? (
        <p className="text-muted">High scores are offline right now.</p>
      ) : board === "loading" ? (
        <p className="text-muted">loading high scores…</p>
      ) : board.length === 0 ? (
        <p className="text-muted">No high scores yet. Be the first.</p>
      ) : (
        <div>
          <h3 className="text-muted">high scores</h3>
          <ol className="mt-1">
            {board.map((entry, i) => (
              <li
                key={i}
                className={`grid grid-cols-[3ch_4ch_5ch_auto] gap-x-2 ${
                  i === placed ? "text-accent" : ""
                }`}
              >
                <span className="text-muted">{i + 1}.</span>
                <span>{entry.initials}</span>
                <span className="text-number text-right">{entry.score}</span>
                {i === placed && <span>← you</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
