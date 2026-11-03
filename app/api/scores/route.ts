// High scores for the mini games. The checks live in lib/scores.ts and the
// storage in lib/score-store.ts (Upstash when deployed, a file in dev).
import { openStore } from "@/lib/score-store";
import { isGame, parseSubmission } from "@/lib/scores";

const maxBody = 4096;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const unavailable = () => json({ error: "scores unavailable" }, 503);

export async function GET(request: Request) {
  const game = new URL(request.url).searchParams.get("game");
  if (!isGame(game)) return json({ error: "unknown game" }, 400);
  const store = openStore();
  if (!store) return unavailable();
  try {
    return json({ scores: await store.top(game) });
  } catch {
    return unavailable();
  }
}

export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > maxBody) return json({ error: "too large" }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "invalid score" }, 400);
  }
  const entry = parseSubmission(body);
  if (!entry) return json({ error: "invalid score" }, 400);
  const store = openStore();
  if (!store) return unavailable();
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    const saved = await store.add(
      entry.game,
      { initials: entry.initials, score: entry.score },
      ip || "unknown",
    );
    if (saved === "limited") {
      return json({ error: "too many scores, try later" }, 429);
    }
    return json(saved);
  } catch {
    return unavailable();
  }
}
