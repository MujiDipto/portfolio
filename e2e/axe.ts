import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * axe for WCAG 2.2 AA. axe ships its target-size rule (WCAG 2.5.8) disabled,
 * so selecting the wcag22aa tag alone never runs it; enable it explicitly.
 */
export function axe(page: Page) {
  return new AxeBuilder({ page })
    .withTags(wcagTags)
    .options({ rules: { "target-size": { enabled: true } } });
}
