import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  Cat,
  catLine,
  commandEvent,
  riseMs,
  sinkMs,
} from "@/components/cat/Cat";
import { bootDurationMs } from "@/components/terminal/useBoot";
import { profile } from "@/lib/content";

function mockMotion(reduce: boolean) {
  window.matchMedia = (query: string) =>
    ({ matches: reduce && query.includes("reduce") }) as MediaQueryList;
}

const cat = () => document.querySelector("[data-cat]") as HTMLElement;
const bubble = () => screen.queryByRole("group", { name: "Sudo says" });
const bootEnd = bootDurationMs(profile.summary.length);

function runCommand() {
  act(() => {
    window.dispatchEvent(new Event(commandEvent));
  });
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
    expect(bubble()).not.toBeNull();
  });

  test("the bubble says hi in one line and its help button runs help", () => {
    mockMotion(false);
    const onRun = vi.fn();
    render(<Cat onRun={onRun} />);
    act(() => vi.advanceTimersByTime(bootEnd + 100));
    expect(bubble()!.textContent).toBe(`${catLine[0]} help ${catLine[1]}`);
    fireEvent.click(within(bubble()!).getByRole("button", { name: "help" }));
    expect(onRun).toHaveBeenCalledWith("help");
  });

  test("stays put until a command runs, then sinks and rises somewhere new", () => {
    mockMotion(false);
    render(<Cat onRun={() => {}} />);
    act(() => vi.advanceTimersByTime(bootEnd + 100));
    const arrived = cat().dataset.x;
    act(() => vi.advanceTimersByTime(60000));
    expect(cat().dataset.x).toBe(arrived);
    expect(cat().dataset.state).toBe("up");

    runCommand();
    expect(bubble()).toBeNull();
    expect(cat().dataset.state).toBe("sinking");
    expect(cat().dataset.x).toBe(arrived); // it moves only while hidden
    act(() => vi.advanceTimersByTime(sinkMs));
    expect(cat().dataset.state).toBe("rising");
    expect(cat().dataset.x).not.toBe(arrived);
    act(() => vi.advanceTimersByTime(riseMs));
    expect(cat().dataset.state).toBe("up");
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
    mockMotion(false);
    render(<Cat onRun={() => {}} />);
    act(() => vi.advanceTimersByTime(bootEnd + 100));
    expect(cat().dataset.mood).toBe("calm");
    expect(cat().querySelector("svg")).toBeNull();
    fireEvent.mouseEnter(cat());
    expect(cat().dataset.mood).toBe("angry");
    expect(cat().querySelector("svg")).not.toBeNull(); // the anger mark
    fireEvent.mouseLeave(cat());
    expect(cat().dataset.mood).toBe("calm");
    expect(cat().querySelector("svg")).toBeNull();
  });

  test("with reduced motion it is simply there, and never moves", () => {
    mockMotion(true);
    render(<Cat onRun={() => {}} />);
    act(() => vi.advanceTimersByTime(0));
    expect(cat().dataset.state).toBe("up");
    expect(bubble()).not.toBeNull();
    const still = cat().dataset.x;
    runCommand();
    act(() => vi.advanceTimersByTime(10000));
    expect(cat().dataset.x).toBe(still);
    expect(cat().dataset.state).toBe("up");
  });

  test("the picture is hidden from screen readers and there is no pause button", () => {
    mockMotion(false);
    render(<Cat onRun={() => {}} />);
    expect(cat().getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("button", { name: /pause/ })).toBeNull();
  });
});
