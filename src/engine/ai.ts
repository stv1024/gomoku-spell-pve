import type { Board, Pos } from "../types";
import { cloneBoard, placeStoneTo } from "./board";

function findEmpty(board: Board): Pos[] {
  const result: Pos[] = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === null) result.push({ row, col });
    }
  }
  return result;
}

function maxLine(board: Board, pos: Pos, color: "black" | "white"): number {
  const size = board.length;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  let max = 0;
  for (const [dr, dc] of directions) {
    let count = 1;
    for (const sign of [1, -1]) {
      let r = pos.row + sign * dr;
      let c = pos.col + sign * dc;
      while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === color) {
        count++;
        r += sign * dr;
        c += sign * dc;
      }
    }
    if (count > max) max = count;
  }
  return max;
}

function scoreBoard(board: Board, pos: Pos): number {
  const attackBoard = placeStoneTo(board, pos, "black");
  const attackScore = maxLine(attackBoard, pos, "black");

  const defenseBoard = placeStoneTo(board, pos, "white");
  const defenseScore = maxLine(defenseBoard, pos, "white");

  return attackScore * 1.0 + defenseScore * 1.2;
}

// Evaluate a position using pattern matching for intermediate AI
function evaluatePosition(board: Board, pos: Pos, color: "black" | "white"): number {
  const size = board.length;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  let total = 0;
  for (const [dr, dc] of directions) {
    let count = 1;
    let openEnds = 0;
    // forward
    let r = pos.row + dr;
    let c = pos.col + dc;
    while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === color) {
      count++;
      r += dr;
      c += dc;
    }
    if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === null) openEnds++;
    // backward
    r = pos.row - dr;
    c = pos.col - dc;
    while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === color) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === null) openEnds++;

    if (count >= 5) total += 100000;
    else if (count === 4 && openEnds >= 1) total += 10000;
    else if (count === 3 && openEnds === 2) total += 1000;
    else if (count === 3 && openEnds === 1) total += 100;
    else if (count === 2 && openEnds === 2) total += 10;
    else if (count === 2 && openEnds === 1) total += 5;
  }
  return total;
}

function intermediateScore(board: Board, pos: Pos): number {
  const testBoard = placeStoneTo(board, pos, "black");
  const attack = evaluatePosition(testBoard, pos, "black");

  const defBoard = placeStoneTo(board, pos, "white");
  const defense = evaluatePosition(defBoard, pos, "white");

  return attack + defense * 1.1;
}

export function aiMove(
  board: Board,
  level: "random" | "basic" | "intermediate"
): Pos {
  const empty = findEmpty(board);
  if (empty.length === 0) return { row: 7, col: 7 };

  if (level === "random") {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (level === "basic") {
    let best = empty[0];
    let bestScore = -Infinity;
    for (const pos of empty) {
      const s = scoreBoard(board, pos);
      if (s > bestScore || (s === bestScore && Math.random() < 0.1)) {
        bestScore = s;
        best = pos;
      }
    }
    return best;
  }

  // intermediate: use enhanced scoring
  // First check immediate win or block
  for (const pos of empty) {
    const t = placeStoneTo(board, pos, "black");
    // Check win
    if (checkImmediateWin(t, "black")) return pos;
  }
  for (const pos of empty) {
    const t = placeStoneTo(board, pos, "white");
    if (checkImmediateWin(t, "white")) return pos;
  }

  let best = empty[0];
  let bestScore = -Infinity;
  for (const pos of empty) {
    const s = intermediateScore(cloneBoard(board), pos);
    if (s > bestScore || (s === bestScore && Math.random() < 0.05)) {
      bestScore = s;
      best = pos;
    }
  }
  return best;
}

function checkImmediateWin(board: Board, color: "black" | "white"): boolean {
  const size = board.length;
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] !== color) continue;
      for (const [dr, dc] of dirs) {
        let count = 1;
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === color) {
          count++;
          r += dr;
          c += dc;
        }
        if (count >= 5) return true;
      }
    }
  }
  return false;
}
