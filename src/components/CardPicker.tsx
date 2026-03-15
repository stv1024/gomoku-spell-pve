import { useState } from "react";
import type { Skill } from "../types";

interface Props {
  cards: Skill[];
  thirdCardLocked: boolean;
  apiKey: string;
  isGenerating: boolean;
  onPick: (skill: Skill) => void;
  onGenerateThird: (idiom: string) => void;
  generatedThird: Skill | null;
}

export default function CardPicker({
  cards,
  thirdCardLocked,
  isGenerating,
  onPick,
  onGenerateThird,
  generatedThird,
}: Props) {
  const [idiomInput, setIdiomInput] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Collapsed state: show a small floating button
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 animate-bounce-slow"
        style={{ animationDuration: "2s" }}
      >
        🃏 选择技能卡
      </button>
    );
  }

  const allCards: { skill: Skill | null; type: "preset" | "ai" | "locked" | "generating" | "input" }[] = [
    ...cards.slice(0, 2).map((s) => ({ skill: s as Skill | null, type: "preset" as const })),
  ];

  // Third card slot
  if (thirdCardLocked) {
    allCards.push({ skill: null, type: "locked" });
  } else if (generatedThird) {
    allCards.push({ skill: generatedThird, type: "ai" });
  } else if (isGenerating) {
    allCards.push({ skill: null, type: "generating" });
  } else {
    allCards.push({ skill: null, type: "input" });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center pointer-events-none">
      {/* Backdrop - click to collapse */}
      <div
        className="fixed inset-0 bg-black/40 pointer-events-auto"
        onClick={() => setCollapsed(true)}
      />

      {/* Bottom drawer */}
      <div
        className="relative pointer-events-auto w-full max-w-2xl mx-auto animate-slide-up"
        style={{ animation: "slideUp 0.35s ease-out" }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🃏</span>
            <span className="text-amber-100 font-bold text-sm tracking-wide">选择一张技能卡</span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="text-amber-300/70 hover:text-amber-100 text-xs px-3 py-1 rounded-full border border-amber-300/30 hover:border-amber-300/60 transition-colors"
          >
            收起 ▼
          </button>
        </div>

        {/* Cards container */}
        <div className="flex gap-3 justify-center px-4 pb-6 pt-1">
          {allCards.map((item, i) => {
            const isHovered = hoveredIdx === i;

            // Locked third card
            if (item.type === "locked") {
              return (
                <div
                  key="locked"
                  className="w-40 min-h-[180px] rounded-xl border-2 border-dashed border-amber-700/50 bg-amber-900/40 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-center p-4"
                >
                  <span className="text-2xl opacity-50">🔒</span>
                  <span className="text-xs text-amber-300/60">填写 API Key 解锁自定义成语</span>
                </div>
              );
            }

            // Generating spinner
            if (item.type === "generating") {
              return (
                <div
                  key="generating"
                  className="w-40 min-h-[180px] rounded-xl border-2 border-purple-400/40 bg-purple-900/30 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-center p-4"
                >
                  <div className="animate-spin w-7 h-7 border-2 border-purple-300 border-t-transparent rounded-full" />
                  <span className="text-xs text-purple-200">AI 生成中…</span>
                </div>
              );
            }

            // Input for idiom
            if (item.type === "input") {
              return (
                <div
                  key="input"
                  className="w-40 min-h-[180px] rounded-xl border-2 border-purple-400/40 bg-purple-900/30 backdrop-blur-sm flex flex-col gap-2.5 p-4"
                >
                  <div className="text-sm text-purple-200 font-semibold flex items-center gap-1">
                    <span>✨</span> 自定义技能
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={idiomInput}
                    onChange={(e) => setIdiomInput(e.target.value)}
                    placeholder="四字成语"
                    className="border border-purple-400/40 bg-purple-950/50 text-purple-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-purple-300 placeholder-purple-400/50"
                  />
                  <button
                    disabled={idiomInput.trim().length < 2}
                    onClick={() => onGenerateThird(idiomInput.trim())}
                    className="text-sm bg-purple-500 hover:bg-purple-400 text-white rounded-lg px-2 py-1.5 disabled:opacity-30 disabled:hover:bg-purple-500 transition-colors font-medium"
                  >
                    生成技能
                  </button>
                  <span className="text-[10px] text-purple-300/40 text-center">输入成语，AI 生成独特技能</span>
                </div>
              );
            }

            // Clickable skill card (preset or AI-generated)
            const skill = item.skill!;
            const isAI = item.type === "ai";

            return (
              <button
                key={i}
                onClick={() => onPick(skill)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`
                  w-40 min-h-[180px] rounded-xl p-4 border-2 transition-all duration-200 text-left flex flex-col relative
                  backdrop-blur-sm
                  ${isAI
                    ? "border-purple-400/60 bg-purple-900/40 hover:border-purple-300 hover:bg-purple-800/50"
                    : "border-amber-400/40 bg-amber-900/40 hover:border-amber-300 hover:bg-amber-800/50"
                  }
                  ${isHovered ? "transform -translate-y-2 shadow-xl shadow-amber-500/20" : ""}
                `}
              >
                {/* Card glow on hover */}
                {isHovered && (
                  <div
                    className={`absolute inset-0 rounded-xl ${isAI ? "bg-purple-400/10" : "bg-amber-400/10"} pointer-events-none`}
                  />
                )}

                <div className={`text-base font-bold ${isAI ? "text-purple-100" : "text-amber-100"}`}>
                  {skill.name}
                </div>
                <div className="text-xs text-gray-300 mt-2 leading-snug flex-1">
                  {skill.description}
                </div>
                <div className="text-[11px] text-amber-400/80 mt-2 italic">
                  {skill.flavor}
                </div>
                {isAI && (
                  <div className="text-[10px] text-purple-300 mt-1.5 flex items-center gap-1">
                    <span>✨</span> AI生成
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Skip hint */}
        <div className="text-center pb-4 -mt-2">
          <span className="text-[11px] text-amber-300/40">点击暗处区域收起面板查看棋盘</span>
        </div>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
