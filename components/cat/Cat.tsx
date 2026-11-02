"use client";

import { useEffect, useRef, useState } from "react";
import { CatImage } from "@/components/cat/CatImage";
import { CommandButton, type RunCommand } from "@/components/terminal/Outputs";
import { bootDurationMs } from "@/components/terminal/useBoot";
import { aboutLines } from "@/lib/content";
import { greeting, isMistake, reply, tips, type Line } from "@/lib/sudo";

/** Dispatched on window each time the terminal runs a command; detail is the command. */
export const commandEvent = "terminal:command";

/** Dispatched on window while the visitor types, so the bubble steps aside. */
export const typingEvent = "terminal:typing";

// public/sudo.webp is drawn at twice this size, so it stays sharp on
// high-density screens.
export const catSize = { width: 49, height: 52 };
const restAt = 0.15; // resting spot, as a share of the top edge; leaves room for the bubble on its right
const cornerInset = 16; // pixels; keeps it clear of the window's rounded corners
const minMove = 150; // pixels; a shorter hop looks like a twitch
const maxMove = 600; // pixels
const bubbleGap = 10; // pixels between the cat and its bubble
const minBubble = 260; // pixels; below this the bubble goes on the cat's left
export const riseMs = 700;
export const sinkMs = 300;
export const startleMs = 600;
const fallbackWidth = 900; // when it cannot measure (tests)

/** Where the cat is: behind the window (down), on its way, or up on top. */
export type CatState = "down" | "rising" | "up" | "sinking";

const transitions: Partial<Record<CatState, string>> = {
  // Like a lift: steady, then slowing to a stop at the top.
  rising: `transform ${riseMs}ms cubic-bezier(0.25, 0.6, 0.35, 1)`,
  sinking: `transform ${sinkMs}ms ease-in`,
};

/**
 * The mascot, Sudo, a guide to the terminal. It waits behind the window and
 * rises above its top edge like a lift, arriving as the opening finishes,
 * then says hi. After each command it sinks and rises somewhere else with a
 * next step to try (lib/sudo.ts); an unknown command makes it shake where it
 * stands. Typing closes the bubble; clicking the cat shows a tip. The window is
 * drawn over the cat's layer (components/TerminalWindow.tsx), so it hides
 * whatever is below the edge. Hovering makes it angry. Its settling bob and
 * shake are CSS (app/globals.css). With reduced motion it talks but never
 * moves. The picture is decorative; the bubble's buttons are real.
 */
export function Cat({ onRun }: { onRun: RunCommand }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState<number | null>(null);
  const [width, setWidth] = useState(fallbackWidth);
  const [state, setState] = useState<CatState>("down");
  const [angry, setAngry] = useState(false);
  const [startled, setStartled] = useState(false);
  const [line, setLine] = useState<Line | null>(null);
  const tipIndex = useRef(0);

  // Mirrors of state for the window listeners.
  const xRef = useRef(0);
  const stateRef = useRef<CatState>("down");
  const entering = useRef(true);
  // What to say on reaching the top.
  const nextLine = useRef<Line>(greeting);

  useEffect(() => {
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
      entering.current = false;
      setLine(nextLine.current);
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
      const measured = rootRef.current?.clientWidth || fallbackWidth;
      setWidth(measured);
      low = cornerInset;
      high = Math.max(low, measured - catSize.width - cornerInset);
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
        Math.max(0, bootDurationMs(aboutLines.length) - riseMs),
      );
    }, 0);

    // Skipping the opening brings the cat straight up.
    const skip = () => {
      if (entering.current && placed) arrive();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);

    const onCommand = (event: Event) => {
      if (entering.current) return;
      const command = (event as CustomEvent<string>).detail ?? "";
      const say = reply(command);
      // A mistake: it shakes where it stands and points to help.
      if (isMistake(command) || reduce) {
        if (isMistake(command)) {
          setStartled(true);
          later(() => setStartled(false), startleMs);
        }
        nextLine.current = say;
        if (stateRef.current === "up") setLine(say);
        return;
      }
      nextLine.current = say;
      // Mid-move it simply says the newest line when it arrives.
      if (stateRef.current !== "up") return;
      setLine(null);
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
    const onTyping = () => setLine(null);
    window.addEventListener(commandEvent, onCommand);
    window.addEventListener(typingEvent, onTyping);

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener(commandEvent, onCommand);
      window.removeEventListener(typingEvent, onTyping);
    };
  }, []);

  function showTip() {
    if (stateRef.current !== "up") return;
    setAngry(false);
    setLine(tips[tipIndex.current % tips.length]);
    tipIndex.current++;
  }

  const hidden = state === "down" || state === "sinking";
  // The bubble goes on the cat's right when there is room, and the cat turns
  // to face it.
  const roomRight =
    x === null ? 0 : width - (x + catSize.width + bubbleGap) - cornerInset;
  const side = roomRight >= minBubble ? "right" : "left";

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      <div
        aria-hidden="true"
        data-cat
        data-x={x === null ? "" : Math.round(x)}
        data-state={state}
        data-mood={angry || startled ? "angry" : "calm"}
        data-facing={side}
        onMouseEnter={() => setAngry(true)}
        onMouseLeave={() => setAngry(false)}
        onClick={showTip}
        className="pointer-events-auto absolute cursor-pointer"
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
          {/* The art faces left; mirrored, it faces right. Either way it
              faces its bubble. */}
          <div
            className="relative"
            style={side === "right" ? { transform: "scaleX(-1)" } : undefined}
          >
            <CatImage {...catSize} />
            {(angry || startled) && <AngerMark />}
          </div>
        </div>
      </div>

      {line && x !== null && state === "up" && (
        <div
          role="group"
          aria-label="Sudo says"
          data-side={side}
          className="cat-bubble pointer-events-auto absolute px-2 py-1"
          style={
            side === "right"
              ? {
                  bottom: "calc(100% + 8px)",
                  left: x + catSize.width + bubbleGap,
                  maxWidth: roomRight,
                }
              : {
                  bottom: "calc(100% + 8px)",
                  right: `calc(100% - ${x - bubbleGap}px)`,
                  maxWidth: Math.max(180, x - bubbleGap - cornerInset),
                }
          }
        >
          <p className="text-fg-strong text-xs">
            {line.text}
            {line.command && (
              <>
                {" "}
                <CommandButton command={line.command} onRun={onRun} />
              </>
            )}
            {line.after && ` ${line.after}`}
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
