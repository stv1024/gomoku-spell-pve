import type { Board, Pos } from "../types";
import { cloneBoard } from "./board";
import { createBoardAPI } from "./boardAPI";
import { checkWin } from "./rules";

export async function executeSkill(
  board: Board,
  executeCode: string,
  onRequestChoice: (candidates: Pos[]) => Promise<Pos>
): Promise<Board | null> {
  const workingBoard = cloneBoard(board);
  const api = createBoardAPI(workingBoard, onRequestChoice);

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("api", `return (async () => { ${executeCode} })()`);
    await fn(api);

    // Check if black won as result of skill
    if (checkWin(workingBoard) === "black") {
      console.warn("[skillSandbox] Skill caused black win, rolling back");
      return null; // signal rollback
    }

    return workingBoard;
  } catch (err) {
    console.error("[skillSandbox] Error executing skill:", err);
    return null; // signal rollback
  }
}
