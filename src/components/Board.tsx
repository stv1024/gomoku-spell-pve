import type { Board, Pos, GameState } from "../types";
import Stone from "./Stone";

interface Props {
  board: Board;
  phase: GameState["phase"];
  choiceCandidates: Pos[];
  lastMove: Pos | null;
  highlightedCells: Pos[];
  onCellClick: (pos: Pos) => void;
}

export default function BoardComponent({ board, phase, choiceCandidates, lastMove, highlightedCells, onCellClick }: Props) {
  const size = 15;
  const cellSize = 40; // px
  const boardPx = (size - 1) * cellSize;

  const candidateSet = new Set(choiceCandidates.map((p) => `${p.row},${p.col}`));
  const highlightSet = new Set(highlightedCells.map((p) => `${p.row},${p.col}`));
  const lastMoveKey = lastMove ? `${lastMove.row},${lastMove.col}` : null;

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
          const cellKey = `${row},${col}`;
          const isCandidate = candidateSet.has(cellKey);
          const isLastMove = cellKey === lastMoveKey;
          const isHighlighted = highlightSet.has(cellKey);
          const isSkillPhase = phase === "skillExecuting";
          const isPlayerPhase = phase === "playerTurn";

          let cursor = "default";
          if (isSkillPhase && isCandidate) cursor = "pointer";
          else if (isPlayerPhase && !cell) cursor = "pointer";

          return (
            <div
              key={cellKey}
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

              {/* Skill effect highlight - brief glow on changed cells */}
              {isHighlighted && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div
                    className="rounded-full w-[90%] h-[90%] border-2 border-cyan-300"
                    style={{
                      boxShadow: "0 0 8px 2px rgba(103, 232, 249, 0.6), inset 0 0 6px rgba(103, 232, 249, 0.3)",
                      animation: "skillGlow 1.5s ease-out forwards",
                    }}
                  />
                </div>
              )}

              {cell && <Stone color={cell} />}

              {/* Last move indicator - small red dot */}
              {isLastMove && cell && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div
                    className="rounded-full w-[22%] h-[22%]"
                    style={{
                      backgroundColor: cell === "black" ? "#ef4444" : "#ef4444",
                      boxShadow: "0 0 4px 1px rgba(239, 68, 68, 0.6)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })
      )}

      {/* CSS for skill effect animation */}
      <style>{`
        @keyframes skillGlow {
          0% { opacity: 1; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
