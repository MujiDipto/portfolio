// Snake, the classic: pure rules, no React, so they are easy to test. The
// board is a grid of cells; each tick the snake moves one cell.

export const cols = 20;
export const rows = 12;

export type Point = { x: number; y: number };
export type Direction = "up" | "down" | "left" | "right";

export type Snake = {
  /** Head first. */
  body: Point[];
  /** Where the next tick goes. */
  direction: Direction;
  /** Where the last tick went: turns are checked against it, so two quick
   * turns within one tick cannot reverse the snake into itself. */
  heading: Direction;
  food: Point;
  score: number;
  over: boolean;
};

const moves: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const opposite: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

/** A free cell for the food; `random` is injectable so tests are exact. */
export function placeFood(body: Point[], random = Math.random): Point {
  const free: Point[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!body.some((p) => p.x === x && p.y === y)) free.push({ x, y });
    }
  }
  return free[Math.floor(random() * free.length)] ?? { x: 0, y: 0 };
}

export function newGame(random = Math.random): Snake {
  const body = [
    { x: 6, y: 6 },
    { x: 5, y: 6 },
    { x: 4, y: 6 },
  ];
  return {
    body,
    direction: "right",
    heading: "right",
    food: placeFood(body, random),
    score: 0,
    over: false,
  };
}

/** Turns, unless the turn would reverse straight into the snake's own body. */
export function turn(game: Snake, direction: Direction): Snake {
  if (game.over || direction === opposite[game.heading]) return game;
  return { ...game, direction };
}

/** One tick: move, eat (grow and score) or crash into a wall or itself. */
export function step(game: Snake, random = Math.random): Snake {
  if (game.over) return game;
  const move = moves[game.direction];
  const head = { x: game.body[0].x + move.x, y: game.body[0].y + move.y };
  const eats = same(head, game.food);
  // The tail moves away this tick unless the snake grows, so it is safe.
  const body = eats ? game.body : game.body.slice(0, -1);
  const crashes =
    head.x < 0 ||
    head.y < 0 ||
    head.x >= cols ||
    head.y >= rows ||
    body.some((p) => same(p, head));
  if (crashes) return { ...game, over: true };
  const next = [head, ...body];
  return {
    ...game,
    body: next,
    heading: game.direction,
    food: eats ? placeFood(next, random) : game.food,
    score: eats ? game.score + 1 : game.score,
  };
}

/** The board as lines of text: @ head, o body, * food, · empty. */
export function draw(game: Snake): string[] {
  const lines: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const at = { x, y };
      if (same(game.body[0], at)) line += "@";
      else if (game.body.some((p) => same(p, at))) line += "o";
      else if (same(game.food, at)) line += "*";
      else line += "·";
    }
    lines.push(line);
  }
  return lines;
}
