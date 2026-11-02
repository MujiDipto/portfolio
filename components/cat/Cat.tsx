"use client";

import { useEffect, useRef, useState } from "react";
import { CatImage } from "@/components/cat/CatImage";
import { CommandButton, type RunCommand } from "@/components/terminal/Outputs";
import { bootDurationMs } from "@/components/terminal/useBoot";
import { highlightLines } from "@/lib/content";
import {
  greeting,
  isEgg,
  isMistake,
  jumps,
  reply,
  tips,
  zoomies,
  type Line,
} from "@/lib/sudo";
import { commandForHash } from "@/lib/terminal";

/** Dispatched on window each time the terminal runs a command; detail is the command. */
export const commandEvent = "terminal:command";

/** Dispatched on window while the visitor types, so the bubble steps aside. */
export const typingEvent = "terminal:typing";

// public/sudo.webp is drawn at twice this size, so it stays sharp on
// high-density screens.
export const catSize = { width: 49, height: 52 };
const restAt = 0.15; // its spot, as a share of the top edge; leaves room for the bubble on its right
const cornerInset = 16; // pixels; keeps it clear of the window's rounded corners
const bubbleGap = 10; // pixels between the cat and its bubble
export const riseMs = 700;
export const startleMs = 600;
export const cheerMs = 900;
// Five clicks within 1.5 seconds set off the zoomies, at most once every 4.
export const zoomClicks = 5;
const zoomWindowMs = 1500;
export const zoomMs = 1100;
const zoomCooldownMs = 4000;
const fallbackWidth = 900; // when it cannot measure (tests)

/** Where the cat is: behind the window (down), on its way, or up on top. */
export type CatState = "down" | "rising" | "up";

const transitions: Partial<Record<CatState, string>> = {
  // Like a lift: steady, then slowing to a stop at the top.
  rising: `transform ${riseMs}ms cubic-bezier(0.25, 0.6, 0.35, 1)`,
};

/**
 * The mascot, Sudo, a guide to the terminal. It waits behind the window and
 * rises above its top edge like a lift, arriving as the opening finishes,
 * then says hi. It rises only once; after that it stays put, and after each
 * command it bobs and suggests a next step (lib/sudo.ts). An unknown command
 * makes it shake; `sudo hire muji` makes it jump for joy. Typing closes the
 * bubble; clicking (petting) the cat floats hearts and shows a tip. The window is
 * drawn over the cat's layer (components/TerminalWindow.tsx), so it hides
 * whatever is below the edge. Hovering makes it shake. Its settling bob and
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
  const [cheering, setCheering] = useState(false);
  // Counts lines said, so each new line replays the bob (see the cat-body key).
  const [said, setSaid] = useState(0);
  const [line, setLine] = useState<Line | null>(null);
  const tipIndex = useRef(0);
  // Counts pets, so each click floats a fresh set of hearts.
  const [petted, setPetted] = useState(0);
  const [zooming, setZooming] = useState(false);
  const clicks = useRef<number[]>([]);
  const zoomCooling = useRef(false);
  const zoomTimers = useRef<number[]>([]);

  // Mirrors of state for the window listeners.
  const stateRef = useRef<CatState>("down");
  const entering = useRef(true);

  useEffect(() => {
    // The zoomies' timers, cleared with the rest when the cat unmounts.
    const zoomTimerList = zoomTimers.current;
    const go = (next: CatState) => {
      stateRef.current = next;
      setState(next);
    };
    const say = (next: Line) => {
      setLine(next);
      setSaid((n) => n + 1);
    };
    const arrive = () => {
      go("up");
      entering.current = false;
      say(greeting);
    };

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) =>
      timers.push(window.setTimeout(fn, ms));
    let placed = false;

    later(() => {
      const measured = rootRef.current?.clientWidth || fallbackWidth;
      setWidth(measured);
      const high = Math.max(
        cornerInset,
        measured - catSize.width - cornerInset,
      );
      setX(Math.round(cornerInset + (high - cornerInset) * restAt));
      placed = true;
      if (reduce || commandForHash(window.location.hash)) {
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
        Math.max(0, bootDurationMs(highlightLines.length) - riseMs),
      );
    }, 0);

    // Skipping the opening brings the cat straight up.
    const skip = () => {
      if (entering.current && placed) arrive();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);

    const react = (setMood: (on: boolean) => void, ms: number) => {
      setMood(true);
      later(() => setMood(false), ms);
    };
    const onCommand = (event: Event) => {
      if (entering.current) return;
      const command = (event as CustomEvent<string>).detail ?? "";
      if (isMistake(command)) react(setStartled, startleMs);
      if (jumps(command)) react(setCheering, cheerMs);
      // The easter egg gets hearts as well as a jump.
      if (isEgg(command)) setPetted((n) => n + 1);
      say(reply(command));
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
      zoomTimerList.forEach(window.clearTimeout);
    };
  }, []);

  function showTip(now: number) {
    if (stateRef.current !== "up") return;
    clicks.current = [...clicks.current, now].filter(
      (t) => now - t < zoomWindowMs,
    );
    if (clicks.current.length >= zoomClicks && !zoomCooling.current) {
      clicks.current = [];
      startZoomies();
      return;
    }
    setAngry(false);
    setPetted((n) => n + 1);
    setLine(tips[tipIndex.current % tips.length]);
    setSaid((n) => n + 1);
    tipIndex.current++;
  }

  /** A dash along the top edge and back, then a spin (globals.css). */
  function startZoomies() {
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const later = (fn: () => void, ms: number) =>
      zoomTimers.current.push(window.setTimeout(fn, ms));
    zoomCooling.current = true;
    setAngry(false);
    setLine(null);
    setPetted((n) => n + 1);
    if (!reduce) setZooming(true);
    later(
      () => {
        setZooming(false);
        setLine(zoomies);
        setSaid((n) => n + 1);
      },
      reduce ? 0 : zoomMs,
    );
    later(() => (zoomCooling.current = false), zoomCooldownMs);
  }

  const hidden = state === "down";
  const bubbleLeft = (x ?? 0) + catSize.width + bubbleGap;

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      <div
        aria-hidden="true"
        data-cat
        data-x={x === null ? "" : Math.round(x)}
        data-state={state}
        data-mood={cheering ? "happy" : angry || startled ? "angry" : "calm"}
        data-zooming={zooming ? "" : undefined}
        onMouseEnter={() => setAngry(true)}
        onMouseLeave={() => setAngry(false)}
        onClick={(event) => showTip(event.timeStamp)}
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
                // How far the zoomies dash: to the right end of the top edge.
                ["--zoom-x" as string]: `${Math.max(0, width - x - catSize.width - cornerInset)}px`,
              }
        }
      >
        <div key={`body-${said}`} className="cat-body">
          {/* The art faces left; mirrored, it faces its bubble on its right. */}
          <div className="relative" style={{ transform: "scaleX(-1)" }}>
            <CatImage {...catSize} />
            {startled && !cheering && <AngerMark />}
          </div>
        </div>
        {/* Prefixed keys: the two counters often match, and siblings need
            different keys. */}
        {petted > 0 && <Hearts key={`hearts-${petted}`} />}
      </div>

      {line && x !== null && state === "up" && (
        <div
          role="group"
          aria-label="Sudo says"
          className="cat-bubble pointer-events-auto absolute px-2 py-1"
          style={{
            bottom: "calc(100% + 8px)",
            left: bubbleLeft,
            maxWidth: width - bubbleLeft - cornerInset,
          }}
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

/** Pixel hearts that float up and fade when the cat is petted (clicked). */
function Hearts() {
  const heart = [".#.#.", "#####", ".###.", "..#.."];
  return (
    <span aria-hidden="true" data-hearts className="absolute inset-x-0 -top-2">
      {[-14, 0, 14].map((offset, i) => (
        <svg
          key={offset}
          viewBox="0 0 5 4"
          width={10}
          height={8}
          shapeRendering="crispEdges"
          className="cat-heart absolute left-1/2"
          style={{ marginLeft: offset - 5, animationDelay: `${i * 120}ms` }}
        >
          {heart.flatMap((row, y) =>
            [...row].map((pixel, x) =>
              pixel === "#" ? (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width={1}
                  height={1}
                  fill="var(--dot-close)"
                />
              ) : null,
            ),
          )}
        </svg>
      ))}
    </span>
  );
}

/** A pixel anger mark, drawn beside the helmet after an unknown command. */
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
