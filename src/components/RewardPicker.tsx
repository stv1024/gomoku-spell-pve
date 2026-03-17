import { useState } from "react";
import type { Skill } from "../types";

const RARITY_STYLES = {
  common: {
    border: "border-gray-400/60",
    bg: "bg-gray-800/40",
    hoverBorder: "hover:border-gray-300",
    hoverBg: "hover:bg-gray-700/50",
    text: "text-gray-100",
    badge: "bg-gray-600 text-gray-200",
    badgeText: "普通",
  },
  rare: {
    border: "border-blue-400/60",
    bg: "bg-blue-900/40",
    hoverBorder: "hover:border-blue-300",
    hoverBg: "hover:bg-blue-800/50",
    text: "text-blue-100",
    badge: "bg-blue-600 text-blue-100",
    badgeText: "稀有",
  },
  epic: {
    border: "border-amber-400/60",
    bg: "bg-amber-900/40",
    hoverBorder: "hover:border-amber-300",
    hoverBg: "hover:bg-amber-800/50",
    text: "text-amber-100",
    badge: "bg-amber-600 text-amber-100",
    badgeText: "史诗",
  },
};

interface Props {
  rewards: Skill[];
  encounterIndex: number;
  totalEncounters: number;
  onPick: (skill: Skill) => void;
}

export default function RewardPicker({ rewards, encounterIndex, totalEncounters, onPick }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        className="max-w-lg mx-4 text-center"
        style={{ animation: "slideUp 0.35s ease-out" }}
      >
        <div className="text-4xl mb-3">🎉</div>
        <div className="text-2xl font-bold text-amber-100 mb-1">过关！</div>
        <div className="text-amber-300/80 text-sm mb-6">
          第 {encounterIndex + 1} / {totalEncounters} 关 — 选择一张技能作为奖励
        </div>

        <div className="flex gap-3 justify-center">
          {rewards.map((skill, i) => {
            const style = RARITY_STYLES[skill.rarity];
            const isHovered = hoveredIdx === i;
            return (
              <button
                key={i}
                onClick={() => onPick(skill)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`
                  w-40 min-h-[200px] rounded-xl p-4 border-2 transition-all duration-200 text-left flex flex-col
                  backdrop-blur-sm
                  ${style.border} ${style.bg} ${style.hoverBorder} ${style.hoverBg}
                  ${isHovered ? "transform -translate-y-2 shadow-xl" : ""}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-base font-bold ${style.text}`}>{skill.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${style.badge}`}>
                    {style.badgeText}
                  </span>
                </div>
                <div className="text-xs text-gray-300 leading-snug flex-1">
                  {skill.description}
                </div>
                <div className="text-[11px] text-amber-400/80 mt-2 italic">
                  {skill.flavor}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
