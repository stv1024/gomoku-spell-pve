import { useState } from "react";

const MODELS = [
  "anthropic/claude-sonnet-4",
  "anthropic/claude-haiku-4",
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "google/gemini-flash-1.5",
];

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("openrouter_api_key") || "");
  const [model, setModel] = useState(
    () => localStorage.getItem("openrouter_model") || "anthropic/claude-sonnet-4"
  );
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem("openrouter_api_key", apiKey.trim());
    localStorage.setItem("openrouter_model", model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">设置</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              API Key 仅存储在本地浏览器中，用于 AI 实时生成第三张技能卡。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI 模型
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-500 text-white rounded-lg py-2 font-medium hover:bg-blue-600 transition-colors"
          >
            {saved ? "✓ 已保存" : "保存"}
          </button>

          <div className="text-xs text-gray-400 text-center">
            没有 API Key？前往{" "}
            <span className="text-blue-500">openrouter.ai</span>{" "}
            免费注册获取。
          </div>
        </div>
      </div>
    </div>
  );
}
