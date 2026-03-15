import { useState } from "react";
import { SYSTEM_PROMPT } from "../ai/prompt";

const MODELS: { label: string; value: string }[] = [
  { label: "Gemini 2.5 Flash ⚡", value: "google/gemini-2.5-flash" },
  { label: "Gemini 2.5 Pro", value: "google/gemini-2.5-pro" },
  { label: "Claude Haiku 4.5", value: "anthropic/claude-haiku-4.5" },
  { label: "DeepSeek R1", value: "deepseek/deepseek-r1" },
  { label: "DeepSeek Chat", value: "deepseek/deepseek-chat" },
  { label: "Llama 3.3 70B (Free)", value: "meta-llama/llama-3.3-70b-instruct:free" },
];

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("openrouter_api_key") || "");
  const [model, setModel] = useState(
    () => localStorage.getItem("openrouter_model") || MODELS[0].value
  );
  const [saved, setSaved] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  function handleSave() {
    localStorage.setItem("openrouter_api_key", apiKey.trim());
    localStorage.setItem("openrouter_model", model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                <option key={m.value} value={m.value}>{m.label}</option>
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

          {/* Prompt template viewer */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <span>📝 技能生成提示词模板</span>
              <span className="text-gray-400">{showPrompt ? "▲ 收起" : "▼ 展开"}</span>
            </button>
            {showPrompt && (
              <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-60 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
                  {SYSTEM_PROMPT}
                </pre>
                <p className="text-[11px] text-gray-400 mt-2 border-t border-gray-200 pt-2">
                  提示词位于 <code className="bg-gray-200 px-1 rounded">src/ai/prompt.ts</code>，可直接编辑该文件来精调生成效果。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
