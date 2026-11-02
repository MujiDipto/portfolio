import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Cat, catLine, commandEvent } from "@/components/cat/Cat";
import { bootDurationMs } from "@/components/terminal/useBoot";
import { profile } from "@/lib/content";
import { suggestions } from "@/lib/terminal";

function mockMotion(reduce: boolean) {
  window.matchMedia = (query: string) =>
    ({ matches: reduce && query.includes("reduce") }) as MediaQueryList;
}

const cat = () => document.querySelector("[data-cat]") as HTMLElement;
const bubble = () =>
  screen.queryByRole("group", { name: "Suggested commands" });
const bootEnd = bootDurationMs(profile.summary.length);

function runCommand() {
  act(() => {
    window.dispatchEvent(new Event(commandEvent));
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Cat", () => {
  test("walks in during the opening and arrives as it finishes, then opens its bubble", () => {
    mockMotion(false);
    const onBubble = vi.fn();
    render(<Cat onRun={() => {}} onBubbleChange={onBubble} />);
    act(() => vi.advanceTimersByTime(bootEnd / 2));
    expect(cat().dataset.moving).toBe("true");
    expect(bubble()).toBeNull();
    act(() => vi.advanceTimersByTime(bootEnd / 2 + 100));
    expect(cat().dataset.moving).toBe("false");
    expect(bubble()).not.toBeNull();
    expect(onBubble).toHaveBeenLastCalledWith(true);
  });

  test("the bubble speaks in the cat's voice and its suggestions run commands", () => {
    mockMotion(false);
    const onRun = vi.fn();
    render(<Cat onRun={onRun} onBubbleChange={() => {}} />);
    act(() => vi.advanceTimersByTime(bootEnd + 100));
    expect(bubble()!.textContent).toContain(catLine);
    for (const command of suggestions) {
      fireEvent.click(within(bubble()!).getByRole("button", { name: command }));
      expect(onRun).toHaveBeenLastCalledWith(command);
    }
  });

  test("stays still until a command runs, then walks somewhere new", () => {
    mockMotion(false);
    const onBubble = vi.fn();
    render(<Cat onRun={() => {}} onBubbleChange={onBubble} />);
    act(() => vi.advanceTimersByTime(bootEnd + 100));
    const arrived = cat().dataset.x;
    act(() => vi.advanceTimersByTime(60000));
    expect(cat().dataset.x).toBe(arrived);

    runCommand();
    expect(bubble()).toBeNull();
    expect(onBubble).toHaveBeenLastCalledWith(false);
    act(() => vi.advanceTimersByTime(100));
    expect(cat().dataset.moving).toBe("true");
    act(() => vi.advanceTimersByTime(10000));
    expect(cat().dataset.moving).toBe("false");
    expect(cat().dataset.x).not.toBe(arrived);
  });

  test("a key press during the opening brings it straight to its spot", () => {
    mockMotion(false);
    render(<Cat onRun={() => {}} onBubbleChange={() => {}} />);
    act(() => vi.advanceTimersByTime(400));
    fireEvent.keyDown(window, { key: "a" });
    expect(cat().dataset.moving).toBe("false");
    expect(bubble()).not.toBeNull();
  });

  test("it faces the way it last walked", () => {
    mockMotion(false);
    render(<Cat onRun={() => {}} onBubbleChange={() => {}} />);
    act(() => vi.advanceTimersByTime(bootEnd + 100));
    // The entrance comes in from the right, so it ends facing left.
    expect(cat().dataset.facing).toBe("left");
    const before = Number(cat().dataset.x);
    runCommand();
    act(() => vi.advanceTimersByTime(10000));
    const after = Number(cat().dataset.x);
    expect(cat().dataset.facing).toBe(after > before ? "right" : "left");
  });

  test("hovering makes it angry, and leaving calms it", () => {
    mockMotion(false);
    render(<Cat onRun={() => {}} onBubbleChange={() => {}} />);
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

  test("with reduced motion it never walks, even after a command", () => {
    mockMotion(true);
    render(<Cat onRun={() => {}} onBubbleChange={() => {}} />);
    act(() => vi.advanceTimersByTime(0));
    expect(bubble()).not.toBeNull();
    const still = cat().dataset.x;
    runCommand();
    act(() => vi.advanceTimersByTime(10000));
    expect(cat().dataset.x).toBe(still);
    expect(cat().dataset.moving).toBe("false");
  });

  test("the picture is hidden from screen readers and there is no pause button", () => {
    mockMotion(false);
    render(<Cat onRun={() => {}} onBubbleChange={() => {}} />);
    expect(cat().getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("button", { name: /pause/ })).toBeNull();
  });
});
