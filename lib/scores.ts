// High scores: what a visitor may submit and how it is checked. Pure, so the
// API route (app/api/scores/route.ts) stays thin and this stays tested.
import { cols, rows } from "@/lib/snake";
import { scoreRun } from "@/lib/triage";
import { games, type Game } from "@/lib/terminal";

export type HighScore = { initials: string; score: number };

/** Entries shown, and kept: only the best are stored, nothing else. */
export const shown = 5;
export const kept = 50;

/**
 * The initials as stored (upper case), or null if they are not three letters.
 * Arcade style: no free text, so no names or links, and no blocklist.
 */
export function cleanInitials(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const initials = input.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(initials)) return null;
  return initials;
}

export function isGame(value: unknown): value is Game {
  return games.some((g) => g.name === value);
}

/** The longest snake possible fills the board, so no score is higher. */
const snakeMax = cols * rows - 3;

/**
 * A checked submission, or null. Triage scores are recomputed from the
 * answers; snake scores can only be checked for being possible.
 */
export function parseSubmission(
  body: unknown,
): { game: Game; initials: string; score: number } | null {
  if (typeof body !== "object" || body === null) return null;
  const {
    game,
    initials: raw,
    score,
    answers,
  } = body as Record<string, unknown>;
  const initials = cleanInitials(raw);
  if (!isGame(game) || !initials) return null;
  if (game === "triage") {
    const points = scoreRun(answers);
    return points ? { game, initials, score: points } : null;
  }
  if (!Number.isInteger(score) || (score as number) < 1) return null;
  if ((score as number) > snakeMax) return null;
  return { game, initials, score: score as number };
}
