import { useReducer, useCallback, useState, useRef, useEffect } from "react";
import type { Pos, Skill, Board } from "./types";
import { gameReducer, createInitialState } from "./game/gameState";
import { placeStoneTo } from "./engine/board";
import { checkWin } from "./engine/rules";
import { aiMove } from "./engine/ai";
import { executeSkill } from "./engine/skillSandbox";
import { makeCard, pickRandomPresetSkills, pickRewardSkills, getAvailableRarities } from "./game/cardSystem";
import { LEVELS } from "./levels/levels";
import { generateSkill } from "./ai/skillGenerator";
import { skillCache } from "./ai/skillCache";
import { getRandomTaunt } from "./data/taunts";

import BoardComponent from "./components/Board";
import HandCards from "./components/HandCards";
import CardPicker from "./components/CardPicker";
import OpponentDialog from "./components/OpponentDialog";
import SettingsPanel from "./components/SettingsPanel";
import LevelSelect from "./components/LevelSelect";
import RewardPicker from "./components/RewardPicker";

/** Compare two boards and return positions that changed */
function diffBoards(before: Board, after: Board): Pos[] {
  const changed: Pos[] = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (before[r][c] !== after[r][c]) {
        changed.push({ row: r, col: c });
      }
    }
  }
  return changed;
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Card picker state
  const [pickerCards, setPickerCards] = useState<Skill[]>([]);
  const [isGeneratingThird, setIsGeneratingThird] = useState(false);
  const [generatedThird, setGeneratedThird] = useState<Skill | null>(null);

  // Reward picker state
  const [rewardCards, setRewardCards] = useState<Skill[]>([]);

  // Use a ref to hold the pendingChoiceResolve so we can call it from board clicks
  const pendingResolveRef = useRef<((pos: Pos) => void) | null>(null);

  const apiKey = localStorage.getItem("openrouter_api_key") || "";
  const model = localStorage.getItem("openrouter_model") || "google/gemini-2.5-flash";

  // Trigger AI turn with small delay for UX
  const aiTurnInProgress = useRef(false);

  /** Get current encounter index for rarity calculation */
  const getEncounterIndex = useCallback(() => {
    if (state.run.active) return state.run.encounterIndex;
    // Standalone mode: use level id as rough encounter index
    return state.levelId - 1;
  }, [state.run, state.levelId]);

  const runAiTurn = useCallback(
    (board: typeof state.board) => {
      if (aiTurnInProgress.current) return;
      aiTurnInProgress.current = true;

      setTimeout(() => {
        const level = LEVELS.find((l) => l.id === state.levelId);
        if (!level) return;

        const pos = aiMove(board);
        const newBoard = placeStoneTo(board, pos, "black");
        dispatch({ type: "SET_BOARD", board: newBoard });
        dispatch({ type: "SET_LAST_MOVE", pos });

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
    const rarities = getAvailableRarities(getEncounterIndex());
    const twoCards = pickRandomPresetSkills(2, existing, rarities);
    setPickerCards(twoCards);
    setGeneratedThird(null);
    dispatch({ type: "SET_PHASE", phase: "cardPicking" });
  }

  function handleLevelSelect(levelId: number) {
    skillCache.clear();
    dispatch({ type: "START_GAME", levelId });
    // Phase is set to cardPicking in reducer START_GAME
    const existing: string[] = [];
    const rarities = getAvailableRarities(levelId - 1);
    const twoCards = pickRandomPresetSkills(2, existing, rarities);
    setPickerCards(twoCards);
    setGeneratedThird(null);
    setSelectedCardId(null);
    aiTurnInProgress.current = false;
  }

  function handleStartRun() {
    skillCache.clear();
    dispatch({ type: "START_RUN" });
    // First encounter starts with cardPicking
    const rarities = getAvailableRarities(0);
    const twoCards = pickRandomPresetSkills(2, [], rarities);
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

  function handleRewardPicked(skill: Skill) {
    // Add reward to persistent hand
    const card = makeCard(skill);
    const newHand = [...state.hand, card].slice(0, 5);
    // Update hand in state
    dispatch({ type: "ADD_CARDS", cards: [card] });
    // Save to persistent hand and advance to next encounter
    const updatedPersistentHand = newHand;
    // We need to update run.persistentHand before NEXT_ENCOUNTER
    // The SET_PHASE to rewardPicking already saved hand, now add the reward
    state.run.persistentHand = updatedPersistentHand;
    dispatch({ type: "NEXT_ENCOUNTER" });

    // Trigger card pick for the new encounter
    setTimeout(() => {
      const nextIndex = state.run.encounterIndex + 1;
      if (nextIndex < state.run.encounterOrder.length) {
        const existing = updatedPersistentHand.map((c) => c.skill.name);
        const rarities = getAvailableRarities(nextIndex);
        const twoCards = pickRandomPresetSkills(2, existing, rarities);
        setPickerCards(twoCards);
        setGeneratedThird(null);
        setSelectedCardId(null);
        aiTurnInProgress.current = false;
      }
    }, 50);
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
    dispatch({ type: "SET_LAST_MOVE", pos });
    dispatch({ type: "SET_HIGHLIGHTED_CELLS", cells: [] });

    const winner = checkWin(newBoard);
    if (winner === "white") {
      // In run mode, go to reward picking instead of just "won"
      if (state.run.active) {
        const nextIndex = state.run.encounterIndex + 1;
        if (nextIndex >= state.run.encounterOrder.length) {
          // Last encounter — run complete!
          dispatch({ type: "SET_PHASE", phase: "runComplete" });
          return;
        }
        // Show reward picker
        const existing = state.hand.map((c) => c.skill.name);
        const rewards = pickRewardSkills(3, existing, state.run.encounterIndex);
        setRewardCards(rewards);
        dispatch({ type: "SET_PHASE", phase: "rewardPicking" });
        dispatch({ type: "SET_TAUNT", taunt: getRandomTaunt("losing") });
        return;
      }
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

    // Snapshot board before skill
    const boardBefore = board.map((row) => [...row]);

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

        // Highlight cells that changed due to skill
        const changed = diffBoards(boardBefore, newBoard);
        if (changed.length > 0) {
          dispatch({ type: "SET_HIGHLIGHTED_CELLS", cells: changed });
          // Auto-clear highlight after animation
          setTimeout(() => dispatch({ type: "SET_HIGHLIGHTED_CELLS", cells: [] }), 1800);
        }

        // Check if white wins after skill
        if (checkWin(newBoard) === "white") {
          if (state.run.active) {
            const nextIndex = state.run.encounterIndex + 1;
            if (nextIndex >= state.run.encounterOrder.length) {
              dispatch({ type: "SET_PHASE", phase: "runComplete" });
              return;
            }
            const existing = state.hand.map((c) => c.skill.name);
            const rewards = pickRewardSkills(3, existing, state.run.encounterIndex);
            setRewardCards(rewards);
            dispatch({ type: "SET_PHASE", phase: "rewardPicking" });
            dispatch({ type: "SET_TAUNT", taunt: getRandomTaunt("losing") });
            return;
          }
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
        <LevelSelect
          onSelect={handleLevelSelect}
          onStartRun={handleStartRun}
          onSettings={() => setShowSettings(true)}
        />
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </>
    );
  }

  const phaseLabel: Record<string, string> = {
    playerTurn: "你的回合",
    skillExecuting: "选择目标",
    aiTurn: "对手落子中…",
    cardPicking: "选择技能卡",
    rewardPicking: "选择奖励",
    won: "🎉 你赢了！",
    lost: "😢 你输了！",
    runComplete: "🏆 通关！",
  };

  const headerLabel = state.run.active
    ? `${level?.name} — 第 ${state.run.encounterIndex + 1}/${state.run.encounterOrder.length} 关 — 回合 ${state.turnNumber + 1}`
    : `${level?.name} — 回合 ${state.turnNumber + 1}`;

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
          {headerLabel}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-amber-200 hover:text-white text-sm"
        >
          ⚙️
        </button>
      </div>

      {/* Opponent dialog - always rendered with fixed height to prevent board shifting */}
      <div className="w-full max-w-lg mb-3 h-12">
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
            : state.phase === "won" || state.phase === "runComplete"
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
      <BoardComponent
        board={state.board}
        phase={state.phase}
        choiceCandidates={state.choiceCandidates}
        lastMove={state.lastMove}
        highlightedCells={state.highlightedCells}
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

      {/* Won / Lost / Run Complete overlay */}
      {(state.phase === "won" || state.phase === "lost" || state.phase === "runComplete") && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4">
            <div className="text-5xl mb-4">
              {state.phase === "runComplete" ? "🏆" : state.phase === "won" ? "🎉" : "😢"}
            </div>
            <div className="text-2xl font-bold mb-2 text-gray-800">
              {state.phase === "runComplete" ? "全部通关！" : state.phase === "won" ? "胜利！" : "失败"}
            </div>
            <div className="text-gray-500 mb-6">
              {state.phase === "runComplete"
                ? "恭喜你完成了所有关卡！"
                : state.phase === "won"
                ? "你用技能翻盘了！"
                : state.run.active
                ? `在第 ${state.run.encounterIndex + 1} 关失败了，Run 结束`
                : "黑子连成五子，再试一次？"}
            </div>
            <div className="flex gap-3 justify-center">
              {!state.run.active && state.phase !== "runComplete" && (
                <button
                  onClick={() => handleLevelSelect(state.levelId)}
                  className="bg-blue-500 text-white rounded-lg px-5 py-2 font-medium hover:bg-blue-600 transition-colors"
                >
                  再来一局
                </button>
              )}
              {state.run.active && state.phase === "lost" && (
                <button
                  onClick={handleStartRun}
                  className="bg-blue-500 text-white rounded-lg px-5 py-2 font-medium hover:bg-blue-600 transition-colors"
                >
                  重新开始 Run
                </button>
              )}
              <button
                onClick={() => dispatch({ type: "RESET_SELECTING" })}
                className="bg-gray-200 text-gray-700 rounded-lg px-5 py-2 font-medium hover:bg-gray-300 transition-colors"
              >
                返回主菜单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward picker (run mode: after winning an encounter) */}
      {state.phase === "rewardPicking" && (
        <RewardPicker
          rewards={rewardCards}
          encounterIndex={state.run.encounterIndex}
          totalEncounters={state.run.encounterOrder.length}
          onPick={handleRewardPicked}
        />
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
