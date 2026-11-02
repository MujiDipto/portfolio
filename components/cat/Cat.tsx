"use client";

import { useEffect, useRef, useState } from "react";
import { CatImage } from "@/components/cat/CatImage";
import { CommandButton, type RunCommand } from "@/components/terminal/Outputs";
import { bootDurationMs, bootStartMs } from "@/components/terminal/useBoot";
import { profile } from "@/lib/content";
import { suggestions } from "@/lib/terminal";

/** Dispatched on window each time the terminal runs a command. */
export const commandEvent = "terminal:command";

/** What the cat says in its bubble (draft, awaiting Muji's approval). */
export const catLine = "meow, i'm sudo, keeper of this terminal. try:";

// public/sudo.webp is drawn at twice this size, so it stays sharp on
// high-density screens.
export const catSize = { width: 49, height: 52 };
const restAt = 0.7; // resting spot, as a share of the top edge
const walkSpeed = 160; // pixels per second after a command
const minWalk = 150; // pixels; shorter walks look like twitches
const maxWalk = 600; // pixels; keeps each walk to about four seconds
const tickMs = 16;
const fallbackWidth = 900; // when it cannot measure (tests)

const entranceMs = bootDurationMs(profile.summary.length) - bootStartMs;

/**
 * The mascot, Sudo. It walks in along the top of the terminal window while
 * the opening types, arriving as it finishes, then offers commands in a
 * bubble. After that it sits until a command runs, then waddles somewhere
 * new along the top. Hovering makes it angry. Its waddle, idle bob and shake
 * are CSS (app/globals.css). With reduced motion it never moves. The picture
 * is decorative; the bubble's buttons are real.
 */
export function Cat({
  onRun,
  onBubbleChange,
}: {
  onRun: RunCommand;
  onBubbleChange: (open: boolean) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);
  const [rightward, setRightward] = useState(false);
  const [angry, setAngry] = useState(false);
  const [bubble, setBubble] = useState(false);

  // Mirrors of state for the walking loop and window listeners.
  const xRef = useRef(0);
  const endRef = useRef(0);
  const walk = useRef<{ target: number; speed: number } | null>(null);
  const entering = useRef(true);
  const bubbleRef = useRef(false);
  const onBubbleRef = useRef(onBubbleChange);
  useEffect(() => {
    onBubbleRef.current = onBubbleChange;
  }, [onBubbleChange]);

  useEffect(() => {
    const showBubble = (open: boolean) => {
      bubbleRef.current = open;
      setBubble(open);
      onBubbleRef.current(open);
    };
    const moveTo = (to: number) => {
      xRef.current = to;
      setX(to);
    };
    const arrive = () => {
      walk.current = null;
      setMoving(false);
      if (entering.current) {
        entering.current = false;
        showBubble(true);
      }
    };
    const startWalk = (target: number, speed: number) => {
      walk.current = { target, speed };
      setRightward(target > xRef.current);
      setMoving(true);
    };

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const timers: number[] = [];

    timers.push(
      window.setTimeout(() => {
        const width = rootRef.current?.clientWidth || fallbackWidth;
        const end = Math.max(0, width - catSize.width);
        endRef.current = end;
        const rest = Math.round(end * restAt);
        if (reduce) {
          moveTo(rest);
          entering.current = false;
          showBubble(true);
          return;
        }
        // Enter from the top-right corner, arriving as the opening ends.
        moveTo(end);
        timers.push(
          window.setTimeout(
            () => startWalk(rest, (end - rest) / (entranceMs / 1000)),
            bootStartMs,
          ),
        );
      }, 0),
    );

    const tick = window.setInterval(() => {
      const w = walk.current;
      if (!w) return;
      const delta = (w.speed * tickMs) / 1000;
      const remaining = w.target - xRef.current;
      const next =
        Math.abs(remaining) <= delta
          ? w.target
          : xRef.current + Math.sign(remaining) * delta;
      moveTo(next);
      if (next === w.target) arrive();
    }, tickMs);

    // Skipping the opening brings the cat straight to its spot.
    const skip = () => {
      if (!entering.current || !walk.current) return;
      moveTo(walk.current.target);
      arrive();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);

    // After the opening, each command sends it somewhere new along the top.
    const onCommand = () => {
      if (reduce || entering.current) return;
      if (bubbleRef.current) showBubble(false);
      const from = xRef.current;
      const low = Math.max(0, from - maxWalk);
      const high = Math.min(endRef.current, from + maxWalk);
      let target = from;
      for (let i = 0; i < 20 && Math.abs(target - from) < minWalk; i++) {
        target = Math.round(low + Math.random() * (high - low));
      }
      if (target !== from) startWalk(target, walkSpeed);
    };
    window.addEventListener(commandEvent, onCommand);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearInterval(tick);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener(commandEvent, onCommand);
    };
  }, []);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      <div
        aria-hidden="true"
        data-cat
        data-x={x === null ? "" : Math.round(x)}
        data-moving={moving ? "true" : "false"}
        data-mood={angry ? "angry" : "calm"}
        data-facing={rightward ? "right" : "left"}
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
              }
        }
      >
        <div className="cat-body">
          {/* The art faces right; it keeps facing the way it last walked. */}
          <div
            className="relative"
            style={rightward ? undefined : { transform: "scaleX(-1)" }}
          >
            <CatImage {...catSize} />
            {angry && <AngerMark />}
          </div>
        </div>
      </div>

      {bubble && x !== null && (
        <div
          role="group"
          aria-label="Suggested commands"
          className="cat-bubble pointer-events-auto absolute px-3 py-2"
          style={{
            bottom: "calc(100% + 8px)",
            right: `calc(100% - ${x - 14}px)`,
            maxWidth: Math.max(180, x - 24),
          }}
        >
          <p className="text-fg-strong text-xs">{catLine}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 text-sm">
            {suggestions.map((command) => (
              <CommandButton key={command} command={command} onRun={onRun} />
            ))}
          </div>
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
