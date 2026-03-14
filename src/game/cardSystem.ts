import type { HandCard, Skill } from "../types";
import { PRESET_SKILLS } from "../data/presetSkills";

let cardIdCounter = 0;

export function makeCard(skill: Skill): HandCard {
  return { id: `card-${Date.now()}-${cardIdCounter++}`, skill };
}

export function pickRandomPresetSkills(count: number, exclude: string[] = []): Skill[] {
  const pool = PRESET_SKILLS.filter((s) => !exclude.includes(s.name));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
