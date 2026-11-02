import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  AuditContext,
  AuditOutput,
  scanMs,
} from "@/components/terminal/AuditOutput";
import { summarise, type Audit } from "@/lib/audit";
import { run } from "@/lib/terminal";

function report(vulnerabilities: Record<string, number>, prod = 21) {
  return JSON.stringify({
    metadata: { vulnerabilities, dependencies: { prod, dev: 600 } },
  });
}

describe("summarise", () => {
  test("reads a clean report", () => {
    expect(summarise(report({ low: 0, high: 0, total: 0 }))).toEqual({
      packages: 21,
      found: [],
    });
  });

  test("lists only the severities found, worst first", () => {
    expect(
      summarise(report({ low: 2, moderate: 0, critical: 1, total: 3 }))?.found,
    ).toEqual([
      { severity: "critical", count: 1 },
      { severity: "low", count: 2 },
    ]);
  });

  test.each(["", "not json", "{}", '{"error":{"code":"ENOTFOUND"}}'])(
    "%j is not a report",
    (json) => {
      expect(summarise(json)).toBeNull();
    },
  );
});

test("npm audit is a command; other npm commands are not", () => {
  expect(run("npm audit").output).toEqual({ type: "audit" });
  expect(run("npm install").output?.type).toBe("error");
});

function renderAudit(audit: Audit | null, animate: boolean) {
  return render(
    <AuditContext value={audit}>
      <AuditOutput animate={animate} />
    </AuditContext>,
  );
}

const clean: Audit = { packages: 21, found: [] };

describe("AuditOutput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.matchMedia = (() => ({ matches: false })) as never;
  });
  afterEach(() => vi.useRealTimers());

  test("scans, then shows the real result", () => {
    const { container } = renderAudit(clean, true);
    act(() => vi.advanceTimersByTime(scanMs / 2));
    // Mid-scan the result waits, invisible but already in the page.
    expect(container.querySelector(".opacity-0")).not.toBeNull();
    act(() => vi.advanceTimersByTime(scanMs));
    expect(container.querySelector(".opacity-0")).toBeNull();
    expect(container.textContent).toContain("21/21");
    expect(container.textContent).toContain("found 0 vulnerabilities");
  });

  test("never shows the result before the scan starts", () => {
    const { container } = renderAudit(clean, true);
    expect(container.querySelector(".opacity-0")).not.toBeNull();
    expect(container.textContent).toContain("0/21");
  });

  test("with reduced motion, shows the result straight away", () => {
    window.matchMedia = (() => ({ matches: true })) as never;
    const { container } = renderAudit(clean, true);
    act(() => vi.advanceTimersByTime(50));
    expect(container.querySelector(".opacity-0")).toBeNull();
    expect(container.textContent).toContain("21/21");
  });

  test("names what it found", () => {
    const { container } = renderAudit(
      { ...clean, found: [{ severity: "high", count: 1 }] },
      false,
    );
    expect(container.textContent).toContain("found 1 vulnerability (1 high)");
  });

  test("says so when the build could not reach the registry", () => {
    const { container } = renderAudit(null, true);
    expect(container.textContent).toContain("could not be reached");
  });
});
