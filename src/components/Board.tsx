import type { Board, Pos, GameState } from "../types";
import Stone from "./Stone";

interface Props {
  board: Board;
  phase: GameState["phase"];
  choiceCandidates: Pos[];
  onCellClick: (pos: Pos) => void;
}

export default function Board({ board, phase, choiceCandidates, onCellClick }: Props) {
  const size = 15;
  const cellSize = 40; // px
  const boardPx = (size - 1) * cellSize;

  const candidateSet = new Set(choiceCandidates.map((p) => `${p.row},${p.col}`));

  return (
    <div
      className="relative select-none mx-auto"
      style={{
        width: boardPx + cellSize,
        height: boardPx + cellSize,
        backgroundColor: "#d4a843",
        borderRadius: 4,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      {/* Grid lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={boardPx + cellSize}
        height={boardPx + cellSize}
      >
        {Array.from({ length: size }).map((_, i) => (
          <g key={i}>
            <line
              x1={cellSize / 2}
              y1={cellSize / 2 + i * cellSize}
              x2={cellSize / 2 + (size - 1) * cellSize}
              y2={cellSize / 2 + i * cellSize}
              stroke="#8B6914"
              strokeWidth={1}
            />
            <line
              x1={cellSize / 2 + i * cellSize}
              y1={cellSize / 2}
              x2={cellSize / 2 + i * cellSize}
              y2={cellSize / 2 + (size - 1) * cellSize}
              stroke="#8B6914"
              strokeWidth={1}
            />
          </g>
        ))}
        {/* Star points */}
        {[
          [3, 3], [3, 11], [7, 7], [11, 3], [11, 11],
        ].map(([r, c]) => (
          <circle
            key={`${r},${c}`}
            cx={cellSize / 2 + c * cellSize}
            cy={cellSize / 2 + r * cellSize}
            r={3}
            fill="#8B6914"
          />
        ))}
      </svg>

      {/* Cells */}
      {Array.from({ length: size }).map((_, row) =>
        Array.from({ length: size }).map((_, col) => {
          const cell = board[row][col];
          const isCandidate = candidateSet.has(`${row},${col}`);
          const isSkillPhase = phase === "skillExecuting";
          const isPlayerPhase = phase === "playerTurn";

          let cursor = "default";
          if (isSkillPhase && isCandidate) cursor = "pointer";
          else if (isPlayerPhase && !cell) cursor = "pointer";

          return (
            <div
              key={`${row},${col}`}
              className="absolute"
              style={{
                left: col * cellSize,
                top: row * cellSize,
                width: cellSize,
                height: cellSize,
                cursor,
                zIndex: 1,
              }}
              onClick={() => onCellClick({ row, col })}
            >
              {/* Highlight for skill choice candidates */}
              {isSkillPhase && isCandidate && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="rounded-full w-[50%] h-[50%] bg-yellow-400 opacity-70 animate-pulse" />
                </div>
              )}
              {cell && <Stone color={cell} />}
            </div>
          );
        })
      )}
    </div>
  );
}
