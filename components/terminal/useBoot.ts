"use client";

import { useEffect, useState } from "react";
import { commandForHash } from "@/lib/terminal";

export const bootCommand = "cat highlights.md";

// Timings in milliseconds; the whole opening takes under 2 seconds.
const startDelay = 250;
const perLetter = 55;
const pauseBeforeOutput = 150;
const perLine = 90;

/** When the opening finishes and the prompt appears. */
export function bootDurationMs(lineCount: number): number {
  return (
    startDelay +
    bootCommand.length * perLetter +
    pauseBeforeOutput +
    lineCount * perLine +
    pauseBeforeOutput
  );
}

export type Boot = {
  phase: "pending" | "typing" | "done";
  /** Letters of the command shown so far. */
  typed: number;
  /** Output lines shown so far. */
  lines: number;
};

const pending: Boot = { phase: "pending", typed: 0, lines: 0 };
const done: Boot = {
  phase: "done",
  typed: bootCommand.length,
  lines: Infinity,
};

/**
 * Types `cat highlights.md`, then reveals its output line by line. Any key press,
 * click or tap finishes at once; with reduced motion, or when the visitor
 * arrives by a deep link, it finishes immediately.
 */
export function useBoot(lineCount: number): Boot {
  const [boot, setBoot] = useState<Boot>(pending);

  useEffect(() => {
    const timers: number[] = [];
    const at = (ms: number, update: (b: Boot) => Boot) =>
      timers.push(
        window.setTimeout(
          () => setBoot((b) => (b.phase === "done" ? b : update(b))),
          ms,
        ),
      );
    const finish = () => setBoot(done);

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // A shared link (/#career) wants its content, not the intro.
    if (reduce || commandForHash(window.location.hash)) {
      at(0, () => done);
    } else {
      for (let i = 0; i <= bootCommand.length; i++) {
        at(startDelay + i * perLetter, (b) => ({
          ...b,
          phase: "typing",
          typed: i,
        }));
      }
      const outputStart =
        startDelay + bootCommand.length * perLetter + pauseBeforeOutput;
      for (let line = 1; line <= lineCount; line++) {
        at(outputStart + (line - 1) * perLine, (b) => ({ ...b, lines: line }));
      }
      at(bootDurationMs(lineCount), () => done);
    }

    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
  }, [lineCount]);

  return boot;
}
