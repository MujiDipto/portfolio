/** Minimum median score per Lighthouse category; blocking failures fail CI. */
export const thresholds = {
  accessibility: { min: 0.9, blocking: true },
  "best-practices": { min: 0.9, blocking: true },
  performance: { min: 0.9, blocking: false },
  seo: { min: 0.9, blocking: false },
};

/** @param {number[]} values */
export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * @param {Record<string, number[]>} scoresByCategory scores from each run, 0 to 1
 */
export function evaluate(scoresByCategory) {
  const rows = [];
  const warnings = [];
  let failed = false;

  for (const [category, rule] of Object.entries(thresholds)) {
    const scores = scoresByCategory[category] ?? [];
    const score = scores.length > 0 ? median(scores) : null;
    const passed = score !== null && score >= rule.min;
    if (!passed && rule.blocking) failed = true;
    if (!passed && !rule.blocking) warnings.push(category);
    rows.push({
      category,
      score,
      min: rule.min,
      blocking: rule.blocking,
      passed,
    });
  }

  return { failed, warnings, rows };
}
