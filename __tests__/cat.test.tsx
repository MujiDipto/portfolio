import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  Cat,
  commandEvent,
  cheerMs,
  riseMs,
  startleMs,
  typingEvent,
  zoomClicks,
  zoomMs,
} from "@/components/cat/Cat";
import { bootDurationMs } from "@/components/terminal/useBoot";
import { highlightLines } from "@/lib/content";
import { greeting, reply, tips, zoomies } from "@/lib/sudo";

function mockMotion(reduce: boolean) {
  window.matchMedia = (query: string) =>
    ({ matches: reduce && query.includes("reduce") }) as MediaQueryList;
}

const cat = () => document.querySelector("[data-cat]") as HTMLElement;
const bubble = () => screen.queryByRole("group", { name: "Sudo says" });
const bootEnd = bootDurationMs(highlightLines.length);
const said = (line: { text: string; command?: string; after?: string }) =>
  [line.text, line.command, line.after].filter(Boolean).join(" ");

function runCommand(command: string) {
  act(() => {
    window.dispatchEvent(new CustomEvent(commandEvent, { detail: command }));
  });
}

function arrived() {
  mockMotion(false);
  const onRun = vi.fn();
  render(<Cat onRun={onRun} />);
  act(() => vi.advanceTimersByTime(bootEnd + 100));
  return onRun;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Cat", () => {
  test("waits behind the window, then rises to arrive as the opening finishes", () => {
    mockMotion(false);
    render(<Cat onRun={() => {}} />);
    act(() => vi.advanceTimersByTime(bootEnd - riseMs - 50));
    expect(cat().dataset.state).toBe("down");
    act(() => vi.advanceTimersByTime(100));
    expect(cat().dataset.state).toBe("rising");
    expect(bubble()).toBeNull();
    act(() => vi.advanceTimersByTime(riseMs));
    expect(cat().dataset.state).toBe("up");
    expect(bubble()!.textContent).toBe(said(greeting));
  });

  test("the greeting's help button runs help", () => {
    const onRun = arrived();
    fireEvent.click(within(bubble()!).getByRole("button", { name: "help" }));
    expect(onRun).toHaveBeenCalledWith("help");
  });

  test("the bubble sits on the cat's right, the way it faces", () => {
    arrived();
    const catBox = cat().style;
    expect(parseFloat(bubble()!.style.left)).toBeGreaterThan(
      parseFloat(catBox.left) + parseFloat(catBox.width),
    );
  });

  test("after a command it stays put, bobs and suggests a next step", () => {
    arrived();
    const before = cat().dataset.x;
    const body = cat().querySelector(".cat-body");
    runCommand("whoami");
    expect(cat().dataset.state).toBe("up");
    expect(cat().dataset.x).toBe(before);
    expect(bubble()!.textContent).toBe(said(reply("whoami")));
    // A fresh body element replays the bob for the new line.
    expect(cat().querySelector(".cat-body")).not.toBe(body);
    act(() => vi.advanceTimersByTime(60000));
    expect(cat().dataset.x).toBe(before);
  });

  test("the easter egg makes it jump for joy", () => {
    arrived();
    runCommand("sudo hire muji");
    expect(cat().dataset.mood).toBe("happy");
    expect(bubble()!.textContent).toBe(said(reply("sudo hire muji")));
    act(() => vi.advanceTimersByTime(cheerMs));
    expect(cat().dataset.mood).toBe("calm");
  });

  test("an unknown command makes it shake and point to help", () => {
    arrived();
    const before = cat().dataset.x;
    runCommand("xyz");
    expect(cat().dataset.state).toBe("up");
    expect(cat().dataset.x).toBe(before);
    expect(cat().dataset.mood).toBe("angry");
    expect(cat().querySelector("svg")).not.toBeNull(); // the anger mark
    expect(bubble()!.textContent).toBe(said(reply("xyz")));
    act(() => vi.advanceTimersByTime(startleMs));
    expect(cat().dataset.mood).toBe("calm");
  });

  test("typing closes the bubble, so it never competes with the hints", () => {
    arrived();
    act(() => {
      window.dispatchEvent(new Event(typingEvent));
    });
    expect(bubble()).toBeNull();
  });

  test("rm makes it jump in front of the window", () => {
    arrived();
    runCommand("rm -rf /");
    expect(cat().dataset.mood).toBe("happy");
    expect(bubble()!.textContent).toBe(said(reply("rm -rf /")));
  });

  test("clicking the cat calms it and shows the tips in turn", () => {
    arrived();
    fireEvent.mouseEnter(cat());
    expect(cat().querySelector("[data-hearts]")).toBeNull();
    fireEvent.click(cat());
    expect(cat().querySelector("[data-hearts]")).not.toBeNull();
    expect(cat().dataset.mood).toBe("calm");
    expect(bubble()!.textContent).toBe(said(tips[0]));
    fireEvent.click(cat());
    expect(bubble()!.textContent).toBe(said(tips[1]));
  });

  test("a key press during the opening brings it straight up", () => {
    mockMotion(false);
    render(<Cat onRun={() => {}} />);
    act(() => vi.advanceTimersByTime(400));
    fireEvent.keyDown(window, { key: "a" });
    expect(cat().dataset.state).toBe("up");
    expect(bubble()).not.toBeNull();
  });

  test("hovering makes it shake, without the anger mark", () => {
    arrived();
    fireEvent.mouseEnter(cat());
    expect(cat().dataset.mood).toBe("angry");
    expect(cat().querySelector("svg")).toBeNull();
    fireEvent.mouseLeave(cat());
    expect(cat().dataset.mood).toBe("calm");
  });

  test("with reduced motion it is simply there and still talks", () => {
    mockMotion(true);
    render(<Cat onRun={() => {}} />);
    act(() => vi.advanceTimersByTime(0));
    expect(cat().dataset.state).toBe("up");
    const still = cat().dataset.x;
    runCommand("git log");
    act(() => vi.advanceTimersByTime(10000));
    expect(cat().dataset.x).toBe(still);
    expect(cat().dataset.state).toBe("up");
    expect(bubble()!.textContent).toBe(said(reply("git log")));
  });

  test("the picture is hidden from screen readers and there is no pause button", () => {
    mockMotion(false);
    render(<Cat onRun={() => {}} />);
    expect(cat().getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("button", { name: /pause/ })).toBeNull();
  });
});

describe("zoomies", () => {
  /** Clicks the cat `times` times, `gapMs` apart. */
  function clickCat(times: number, gapMs = 100) {
    for (let i = 0; i < times; i++) {
      fireEvent.click(cat());
      act(() => vi.advanceTimersByTime(gapMs));
    }
  }

  test("five fast clicks set off a dash, then Sudo calms down", () => {
    arrived();
    clickCat(zoomClicks - 1);
    expect(cat().dataset.zooming).toBeUndefined();
    expect(bubble()!.textContent).toBe(said(tips[zoomClicks - 2]));
    clickCat(1, 0);
    expect(cat().dataset.zooming).toBe("");
    // No bubble while it dashes, so the two never collide.
    expect(bubble()).toBeNull();
    act(() => vi.advanceTimersByTime(zoomMs));
    expect(cat().dataset.zooming).toBeUndefined();
    expect(bubble()!.textContent).toBe(said(zoomies));
  });

  test("slow clicks just show tips", () => {
    arrived();
    clickCat(zoomClicks + 2, 600);
    expect(cat().dataset.zooming).toBeUndefined();
  });

  test("it rests for a few seconds before it can go again", () => {
    arrived();
    clickCat(zoomClicks, 50);
    act(() => vi.advanceTimersByTime(zoomMs));
    clickCat(zoomClicks, 50);
    expect(cat().dataset.zooming).toBeUndefined();
  });

  test("with reduced motion it says the line without moving", () => {
    mockMotion(true);
    render(<Cat onRun={() => {}} />);
    act(() => vi.advanceTimersByTime(100));
    clickCat(zoomClicks, 50);
    expect(cat().dataset.zooming).toBeUndefined();
    expect(bubble()!.textContent).toBe(said(zoomies));
  });
});

test("rapid clicks never give React two siblings with the same key", () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  arrived();
  for (let i = 0; i < 12; i++) {
    fireEvent.click(cat());
    act(() => vi.advanceTimersByTime(100));
  }
  act(() => vi.advanceTimersByTime(5000));
  const keyErrors = errors.mock.calls.filter((args) =>
    String(args[0]).includes("same key"),
  );
  errors.mockRestore();
  expect(keyErrors).toEqual([]);
});
