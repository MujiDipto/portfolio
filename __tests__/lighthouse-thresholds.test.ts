import { describe, expect, test } from "vitest";
import {
  evaluate,
  median,
  thresholds,
} from "@/scripts/lighthouse-thresholds.mjs";

describe("median", () => {
  test("returns the middle value of an odd-length list", () => {
    expect(median([0.8, 0.95, 0.9])).toBe(0.9);
  });

  test("averages the two middle values of an even-length list", () => {
    expect(median([0.8, 1, 0.9, 0.7])).toBeCloseTo(0.85);
  });
});

describe("evaluate", () => {
  const passing = {
    accessibility: [1, 1, 1],
    "best-practices": [0.96, 0.96, 0.96],
    performance: [0.98, 0.97, 0.99],
    seo: [1, 1, 1],
  };

  test("passes when every median meets its threshold", () => {
    const result = evaluate(passing);
    expect(result.failed).toBe(false);
    expect(result.warnings).toEqual([]);
  });

  test("fails when accessibility is below 0.9", () => {
    const result = evaluate({ ...passing, accessibility: [0.85, 0.88, 0.89] });
    expect(result.failed).toBe(true);
  });

  test("fails when best practices is below 0.9", () => {
    const result = evaluate({ ...passing, "best-practices": [0.8, 0.8, 0.8] });
    expect(result.failed).toBe(true);
  });

  test("only warns when performance is below 0.9", () => {
    const result = evaluate({ ...passing, performance: [0.7, 0.75, 0.8] });
    expect(result.failed).toBe(false);
    expect(result.warnings).toEqual(["performance"]);
  });

  test("uses the median, so one slow run does not fail the build", () => {
    const result = evaluate({ ...passing, accessibility: [0.5, 0.95, 0.96] });
    expect(result.failed).toBe(false);
  });

  test("fails when a category has no scores", () => {
    const result = evaluate({ ...passing, accessibility: [] });
    expect(result.failed).toBe(true);
  });

  test("blocks on accessibility and best practices only", () => {
    expect(
      Object.entries(thresholds)
        .filter(([, rule]) => rule.blocking)
        .map(([category]) => category),
    ).toEqual(["accessibility", "best-practices"]);
  });
});
