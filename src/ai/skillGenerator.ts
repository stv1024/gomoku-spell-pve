import type { Skill } from "../types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { skillCache } from "./skillCache";

const FALLBACK_SKILL: Skill = {
  name: "随机应变",
  description: "随机移除一颗黑子",
  flavor: "兵来将挡，水来土掩",
  rarity: "rare",
  executeCode: `
    const blacks = api.findAll("black");
    if (blacks.length === 0) return;
    const target = blacks[Math.floor(Math.random() * blacks.length)];
    api.remove(target.row, target.col);
  `,
};

function parseSkillFromText(text: string): Skill | null {
  try {
    // Try to extract JSON from code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
    const obj = JSON.parse(jsonStr);
    if (
      typeof obj.name === "string" &&
      typeof obj.description === "string" &&
      typeof obj.flavor === "string" &&
      typeof obj.executeCode === "string"
    ) {
      // AI-generated skills default to rare
      if (!obj.rarity || !["common", "rare", "epic"].includes(obj.rarity)) {
        obj.rarity = "rare";
      }
      return obj as Skill;
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateSkill(
  idiom: string,
  apiKey: string,
  model: string
): Promise<Skill> {
  // Check cache
  const cached = skillCache.get(idiom);
  if (cached) return cached;

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(idiom) },
    ],
    max_tokens: 800,
    temperature: 0.7,
  };

  async function attempt(): Promise<Skill | null> {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Gomoku Spell PVE",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return null;
      return parseSkillFromText(content);
    } catch {
      return null;
    }
  }

  let skill = await attempt();
  if (!skill) {
    skill = await attempt(); // retry once
  }
  if (!skill) {
    // Use fallback with idiom name
    skill = { ...FALLBACK_SKILL, name: idiom };
  }

  skillCache.set(idiom, skill);
  return skill;
}
