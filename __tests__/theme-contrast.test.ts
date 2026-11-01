import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

/** Reads `--name: #hex;` declarations from the first block after `marker`. */
function variablesAfter(marker: string): Record<string, string> {
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`No block found for ${marker}`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [
      m[1],
      m[2].toLowerCase(),
    ]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Text colours must reach 4.5:1 (WCAG 1.4.3) on every surface they sit on.
const textOn: Record<string, string[]> = {
  window: [
    "fg",
    "fg-strong",
    "muted",
    "accent",
    "prompt-user",
    "prompt-path",
    "number",
  ],
  titlebar: ["fg", "muted", "accent"],
  // Text outside the terminal window, such as the skip link and footer.
  page: ["fg", "fg-strong", "muted", "accent"],
};
// The focus ring is a non-text indicator: 3:1 (WCAG 1.4.11).
const uiOn: Record<string, string[]> = { window: ["focus"], page: ["focus"] };

const themes = {
  dark: variablesAfter(":root {"),
  light: variablesAfter(':root[data-theme="light"] {'),
};

describe.each(Object.entries(themes))("%s theme", (_, vars) => {
  for (const [surface, colours] of Object.entries(textOn)) {
    test.each(colours)(`%s text on ${surface} reaches 4.5:1`, (colour) => {
      expect(vars[colour], `--${colour} missing`).toBeDefined();
      expect(vars[surface], `--${surface} missing`).toBeDefined();
      expect(contrast(vars[colour], vars[surface])).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const [surface, colours] of Object.entries(uiOn)) {
    test.each(colours)(`%s on ${surface} reaches 3:1`, (colour) => {
      expect(vars[colour], `--${colour} missing`).toBeDefined();
      expect(contrast(vars[colour], vars[surface])).toBeGreaterThanOrEqual(3);
    });
  }
});

test("contrast helper matches known WCAG values", () => {
  expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
  expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
});
