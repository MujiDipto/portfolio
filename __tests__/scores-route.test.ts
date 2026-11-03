import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { packages } from "@/lib/triage";

// A tiny in-memory stand-in for Upstash: one sorted set per key.
const sets = new Map<string, Map<string, number>>();
let allowed = true;
let reads = 0;

function ranked(key: string) {
  return [...(sets.get(key) ?? new Map()).entries()].sort(
    (a, b) => b[1] - a[1] || b[0].localeCompare(a[0]),
  );
}
function flatTop(key: string, n: number) {
  return ranked(key)
    .slice(0, n)
    .flatMap(([member, score]) => [member, score]);
}

vi.mock("@upstash/redis", () => ({
  Redis: class {
    async zrange(key: string, _min: number, max: number) {
      reads++;
      return flatTop(key, max + 1);
    }
    pipeline() {
      const steps: (() => unknown)[] = [];
      const chain = {
        zadd(
          key: string,
          { score, member }: { score: number; member: string },
        ) {
          steps.push(() => {
            if (!sets.has(key)) sets.set(key, new Map());
            sets.get(key)!.set(member, score);
            return 1;
          });
          return chain;
        },
        zremrangebyrank(key: string, _start: number, stop: number) {
          steps.push(() => {
            const keep = -(stop + 1);
            const set = sets.get(key)!;
            const drop = ranked(key)
              .slice(keep)
              .map(([m]) => m);
            drop.forEach((m) => set.delete(m));
            return drop.length;
          });
          return chain;
        },
        zrevrank(key: string, member: string) {
          steps.push(() => {
            const i = ranked(key).findIndex(([m]) => m === member);
            return i === -1 ? null : i;
          });
          return chain;
        },
        zrange(key: string, _min: number, max: number) {
          steps.push(() => flatTop(key, max + 1));
          return chain;
        },
        async exec() {
          return steps.map((run) => run());
        },
      };
      return chain;
    }
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }
    async limit() {
      return { success: allowed };
    }
  },
}));

const { GET, POST } = await import("@/app/api/scores/route");

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/scores", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

describe("/api/scores", () => {
  beforeEach(() => {
    sets.clear();
    allowed = true;
    vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "test");
  });
  afterEach(() => vi.unstubAllEnvs());

  test("says so when no store is connected", async () => {
    vi.stubEnv("KV_REST_API_URL", "");
    const response = await GET(
      new Request("http://localhost/api/scores?game=snake"),
    );
    expect(response.status).toBe(503);
  });

  test("refuses unknown games, bad JSON, odd scores and huge bodies", async () => {
    expect(
      (await GET(new Request("http://localhost/api/scores?game=pong"))).status,
    ).toBe(400);
    expect((await post("{not json")).status).toBe(400);
    expect(
      (await post({ game: "snake", initials: "abc", score: 1e6 })).status,
    ).toBe(400);
    expect((await post("x".repeat(5000))).status).toBe(413);
  });

  test("saves a score and returns the top five with its place", async () => {
    for (const [initials, score] of [
      ["AAA", 10],
      ["BBB", 20],
      ["CCC", 5],
    ] as const) {
      await post({ game: "snake", initials, score });
    }
    const response = await post({ game: "snake", initials: "mud", score: 15 });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.placed).toBe(1);
    expect(data.scores.map((s: { initials: string }) => s.initials)).toEqual([
      "BBB",
      "MUD",
      "AAA",
      "CCC",
    ]);
    const listed = await (
      await GET(new Request("http://localhost/api/scores?game=snake"))
    ).json();
    expect(listed.scores[1]).toEqual({ initials: "MUD", score: 15 });
  });

  test("stores the recomputed triage score, not the claimed one", async () => {
    const [a] = packages;
    const data = await (
      await post({
        game: "triage",
        initials: "abc",
        score: 999,
        answers: [{ id: a.id, given: a.answer, clues: 2 }],
      })
    ).json();
    expect(data.scores).toEqual([{ initials: "ABC", score: 2 }]);
  });

  test("keeps only the best 50", async () => {
    for (let i = 1; i <= 55; i++) {
      await post({ game: "snake", initials: "abc", score: i });
    }
    expect(sets.get("scores:snake")!.size).toBe(50);
    const low = await (
      await post({ game: "snake", initials: "low", score: 1 })
    ).json();
    expect(low.placed).toBeNull();
  });

  test("rate limits busy visitors", async () => {
    allowed = false;
    const response = await post({ game: "snake", initials: "abc", score: 3 });
    expect(response.status).toBe(429);
  });
});

describe("the dev server's file store", () => {
  test("saves to a JSON file, best first, keeping 50", async () => {
    const { fileStore } = await import("@/lib/score-store");
    const { mkdtemp, readFile } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const file = `${await mkdtemp(`${tmpdir()}/scores-`)}/scores.json`;
    const store = fileStore(file);
    expect(await store.top("snake")).toEqual([]);
    await store.add("snake", { initials: "AAA", score: 5 }, "x");
    const saved = await store.add("snake", { initials: "BBB", score: 9 }, "x");
    expect(saved).toEqual({
      scores: [
        { initials: "BBB", score: 9 },
        { initials: "AAA", score: 5 },
      ],
      placed: 0,
    });
    // Each game has its own board.
    expect(await store.top("triage")).toEqual([]);
    for (let i = 0; i < 60; i++) {
      await store.add("snake", { initials: "CCC", score: 100 + i }, "x");
    }
    const low = await store.add("snake", { initials: "LOW", score: 1 }, "x");
    expect(low).toMatchObject({ placed: null });
    const board = JSON.parse(await readFile(file, "utf8"));
    expect(board.snake).toHaveLength(50);
  });

  test("is what npm run dev uses, even with Upstash set up", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "test");
    const { openStore } = await import("@/lib/score-store");
    reads = 0;
    await openStore()!.top("snake");
    expect(reads).toBe(0);
    // Anywhere else, Upstash it is.
    vi.stubEnv("NODE_ENV", "production");
    await openStore()!.top("snake");
    expect(reads).toBe(1);
    vi.unstubAllEnvs();
  });
});
