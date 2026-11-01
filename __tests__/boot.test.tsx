import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Terminal } from "@/components/terminal/Terminal";
import { profile } from "@/lib/content";

function mockMotion(reduce: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: reduce && query.includes("reduce"),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }) as unknown as MediaQueryList;
}

/** The part of `cat about.md` a sighted visitor can currently see. */
function visibleCommand() {
  return document.querySelector("[data-boot-typed]")?.textContent ?? "";
}

function revealedLines() {
  return profile.summary.filter((line) => {
    const el = [...document.querySelectorAll("[data-boot-line]")].find(
      (node) => node.textContent === line,
    );
    return el && !el.classList.contains("boot-hidden");
  }).length;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("opening animation", () => {
  test("types cat about.md letter by letter, then prints the lines, then shows the prompt", () => {
    mockMotion(false);
    render(<Terminal />);
    expect(screen.queryByRole("textbox")).toBeNull();

    act(() => vi.advanceTimersByTime(450));
    const partway = visibleCommand();
    expect(partway.length).toBeGreaterThan(0);
    expect("cat about.md".startsWith(partway)).toBe(true);
    expect(partway).not.toBe("cat about.md");
    expect(revealedLines()).toBe(0);

    act(() => vi.advanceTimersByTime(800));
    expect(visibleCommand()).toBe("cat about.md");
    expect(revealedLines()).toBeGreaterThan(0);

    act(() => vi.advanceTimersByTime(1000));
    expect(revealedLines()).toBe(profile.summary.length);
    expect(screen.getByRole("textbox", { name: "Command" })).toBeDefined();
  });

  test("finishes in under two seconds", () => {
    mockMotion(false);
    render(<Terminal />);
    expect(screen.queryByRole("textbox")).toBeNull();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("textbox", { name: "Command" })).toBeDefined();
  });

  test("a key press skips straight to the prompt", () => {
    mockMotion(false);
    render(<Terminal />);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.keyDown(window, { key: "a" });
    expect(screen.getByRole("textbox", { name: "Command" })).toBeDefined();
    expect(revealedLines()).toBe(profile.summary.length);
  });

  test("a tap or click skips straight to the prompt", () => {
    mockMotion(false);
    render(<Terminal />);
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.pointerDown(window);
    expect(screen.getByRole("textbox", { name: "Command" })).toBeDefined();
  });

  test("with reduced motion everything appears at once", () => {
    mockMotion(true);
    render(<Terminal />);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByRole("textbox", { name: "Command" })).toBeDefined();
    expect(revealedLines()).toBe(profile.summary.length);
  });

  test("screen readers get the full command and every line from the start", () => {
    mockMotion(false);
    render(<Terminal />);
    const log = screen.getByRole("log");
    expect(log.textContent).toContain("cat about.md");
    for (const line of profile.summary) expect(log.textContent).toContain(line);
  });
});
