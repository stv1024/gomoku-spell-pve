import type { Board, Pos, Color } from "../types";

export function createBoard(): Board {
  return Array.from({ length: 15 }, () => Array(15).fill(null));
}

export function initBoard(blackStones: Pos[]): Board {
  const board = createBoard();
  for (const pos of blackStones) {
    board[pos.row][pos.col] = "black";
  }
  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function placeStoneTo(board: Board, pos: Pos, color: Color): Board {
  const next = cloneBoard(board);
  next[pos.row][pos.col] = color;
  return next;
}
