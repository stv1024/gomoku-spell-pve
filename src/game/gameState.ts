import type { Board, HandCard, GameState, Pos } from "../types";
import { initBoard } from "../engine/board";
import { LEVELS } from "../levels/levels";

export type GameAction =
  | { type: "START_GAME"; levelId: number }
  | { type: "SET_BOARD"; board: Board }
  | { type: "ADD_CARDS"; cards: HandCard[] }
  | { type: "REMOVE_CARD"; cardId: string }
  | { type: "SET_PHASE"; phase: GameState["phase"] }
  | { type: "SET_TURN"; turn: GameState["currentTurn"] }
  | { type: "INCREMENT_TURN" }
  | { type: "SET_SKILL_USED"; value: boolean }
  | { type: "SET_CHOICE_PENDING"; resolve: ((pos: Pos) => void) | null; candidates: Pos[] }
  | { type: "SET_TAUNT"; taunt: string | null }
  | { type: "RESET_SELECTING" };

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
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const level = LEVELS.find((l) => l.id === action.levelId);
      if (!level) return state;
      return {
        ...state,
        board: initBoard(level.blackStones),
        levelId: action.levelId,
        currentTurn: "player",
        turnNumber: 0,
        hand: [],
        phase: "cardPicking", // start with card picking
        skillUsedThisTurn: false,
        pendingChoiceResolve: null,
        choiceCandidates: [],
        taunt: null,
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
    case "SET_PHASE":
      return { ...state, phase: action.phase };
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
    case "RESET_SELECTING":
      return createInitialState();
    default:
      return state;
  }
}
