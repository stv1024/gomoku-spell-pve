import type { Level } from "../types";
import { LEVELS } from "../levels/levels";

interface Props {
  onSelect: (levelId: number) => void;
  onSettings: () => void;
}

const CHAPTER_NAMES: Record<number, string> = {
  0: "入门",
  1: "进阶",
};

export default function LevelSelect({ onSelect, onSettings }: Props) {
  const chapters = [LEVELS.slice(0, 5), LEVELS.slice(5, 10)];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-700 flex flex-col items-center py-10 px-4">
      <div className="flex items-center justify-between w-full max-w-2xl mb-6">
        <div>
          <h1 className="text-3xl font-bold text-amber-100">技能五子棋</h1>
          <p className="text-amber-200 text-sm mt-1">用成语技能翻盘，闯关 PVE</p>
        </div>
        <button
          onClick={onSettings}
          className="text-amber-200 hover:text-white transition-colors p-2 rounded-full hover:bg-amber-600"
          title="设置"
        >
          ⚙️
        </button>
      </div>

      {chapters.map((levels: Level[], chapterIdx: number) => (
        <div key={chapterIdx} className="w-full max-w-2xl mb-6">
          <h2 className="text-amber-200 font-semibold mb-3 text-lg">
            {CHAPTER_NAMES[chapterIdx] ?? `第${chapterIdx + 1}章`}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => onSelect(level.id)}
                className="bg-amber-800/60 hover:bg-amber-600 border border-amber-500/40 rounded-xl p-4 text-left transition-all hover:shadow-lg group"
              >
                <div className="flex items-start justify-between">
                  <span className="text-amber-100 font-bold text-base group-hover:text-white">
                    {level.name}
                  </span>
                  <span className="text-amber-300 text-xs">#{level.id}</span>
                </div>
                <p className="text-amber-300 text-xs mt-1 leading-snug">{level.description}</p>
                <div className="mt-2">
                  <span className="text-amber-400 text-xs">
                    {level.blackStones.length} 颗黑子
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
