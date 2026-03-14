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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-center mb-4 text-gray-800">选择一张技能卡</h2>
        <div className="flex gap-3 justify-center flex-wrap">
          {/* Card 1 & 2 from preset */}
          {cards.slice(0, 2).map((skill, i) => (
            <button
              key={i}
              onClick={() => onPick(skill)}
              className="w-40 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all text-left bg-gray-50"
            >
              <div className="text-lg font-bold text-gray-800">{skill.name}</div>
              <div className="text-sm text-gray-600 mt-2 leading-snug">{skill.description}</div>
              <div className="text-xs text-amber-600 mt-2 italic">{skill.flavor}</div>
            </button>
          ))}

          {/* Card 3: AI-generated or locked */}
          <div className="w-40 rounded-xl p-4 border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col">
            {thirdCardLocked ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <span className="text-2xl">🔒</span>
                <span className="text-sm text-gray-500">填写 API Key 解锁自定义成语</span>
              </div>
            ) : generatedThird ? (
              <button
                onClick={() => onPick(generatedThird)}
                className="flex flex-col h-full text-left hover:opacity-80 transition-opacity"
              >
                <div className="text-lg font-bold text-purple-700">{generatedThird.name}</div>
                <div className="text-sm text-gray-600 mt-2 leading-snug">{generatedThird.description}</div>
                <div className="text-xs text-amber-600 mt-2 italic">{generatedThird.flavor}</div>
                <div className="text-xs text-purple-500 mt-2">✨ AI生成</div>
              </button>
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                <span className="text-sm text-gray-500">AI 生成中…</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-purple-700 font-semibold">✨ 输入成语</div>
                <input
                  type="text"
                  maxLength={4}
                  value={idiomInput}
                  onChange={(e) => setIdiomInput(e.target.value)}
                  placeholder="四字成语"
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-400"
                />
                <button
                  disabled={idiomInput.trim().length < 2}
                  onClick={() => onGenerateThird(idiomInput.trim())}
                  className="text-sm bg-purple-500 text-white rounded px-2 py-1 disabled:opacity-40 hover:bg-purple-600 transition-colors"
                >
                  生成技能
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
