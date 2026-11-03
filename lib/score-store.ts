// Where high scores live (server only; used by app/api/scores/route.ts).
// The deployed site keeps them in Upstash Redis, connected through Vercel's
// Marketplace, which sets the KV_REST_API_* variables. `npm run dev` keeps
// them in a gitignored JSON file instead, so local play never reaches the
// real board; delete the file to start again.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { kept, shown, type HighScore } from "@/lib/scores";
import type { Game } from "@/lib/terminal";

export type Saved = { scores: HighScore[]; placed: number | null };

export type Store = {
  top(game: Game): Promise<HighScore[]>;
  /** Saves a score, or says the visitor is saving too often. */
  add(
    game: Game,
    entry: HighScore,
    visitor: string,
  ): Promise<Saved | "limited">;
};

export const devFile = path.join(process.cwd(), ".scores.dev.json");

/** The store for this server, or null when none is set up. */
export function openStore(): Store | null {
  if (process.env.NODE_ENV === "development") return fileStore(devFile);
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return upstashStore(new Redis({ url, token, enableTelemetry: false }));
}

/**
 * Each game's scores are one sorted set holding only the best `kept`; members
 * are initials plus a random id. Nothing else about a visitor is stored: the
 * rate limit keys on a hash of the IP address, which expires within a minute.
 */
export function upstashStore(redis: Redis): Store {
  const key = (game: Game) => `scores:${game}`;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "scores:limit",
  });
  return {
    async top(game) {
      return toScores(
        await redis.zrange<unknown[]>(key(game), 0, shown - 1, {
          rev: true,
          withScores: true,
        }),
      );
    },
    async add(game, entry, visitor) {
      const { success } = await limiter.limit(await hash(visitor));
      if (!success) return "limited";
      const member = `${entry.initials}:${crypto.randomUUID()}`;
      const [, , rank, flat] = await redis
        .pipeline()
        .zadd(key(game), { score: entry.score, member })
        // Keep only the best `kept`: ranks run from the lowest score up.
        .zremrangebyrank(key(game), 0, -(kept + 1))
        .zrevrank(key(game), member)
        .zrange(key(game), 0, shown - 1, { rev: true, withScores: true })
        .exec<[number, number, number | null, unknown[]]>();
      return { scores: toScores(flat), placed: placedAt(rank) };
    },
  };
}

/** A JSON file of each game's best `kept`, for the dev server. No rate limit. */
export function fileStore(file: string): Store {
  type Board = Partial<Record<Game, HighScore[]>>;
  const read = async (): Promise<Board> => {
    try {
      return JSON.parse(await readFile(file, "utf8")) as Board;
    } catch {
      return {}; // no file yet, or one edited into nonsense: start afresh
    }
  };
  return {
    async top(game) {
      return ((await read())[game] ?? []).slice(0, shown);
    },
    async add(game, entry) {
      const board = await read();
      const saved = { ...entry };
      // Ties keep the earlier score first, as an arcade would.
      const scores = [...(board[game] ?? []), saved]
        .sort((a, b) => b.score - a.score)
        .slice(0, kept);
      await writeFile(file, JSON.stringify({ ...board, [game]: scores }));
      const rank = scores.indexOf(saved);
      return {
        scores: scores.slice(0, shown),
        placed: placedAt(rank === -1 ? null : rank),
      };
    },
  };
}

/** Where a new score landed in the list shown, if it made it. */
function placedAt(rank: number | null): number | null {
  return rank !== null && rank < shown ? rank : null;
}

/** Sorted-set replies come flat: member, score, member, score. */
function toScores(flat: unknown[]): HighScore[] {
  const scores: HighScore[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    scores.push({
      initials: String(flat[i]).slice(0, 3),
      score: Number(flat[i + 1]),
    });
  }
  return scores;
}

async function hash(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Buffer.from(bytes).toString("hex");
}
