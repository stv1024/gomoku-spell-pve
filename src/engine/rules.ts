import type { Board, Color } from "../types";

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function checkWin(board: Board): Color | null {
  const size = board.length;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const color = board[row][col];
      if (!color) continue;
      for (const [dr, dc] of DIRECTIONS) {
        let count = 1;
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === color) {
          count++;
          r += dr;
          c += dc;
        }
        if (count >= 5) return color;
      }
    }
  }
  return null;
}
