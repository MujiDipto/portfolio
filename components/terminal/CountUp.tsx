"use client";

import { useEffect, useRef, useState } from "react";

export const countMs = 600;

/** "15,000" → 15000 with its formatting; "77%" and "960+" keep their suffix. */
function parse(value: string) {
  const [, digits = "", suffix = ""] = /^([\d,]+)(.*)$/.exec(value) ?? [];
  return {
    target: Number(digits.replaceAll(",", "")),
    grouped: digits.includes(","),
    suffix,
  };
}

function format(value: string, progress: number): string {
  const { target, grouped, suffix } = parse(value);
  const n = Math.round(target * (1 - (1 - progress) ** 3));
  return (grouped ? n.toLocaleString("en-AU") : String(n)) + suffix;
}

/**
 * A number that counts up from zero when its opening line appears. It counts
 * only if it was still waiting when it mounted, so the server render, later
 * `cat highlights.md` runs and reduced motion all show the final value. Any
 * key or click finishes it, like the rest of the opening. Screen readers get
 * the final value throughout.
 */
export function CountUp({
  value,
  waiting,
}: {
  value: string;
  waiting: boolean;
}) {
  // null shows the final value.
  const [progress, setProgress] = useState<number | null>(null);
  const armed = useRef<boolean | null>(null);
  if (armed.current === null) armed.current = waiting;

  useEffect(() => {
    if (!armed.current) return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) {
      armed.current = false;
      return;
    }
    let frame: number;
    if (waiting) {
      // Hidden until its line appears, so it can drop to zero unseen.
      frame = requestAnimationFrame(() => setProgress(0));
    } else {
      let start: number | undefined;
      const tick = (now: number) => {
        start ??= now;
        const p = Math.min(1, (now - start) / countMs);
        setProgress(p < 1 ? p : null);
        if (p < 1) frame = requestAnimationFrame(tick);
        else armed.current = false;
      };
      frame = requestAnimationFrame(tick);
    }
    const finish = () => {
      armed.current = false;
      cancelAnimationFrame(frame);
      setProgress(null);
    };
    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
  }, [waiting]);

  if (progress === null) return value;
  return (
    <>
      <span aria-hidden="true">{format(value, progress)}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}
