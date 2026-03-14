import type { Board, Cell, Color, Pos, BoardAPI } from "../types";

export function createBoardAPI(
  board: Board,
  onRequestChoice: (candidates: Pos[]) => Promise<Pos>
): BoardAPI {
  const size = board.length;

  function inBounds(row: number, col: number): boolean {
    return row >= 0 && row < size && col >= 0 && col < size;
  }

  return {
    get(row: number, col: number): Cell {
      if (!inBounds(row, col)) return null;
      return board[row][col];
    },

    findAll(color: Color): Pos[] {
      const result: Pos[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r][c] === color) result.push({ row: r, col: c });
        }
      }
      return result;
    },

    findEmpty(): Pos[] {
      const result: Pos[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r][c] === null) result.push({ row: r, col: c });
        }
      }
      return result;
    },

    countInDirection(row: number, col: number, color: Color, dr: number, dc: number): number {
      let count = 0;
      let r = row + dr;
      let c = col + dc;
      while (inBounds(r, c) && board[r][c] === color) {
        count++;
        r += dr;
        c += dc;
      }
      return count;
    },

    getBoardSize(): number {
      return size;
    },

    place(row: number, col: number, color: Color): void {
      if (!inBounds(row, col)) return;
      if (board[row][col] !== null) return;
      board[row][col] = color;
    },

    remove(row: number, col: number): void {
      if (!inBounds(row, col)) return;
      if (board[row][col] === null) return;
      board[row][col] = null;
    },

    transform(row: number, col: number, newColor: Color): void {
      if (!inBounds(row, col)) return;
      if (board[row][col] === null) return;
      if (board[row][col] === newColor) return;
      board[row][col] = newColor;
    },

    move(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
      if (!inBounds(fromRow, fromCol) || !inBounds(toRow, toCol)) return;
      if (board[fromRow][fromCol] === null) return;
      if (board[toRow][toCol] !== null) return;
      board[toRow][toCol] = board[fromRow][fromCol];
      board[fromRow][fromCol] = null;
    },

    swap(r1: number, c1: number, r2: number, c2: number): void {
      if (!inBounds(r1, c1) || !inBounds(r2, c2)) return;
      if (board[r1][c1] === null && board[r2][c2] === null) return;
      const tmp = board[r1][c1];
      board[r1][c1] = board[r2][c2];
      board[r2][c2] = tmp;
    },

    requestChoice(candidates: Pos[]): Promise<Pos> {
      return onRequestChoice(candidates);
    },
  };
}
