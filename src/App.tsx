import { useReducer, useCallback, useState, useRef, useEffect } from "react";
import type { Pos, Skill } from "./types";
import { gameReducer, createInitialState } from "./game/gameState";
import { placeStoneTo } from "./engine/board";
import { checkWin } from "./engine/rules";
import { aiMove } from "./engine/ai";
import { executeSkill } from "./engine/skillSandbox";
import { makeCard, pickRandomPresetSkills } from "./game/cardSystem";
import { LEVELS } from "./levels/levels";
import { generateSkill } from "./ai/skillGenerator";
import { skillCache } from "./ai/skillCache";
import { getRandomTaunt } from "./data/taunts";

import Board from "./components/Board";
import HandCards from "./components/HandCards";
import CardPicker from "./components/CardPicker";
import OpponentDialog from "./components/OpponentDialog";
import SettingsPanel from "./components/SettingsPanel";
import LevelSelect from "./components/LevelSelect";

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Card picker state
  const [pickerCards, setPickerCards] = useState<Skill[]>([]);
  const [isGeneratingThird, setIsGeneratingThird] = useState(false);
  const [generatedThird, setGeneratedThird] = useState<Skill | null>(null);

  // Use a ref to hold the pendingChoiceResolve so we can call it from board clicks
  const pendingResolveRef = useRef<((pos: Pos) => void) | null>(null);

  const apiKey = localStorage.getItem("openrouter_api_key") || "";
  const model = localStorage.getItem("openrouter_model") || "anthropic/claude-sonnet-4";

  // Trigger AI turn with small delay for UX
  const aiTurnInProgress = useRef(false);

  const runAiTurn = useCallback(
    (board: typeof state.board) => {
      if (aiTurnInProgress.current) return;
      aiTurnInProgress.current = true;

      setTimeout(() => {
        const level = LEVELS.find((l) => l.id === state.levelId);
        if (!level) return;

        const pos = aiMove(board, level.aiLevel);
        const newBoard = placeStoneTo(board, pos, "black");
        dispatch({ type: "SET_BOARD", board: newBoard });

        const winner = checkWin(newBoard);
        if (winner === "black") {
          dispatch({ type: "SET_TAUNT", taunt: getRandomTaunt("winning") });
          dispatch({ type: "SET_PHASE", phase: "lost" });
          aiTurnInProgress.current = false;
          return;
        }

        dispatch({ type: "INCREMENT_TURN" });

        // Check if next turn needs card pick (every 3 turns, turnNumber is 0-based player turns)
        const nextTurnNumber = state.turnNumber + 1;
        if (nextTurnNumber > 0 && nextTurnNumber % 3 === 0 && state.hand.length < 5) {
          triggerCardPick();
        } else {
          dispatch({ type: "SET_PHASE", phase: "playerTurn" });
        }

        dispatch({ type: "SET_SKILL_USED", value: false });
        aiTurnInProgress.current = false;
      }, 600);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.levelId, state.turnNumber, state.hand.length]
  );

  function triggerCardPick() {
    const existing = state.hand.map((c) => c.skill.name);
    const twoCards = pickRandomPresetSkills(2, existing);
    setPickerCards(twoCards);
    setGeneratedThird(null);
    dispatch({ type: "SET_PHASE", phase: "cardPicking" });
  }

  function handleLevelSelect(levelId: number) {
    skillCache.clear();
    dispatch({ type: "START_GAME", levelId });
    // Phase is set to cardPicking in reducer START_GAME
    const existing: string[] = [];
    const twoCards = pickRandomPresetSkills(2, existing);
    setPickerCards(twoCards);
    setGeneratedThird(null);
    setSelectedCardId(null);
    aiTurnInProgress.current = false;
  }

  function handleCardPicked(skill: Skill) {
    const card = makeCard(skill);
    dispatch({ type: "ADD_CARDS", cards: [card] });
    dispatch({ type: "SET_PHASE", phase: "playerTurn" });
  }

  async function handleGenerateThird(idiom: string) {
    setIsGeneratingThird(true);
    try {
      const skill = await generateSkill(idiom, apiKey, model);
      setGeneratedThird(skill);
    } finally {
      setIsGeneratingThird(false);
    }
  }

  function handleCellClick(pos: Pos) {
    const { phase, board } = state;

    // Skill choice mode
    if (phase === "skillExecuting") {
      if (pendingResolveRef.current) {
        const resolve = pendingResolveRef.current;
        pendingResolveRef.current = null;
        dispatch({ type: "SET_CHOICE_PENDING", resolve: null, candidates: [] });
        resolve(pos);
      }
      return;
    }

    // Normal placement
    if (phase !== "playerTurn") return;
    if (board[pos.row][pos.col] !== null) return;

    const newBoard = placeStoneTo(board, pos, "white");
    dispatch({ type: "SET_BOARD", board: newBoard });

    const winner = checkWin(newBoard);
    if (winner === "white") {
      dispatch({ type: "SET_PHASE", phase: "won" });
      dispatch({ type: "SET_TAUNT", taunt: getRandomTaunt("losing") });
      return;
    }

    // Taunt on white threaten
    const whites = newBoard.flat().filter((c) => c === "white").length;
    if (whites > 0 && Math.random() < 0.3) {
      dispatch({ type: "SET_TAUNT", taunt: getRandomTaunt("playerThreaten") });
    }

    setSelectedCardId(null);
    dispatch({ type: "SET_PHASE", phase: "aiTurn" });
    runAiTurn(newBoard);
  }

  async function handleUseCard(cardId: string) {
    const { phase, board, skillUsedThisTurn } = state;
    if (phase !== "playerTurn") return;
    if (skillUsedThisTurn) return;

    const card = state.hand.find((c) => c.id === cardId);
    if (!card) return;

    dispatch({ type: "SET_PHASE", phase: "skillExecuting" });
    dispatch({ type: "SET_SKILL_USED", value: true });
    dispatch({ type: "REMOVE_CARD", cardId });
    setSelectedCardId(null);

    const onRequestChoice = (candidates: Pos[]): Promise<Pos> => {
      return new Promise((resolve) => {
        pendingResolveRef.current = resolve;
        dispatch({ type: "SET_CHOICE_PENDING", resolve, candidates });
      });
    };

    try {
      const newBoard = await executeSkill(board, card.skill.executeCode, onRequestChoice);
      if (newBoard) {
        dispatch({ type: "SET_BOARD", board: newBoard });
        // Check if white wins after skill
        if (checkWin(newBoard) === "white") {
          dispatch({ type: "SET_PHASE", phase: "won" });
          dispatch({ type: "SET_TAUNT", taunt: getRandomTaunt("losing") });
          return;
        }
      } else {
        // Rollback: skill failed or caused black win - refund card
        dispatch({ type: "ADD_CARDS", cards: [card] });
        dispatch({ type: "SET_SKILL_USED", value: false });
      }
      dispatch({ type: "SET_CHOICE_PENDING", resolve: null, candidates: [] });
      dispatch({ type: "SET_PHASE", phase: "playerTurn" });
      dispatch({ type: "SET_TAUNT", taunt: getRandomTaunt("skillUsed") });
    } catch {
      dispatch({ type: "ADD_CARDS", cards: [card] });
      dispatch({ type: "SET_SKILL_USED", value: false });
      dispatch({ type: "SET_CHOICE_PENDING", resolve: null, candidates: [] });
      dispatch({ type: "SET_PHASE", phase: "playerTurn" });
    }
  }

  function handleCardClick(cardId: string) {
    if (state.phase !== "playerTurn" || state.skillUsedThisTurn) return;
    if (selectedCardId === cardId) {
      // Second click = use card
      handleUseCard(cardId);
    } else {
      setSelectedCardId(cardId);
    }
  }

  // Opening taunt
  useEffect(() => {
    if (state.phase === "playerTurn" && state.turnNumber === 0) {
      dispatch({ type: "SET_TAUNT", taunt: getRandomTaunt("opening") });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.levelId]);

  const level = LEVELS.find((l) => l.id === state.levelId);

  if (state.phase === "selecting") {
    return (
      <>
        <LevelSelect onSelect={handleLevelSelect} onSettings={() => setShowSettings(true)} />
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </>
    );
  }

  const phaseLabel: Record<string, string> = {
    playerTurn: "你的回合",
    skillExecuting: "选择目标",
    aiTurn: "对手落子中…",
    cardPicking: "选择技能卡",
    won: "🎉 你赢了！",
    lost: "😢 你输了！",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-700 flex flex-col items-center py-4 px-2">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-3">
        <button
          onClick={() => dispatch({ type: "RESET_SELECTING" })}
          className="text-amber-200 hover:text-white text-sm"
        >
          ← 返回
        </button>
        <div className="text-amber-100 font-bold text-sm">
          {level?.name} — 回合 {state.turnNumber + 1}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-amber-200 hover:text-white text-sm"
        >
          ⚙️
        </button>
      </div>

      {/* Opponent dialog */}
      <div className="w-full max-w-lg mb-3">
        <OpponentDialog
          taunt={state.taunt}
          onDismiss={() => dispatch({ type: "SET_TAUNT", taunt: null })}
        />
      </div>

      {/* Phase status */}
      <div
        className={`text-sm font-semibold mb-2 px-3 py-1 rounded-full ${
          state.phase === "playerTurn"
            ? "bg-blue-100 text-blue-700"
            : state.phase === "skillExecuting"
            ? "bg-yellow-100 text-yellow-700"
            : state.phase === "aiTurn"
            ? "bg-red-100 text-red-700"
            : state.phase === "won"
            ? "bg-green-100 text-green-700"
            : state.phase === "lost"
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        {phaseLabel[state.phase] ?? state.phase}
      </div>

      {/* Skill use hint */}
      {state.phase === "playerTurn" && !state.skillUsedThisTurn && state.hand.length > 0 && (
        <div className="text-xs text-amber-200 mb-1">
          {selectedCardId ? "再次点击卡片使用，或点击下方其他卡片取消" : "点击下方技能卡使用（可选），然后落子"}
        </div>
      )}
      {state.phase === "skillExecuting" && (
        <div className="text-xs text-yellow-200 mb-1 animate-pulse">点击高亮格子选择目标</div>
      )}

      {/* Board */}
      <Board
        board={state.board}
        phase={state.phase}
        choiceCandidates={state.choiceCandidates}
        onCellClick={handleCellClick}
      />

      {/* Hand cards */}
      <div className="w-full max-w-lg mt-4">
        <HandCards
          hand={state.hand}
          selectedCardId={selectedCardId}
          onSelectCard={handleCardClick}
          disabled={state.phase !== "playerTurn"}
          skillUsedThisTurn={state.skillUsedThisTurn}
        />
      </div>

      {/* Won / Lost overlay */}
      {(state.phase === "won" || state.phase === "lost") && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4">
            <div className="text-5xl mb-4">{state.phase === "won" ? "🎉" : "😢"}</div>
            <div className="text-2xl font-bold mb-2 text-gray-800">
              {state.phase === "won" ? "胜利！" : "失败"}
            </div>
            <div className="text-gray-500 mb-6">
              {state.phase === "won" ? "你用技能翻盘了！" : "黑子连成五子，再试一次？"}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleLevelSelect(state.levelId)}
                className="bg-blue-500 text-white rounded-lg px-5 py-2 font-medium hover:bg-blue-600 transition-colors"
              >
                再来一局
              </button>
              <button
                onClick={() => dispatch({ type: "RESET_SELECTING" })}
                className="bg-gray-200 text-gray-700 rounded-lg px-5 py-2 font-medium hover:bg-gray-300 transition-colors"
              >
                选择关卡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card picker */}
      {state.phase === "cardPicking" && (
        <CardPicker
          cards={pickerCards}
          thirdCardLocked={!apiKey}
          apiKey={apiKey}
          isGenerating={isGeneratingThird}
          onPick={handleCardPicked}
          onGenerateThird={handleGenerateThird}
          generatedThird={generatedThird}
        />
      )}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
