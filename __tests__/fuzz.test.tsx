import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { OutputView } from "@/components/terminal/Outputs";
import { isMistake, reply } from "@/lib/sudo";
import {
  commandForHash,
  filterPalette,
  linkFor,
  matches,
  run,
} from "@/lib/terminal";

// Hostile and odd input for everything a visitor can type, paste or put in
// the address bar. A fixed seed keeps any failure reproducible.
let seed = 20261103;
function random() {
  seed = (seed * 1103515245 + 12345) % 2 ** 31;
  return seed / 2 ** 31;
}
const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];

const pieces = [
  "",
  " ",
  "\t",
  "\n",
  "\u0000",
  "​",
  "‮",
  "ls",
  "cat",
  "sudo",
  "git",
  "open",
  "echo",
  "-a",
  "--all",
  "../",
  "~",
  "*",
  "$(rm -rf /)",
  "`id`",
  "; rm -rf /",
  "|",
  "&&",
  "<script>alert(1)</script>",
  '<img src=x onerror="alert(1)">',
  "javascript:alert(1)",
  "%00",
  "%E0%A4%A",
  "\\",
  '"',
  "'",
  "{{7*7}}",
  "${7*7}",
  "constructor",
  "__proto__",
  "toString",
  "hasOwnProperty",
  "😀",
  "مرحبا",
  "日本語",
  "Ω≈ç√",
  "a".repeat(5000),
  "9".repeat(400),
  "(a+)+$",
  ".*.*.*.*.*!",
];

function hostileInput() {
  const n = 1 + Math.floor(random() * 6);
  return Array.from({ length: n }, () => pick(pieces)).join(
    pick([" ", "", "  "]),
  );
}

const inputs = Array.from({ length: 3000 }, hostileInput);

test("the command engine never throws and always answers in a known shape", () => {
  const types = new Set([
    "whoami",
    "highlights",
    "experience",
    "graph",
    "projects",
    "project",
    "skills",
    "education",
    "contact",
    "hire",
    "recommendations",
    "files",
    "tree",
    "neofetch",
    "audit",
    "secrets",
    "help",
    "message",
    "error",
  ]);
  for (const input of inputs) {
    const result = run(input, { history: [input], now: new Date(0) });
    if (result.output) expect(types, input).toContain(result.output.type);
    if (result.effect) expect(["clear", "theme"]).toContain(result.effect.type);
    expect(() => matches(input, [input])).not.toThrow();
    expect(() => filterPalette(input)).not.toThrow();
    expect(() => linkFor(input)).not.toThrow();
    expect(() => reply(input)).not.toThrow();
    expect(() => isMistake(input)).not.toThrow();
    // Only the fixed list of deep links ever runs from the address bar.
    const linked = commandForHash(`#${input}`);
    if (linked) expect(linked).toMatch(/^(cat|git|ls|open) /);
  }
});

test("no input is slow, however long or repetitive", () => {
  const worst = [
    "a".repeat(100_000),
    " -a".repeat(30_000),
    "9".repeat(100_000),
  ];
  for (const input of worst) {
    const start = performance.now();
    run(input);
    matches(input);
    filterPalette(input);
    reply(input);
    expect(performance.now() - start, input.slice(0, 20)).toBeLessThan(250);
  }
});

test("whatever comes back renders as text, never as markup", () => {
  for (const input of inputs.slice(0, 400)) {
    const { output } = run(input);
    if (!output || output.type === "audit") continue;
    const { container, unmount } = render(<OutputView output={output} />);
    expect(container.querySelector("script, img[onerror], iframe")).toBeNull();
    unmount();
  }
});
