"use client";

import { useEffect, useRef, useState } from "react";
import { CatImage } from "@/components/cat/CatImage";
import { CommandButton, type RunCommand } from "@/components/terminal/Outputs";
import { bootDurationMs } from "@/components/terminal/useBoot";
import { profile } from "@/lib/content";

/** Dispatched on window each time the terminal runs a command. */
export const commandEvent = "terminal:command";

/** What the cat says in its bubble, around a button that runs `help`. */
export const catLine = ["Hi, I’m Sudo! Run", "to see what you can do."];

// public/sudo.webp is drawn at twice this size, so it stays sharp on
// high-density screens.
export const catSize = { width: 49, height: 52 };
const restAt = 0.7; // resting spot, as a share of the top edge
const cornerInset = 16; // pixels; keeps it clear of the window's rounded corners
const minMove = 150; // pixels; a shorter hop looks like a twitch
const maxMove = 600; // pixels
export const riseMs = 700;
export const sinkMs = 300;
const fallbackWidth = 900; // when it cannot measure (tests)

/** Where the cat is: behind the window (down), on its way, or up on top. */
export type CatState = "down" | "rising" | "up" | "sinking";

const transitions: Partial<Record<CatState, string>> = {
  // Like a lift: steady, then slowing to a stop at the top.
  rising: `transform ${riseMs}ms cubic-bezier(0.25, 0.6, 0.35, 1)`,
  sinking: `transform ${sinkMs}ms ease-in`,
};

/**
 * The mascot, Sudo. It waits behind the terminal window and rises above its
 * top edge like a lift, arriving as the opening finishes, then says hi in a
 * bubble that points to `help`. After each command it sinks back down and rises
 * somewhere else along the top. The window is drawn over the cat's layer
 * (components/TerminalWindow.tsx), so it hides whatever is below the edge.
 * Hovering makes it angry. Its settling bob and hover shake are CSS
 * (app/globals.css). With reduced motion it never moves. The picture is
 * decorative; the bubble's buttons are real.
 */
export function Cat({ onRun }: { onRun: RunCommand }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState<number | null>(null);
  const [state, setState] = useState<CatState>("down");
  const [angry, setAngry] = useState(false);
  const [bubble, setBubble] = useState(false);

  // Mirrors of state for the window listeners.
  const xRef = useRef(0);
  const stateRef = useRef<CatState>("down");
  const entering = useRef(true);
  const bubbleRef = useRef(false);

  useEffect(() => {
    const showBubble = (open: boolean) => {
      bubbleRef.current = open;
      setBubble(open);
    };
    const go = (next: CatState) => {
      stateRef.current = next;
      setState(next);
    };
    const moveTo = (to: number) => {
      xRef.current = to;
      setX(to);
    };
    const arrive = () => {
      go("up");
      if (entering.current) {
        entering.current = false;
        showBubble(true);
      }
    };

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) =>
      timers.push(window.setTimeout(fn, ms));
    let placed = false;
    let low = 0;
    let high = 0;

    later(() => {
      const width = rootRef.current?.clientWidth || fallbackWidth;
      low = cornerInset;
      high = Math.max(low, width - catSize.width - cornerInset);
      moveTo(Math.round(low + (high - low) * restAt));
      placed = true;
      if (reduce) {
        arrive();
        return;
      }
      // Rise so it reaches the top as the opening ends.
      later(
        () => {
          if (!entering.current) return;
          go("rising");
          later(arrive, riseMs);
        },
        Math.max(0, bootDurationMs(profile.summary.length) - riseMs),
      );
    }, 0);

    // Skipping the opening brings the cat straight up.
    const skip = () => {
      if (entering.current && placed) arrive();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);

    // After the opening, each command sends it down and up somewhere else.
    const onCommand = () => {
      if (reduce || entering.current || stateRef.current !== "up") return;
      if (bubbleRef.current) showBubble(false);
      const from = xRef.current;
      const lo = Math.max(low, from - maxMove);
      const hi = Math.min(high, from + maxMove);
      let target = from;
      for (let i = 0; i < 20 && Math.abs(target - from) < minMove; i++) {
        target = Math.round(lo + Math.random() * (hi - lo));
      }
      go("sinking");
      later(() => {
        moveTo(target);
        go("rising");
        later(arrive, riseMs);
      }, sinkMs);
    };
    window.addEventListener(commandEvent, onCommand);

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener(commandEvent, onCommand);
    };
  }, []);

  const hidden = state === "down" || state === "sinking";

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      <div
        aria-hidden="true"
        data-cat
        data-x={x === null ? "" : Math.round(x)}
        data-state={state}
        data-mood={angry ? "angry" : "calm"}
        onMouseEnter={() => setAngry(true)}
        onMouseLeave={() => setAngry(false)}
        className="pointer-events-auto absolute"
        style={
          x === null
            ? { visibility: "hidden" }
            : {
                left: x,
                top: -catSize.height,
                width: catSize.width,
                height: catSize.height,
                transform: hidden
                  ? `translateY(${catSize.height + 4}px)`
                  : undefined,
                transition: transitions[state],
              }
        }
      >
        <div className="cat-body">
          {/* Mirrored so it faces its bubble, on its left. */}
          <div className="relative" style={{ transform: "scaleX(-1)" }}>
            <CatImage {...catSize} />
            {angry && <AngerMark />}
          </div>
        </div>
      </div>

      {bubble && x !== null && (
        <div
          role="group"
          aria-label="Sudo says"
          className="cat-bubble pointer-events-auto absolute px-2 py-1"
          style={{
            bottom: "calc(100% + 8px)",
            right: `calc(100% - ${x - 10}px)`,
            maxWidth: Math.max(180, x - 24),
          }}
        >
          <p className="text-fg-strong text-xs">
            {catLine[0]} <CommandButton command="help" onRun={onRun} />{" "}
            {catLine[1]}
          </p>
          <span aria-hidden="true" className="cat-bubble-tail" />
        </div>
      )}
    </div>
  );
}

/** A pixel anger mark, drawn beside the helmet (away from the red plume) while hovered. */
function AngerMark() {
  const pixels = [
    [1, 0],
    [5, 0],
    [0, 1],
    [1, 1],
    [5, 1],
    [6, 1],
    [0, 5],
    [1, 5],
    [5, 5],
    [6, 5],
    [1, 6],
    [5, 6],
  ];
  return (
    <svg
      viewBox="0 0 7 7"
      width={14}
      height={14}
      shapeRendering="crispEdges"
      className="absolute -top-1 -left-3"
      aria-hidden="true"
      focusable="false"
    >
      {pixels.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill="var(--dot-close)"
        />
      ))}
    </svg>
  );
}
