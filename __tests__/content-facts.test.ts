import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import * as content from "@/lib/content";

// The resume is the only source of facts (CLAUDE.md). These checks keep the
// site's content from drifting away from it.
const resume = readFileSync("content/resume.md", "utf8").replaceAll("**", "");
// Facts Muji confirmed beyond the resume (CLAUDE.md, Site rules).
const confirmed =
  "Oracle until Oct 2026. OnEarly from Nov 2026.";
const sources = `${resume}\n${confirmed}`;

const allowedLinks = new Set([
  "mailto:mujibulislamdipto@gmail.com",
  "https://www.linkedin.com/in/mujidipto",
  "https://github.com/MujiDipto",
  "https://github.com/MujiDipto/fifa-wc-newsletter",
]);

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(strings);
  }
  return [];
}

/** Numbers in `text` (such as 15,000, 77%, 960+) that the resume never mentions. */
function unsupportedNumbers(text: string, source: string): string[] {
  const numbers = text.match(/\d[\d,]*(?:\.\d+)?\+?%?/g) ?? [];
  return numbers.filter((n) => !source.includes(n));
}

const siteText = strings(content);

describe("checker", () => {
  test("flags a number the resume does not contain", () => {
    expect(unsupportedNumbers("Saved 1,200 analyst-hours", resume)).toEqual([
      "1,200",
    ]);
  });

  test("accepts numbers the resume contains", () => {
    expect(unsupportedNumbers("15,000 packages, 77% faster", resume)).toEqual(
      [],
    );
  });
});

describe("site content", () => {
  test("has content to check", () => {
    expect(siteText.length).toBeGreaterThan(20);
  });

  // The 77% cut is linked to the scoring pipelines on Muji's confirmation
  // (CLAUDE.md); the number itself still has to come from the resume.
  test("uses only numbers from the resume or Muji's confirmed facts", () => {
    expect(siteText.flatMap((s) => unsupportedNumbers(s, sources))).toEqual([]);
  });

  test("contains no phone number", () => {
    const phoneLike = /(\+?\d[\d\s()-]{7,}\d)/;
    expect(siteText.filter((s) => phoneLike.test(s))).toEqual([]);
  });

  test("links only to approved destinations", () => {
    const links = siteText.filter((s) => /^(https?:|mailto:)/.test(s));
    expect(links.length).toBeGreaterThan(0);
    expect(links.filter((l) => !allowedLinks.has(l))).toEqual([]);
  });
});

test("the pull quote is word for word from its recommendation", () => {
  expect(content.pullQuote.by.paragraphs.join(" ")).toContain(
    content.pullQuote.text,
  );
});
