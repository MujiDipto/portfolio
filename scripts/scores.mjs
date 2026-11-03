// Lists or removes high scores (app/api/scores/route.ts), for moderation.
// Needs the store's credentials: `vercel env pull .env.local` writes them
// (gitignored), then:
//   node --env-file=.env.local scripts/scores.mjs list snake
//   node --env-file=.env.local scripts/scores.mjs remove snake ABC
import { Redis } from "@upstash/redis";

const [action, game, initials] = process.argv.slice(2);
const games = ["snake", "triage"];

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error("No store credentials. Run: vercel env pull .env.local");
  process.exit(1);
}
if (!games.includes(game) || !["list", "remove"].includes(action)) {
  console.error("usage: scores.mjs list <game> | remove <game> <initials>");
  process.exit(1);
}

const redis = new Redis({ url, token, enableTelemetry: false });
const key = `scores:${game}`;
const flat = await redis.zrange(key, 0, -1, { rev: true, withScores: true });
const entries = [];
for (let i = 0; i + 1 < flat.length; i += 2) {
  entries.push({ member: String(flat[i]), score: Number(flat[i + 1]) });
}

if (action === "list") {
  entries.forEach((e, i) =>
    console.log(
      `${String(i + 1).padStart(3)}. ${e.member.slice(0, 3)} ${e.score}`,
    ),
  );
  if (entries.length === 0) console.log(`no ${game} scores`);
} else {
  const target = (initials ?? "").toUpperCase();
  const members = entries
    .filter((e) => e.member.startsWith(`${target}:`))
    .map((e) => e.member);
  if (members.length) await redis.zrem(key, ...members);
  console.log(`removed ${members.length} ${game} score(s) for ${target}`);
}
