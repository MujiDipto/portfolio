"use client";

import { useEffect, useState, type RefObject } from "react";
import { sayEvent } from "@/components/cat/Cat";
import type { Line } from "@/lib/sudo";

/** Gives Sudo a line to say. */
export function say(line: Line) {
  window.dispatchEvent(new CustomEvent(sayEvent, { detail: line }));
}

/**
 * Hands the keyboard back to the prompt when a game ends, if the game had it.
 * Not on touch screens, where focusing the prompt opens the keyboard, unless
 * a key (Esc) asked for it.
 */
export function focusPrompt(
  game: HTMLElement | null,
  { always = false }: { always?: boolean } = {},
) {
  const fine = window.matchMedia?.("(pointer: fine)").matches ?? true;
  if (!always && (!fine || !game?.contains(document.activeElement))) return;
  document.getElementById("command")?.focus({ preventScroll: true });
}

/** Whether focus is inside the element, so a game can pause when it leaves. */
export function useFocusWithin(ref: RefObject<HTMLElement | null>) {
  const [inside, setInside] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onIn = () => setInside(true);
    const onOut = (event: FocusEvent) => {
      if (!element.contains(event.relatedTarget as Node | null)) {
        setInside(false);
      }
    };
    element.addEventListener("focusin", onIn);
    element.addEventListener("focusout", onOut);
    return () => {
      element.removeEventListener("focusin", onIn);
      element.removeEventListener("focusout", onOut);
    };
  }, [ref]);
  return inside;
}

/**
 * Keeps the bottom of a live game in view as it grows (a clue, the answer,
 * the high scores), the way a terminal follows its newest line.
 */
export function useFollow(ref: RefObject<HTMLElement | null>, live: boolean) {
  useEffect(() => {
    const element = ref.current;
    if (!live || !element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() =>
      element.scrollIntoView?.({ block: "end" }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, live]);
}
