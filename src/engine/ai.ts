import type { Board, Pos } from "../types";

const SIZE = 15;
const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/* ── Pattern scores ── */
const SCORE_FIVE = 100000;
const SCORE_LIVE_FOUR = 50000;
const SCORE_RUSH_FOUR = 5000; // 冲四 (dead four, one open end)
const SCORE_LIVE_THREE = 2000;
const SCORE_SLEEP_THREE = 200;
const SCORE_LIVE_TWO = 50;
const SCORE_SLEEP_TWO = 10;

/* ── Combined threat bonuses ── */
const BONUS_DOUBLE_LIVE_THREE = 30000; // 双活三 → almost unstoppable
const BONUS_RUSH_FOUR_PLUS_LIVE_THREE = 40000; // 冲四 + 活三

function patternScore(count: number, openEnds: number): number {
  if (count >= 5) return SCORE_FIVE;
  if (count === 4) {
    if (openEnds >= 2) return SCORE_LIVE_FOUR;
    if (openEnds === 1) return SCORE_RUSH_FOUR;
  }
  if (count === 3) {
    if (openEnds >= 2) return SCORE_LIVE_THREE;
    if (openEnds === 1) return SCORE_SLEEP_THREE;
  }
  if (count === 2) {
    if (openEnds >= 2) return SCORE_LIVE_TWO;
    if (openEnds === 1) return SCORE_SLEEP_TWO;
  }
  if (count === 1 && openEnds >= 2) return 3;
  return 0;
}

/**
 * Analyze one direction from (row, col) for the given color,
 * assuming the stone is already placed on the board.
 */
function analyzeDir(
  board: Board,
  row: number,
  col: number,
  color: "black" | "white",
  dr: number,
  dc: number,
): { count: number; openEnds: number } {
  let count = 1;
  let openEnds = 0;

  // forward
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === color) {
    count++;
    r += dr;
    c += dc;
  }
  if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === null) openEnds++;

  // backward
  r = row - dr;
  c = col - dc;
  while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === color) {
    count++;
    r -= dr;
    c -= dc;
  }
  if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === null) openEnds++;

  return { count, openEnds };
}

/**
 * Evaluate how valuable placing `color` at (row, col) is.
 * Mutates board temporarily for speed, restores before returning.
 */
function evaluate(board: Board, row: number, col: number, color: "black" | "white"): number {
  board[row][col] = color;

  const dirScores: number[] = [];
  for (const [dr, dc] of DIRS) {
    const { count, openEnds } = analyzeDir(board, row, col, color, dr, dc);
    dirScores.push(patternScore(count, openEnds));
  }

  board[row][col] = null; // restore

  let total = 0;
  let liveThrees = 0;
  let rushFours = 0;

  for (const s of dirScores) {
    total += s;
    if (s >= SCORE_FIVE) return SCORE_FIVE; // immediate win/block
    if (s >= SCORE_LIVE_FOUR) return SCORE_LIVE_FOUR;
    if (s >= SCORE_RUSH_FOUR) rushFours++;
    if (s >= SCORE_LIVE_THREE && s < SCORE_RUSH_FOUR) liveThrees++;
  }

  // Combined threat bonuses
  if (rushFours >= 1 && liveThrees >= 1) total += BONUS_RUSH_FOUR_PLUS_LIVE_THREE;
  else if (liveThrees >= 2) total += BONUS_DOUBLE_LIVE_THREE;
  else if (rushFours >= 2) total += BONUS_DOUBLE_LIVE_THREE; // double rush-four is also strong

  return total;
}

/**
 * Collect candidate positions: empty cells within distance 2 of any stone.
 * Falls back to center if board is empty.
 */
function getCandidates(board: Board): Pos[] {
  const set = new Set<number>();
  const RANGE = 2;

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === null) continue;
      for (let dr = -RANGE; dr <= RANGE; dr++) {
        for (let dc = -RANGE; dc <= RANGE; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === null) {
            set.add(nr * SIZE + nc);
          }
        }
      }
    }
  }

  if (set.size === 0) return [{ row: 7, col: 7 }];

  const result: Pos[] = [];
  for (const key of set) {
    result.push({ row: Math.floor(key / SIZE), col: key % SIZE });
  }
  return result;
}

/**
 * AI move — always plays at maximum strength.
 * The AI plays black.
 */
export function aiMove(board: Board): Pos {
  const candidates = getCandidates(board);
  if (candidates.length <= 1) return candidates[0] ?? { row: 7, col: 7 };

  let bestPos = candidates[0];
  let bestScore = -Infinity;

  for (const pos of candidates) {
    const attack = evaluate(board, pos.row, pos.col, "black");
    const defense = evaluate(board, pos.row, pos.col, "white");

    let score: number;

    if (attack >= SCORE_FIVE) {
      // Winning move — highest priority
      score = 2000000;
    } else if (defense >= SCORE_FIVE) {
      // Must block opponent's winning threat
      score = 1000000;
    } else if (attack >= SCORE_LIVE_FOUR) {
      // Creating a live four — essentially winning
      score = 900000;
    } else if (defense >= SCORE_LIVE_FOUR) {
      // Block opponent's live four
      score = 800000;
    } else {
      // General scoring: attack weighted slightly higher
      score = attack * 1.05 + defense;
    }

    // Tiny center bias for equally-scored positions (prefer center play)
    score += (7 - Math.abs(pos.row - 7) + 7 - Math.abs(pos.col - 7)) * 0.1;
    // Small random perturbation for variety among ties
    score += Math.random() * 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestPos = pos;
    }
  }

  return bestPos;
}
