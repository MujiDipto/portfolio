import { describe, expect, test } from "vitest";
import { cleanInitials, parseSubmission } from "@/lib/scores";
import { cols, draw, newGame, rows, step, turn, type Snake } from "@/lib/snake";
import {
  cluesAt,
  isOver,
  lives,
  packages,
  pointsFor,
  scoreRun,
  secondsFor,
  shuffle,
  verdicts,
  type Answer,
  type Verdict,
} from "@/lib/triage";

const fixed = () => 0;

describe("snake", () => {
  test("moves one cell a tick and grows when it eats", () => {
    const game: Snake = { ...newGame(fixed), food: { x: 7, y: 6 } };
    const next = step(game, fixed);
    expect(next.body[0]).toEqual({ x: 7, y: 6 });
    expect(next.body).toHaveLength(4);
    expect(next.score).toBe(1);
    expect(next.body).not.toContainEqual(next.food);
  });

  test("crashes into walls and itself", () => {
    let game = newGame(fixed);
    for (let i = 0; i < cols; i++) game = step(game, fixed);
    expect(game.over).toBe(true);
    const curled: Snake = {
      ...newGame(fixed),
      body: [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 6 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
      ],
      direction: "down",
      heading: "down",
    };
    expect(step(curled, fixed).over).toBe(true);
  });

  test("two quick turns in one tick cannot reverse it into itself", () => {
    // Heading right, up then left before the next tick: left would turn it
    // back into its own neck, so it is ignored.
    const game = turn(turn(newGame(fixed), "up"), "left");
    expect(game.direction).toBe("up");
    const moved = step(game, fixed);
    expect(moved.over).toBe(false);
    // Once it has moved up, left is a fair turn.
    expect(turn(moved, "left").direction).toBe("left");
  });

  test("draws a board of the right size", () => {
    const board = draw(newGame(fixed));
    expect(board).toHaveLength(rows);
    expect(board.every((line) => [...line].length === cols)).toBe(true);
    expect(board.join("")).toContain("@");
  });
});

describe("triage", () => {
  const right = (id: string, clues = 1): Answer => ({
    id,
    given: packages.find((p) => p.id === id)!.answer,
    clues,
  });
  const wrong = (id: string): Answer => ({
    id,
    given:
      packages.find((p) => p.id === id)!.answer === "safe" ? "risky" : "safe",
    clues: 1,
  });

  test("packages are well formed, with every verdict represented", () => {
    const ids = packages.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const v of verdicts) {
      expect(packages.some((p) => p.answer === v.verdict)).toBe(true);
    }
    for (const p of packages) {
      expect(p.clues).toHaveLength(3);
      expect(p.why).toBeTruthy();
    }
  });

  test("clues arrive in thirds, the clock tightens, braver answers score more", () => {
    expect(cluesAt(0, 9000)).toBe(1);
    expect(cluesAt(3000, 9000)).toBe(2);
    expect(cluesAt(8999, 9000)).toBe(3);
    expect(secondsFor(0)).toBe(15);
    expect(secondsFor(1)).toBe(10);
    expect(secondsFor(100)).toBe(6);
    expect([1, 2, 3].map(pointsFor)).toEqual([3, 2, 1]);
  });

  test("the server recomputes a run's score instead of trusting it", () => {
    const [a, b, c] = packages;
    expect(scoreRun([right(a.id, 1), right(b.id, 3), wrong(c.id)])).toBe(4);
  });

  test("runs that could not happen are refused", () => {
    const [a, b, c, d] = packages;
    expect(scoreRun("lots")).toBeNull();
    expect(scoreRun([right(a.id), right(a.id)])).toBeNull();
    expect(scoreRun([{ id: "made-up", given: "safe", clues: 1 }])).toBeNull();
    expect(scoreRun([{ ...right(a.id), clues: 0 }])).toBeNull();
    expect(scoreRun([{ ...right(a.id), clues: 1.5 }])).toBeNull();
    expect(
      scoreRun([{ id: a.id, given: "maybe" as Verdict, clues: 1 }]),
    ).toBeNull();
    // Nothing after the last life.
    const out = [wrong(a.id), wrong(b.id), wrong(c.id)];
    expect(isOver(out)).toBe(true);
    expect(out.length).toBe(lives);
    expect(scoreRun([...out, right(d.id)])).toBeNull();
  });

  test("a shuffle keeps every package", () => {
    const shuffled = shuffle(packages, () => 0.42);
    expect(shuffled).toHaveLength(packages.length);
    expect(new Set(shuffled)).toEqual(new Set(packages));
  });
});

describe("high scores", () => {
  test("initials are three letters, upper-cased", () => {
    expect(cleanInitials("abc")).toBe("ABC");
    expect(cleanInitials(" Mud ")).toBe("MUD");
    for (const bad of ["ab", "abcd", "a1c", "<b>", "", 123, null]) {
      expect(cleanInitials(bad)).toBeNull();
    }
  });

  test("snake scores must be possible", () => {
    const base = { game: "snake", initials: "abc" };
    expect(parseSubmission({ ...base, score: 12 })).toEqual({
      game: "snake",
      initials: "ABC",
      score: 12,
    });
    for (const score of [0, -1, 2.5, "12", cols * rows, 1e9]) {
      expect(parseSubmission({ ...base, score })).toBeNull();
    }
  });

  test("a triage score comes from its answers, whatever is claimed", () => {
    const [a] = packages;
    const answers = [{ id: a.id, given: a.answer, clues: 1 }];
    expect(
      parseSubmission({ game: "triage", initials: "abc", score: 999, answers }),
    ).toEqual({ game: "triage", initials: "ABC", score: 3 });
    // Nothing right, nothing to save.
    expect(
      parseSubmission({
        game: "triage",
        initials: "abc",
        answers: [{ id: a.id, given: null, clues: 3 }],
      }),
    ).toBeNull();
  });

  test("anything else is refused", () => {
    for (const body of [
      null,
      "x",
      [],
      { game: "pong", initials: "abc", score: 1 },
      { game: "__proto__", initials: "abc", score: 1 },
      { game: "snake", initials: "a b", score: 1 },
    ]) {
      expect(parseSubmission(body)).toBeNull();
    }
  });
});
