import type { Skill } from "../types";

class SkillCache {
  private cache: Map<string, Skill> = new Map();

  get(idiom: string): Skill | undefined {
    return this.cache.get(idiom);
  }

  set(idiom: string, skill: Skill): void {
    this.cache.set(idiom, skill);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const skillCache = new SkillCache();
