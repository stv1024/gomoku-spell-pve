import type { Board, HandCard, GameState, Pos, RunState } from "../types";
import { initBoard } from "../engine/board";
import { LEVELS } from "../levels/levels";

export type GameAction =
  | { type: "START_GAME"; levelId: number }
  | { type: "START_RUN" }
  | { type: "NEXT_ENCOUNTER" }
  | { type: "SET_BOARD"; board: Board }
  | { type: "ADD_CARDS"; cards: HandCard[] }
  | { type: "REMOVE_CARD"; cardId: string }
  | { type: "SET_PHASE"; phase: GameState["phase"] }
  | { type: "SET_TURN"; turn: GameState["currentTurn"] }
  | { type: "INCREMENT_TURN" }
  | { type: "SET_SKILL_USED"; value: boolean }
  | { type: "SET_CHOICE_PENDING"; resolve: ((pos: Pos) => void) | null; candidates: Pos[] }
  | { type: "SET_TAUNT"; taunt: string | null }
  | { type: "SET_LAST_MOVE"; pos: Pos | null }
  | { type: "SET_HIGHLIGHTED_CELLS"; cells: Pos[] }
  | { type: "RESET_SELECTING" };

const DEFAULT_RUN: RunState = {
  active: false,
  encounterIndex: 0,
  encounterOrder: [],
  persistentHand: [],
};

export function createInitialState(): GameState {
  return {
    board: Array.from({ length: 15 }, () => Array(15).fill(null)),
    currentTurn: "player",
    turnNumber: 0,
    hand: [],
    phase: "selecting",
    levelId: 0,
    skillUsedThisTurn: false,
    pendingChoiceResolve: null,
    choiceCandidates: [],
    taunt: null,
    lastMove: null,
    highlightedCells: [],
    run: { ...DEFAULT_RUN },
  };
}

/** Start a specific encounter within a run (or standalone) */
function startEncounter(state: GameState, levelId: number, carryHand: HandCard[]): GameState {
  const level = LEVELS.find((l) => l.id === levelId);
  if (!level) return state;
  return {
    ...state,
    board: initBoard(level.blackStones),
    levelId,
    currentTurn: "player",
    turnNumber: 0,
    hand: carryHand,
    phase: "cardPicking",
    skillUsedThisTurn: false,
    pendingChoiceResolve: null,
    choiceCandidates: [],
    taunt: null,
    lastMove: null,
    highlightedCells: [],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_RUN": {
      // Start a new run: use all 10 levels in order
      const encounterOrder = LEVELS.map((l) => l.id);
      const firstLevelId = encounterOrder[0];
      const level = LEVELS.find((l) => l.id === firstLevelId);
      if (!level) return state;
      return {
        ...startEncounter(state, firstLevelId, []),
        run: {
          active: true,
          encounterIndex: 0,
          encounterOrder,
          persistentHand: [],
        },
      };
    }

    case "NEXT_ENCOUNTER": {
      const { run } = state;
      if (!run.active) return state;
      const nextIndex = run.encounterIndex + 1;
      if (nextIndex >= run.encounterOrder.length) {
        // Run complete!
        return {
          ...state,
          phase: "runComplete",
          run: { ...run, encounterIndex: nextIndex },
        };
      }
      const nextLevelId = run.encounterOrder[nextIndex];
      return {
        ...startEncounter(state, nextLevelId, run.persistentHand),
        run: {
          ...run,
          encounterIndex: nextIndex,
        },
      };
    }

    case "START_GAME": {
      const level = LEVELS.find((l) => l.id === action.levelId);
      if (!level) return state;
      // Standalone mode (not a run)
      return {
        ...startEncounter(state, action.levelId, []),
        run: { ...DEFAULT_RUN },
      };
    }

    case "SET_BOARD":
      return { ...state, board: action.board };

    case "ADD_CARDS":
      return {
        ...state,
        hand: [...state.hand, ...action.cards].slice(0, 5),
      };

    case "REMOVE_CARD":
      return { ...state, hand: state.hand.filter((c) => c.id !== action.cardId) };

    case "SET_PHASE": {
      const newState = { ...state, phase: action.phase };
      // When entering rewardPicking phase, save current hand to persistent
      if (action.phase === "rewardPicking" && state.run.active) {
        newState.run = {
          ...state.run,
          persistentHand: [...state.hand],
        };
      }
      return newState;
    }

    case "SET_TURN":
      return { ...state, currentTurn: action.turn };

    case "INCREMENT_TURN":
      return { ...state, turnNumber: state.turnNumber + 1 };

    case "SET_SKILL_USED":
      return { ...state, skillUsedThisTurn: action.value };

    case "SET_CHOICE_PENDING":
      return {
        ...state,
        pendingChoiceResolve: action.resolve,
        choiceCandidates: action.candidates,
      };

    case "SET_TAUNT":
      return { ...state, taunt: action.taunt };

    case "SET_LAST_MOVE":
      return { ...state, lastMove: action.pos };

    case "SET_HIGHLIGHTED_CELLS":
      return { ...state, highlightedCells: action.cells };

    case "RESET_SELECTING":
      return createInitialState();

    default:
      return state;
  }
}
