import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  Cat,
  commandEvent,
  cheerMs,
  riseMs,
  startleMs,
  typingEvent,
} from "@/components/cat/Cat";
import { bootDurationMs } from "@/components/terminal/useBoot";
import { aboutLines } from "@/lib/content";
import { greeting, reply, tips } from "@/lib/sudo";

function mockMotion(reduce: boolean) {
  window.matchMedia = (query: string) =>
    ({ matches: reduce && query.includes("reduce") }) as MediaQueryList;
}

const cat = () => document.querySelector("[data-cat]") as HTMLElement;
const bubble = () => screen.queryByRole("group", { name: "Sudo says" });
const bootEnd = bootDurationMs(aboutLines.length);
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

  test("clicking the cat calms it and shows the tips in turn", () => {
    arrived();
    fireEvent.mouseEnter(cat());
    fireEvent.click(cat());
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

  test("hovering makes it angry, and leaving calms it", () => {
    arrived();
    expect(cat().querySelector("svg")).toBeNull();
    fireEvent.mouseEnter(cat());
    expect(cat().dataset.mood).toBe("angry");
    expect(cat().querySelector("svg")).not.toBeNull(); // the anger mark
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
