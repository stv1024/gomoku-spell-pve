import type { HandCard, Skill, Rarity } from "../types";
import { PRESET_SKILLS } from "../data/presetSkills";

let cardIdCounter = 0;

export function makeCard(skill: Skill): HandCard {
  return { id: `card-${Date.now()}-${cardIdCounter++}`, skill };
}

/** Get available rarities based on encounter index (0-based) */
export function getAvailableRarities(encounterIndex: number): Rarity[] {
  if (encounterIndex >= 4) return ["common", "rare", "epic"];
  if (encounterIndex >= 2) return ["common", "rare"];
  return ["common"];
}

export function pickRandomPresetSkills(
  count: number,
  exclude: string[] = [],
  allowedRarities?: Rarity[],
): Skill[] {
  let pool = PRESET_SKILLS.filter((s) => !exclude.includes(s.name));
  if (allowedRarities) {
    pool = pool.filter((s) => allowedRarities.includes(s.rarity));
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Pick reward skills (prefer higher rarity when available) */
export function pickRewardSkills(
  count: number,
  exclude: string[],
  encounterIndex: number,
): Skill[] {
  const rarities = getAvailableRarities(encounterIndex);
  // For rewards, try to offer at least one higher-rarity skill
  const pool = PRESET_SKILLS.filter(
    (s) => !exclude.includes(s.name) && rarities.includes(s.rarity),
  );
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
