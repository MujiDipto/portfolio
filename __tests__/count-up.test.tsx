import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CountUp, countMs } from "@/components/terminal/CountUp";

function mockMotion(reduce: boolean) {
  window.matchMedia = (query: string) =>
    ({ matches: reduce && query.includes("reduce") }) as MediaQueryList;
}

/** What a sighted visitor sees, leaving out the screen-reader copy. */
function shown(container: HTMLElement) {
  return (
    container.querySelector("[aria-hidden]")?.textContent ??
    container.textContent
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  mockMotion(false);
});
afterEach(() => vi.useRealTimers());

test("counts up from zero once its line appears, keeping the format", () => {
  const { container, rerender } = render(
    <CountUp value="15,000" waiting={true} />,
  );
  act(() => vi.advanceTimersByTime(50));
  expect(shown(container)).toBe("0");
  // Screen readers get the final value even mid-count.
  expect(container.querySelector(".sr-only")?.textContent).toBe("15,000");

  rerender(<CountUp value="15,000" waiting={false} />);
  act(() => vi.advanceTimersByTime(countMs / 2));
  expect(Number(shown(container)?.replaceAll(",", ""))).toBeGreaterThan(0);
  expect(shown(container)).not.toBe("15,000");

  act(() => vi.advanceTimersByTime(countMs));
  expect(container.innerHTML).toBe("15,000");
});

test("keeps its suffix while counting", () => {
  const { container, rerender } = render(
    <CountUp value="77%" waiting={true} />,
  );
  rerender(<CountUp value="77%" waiting={false} />);
  act(() => vi.advanceTimersByTime(countMs / 3));
  expect(shown(container)).toMatch(/^\d+%$/);
});

test("a key press finishes the count at once", () => {
  const { container, rerender } = render(
    <CountUp value="960+" waiting={true} />,
  );
  rerender(<CountUp value="960+" waiting={false} />);
  act(() => vi.advanceTimersByTime(50));
  act(() => {
    fireEvent.keyDown(window, { key: "a" });
  });
  expect(container.innerHTML).toBe("960+");
});

test("shows the final value when it was never waiting, or with reduced motion", () => {
  const later = render(<CountUp value="15,000" waiting={false} />);
  act(() => vi.advanceTimersByTime(50));
  expect(later.container.innerHTML).toBe("15,000");

  mockMotion(true);
  const reduced = render(<CountUp value="15,000" waiting={true} />);
  act(() => vi.advanceTimersByTime(50));
  expect(reduced.container.innerHTML).toBe("15,000");
});
